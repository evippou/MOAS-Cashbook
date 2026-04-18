# ✝ Ministry of Altar Servers — Bursary Cashbook

A liturgically-styled web application for managing the financial records of the **Ministry of Altar Servers** of Sta. Clara de Montefalco Parish, Pasay. Features secure **Google authentication**, real-time **cloud sync**, and comprehensive financial reporting. Built for the ministry bursar to record, track, and report all income and expenses with ease.

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

### 🔐 Authentication
- **Google Sign-In** for secure access
- Email-based authorization (allowlist)
- Session persistence with automatic logout

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

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify Site Settings:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID
   - `AUTHORIZED_EMAILS`: Comma-separated authorized email addresses (e.g., `user1@example.com,user2@example.com`)
3. **Deploy**: Netlify will automatically build and deploy on push to `main`
4. Access your app at your Netlify URL

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/evippou/MOAS-Cashbook.git
   cd MOAS-Cashbook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   AUTHORIZED_EMAILS=your.email@example.com,other.email@example.com
   ```

4. Start the local server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Vanilla HTML/CSS/JS | Core app — no frameworks |
| [Google Identity Services](https://developers.google.com/identity) | Secure Google OAuth 2.0 authentication |
| [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) | Server-side token verification |
| [Express.js](https://expressjs.com/) | Local dev server and API routes |
| [Netlify Functions](https://docs.netlify.com/functions/overview/) | Serverless auth endpoint verification |
| [SheetJS (xlsx.js)](https://sheetjs.com/) | XLSX export |
| [EB Garamond / Cinzel / Lato](https://fonts.google.com/) | Liturgical typography |
| [JSONBin.io](https://jsonbin.io/) | Cloud sync & backup |
| localStorage | Local data persistence |

---

## 📁 File Structure

```
/
├── index.html                          # Main HTML shell and view structure
├── README.md                           # This file
├── package.json                        # Node.js dependencies and scripts
├── netlify.toml                        # Netlify build config and redirects
├── .env.example                        # Sample environment variables
├── .gitignore                          # Git ignore rules
├── server.js                           # Local development server (Express)
│
├── css/
│   ├── variables.css                   # Theme colors, fonts, spacing
│   ├── layout.css                      # Header, tabs, modals, grids
│   └── components.css                  # Cards, buttons, tables, forms, auth UI
│
├── js/
│   ├── app.js                          # App initialization and bootstrap
│   ├── auth.js                         # Google auth flow and session management
│   ├── config.js                       # API endpoints and configuration
│   ├── store.js                        # Data persistence and state management
│   ├── utils.js                        # Utility functions
│   ├── modules/                        # Core feature modules (cashbook, sync, etc.)
│   └── views/                          # View controllers for each section
│       ├── cashbook.js
│       ├── cashflow.js
│       ├── liquidation.js
│       ├── record.js
│       ├── settings.js
│       └── transfer.js
│
├── netlify/functions/
│   └── auth-google-verify.cjs          # Serverless function for token verification
│
└── assets/
    └── logo.png                        # Ministry logo
```

---

## 🎨 Design

The app uses a **liturgical visual theme** — black, bright gold, and parchment — consistent with the ministry's identity. Typography draws from classical serif fonts to evoke a reverent, parish-appropriate aesthetic.

## 🔐 Security

- **Backend Token Verification**: All Google ID tokens are verified server-side using `google-auth-library`
- **Email Allowlist**: Only authorized email addresses (configured via `AUTHORIZED_EMAILS`) can access the app
- **Secure Sessions**: User sessions are managed in browser localStorage with automatic cleanup
- **CORS-Protected**: API endpoints are protected against unauthorized access
- **Environment Variables**: Sensitive credentials are stored securely in Netlify environment variables

---

## 👤 Author & Context

Developed for the **Ministry of Altar Servers**  
📍 Sta. Clara de Montefalco Parish, Pasay City  
Maintained by the Ministry Bursar  
Hosted on [Netlify](https://netlify.com)

## 🤝 Support

For issues, feature requests, or contributions, please contact the Ministry Bursar or submit via the app's feedback mechanism.

---

## 📜 License & Terms

This project is for internal ministry use only. Not licensed for public redistribution or external use without explicit written permission from the Ministry of Altar Servers and Sta. Clara de Montefalco Parish.

---

**Last Updated**: April 2026  
**Version**: 2.0 (Authenticated & Deployed)
