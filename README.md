# ✝ Ministry of Altar Servers — Bursary Cashbook

A liturgically-styled, single-file web application for managing the financial records of the **Ministry of Altar Servers** of Sta. Clara de Montefalco Parish, Pasay. Built for the ministry bursar to record, track, and report all income and expenses with ease.

---

## ✨ Features

### 📖 Cashbook Ledger
- Full transaction history with running balance
- Search and filter by type, category, payment mode, or month
- Print-ready layout
- Export to **XLSX** (Excel) via SheetJS

### ✚ Record Entry
- Log **Income** and **Expense** transactions
- Fields: Description, Date, Type, Amount, Mode of Payment, Category, Reference/Receipt No., Received From / Paid To, Remarks
- Attach a **receipt photo** (JPG/PNG/HEIC, max 5MB)
- Set **Opening Balance** and **Fiscal Period**
- Edit or delete existing entries

### ↔ Fund Transfer
- Record internal fund movements (e.g., remittance to parish, transfer to savings)
- Appears in the ledger as a neutral Transfer entry (does not affect overall balance)

### 📊 Cash Flow
- Monthly summary of income vs. expenses
- Visual overview of financial trends

### 🧾 Liquidation
- Generate liquidation reports for events or activities
- Summarizes disbursements against a stated budget

### ⚙ Settings
- Set Ministry Name, Bursar Name, and Moderator Name
- Manage custom **Income** and **Expense** categories
- Configure **JSONBin.io** cloud sync credentials

---

## ☁ Cloud Sync (JSONBin.io)

The app supports cloud backup and sync via [JSONBin.io](https://jsonbin.io):

1. Create a free account at jsonbin.io
2. Generate an **API Key** and create a **Bin**
3. Enter both in **⚙ Settings → Cloud Sync Setup**
4. Data will auto-sync after every change (with a 1.5s debounce)
5. Use the **Sync Now** button for a manual pull from the cloud

> Data is stored locally in `localStorage` under the key `_cb` and pushed to the cloud automatically.

---

## 💾 Local Storage

All data persists in the browser's `localStorage`. No internet connection is required for basic use — cloud sync is optional.

---

## 🚀 How to Use

1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari)
3. No installation, no build step — it runs entirely in the browser

```
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
open index.html
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Vanilla HTML/CSS/JS | Core app — no frameworks |
| [SheetJS (xlsx.js)](https://sheetjs.com/) | XLSX export |
| [EB Garamond / Cinzel / Lato](https://fonts.google.com/) | Liturgical typography |
| [JSONBin.io](https://jsonbin.io/) | Cloud sync & backup |
| localStorage | Local data persistence |

---

## 📁 File Structure

```
/
└── index.html      # Entire app in a single file
└── README.md       # This file
```

---

## 🎨 Design

The app uses a **liturgical visual theme** — crimson, gold, and parchment — consistent with the ministry's identity. Typography draws from classical serif fonts to evoke a reverent, parish-appropriate aesthetic.

---

## 👤 Author & Context

Developed for the **Ministry of Altar Servers**  
📍 Sta. Clara de Montefalco Parish, Pasay City  
Maintained by the Ministry Bursar

---

## 📜 License

This project is for internal ministry use. Not licensed for public redistribution.
