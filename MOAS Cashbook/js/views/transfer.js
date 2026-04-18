import { store } from '../store.js';
import { generateId, formatDate, formatCurrency } from '../utils.js';

export function initTransfer() {
  const form = document.getElementById('form-transfer');
  const tableBody = document.querySelector('#transfer-table tbody');
  const btnCancel = document.getElementById('btn-cancel-transfer');

  document.getElementById('trans-date').valueAsDate = new Date();

  store.subscribe(renderTable);

  btnCancel.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    document.getElementById('trans-id').value = '';
    document.getElementById('trans-date').valueAsDate = new Date();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('trans-id').value;
    
    const tx = {
      id: id || generateId(),
      date: document.getElementById('trans-date').value,
      amount: parseFloat(document.getElementById('trans-amount').value),
      desc: document.getElementById('trans-desc').value,
      from: document.getElementById('trans-from').value,
      to: document.getElementById('trans-to').value,
      mode: document.getElementById('trans-mode').value,
      ref: document.getElementById('trans-ref').value,
      notes: document.getElementById('trans-notes').value
    };

    if (id) {
       // update not explicitly defined in store but similar approach
       const idx = store.state.transfers.findIndex(t => t.id === id);
       if (idx > -1) {
         store.state.transfers[idx] = tx;
         store.state.transfers.sort((a,b) => new Date(a.date) - new Date(b.date));
         store.saveToLocal();
       }
    } else {
      store.addTransfer(tx);
    }
    
    resetForm();
  });

  function renderTable() {
    tableBody.innerHTML = '';
    const transfers = store.state.transfers;

    if (transfers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--color-smoke);">No transfers recorded yet.</td></tr>';
      return;
    }

    transfers.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-date">${formatDate(t.date)}</td>
        <td>
          <span class="td-desc">${t.desc}</span>
          ${t.notes ? `<span class="td-remarks">${t.notes}</span>` : ''}
        </td>
        <td>${t.from}</td>
        <td>${t.to}</td>
        <td><span class="badge badge-neutral">${t.mode}</span></td>
        <td class="td-amount" style="color: var(--color-blue);">${formatCurrency(t.amount)}</td>
        <td style="font-size:0.8rem">${t.ref || ''}</td>
        <td>
           <span class="action-icon action-delete-t" data-id="${t.id}" title="Delete">✕</span>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('.action-delete-t').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(confirm('Delete this transfer?')) {
           store.deleteTransfer(e.target.getAttribute('data-id'));
        }
      });
    });
  }
}
