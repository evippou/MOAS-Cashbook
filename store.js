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
  liquidations: [],
  // Tombstone lists — track IDs of deleted items so deletions sync correctly
  deletedIds: { transactions: [], transfers: [], liquidations: [] }
};

class Store {
  constructor() {
    this.state = JSON.parse(JSON.stringify(defaultState));
    this.listeners = [];
    this.syncStatus = 'synced'; // synced, syncing, error
    this.loadFromLocal();
    
    this.debouncedSync = debounce(this.syncToCloud.bind(this), 1500);
  }

  mergeCollections(localItems = [], remoteItems = [], deletedIds = []) {
    const merged = new Map();
    const deletedSet = new Set(deletedIds);

    localItems.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) merged.set(item.id, item);
    });

    remoteItems.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) merged.set(item.id, item);
    });

    return Array.from(merged.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  mergeDeletedIds(local = [], remote = []) {
    return Array.from(new Set([...local, ...remote]));
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
          settings: { ...defaultState.settings, ...(parsed.settings || {}) },
          deletedIds: {
            transactions: parsed.deletedIds?.transactions || [],
            transfers: parsed.deletedIds?.transfers || [],
            liquidations: parsed.deletedIds?.liquidations || []
          }
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

      const remote = data.record || {};

      // Merge tombstone lists first so deletions from either device are respected
      const mergedDeletedIds = {
        transactions: this.mergeDeletedIds(this.state.deletedIds?.transactions, remote.deletedIds?.transactions),
        transfers: this.mergeDeletedIds(this.state.deletedIds?.transfers, remote.deletedIds?.transfers),
        liquidations: this.mergeDeletedIds(this.state.deletedIds?.liquidations, remote.deletedIds?.liquidations)
      };

      const nextState = {
        ...this.state,
        ...remote,
        settings: { ...this.state.settings, ...(remote.settings || {}) },
        deletedIds: mergedDeletedIds,
        transactions: this.mergeCollections(this.state.transactions, remote.transactions, mergedDeletedIds.transactions),
        transfers: this.mergeCollections(this.state.transfers, remote.transfers, mergedDeletedIds.transfers),
        liquidations: this.mergeCollections(this.state.liquidations, remote.liquidations, mergedDeletedIds.liquidations)
      };

      this.state = nextState;
      localStorage.setItem('_cb', JSON.stringify(this.state));
      this.notify();
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
    if (!this.state.deletedIds.transactions.includes(id)) {
      this.state.deletedIds.transactions.push(id);
    }
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
    if (!this.state.deletedIds.transfers.includes(id)) {
      this.state.deletedIds.transfers.push(id);
    }
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
    if (!this.state.deletedIds.liquidations.includes(id)) {
      this.state.deletedIds.liquidations.push(id);
    }
    this.saveToLocal();
  }

  // Settings API
  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveToLocal();
  }
}

export const store = new Store();
