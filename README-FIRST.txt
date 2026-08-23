MYFINANCE V19.2.3 — EXACT DATES + PROFIT/LOSS TO DATE
Frontend v19.2.3 / Backend v3.15.1

This version improves the Holdings dashboard so transaction dates and profit/loss are visible and not ambiguous.

WHAT YOU WILL SEE
- Separate Purchase Date(s) and Sale Date(s) columns.
- Exact BUY date in green.
- Exact SALE/redemption date in red.
- For multiple MF SIPs/stock buys: First BUY + Latest BUY + number of recorded dates.
- Hover the date cell for the recorded dates; the Holding detail drawer lists all exact dates.
- Current P/L Till Today: current value minus current cost basis.
- Realised P/L: FIFO P/L from completed sales/redemptions.
- Total P/L To Date: Current P/L + Realised P/L when complete history exists.
- PROFIT = green. LOSS = red.
- A compact P/L strip above Holdings shows Current P/L, Realised P/L, Total P/L and trade-date coverage.
- Latest price/NAV date is shown so “till today” is not misleading.

WHY DATES CAN STILL BE MISSING
A holdings snapshot does not contain historical trade dates. Exact dates require:
- MF transaction statement, or
- Stock/ETF broker Tradebook.
If a row says “Import broker tradebook” or “Import MF transaction statement”, the dashboard is telling you the source history is missing rather than inventing a date.

BETTER STOCK MATCHING
Backend v3.15.1 matches common symbol forms such as:
HDFCBANK / NSE:HDFCBANK / HDFCBANK-EQ / HDFCBANK.NS

INSTALL — BOTH FRONTEND AND BACKEND
Apps Script:
1. Replace Code.gs with Code-v3.15.1.gs
2. Save
3. Deploy > Manage deployments > Edit existing Web App > New version > Deploy
4. Execute as Me / Who has access: Anyone

GitHub:
Upload/replace:
- index.html
- styles.css
- app-v19-2-3.js
- app-v19-2-2.js (compatibility)

Keep the CURRENT working config.js /exec URL.

Open with ?v=1923 and hard refresh (Command + Shift + R).
