MYFINANCE V19.3 / BACKEND V3.16.0 — LOGIN TIMEOUT FIX

The screenshot showing Backend v3.15.0 proves the frontend can reach Apps Script.
The timeout was caused by LOGIN trying to build and return the full dashboard including
the new transaction history before login completed.

V19.3 changes this:
- Login returns only authentication details and token.
- Dashboard loads separately after login.
- Full transaction history is removed from the normal dashboard payload.
- Transactions load only when you open Transactions.
- Transactions are fetched in pages of 200 rows.
- Purchase/sale dates, realised P/L and red SALE display remain.

BACKEND
Replace Code.gs with Code-v3.16.gs.
Deploy > Manage deployments > Edit existing Web App > New version > Deploy.
Execute as: Me
Who has access: Anyone

Confirm the same /exec URL shows:
"version":"3.16.0"

GITHUB
Upload/replace:
- index.html
- styles.css
- app-v19-2.js  (compatibility)
- app-v19-3.js

Keep config.js unchanged.

Open your current GitHub Pages URL with:
?v=1930

Then Command + Shift + R.

Expected:
Frontend v19.3
Backend v3.16.0
