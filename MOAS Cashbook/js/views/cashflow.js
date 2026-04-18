import { store } from '../store.js';
import { formatCurrency, formatMonthYYYY } from '../utils.js';

export function initCashflow() {
  const periodSelect = document.getElementById('cf-period');
  
  store.subscribe(render);
  periodSelect.addEventListener('change', render);

  function render() {
    const { transactions, settings, transfers } = store.state;
    
    // Parse Months for Select Dropdown
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
    const currVal = periodSelect.value;
    periodSelect.innerHTML = '<option value="ALL">All Time</option>';
    months.forEach(m => {
      periodSelect.innerHTML += `<option value="${m}">${formatMonthYYYY(m)}</option>`;
    });
    if (currVal && periodSelect.querySelector(`option[value="${currVal}"]`)) {
      periodSelect.value = currVal;
    }

    const selectedPeriod = periodSelect.value;
    
    // Filter transactions and transfers based on period
    const filteredTx = transactions.filter(t => selectedPeriod === 'ALL' || t.date.startsWith(selectedPeriod));
    
    // Calculate Net Flow
    let tIncome = 0;
    let tExpense = 0;
    filteredTx.forEach(t => {
      if (t.type === 'Income') tIncome += parseFloat(t.amount);
      if (t.type === 'Expense') tExpense += parseFloat(t.amount);
    });

    const net = tIncome - tExpense;
    document.getElementById('cf-period-label').textContent = selectedPeriod === 'ALL' ? 'All Time' : formatMonthYYYY(selectedPeriod);
    const nfEl = document.getElementById('cf-netflow');
    nfEl.textContent = formatCurrency(net);
    if (net < 0) nfEl.classList.add('negative');
    else nfEl.classList.remove('negative');

    // Calculate historical closing balance for "All time"
    const openBal = parseFloat(settings.openingBalance || 0);
    // If we select a specific month, closing balance should technically be up to that month. 
    // To keep it simple, we show historical cumulative closing balance up to the end of selected period.
    let historicalNet = 0;
    transactions.forEach(t => {
      if (selectedPeriod === 'ALL' || t.date <= selectedPeriod + '-31') {
        if (t.type === 'Income') historicalNet += parseFloat(t.amount);
        if (t.type === 'Expense') historicalNet -= parseFloat(t.amount);
      }
    });

    document.getElementById('cf-closing-balance').textContent = `Closing Balance: ${formatCurrency(openBal + historicalNet)}`;

    // Group by category
    const incMap = {};
    const expMap = {};
    filteredTx.forEach(t => {
      const a = parseFloat(t.amount);
      if (t.type === 'Income') incMap[t.category] = (incMap[t.category] || 0) + a;
      if (t.type === 'Expense') expMap[t.category] = (expMap[t.category] || 0) + a;
    });

    renderBreakdown(incMap, tIncome, 'cf-income-breakdown', 'income');
    renderBreakdown(expMap, tExpense, 'cf-expense-breakdown', 'expense');
    
    renderMonthlySummary(transactions, transfers, openBal);
  }

  function renderBreakdown(map, total, elementId, typ) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    
    if (total === 0) {
      el.innerHTML = '<p style="color:var(--color-smoke); font-size:0.9rem;">No data.</p>';
      return;
    }

    const sorted = Object.entries(map).sort((a,b) => b[1] - a[1]);
    
    sorted.forEach(([cat, amt]) => {
      const pct = (amt / total) * 100;
      el.innerHTML += `
        <div style="margin-bottom: 12px;">
          <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:600;">
            <span>${cat}</span>
            <span>${formatCurrency(amt)} <span style="color:var(--color-smoke); font-size:0.8rem; font-weight:normal;">(${pct.toFixed(1)}%)</span></span>
          </div>
          <div class="progress-container">
            <div class="progress-bar ${typ}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    });
  }

  function renderMonthlySummary(transactions, transfers, openBal) {
    const tbody = document.querySelector('#cf-monthly-table tbody');
    tbody.innerHTML = '';

    const monthsMap = {};
    transactions.forEach(t => {
      const m = t.date.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { inc: 0, exp: 0, tra: 0 };
      if (t.type === 'Income') monthsMap[m].inc += parseFloat(t.amount);
      if (t.type === 'Expense') monthsMap[m].exp += parseFloat(t.amount);
    });

    transfers.forEach(t => {
      const m = t.date.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { inc: 0, exp: 0, tra: 0 };
      monthsMap[m].tra += parseFloat(t.amount);
    });

    const mKeys = Object.keys(monthsMap).sort().reverse();
    if(mKeys.length === 0) {
       tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No historical data available.</td></tr>';
       return;
    }

    mKeys.forEach(m => {
      const d = monthsMap[m];
      const net = d.inc - d.exp;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${formatMonthYYYY(m)}</td>
        <td class="td-amount income">${formatCurrency(d.inc)}</td>
        <td class="td-amount expense">${formatCurrency(d.exp)}</td>
        <td class="td-amount" style="color:var(--color-blue)">${formatCurrency(d.tra)}</td>
        <td class="td-amount ${net < 0 ? 'expense' : 'income'}">${formatCurrency(net)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}
