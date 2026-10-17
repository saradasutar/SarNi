# SarNi — Personal Life Dashboard

**Open the website:** https://saradasutar.github.io/SarNi/

SarNi's frontend is hosted directly on GitHub Pages. Google Apps Script is the **backend service only**. Use the GitHub Pages address to sign in and navigate; do not open the Apps Script `/exec?app=1` link as the dashboard.

## Current GitHub Pages frontend

- Frontend: **v20.8.7** (`index.html` loads `app-v20-8-7.js`)
- Expected backend: **v3.17.29** (verify against your active Apps Script deployment)
- User interface: `styles.css`, `sarni-delight.css` and `sarni-delight.js`
- App installation: `manifest.webmanifest`
- Frontend checks: [Site Check](./health.html)
- Deployment notes and rollback: [Direct-hosting guide](./DIRECT-HOSTING-20261017.md)

The existing dashboard includes personal expenses, GPF, diary, calendar/reminders, life experiences, smart paste, user management and mobile quick actions. Investments in stocks/MF/ETF are intended to be managed in the separate Analysis dashboard.

## Safety

Do not run `setupSystem()` against the existing Google Sheet. Do not overwrite `Code.gs` from an old ZIP without verifying backend action compatibility. Back up the Apps Script project and Sheet before backend deployment. Never commit personal records, passwords, tokens or private Drive content to this public repository.

Legacy `IndexApp.html` and earlier versioned assets have been retained for compatibility/rollback; the live GitHub Pages site is served from **`index.html`**.
