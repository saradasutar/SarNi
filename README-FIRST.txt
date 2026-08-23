MYFINANCE V19.2.1 ENHANCED
Backend remains v3.15.0 — no Apps Script code change is required for these two UI improvements.

RETAINS ALL V19.2 TRANSACTION FEATURES
- MF purchase / SIP / redemption dates from imported MF statements
- Stock/ETF BUY and SALE dates from Zerodha/broker Tradebook CSV/XLSX
- SALE prominently red
- BUY green
- Realised profit green / realised loss red
- Investor, asset, BUY/SALE, date-range and search filters
- Qty/Units, Price/NAV, Amount, Broker/Source, Holding Period, Realised P/L
- Total Purchases / Total Sales / Realised P/L / transaction-count summary cards
- Holding detail: First Purchase / Latest Purchase / Latest Sale
- Tradebook import adds transaction history and does not replace existing Holdings

NEW — SMOOTHER HORIZONTAL SCROLLING
- Fixed bottom horizontal controller now works for Holdings, Transactions AND Watchlist
- Range slider updates are animation-frame coalesced
- Left/right arrows move by a responsive amount based on the visible table width
- Shift + mouse wheel moves tables horizontally
- Trackpad/touch horizontal movement remains native
- Less UI refresh work while scrolling for smoother movement

NEW — PINNED STICKY NOTES
- Every sticky note has a Pin / Pinned button
- A pinned note floats above other dashboard fields
- Multiple notes may be pinned
- Pinned notes keep Completed, Edit and Delete buttons visible
- Completed still archives the note to Daily Diary using the existing backend
- Delete still removes the active sticky using the existing backend
- Unpin returns the note to the normal sticky panel
- Pin state persists on this browser/device without changing backend data

INSTALL
GitHub: upload/replace
- index.html
- styles.css
- app-v19-2.js   (compatibility)
- app-v19-2-1.js

Keep your CURRENT working config.js. If your backend URL is already working, do not replace config.js unnecessarily.

Backend stays:
v3.15.0

Open your GitHub Pages site with:
?v=1921

Then hard refresh:
Mac: Command + Shift + R
