MYFINANCE V19.2.2
Backend remains v3.15.0.

NEW
1. INVESTMENT HOLDINGS — Purchase / Sale Date column
   - Works for MF, stocks and ETFs.
   - BUY date appears in green.
   - SALE date appears in red.
   - Uses transaction history already available in V19.2.
   - First purchase is shown; latest purchase remains available in the holding detail drawer.
   - Latest sale/redemption is shown in red.
   - Also included in Holdings Preview/Print and CSV export.

2. SMOOTHER KEYBOARD HORIZONTAL SCROLLING
   - Left / Right arrow keys now smoothly move the active Holdings, Transactions or Watchlist table.
   - Normal Arrow key = smaller controlled movement.
   - Shift + Arrow = larger movement.
   - Uses requestAnimationFrame easing instead of competing browser smooth-scroll calls.
   - Does not interfere while typing in input/select/textarea fields.

3. ADD / EDIT / DELETE COLUMNS
   - Available in BOTH Investment Holdings and Watchlist.
   - Buttons are now labelled “Add / Edit / Delete Columns”.
   - Add custom parameter columns.
   - Edit custom column name, data type and order.
   - Delete custom columns and their saved values.
   - Rename/hide standard columns.
   - Click custom cells to edit values.
   - Custom columns continue to appear in Preview/Print.

4. All V19.2.1 features retained
   - Transactions
   - BUY green / SALE red
   - realised P/L colours
   - stock tradebook import
   - sticky Pin / Completed / Edit / Delete
   - smooth trackpad/mouse horizontal controls

INSTALL
Frontend files to upload/replace:
- index.html
- styles.css
- app-v19-2-1.js  (compatibility)
- app-v19-2-2.js

Keep your CURRENT working config.js.
Backend stays v3.15.0, so no Apps Script redeployment is required for this update.

Open your current GitHub Pages URL with:
?v=1922

Then Command + Shift + R.
