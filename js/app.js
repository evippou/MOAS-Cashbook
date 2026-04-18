import { store } from './store.js';
import { initAuth, signOut, getSignedInUser } from './auth.js';

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
    return;
  }

  const signOutBtn = document.getElementById('btn-signout');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      signOut();
      window.location.reload();
    });
  }

  const currentUser = getSignedInUser();
  if (currentUser?.email) {
    const syncText = document.getElementById('sync-text');
    if (syncText && syncText.textContent === 'Loading...') {
      syncText.textContent = `Signed in as ${currentUser.email}`;
    }
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
});
