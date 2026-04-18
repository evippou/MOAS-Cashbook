import { store } from '../store.js';
import { generateId, formatDate, formatCurrency } from '../utils.js';

export function initLiquidation() {
  const modal = document.getElementById('modal-liquidation');
  const form = document.getElementById('form-liquidation');
  const itemsContainer = document.getElementById('liq-items-container');
  const listContainer = document.getElementById('liquidation-list');
  
  let currentItems = [];

  store.subscribe(render);

  document.getElementById('btn-new-liquidation').addEventListener('click', () => {
    openModal();
  });

  document.getElementById('btn-close-liq-modal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('btn-add-liq-item').addEventListener('click', () => {
    currentItems.push({ desc: '', amount: 0, ref: '' });
    renderModalItems();
  });

  function recalculateModalBalance() {
    const relAmt = parseFloat(document.getElementById('liq-released').value) || 0;
    let disbursed = 0;
    currentItems.forEach(item => { disbursed += parseFloat(item.amount) || 0; });
    const bal = relAmt - disbursed;
    const el = document.getElementById('liq-balance-display');
    el.textContent = formatCurrency(bal);
    el.style.color = bal < 0 ? 'var(--color-crimson)' : 'var(--color-ink)';
  }

  document.getElementById('liq-released').addEventListener('input', recalculateModalBalance);

  function renderModalItems() {
    itemsContainer.innerHTML = '';
    currentItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
      row.style.gap = 'var(--gap-sm)';
      row.innerHTML = `
        <input type="text" placeholder="Description" value="${item.desc}" class="item-desc">
        <input type="number" placeholder="Amount" step="0.01" min="0" value="${item.amount || ''}" class="item-amount">
        <input type="text" placeholder="Ref No." value="${item.ref}" class="item-ref">
        <button type="button" class="btn btn-outline btn-sm item-remove">✕</button>
      `;
      itemsContainer.appendChild(row);

      row.querySelector('.item-desc').addEventListener('input', e => { item.desc = e.target.value; });
      row.querySelector('.item-amount').addEventListener('input', e => { 
        item.amount = parseFloat(e.target.value) || 0; 
        recalculateModalBalance();
      });
      row.querySelector('.item-ref').addEventListener('input', e => { item.ref = e.target.value; });
      row.querySelector('.item-remove').addEventListener('click', () => {
        currentItems.splice(idx, 1);
        renderModalItems();
      });
    });
    recalculateModalBalance();
  }

  function openModal(liq = null) {
    if (liq) {
      document.getElementById('modal-liq-title').textContent = 'Edit Liquidation';
      document.getElementById('liq-id').value = liq.id;
      document.getElementById('liq-title').value = liq.title;
      document.getElementById('liq-person').value = liq.person;
      document.getElementById('liq-released').value = liq.released;
      document.getElementById('liq-dateRel').value = liq.dateRel;
      document.getElementById('liq-dateDue').value = liq.dateDue || '';
      document.getElementById('liq-remarks').value = liq.remarks || '';
      currentItems = JSON.parse(JSON.stringify(liq.items || []));
    } else {
      document.getElementById('modal-liq-title').textContent = 'New Liquidation';
      form.reset();
      document.getElementById('liq-id').value = '';
      document.getElementById('liq-dateRel').valueAsDate = new Date();
      currentItems = [];
    }
    renderModalItems();
    modal.classList.add('active');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('liq-id').value;
    
    // Calculate Status logic
    const released = parseFloat(document.getElementById('liq-released').value);
    let disbursed = 0;
    currentItems.forEach(i => disbursed += (parseFloat(i.amount) || 0));
    
    let status = 'open';
    const dDue = document.getElementById('liq-dateDue').value;
    const isOverdue = dDue && new Date(dDue) < new Date();
    
    if (disbursed >= released && released > 0) status = 'settled';
    else if (disbursed > 0) status = 'partial';
    
    if (status !== 'settled' && isOverdue) status = 'overdue';

    const liq = {
      id: id || generateId(),
      title: document.getElementById('liq-title').value,
      person: document.getElementById('liq-person').value,
      released: released,
      dateRel: document.getElementById('liq-dateRel').value,
      dateDue: dDue,
      remarks: document.getElementById('liq-remarks').value,
      items: currentItems,
      status: status
    };

    if (id) store.updateLiquidation(liq);
    else store.addLiquidation(liq);

    modal.classList.remove('active');
  });

  function render() {
    listContainer.innerHTML = '';
    const liquidations = store.state.liquidations;
    
    let cntTotal = liquidations.length;
    let cntOpen = 0, cntSettled = 0, cntOverdue = 0;

    liquidations.forEach(liq => {
      // Re-evaluate overdue in case date ticked over
      let status = liq.status;
      if (status !== 'settled' && liq.dateDue && new Date(liq.dateDue) < new Date()) {
        status = 'overdue';
      }

      if (status === 'open' || status === 'partial') cntOpen++;
      if (status === 'settled') cntSettled++;
      if (status === 'overdue') cntOverdue++;

      let disTotal = 0;
      liq.items.forEach(i => disTotal += (parseFloat(i.amount) || 0));
      const bal = liq.released - disTotal;

      let bCls = 'badge-open';
      if(status === 'settled') bCls = 'badge-settled';
      if(status === 'partial') bCls = 'badge-partial';
      if(status === 'overdue') bCls = 'badge-overdue';

      const card = document.createElement('div');
      card.className = 'card';
      
      let itemsHtml = '<div style="margin: var(--gap-sm) 0; font-size: 0.85rem;">';
      liq.items.forEach(i => {
         itemsHtml += `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--color-border); padding:4px 0;">
           <span>${i.desc} <span style="color:var(--color-smoke)">${i.ref?`(${i.ref})`:''}</span></span>
           <span style="font-family:var(--font-serif-italic)">${formatCurrency(i.amount)}</span>
         </div>`;
      });
      itemsHtml += '</div>';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: var(--gap-sm);">
          <h3 style="margin:0; font-size:1rem;">${liq.title}</h3>
          <span class="badge ${bCls}">${status}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--color-smoke); margin-bottom: var(--gap-md);">
          Resp: <strong>${liq.person}</strong>  |  Rel: ${formatDate(liq.dateRel)} ${liq.dateDue ? `| Due: ${formatDate(liq.dateDue)}` : ''}
        </p>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:var(--gap-sm); background-color:var(--color-crimson-light); padding:8px; border-radius:4px; text-align:center;">
           <div><span style="font-size:0.75rem; color:var(--color-smoke); display:block;">Released</span><strong style="font-family:var(--font-serif-italic)">${formatCurrency(liq.released)}</strong></div>
           <div><span style="font-size:0.75rem; color:var(--color-smoke); display:block;">Disbursed</span><strong style="font-family:var(--font-serif-italic)">${formatCurrency(disTotal)}</strong></div>
           <div><span style="font-size:0.75rem; color:var(--color-smoke); display:block;">Balance</span><strong style="font-family:var(--font-serif-italic); color:${bal < 0 ? 'var(--color-crimson)' : 'var(--color-gold)'}">${formatCurrency(bal)}</strong></div>
        </div>
        ${liq.items.length > 0 ? itemsHtml : ''}
        <div style="display:flex; justify-content:flex-end; gap:var(--gap-sm); margin-top:var(--gap-md);">
          <button class="btn btn-sm btn-outline act-edit" data-id="${liq.id}">Edit</button>
          <button class="btn btn-sm btn-secondary act-delete" data-id="${liq.id}">Delete</button>
        </div>
      `;
      listContainer.appendChild(card);
    });

    document.getElementById('liq-stat-total').textContent = cntTotal;
    document.getElementById('liq-stat-open').textContent = cntOpen;
    document.getElementById('liq-stat-settled').textContent = cntSettled;
    document.getElementById('liq-stat-overdue').textContent = cntOverdue;

    // Bind item actions
    listContainer.querySelectorAll('.act-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.getAttribute('data-id');
        const l = liquidations.find(x => x.id === id);
        if(l) openModal(l);
      });
    });

    listContainer.querySelectorAll('.act-delete').forEach(btn => {
      btn.addEventListener('click', e => {
        if(confirm('Delete this liquidation?')) {
          store.deleteLiquidation(e.target.getAttribute('data-id'));
        }
      });
    });
  }
}
