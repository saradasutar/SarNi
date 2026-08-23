MYFINANCE V19.2 / BACKEND V3.15.0 — TRANSACTION HISTORY

NEW
- New Transactions tab
- MF purchase/SIP/redemption dates from already imported MF statements
- Stock/ETF BUY/SELL dates from broker Tradebook import
- Zerodha Tradebook CSV/XLSX support plus similar common tradebook headings
- Filters: investor, asset type, BUY/SALE, date range, search
- Total purchases
- Total sales
- Realised profit/loss (FIFO when complete buy history is available)
- Holding period on sale transactions
- Holding detail drawer shows first purchase, latest purchase and latest sale dates
- SALE is deliberately shown in RED
- Realised profit = green; realised loss = red
- Transaction print preview

IMPORTANT
Stock holdings files normally do not contain full trade dates. Use:
Transactions > Import stock tradebook

Stock tradebook import adds transaction history and DOES NOT replace existing holdings.

BACKEND
Update Apps Script to Code-v3.15.gs and redeploy the SAME existing Web App deployment:
Deploy > Manage deployments > Edit > New version > Deploy
Execute as: Me
Who has access: Anyone

Then direct /exec should show:
"version":"3.15.0"

GITHUB
Upload/replace:
- index.html
- styles.css
- app-v19-1.js  (compatibility)
- app-v19-2.js
Keep:
- config.js

Current config.js retains your existing backend URL. If you intentionally create a NEW deployment URL,
update config.js to that new /exec URL.

Open:
https://saradasutar.github.io/saradaniharika/?v=1920

Hard refresh:
Mac: Command + Shift + R
