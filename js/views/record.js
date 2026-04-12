import { store } from '../store.js';
import { generateId, compressImage } from '../utils.js';

export function initRecord() {
  const form = document.getElementById('form-record');
  const typeRadios = document.querySelectorAll('input[name="entry-type"]');
  const catSelect = document.getElementById('entry-category');
  const receiptInput = document.getElementById('entry-receipt');
  const receiptPreview = document.getElementById('receipt-preview');
  const receiptB64 = document.getElementById('entry-receipt-b64');
  const btnCancel = document.getElementById('btn-cancel-entry');
  const title = document.getElementById('record-form-title');

  // Bind type to update category dropdown
  typeRadios.forEach(r => r.addEventListener('change', updateCategories));
  
  // Also react to settings changing (new categories added)
  store.subscribe(updateCategories);

  // Set default date
  document.getElementById('entry-date').valueAsDate = new Date();

  function updateCategories() {
    const isIncome = document.getElementById('type-income').checked;
    const cats = isIncome ? store.state.settings.incomeCategories : store.state.settings.expenseCategories;
    
    // Remember selection
    const curr = catSelect.value;
    catSelect.innerHTML = '';
    cats.forEach(c => {
      catSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
    if (cats.includes(curr)) catSelect.value = curr;
  }

  // Handle Image Upload
  receiptInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Max 5MB.");
        receiptInput.value = '';
        return;
      }
      compressImage(file, (base64) => {
        receiptB64.value = base64;
        receiptPreview.src = base64;
        receiptPreview.style.display = 'block';
      });
    } else {
      receiptB64.value = '';
      receiptPreview.style.display = 'none';
      receiptPreview.src = '';
    }
  });

  // Handle Cancel
  btnCancel.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    document.getElementById('entry-id').value = '';
    document.getElementById('entry-date').valueAsDate = new Date();
    title.textContent = 'New Entry';
    receiptB64.value = '';
    receiptPreview.style.display = 'none';
    receiptPreview.src = '';
    updateCategories();
  }

  // Listen for Edit Action from Cashbook
  document.addEventListener('edit-transaction', (e) => {
    const id = e.detail;
    const tx = store.state.transactions.find(t => t.id === id);
    if (!tx) return;

    title.textContent = 'Editing Entry...';
    document.getElementById('entry-id').value = tx.id;
    document.getElementById('entry-date').value = tx.date;
    document.getElementById('entry-desc').value = tx.desc;
    document.getElementById('entry-amount').value = tx.amount;
    document.getElementById('entry-mode').value = tx.mode || 'Cash';
    document.getElementById('entry-ref').value = tx.ref || '';
    document.getElementById('entry-party').value = tx.party || '';
    document.getElementById('entry-remarks').value = tx.notes || '';
    
    // Type handling
    if (tx.type === 'Income') document.getElementById('type-income').checked = true;
    else document.getElementById('type-expense').checked = true;
    updateCategories();
    catSelect.value = tx.category;

    // Receipt handling
    if (tx.receipt) {
      receiptB64.value = tx.receipt;
      receiptPreview.src = tx.receipt;
      receiptPreview.style.display = 'block';
    } else {
      receiptB64.value = '';
      receiptPreview.style.display = 'none';
      receiptPreview.src = '';
    }
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('entry-id').value;
    const type = document.getElementById('type-income').checked ? 'Income' : 'Expense';
    
    const tx = {
      id: id || generateId(),
      date: document.getElementById('entry-date').value,
      desc: document.getElementById('entry-desc').value,
      type: type,
      amount: parseFloat(document.getElementById('entry-amount').value),
      category: document.getElementById('entry-category').value,
      mode: document.getElementById('entry-mode').value,
      ref: document.getElementById('entry-ref').value,
      party: document.getElementById('entry-party').value,
      notes: document.getElementById('entry-remarks').value,
      receipt: document.getElementById('entry-receipt-b64').value || null
    };

    if (id) {
      store.updateTransaction(tx);
    } else {
      store.addTransaction(tx);
    }

    resetForm();
    alert('Entry saved successfully!');
    // Jump back to ledger
    document.querySelector('.tab[data-target="view-cashbook"]').click();
  });
}
