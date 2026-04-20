import { store } from '../store.js';
import { formatDate, formatCurrency } from '../utils.js';

export function initCashbook() {
  const tableBody = document.querySelector('#ledger-table tbody');
  const searchInput = document.getElementById('filter-search');
  const typeFilter = document.getElementById('filter-type');
  const categoryFilter = document.getElementById('filter-category');
  const modeFilter = document.getElementById('filter-mode');
  const monthFilter = document.getElementById('filter-month');
  const dateOrderFilter = document.getElementById('filter-date-order');
  const btnClear = document.getElementById('btn-clear-filters');
  const btnExport = document.getElementById('btn-export-xlsx');
  
  // Modals
  const receiptModal = document.getElementById('modal-receipt');
  const receiptImg = document.getElementById('receipt-viewer-img');
  
  document.getElementById('btn-close-receipt').addEventListener('click', () => {
    receiptModal.classList.remove('active');
  });

  // Re-render when data changes
  store.subscribe(render);

  // Bind filters
  [searchInput, typeFilter, categoryFilter, modeFilter, monthFilter, dateOrderFilter].forEach(el => {
    el.addEventListener('input', renderTable);
  });
  
  btnClear.addEventListener('click', () => {
    searchInput.value = '';
    typeFilter.value = 'All';
    categoryFilter.value = 'All';
    modeFilter.value = 'All';
    monthFilter.value = '';
    dateOrderFilter.value = 'desc';
    renderTable();
  });
  
  btnExport.addEventListener('click', exportToExcel);

  function checkEmptyState() {
    if (store.state.transactions.length === 0) {
      document.querySelector('.table-wrapper').style.display = 'none';
      const noData = document.createElement('div');
      noData.id = 'cashbook-empty';
      noData.style.padding = '40px';
      noData.style.textAlign = 'center';
      noData.style.color = 'var(--color-smoke)';
      noData.innerHTML = `<p>No transactions found.</p><p style="font-size:0.9rem">Switch to the "Record Entry" tab to add your first transaction.</p>`;
      
      if (!document.getElementById('cashbook-empty')) {
         document.getElementById('view-cashbook').appendChild(noData);
      }
    } else {
      document.querySelector('.table-wrapper').style.display = 'block';
      const noData = document.getElementById('cashbook-empty');
      if (noData) noData.remove();
    }
  }

  function render() {
    updateCardSummaries();
    updateFilterOptions();
    renderTable();
    checkEmptyState();
  }

  function updateCardSummaries() {
    const { transactions, settings } = store.state;
    let totalIncome = 0;
    let totalExpense = 0;
    let incCount = 0;
    let expCount = 0;

    transactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += parseFloat(t.amount);
        incCount++;
      } else {
        totalExpense += parseFloat(t.amount);
        expCount++;
      }
    });

    const balance = parseFloat(settings.openingBalance || 0) + totalIncome - totalExpense;

    document.getElementById('card-income').textContent = formatCurrency(totalIncome);
    document.getElementById('card-income-count').textContent = `${incCount} entries`;
    
    document.getElementById('card-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('card-expense-count').textContent = `${expCount} entries`;
    
    const balEl = document.getElementById('card-balance');
    balEl.textContent = formatCurrency(balance);
    if (balance < 0) {
      balEl.classList.add('negative');
      document.getElementById('card-balance-label').textContent = 'Deficit';
      document.getElementById('card-balance-label').style.color = 'var(--color-crimson)';
    } else {
      balEl.classList.remove('negative');
      document.getElementById('card-balance-label').textContent = 'Surplus';
      document.getElementById('card-balance-label').style.color = 'var(--color-smoke)';
    }
  }

  function updateFilterOptions() {
    const { settings, transactions } = store.state;
    const allCats = [...new Set([...settings.incomeCategories, ...settings.expenseCategories])];
    
    // Remember current selection
    const currCat = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="All">All Categories</option>';
    allCats.forEach(c => {
      categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
    });
    // Restore if possible
    if (allCats.includes(currCat)) categoryFilter.value = currCat;

    // Modes
    const currMode = modeFilter.value;
    const modes = [...new Set(transactions.map(t => t.mode).filter(Boolean))];
    modeFilter.innerHTML = '<option value="All">All Payment Modes</option>';
    modes.forEach(m => {
      modeFilter.innerHTML += `<option value="${m}">${m}</option>`;
    });
    if (modes.includes(currMode)) modeFilter.value = currMode;
  }

  function renderTable() {
    tableBody.innerHTML = '';
    const { transactions, settings } = store.state;
    
    // 1. Calculate running balances sequentially (data is already sorted ASC)
    let currentBalance = parseFloat(settings.openingBalance || 0);
    const withBalances = transactions.map(t => {
      if (t.type === 'Income') currentBalance += parseFloat(t.amount);
      if (t.type === 'Expense') currentBalance -= parseFloat(t.amount);
      return { ...t, runningBalance: currentBalance };
    });

    // 2. Filter (we still show the correct historical running balance)
    const search = searchInput.value.toLowerCase();
    const tType = typeFilter.value;
    const tCat = categoryFilter.value;
    const tMode = modeFilter.value;
    const tMonth = monthFilter.value;
    const dateOrder = dateOrderFilter.value;

    const filtered = withBalances.filter(t => {
      const matchSearch = (t.desc || '').toLowerCase().includes(search) || 
                          (t.party || '').toLowerCase().includes(search) ||
                          (t.notes || '').toLowerCase().includes(search);
      const matchType = tType === 'All' || t.type === tType;
      const matchCat = tCat === 'All' || t.category === tCat;
      const matchMode = tMode === 'All' || t.mode === tMode;
      const matchMonth = !tMonth || t.date.startsWith(tMonth); // tMonth format YYYY-MM
      
      return matchSearch && matchType && matchCat && matchMode && matchMonth;
    });

    const ordered = dateOrder === 'asc' ? filtered : filtered.slice().reverse();

    ordered.forEach((t, index) => {
      const tr = document.createElement('tr');
      const amt = parseFloat(t.amount);
      const isInc = t.type === 'Income';
      
      const badgeCls = isInc ? 'badge-income' : 'badge-expense';
      
      // Build Actions
      let actionsHTML = '';
      if (t.receipt) {
        actionsHTML += `<span class="action-icon action-view" data-id="${t.id}" title="View Receipt">🧾</span>`;
      }
      actionsHTML += `<span class="action-icon action-edit" data-id="${t.id}" title="Edit">✎</span>`;
      actionsHTML += `<span class="action-icon action-delete" data-id="${t.id}" title="Delete">✕</span>`;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="td-date">${formatDate(t.date)}</td>
        <td>
          <span class="td-desc">${t.desc}</span>
          ${t.party ? `<span class="td-party">${t.party}</span>` : ''}
          ${t.notes ? `<span class="td-remarks">${t.notes}</span>` : ''}
        </td>
        <td>${t.category}</td>
        <td><span class="badge ${badgeCls}">${t.type}</span></td>
        <td><span class="badge badge-neutral">${t.mode || ''}</span></td>
        <td class="td-amount income">${isInc ? formatCurrency(amt) : '-'}</td>
        <td class="td-amount expense">${!isInc ? formatCurrency(amt) : '-'}</td>
        <td class="td-balance ${t.runningBalance < 0 ? 'negative' : ''}">${formatCurrency(t.runningBalance)}</td>
        <td style="font-size: 0.8rem; color: var(--color-smoke);">${t.ref || ''}</td>
        <td>${actionsHTML}</td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach Action Listeners
    tableBody.querySelectorAll('.action-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const tx = store.state.transactions.find(t => t.id === id);
        if (tx && tx.receipt) {
          receiptImg.src = tx.receipt;
          receiptModal.classList.add('active');
        }
      });
    });

    tableBody.querySelectorAll('.action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        // Dispatch custom event to tell record view to edit
        document.dispatchEvent(new CustomEvent('edit-transaction', { detail: id }));
        // Switch tab
        document.querySelector('.tab[data-target="view-record"]').click();
      });
    });

    tableBody.querySelectorAll('.action-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(confirm('Are you sure you want to delete this transaction?')) {
          const id = e.target.getAttribute('data-id');
          store.deleteTransaction(id);
        }
      });
    });
  }

  function exportToExcel() {
    const { settings, transactions } = store.state;
     // 1. Calculate running balances sequentially
    let currentBalance = parseFloat(settings.openingBalance || 0);
    const withBalances = transactions.map(t => {
      if (t.type === 'Income') currentBalance += parseFloat(t.amount);
      if (t.type === 'Expense') currentBalance -= parseFloat(t.amount);
      return { 
        Date: t.date,
        Description: t.desc,
        Party: t.party || '',
        Type: t.type,
        Category: t.category,
        Mode: t.mode || '',
        Income: t.type === 'Income' ? parseFloat(t.amount) : '',
        Expense: t.type === 'Expense' ? parseFloat(t.amount) : '',
        Balance: currentBalance,
        'Ref No': t.ref || '',
        Remarks: t.notes || ''
      };
    });

    if (withBalances.length === 0) return alert('No data to export.');

    // Prepend Opening Balance Row
    const exportData = [
      { Date: '', Description: 'OPENING BALANCE', Balance: parseFloat(settings.openingBalance || 0) },
      ...withBalances
    ];

    const ws = window.XLSX.utils.json_to_sheet(exportData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Cashbook Ledger");
    const d = new Date().toISOString().split('T')[0];
    window.XLSX.writeFile(wb, `MOAS_Cashbook_${d}.xlsx`);
  }
}
