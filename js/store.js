import { debounce } from './utils.js';

// Default State
const defaultState = {
  settings: {
    ministryName: 'Ministry of Altar Servers',
    bursarName: '',
    moderatorName: '',
    openingBalance: 0,
    fiscalPeriod: '',
    incomeCategories: ['Sunday Collection', 'Special Collection', 'Donations', 'Fundraising', 'Other Income'],
    expenseCategories: ['Candles & Supplies', 'Vestments & Altar Wear', 'Retreat & Formation', 'Miscellaneous', 'Transportation', 'Food & Refreshments'],
    jsonbinKey: '',
    jsonbinId: ''
  },
  transactions: [],
  transfers: [],
  liquidations: []
};

class Store {
  constructor() {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.listeners = [];
    this.syncStatus = 'synced'; // synced, syncing, error
    this.loadFromLocal();
    
    this.debouncedSync = debounce(this.syncToCloud.bind(this), 1500);
  }

  loadFromLocal() {
    const saved = localStorage.getItem('_cb');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge defaults
        this.state = {
          ...defaultState,
          ...parsed,
          settings: { ...defaultState.settings, ...(parsed.settings || {}) }
        };
      } catch(e) {
        console.error("Local storage parsing error: ", e);
      }
    }
  }

  saveToLocal() {
    localStorage.setItem('_cb', JSON.stringify(this.state));
    this.debouncedSync();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(); // initial call
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  // Setting status updates indicator in DOM directly for simplicity
  setSyncStatus(status) {
    this.syncStatus = status;
    const dot = document.getElementById('sync-indicator');
    const txt = document.getElementById('sync-text');
    if (dot && txt) {
      dot.className = 'sync-dot ' + status;
      txt.textContent = status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing...' : 'Sync Error';
    }
  }

  async syncToCloud() {
    const { jsonbinKey, jsonbinId } = this.state.settings;
    if (!jsonbinKey || !jsonbinId) {
      this.setSyncStatus('synced'); // No cloud config, so it's technically synced locally
      return;
    }

    this.setSyncStatus('syncing');

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonbinKey
        },
        body: JSON.stringify(this.state)
      });

      if (!response.ok) throw new Error('Cloud sync failed');
      this.setSyncStatus('synced');
    } catch (error) {
      console.error(error);
      this.setSyncStatus('error');
    }
  }

  async pullFromCloud() {
    const { jsonbinKey, jsonbinId } = this.state.settings;
    if (!jsonbinKey || !jsonbinId) return;

    this.setSyncStatus('syncing');

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': jsonbinKey
        }
      });

      if (!response.ok) throw new Error('Cloud pull failed');
      const data = await response.json();
      
      const remote = data.record;
      // Conflict resolution: remote wins if more transactions
      if (remote && remote.transactions && remote.transactions.length >= this.state.transactions.length) {
        this.state = remote;
        localStorage.setItem('_cb', JSON.stringify(this.state));
        this.notify();
      }
      this.setSyncStatus('synced');
    } catch (error) {
      console.error(error);
      this.setSyncStatus('error');
    }
  }

  // Transactions API
  addTransaction(tx) {
    this.state.transactions.push(tx);
    // Sort transactions by date ASC always
    this.state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveToLocal();
  }

  updateTransaction(tx) {
    const idx = this.state.transactions.findIndex(t => t.id === tx.id);
    if (idx > -1) {
      this.state.transactions[idx] = tx;
      this.state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      this.saveToLocal();
    }
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.saveToLocal();
  }

  // Transfers API
  /* Similar patterns for transfers and liquidations */
  addTransfer(tx) {
    this.state.transfers.push(tx);
    this.state.transfers.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveToLocal();
  }
  
  deleteTransfer(id) {
    this.state.transfers = this.state.transfers.filter(t => t.id !== id);
    this.saveToLocal();
  }

  // Liquidations API
  addLiquidation(liq) {
    this.state.liquidations.push(liq);
    this.saveToLocal();
  }

  updateLiquidation(liq) {
    const idx = this.state.liquidations.findIndex(l => l.id === liq.id);
    if (idx > -1) {
      this.state.liquidations[idx] = liq;
      this.saveToLocal();
    }
  }

  deleteLiquidation(id) {
    this.state.liquidations = this.state.liquidations.filter(l => l.id !== id);
    this.saveToLocal();
  }

  // Settings API
  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveToLocal();
  }
}

export const store = new Store();
