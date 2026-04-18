import { store } from '../store.js';

export function initSettings() {
  const minName = document.getElementById('set-ministryName');
  const burName = document.getElementById('set-bursarName');
  const modName = document.getElementById('set-moderatorName');
  const oBal = document.getElementById('set-openingBalance');
  const fPer = document.getElementById('set-fiscalPeriod');
  const btnSaveMin = document.getElementById('btn-save-min-info');

  const jKey = document.getElementById('set-jsonbinKey');
  const jId = document.getElementById('set-jsonbinId');
  const btnConnect = document.getElementById('btn-connect-sync');
  const btnDisconnect = document.getElementById('btn-disconnect-sync');

  const incCats = document.getElementById('set-incomeCats');
  const expCats = document.getElementById('set-expenseCats');
  const btnSaveInc = document.getElementById('btn-save-inc-cats');
  const btnSaveExp = document.getElementById('btn-save-exp-cats');

  store.subscribe(render);

  function render() {
    const s = store.state.settings;
    
    // Only update if not currently focused (to avoid annoying overrides while writing)
    if(document.activeElement !== minName) minName.value = s.ministryName || '';
    if(document.activeElement !== burName) burName.value = s.bursarName || '';
    if(document.activeElement !== modName) modName.value = s.moderatorName || '';
    if(document.activeElement !== oBal) oBal.value = s.openingBalance || 0;
    if(document.activeElement !== fPer) fPer.value = s.fiscalPeriod || '';
    
    if(document.activeElement !== jKey) jKey.value = s.jsonbinKey || '';
    if(document.activeElement !== jId) jId.value = s.jsonbinId || '';
    
    if(document.activeElement !== incCats) incCats.value = (s.incomeCategories || []).join('\n');
    if(document.activeElement !== expCats) expCats.value = (s.expenseCategories || []).join('\n');
  }

  btnSaveMin.addEventListener('click', () => {
    store.updateSettings({
      ministryName: minName.value,
      bursarName: burName.value,
      moderatorName: modName.value,
      openingBalance: parseFloat(oBal.value) || 0,
      fiscalPeriod: fPer.value
    });
    alert('Ministry Information Saved.');
  });

  btnSaveInc.addEventListener('click', () => {
    const cats = incCats.value.split('\n').map(c => c.trim()).filter(Boolean);
    store.updateSettings({ incomeCategories: cats });
    alert('Income Categories Saved.');
  });

  btnSaveExp.addEventListener('click', () => {
    const cats = expCats.value.split('\n').map(c => c.trim()).filter(Boolean);
    store.updateSettings({ expenseCategories: cats });
    alert('Expense Categories Saved.');
  });

  btnConnect.addEventListener('click', () => {
    store.updateSettings({ jsonbinKey: jKey.value, jsonbinId: jId.value });
    store.pullFromCloud(); // Try immediate sync
    alert('Sync details saved! Attempting to connect...');
  });

  btnDisconnect.addEventListener('click', () => {
    if(confirm('Disconnect sync? Local data will be kept.')) {
      store.updateSettings({ jsonbinKey: '', jsonbinId: '' });
      jKey.value = '';
      jId.value = '';
      store.setSyncStatus('synced');
    }
  });
}
