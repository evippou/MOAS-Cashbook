import { store } from './store.js';
import { initAuth } from './auth.js';

// Import views
import { initCashbook } from './views/cashbook.js';
import { initRecord } from './views/record.js';
import { initTransfer } from './views/transfer.js';
import { initCashflow } from './views/cashflow.js';
import { initLiquidation } from './views/liquidation.js';
import { initSettings } from './views/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth to complete
  const isAuth = await initAuth();
  if (!isAuth) {
    document.body.innerHTML = '<div style="text-align:center; padding: 50px;"><h2>Access Denied</h2><p>Please log in with the authorized account.</p></div>';
    return;
  }

  // Bind top level buttons (Sync)
  document.getElementById('btn-sync-now').addEventListener('click', () => {
    store.pullFromCloud();
  });

  // Tab switching logic
  const tabs = document.querySelectorAll('.tab');
  const views = document.querySelectorAll('.view-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      
      // Activate target
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Initialize Views
  initCashbook();
  initRecord();
  initTransfer();
  initCashflow();
  initLiquidation();
  initSettings();

  // Try to pull initial data if configured
  store.pullFromCloud();

  const refreshCloud = () => store.pullFromCloud();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshCloud();
    }
  });
  window.addEventListener('focus', refreshCloud);
  setInterval(refreshCloud, 60000);
});
