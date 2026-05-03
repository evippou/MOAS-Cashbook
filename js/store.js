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
    
    this.debouncedSync = debounce(this.syncWithCloud.bind(this), 1500);
  }

  mergeCollections(localItems = [], remoteItems = [], deletedIds = []) {
    const merged = new Map();
    const deletedSet = new Set(deletedIds);

    // Index local items first
    localItems.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) merged.set(item.id, item);
    });

    // Remote items win on merge, EXCEPT keep local receipt if remote only has placeholder
    remoteItems.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) {
        const local = merged.get(item.id);
        if (local && item.receipt === '[local-only]' && local.receipt && local.receipt !== '[local-only]') {
          // Preserve the real local receipt
          merged.set(item.id, { ...item, receipt: local.receipt });
        } else {
          merged.set(item.id, item);
        }
      }
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

  setSyncStatus(status) {
    this.syncStatus = status;
    const dot = document.getElementById('sync-indicator');
    const txt = document.getElementById('sync-text');
    if (dot && txt) {
      dot.className = 'sync-dot ' + status;
      txt.textContent = status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing...' : 'Sync Error';
    }
  }

  // Strip base64 receipt images before cloud upload to stay within JSONBin 100KB free limit.
  // Receipts remain intact in localStorage on the device that uploaded them.
  stripReceiptsForCloud(state) {
    return {
      ...state,
      transactions: (state.transactions || []).map(t => ({ ...t, receipt: t.receipt ? '[local-only]' : null })),
      transfers: (state.transfers || []).map(t => ({ ...t, receipt: t.receipt ? '[local-only]' : null })),
      liquidations: (state.liquidations || []).map(l => ({ ...l, receipt: l.receipt ? '[local-only]' : null }))
    };
  }

  async syncWithCloud() {
    const { jsonbinKey, jsonbinId } = this.state.settings;
    if (!jsonbinKey || !jsonbinId) {
      this.setSyncStatus('synced');
      return;
    }

    this.setSyncStatus('syncing');

    try {
      // Step 1: Pull latest from cloud
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}/latest`, {
        method: 'GET',
        headers: { 'X-Master-Key': jsonbinKey }
      });

      if (!getRes.ok) {
        const errBody = await getRes.text().catch(() => '');
        throw new Error(`GET failed ${getRes.status}: ${errBody}`);
      }

      let mergedState = this.state;
      const data = await getRes.json();
      const remote = data.record || {};

      // Step 2: Merge remote into local (union of all data, deletions respected)
      const mergedDeletedIds = {
        transactions: this.mergeDeletedIds(this.state.deletedIds?.transactions, remote.deletedIds?.transactions),
        transfers: this.mergeDeletedIds(this.state.deletedIds?.transfers, remote.deletedIds?.transfers),
        liquidations: this.mergeDeletedIds(this.state.deletedIds?.liquidations, remote.deletedIds?.liquidations)
      };

      mergedState = {
        ...this.state,
        ...remote,
        settings: { ...this.state.settings, ...(remote.settings || {}) },
        deletedIds: mergedDeletedIds,
        transactions: this.mergeCollections(this.state.transactions, remote.transactions, mergedDeletedIds.transactions),
        transfers: this.mergeCollections(this.state.transfers, remote.transfers, mergedDeletedIds.transfers),
        liquidations: this.mergeCollections(this.state.liquidations, remote.liquidations, mergedDeletedIds.liquidations)
      };

      this.state = mergedState;
      localStorage.setItem('_cb', JSON.stringify(this.state));
      this.notify();

      // Step 3: Push merged state back to cloud so other devices get everything
      const putRes = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonbinKey
        },
        body: JSON.stringify(this.stripReceiptsForCloud(mergedState))
      });

      if (!putRes.ok) {
        const errBody = await putRes.text().catch(() => '');
        throw new Error(`PUT failed ${putRes.status}: ${errBody}`);
      }

      this.setSyncStatus('synced');
    } catch (error) {
      console.error('Sync error:', error);
      this.setSyncStatus('error');
    }
  }

  // pullFromCloud is now an alias for syncWithCloud (bidirectional)
  async pullFromCloud() {
    return this.syncWithCloud();
  }

  // Transactions API
  addTransaction(tx) {
    this.state.transactions.push(tx);
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
