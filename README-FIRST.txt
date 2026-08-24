SarNi GPF Holdings Summary — Frontend v19.4.9
Backend v3.17.4 (no backend change is required if v3.17.4 is already deployed)

WHAT THIS FIX CHANGES
1. Login now opens the dashboard immediately after authentication; holdings and full details update quietly afterward.
2. The browser no longer starts many rapid polling requests while Apps Script is still working.
3. Successful Apps Script replies are delivered directly to the page, with delayed polling only as a fallback.
4. Normal authenticated requests use the server session cache and avoid repeated session-sheet reads and writes.
5. A verified holdings snapshot remains shared across desktop, mobile and tablet to repair temporary zero values.
6. GPF can be added as a holding with present balance, monthly payment, annual interest rate and balance date.
7. The expanded Holdings Summary now has a separate GPF card in all three rows: Combined, Niharika and Sarada.
8. Each GPF summary card shows present balance, monthly payment, projected 12-month value and estimated interest.
9. The summary is more compact: Unified Combined, Niharika and Sarada are organised as separate groups with four cards each—Total, Mutual Funds, Stocks & ETFs and GPF.
10. Each investment type is visually distinct: ALL/Total is blue, MF is green, Stocks/ETFs is orange and GPF is teal; Combined, Niharika and Sarada also have separate group colours.
11. Wide desktop shows the three groups together; laptop emphasises Combined with both investor groups below; mobile uses a readable 2×2 card grid without sideways scrolling.
12. GPF present balance remains included in Total Portfolio, while its projected future value stays clearly identified as a 12-month estimate.
13. Holdings continue checking in the background and when the app returns to the foreground.
14. The professional diary layout and comfortable mobile text remain included.

STEP 1 — CHECK APPS SCRIPT BACKEND
1. If SarNi already shows Backend v3.17.4, do not change or redeploy the backend.
2. If it shows an older backend, replace Code.gs with Code-v3.17.4.gs and deploy a New version using the same /exec URL.

STEP 2 — UPLOAD WEBSITE FILES ON GITHUB
1. Open your SarNi repository.
2. Choose Add file > Upload files.
3. Upload all five website files from this folder:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-9.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

GPF HOLDINGS SUMMARY TEST
1. On the affected phone, open:
   https://saradasutar.github.io/SarNi/?v=1949-gpfsummary2
2. Confirm the login screen shows Frontend v19.4.9 and Backend v3.17.4.
3. Sign in. The dashboard should open as soon as authentication succeeds; holdings may fill in quietly afterward.
4. If an older version appears, tap Repair browser cache/session once, then sign in again.
5. In Holdings, confirm the expected holding count and values on desktop and both phones.
6. Tap Add, choose GPF, enter the present balance, monthly payment, editable interest rate and balance date, then save.
7. Open Holdings and tap Show Holding Summary.
8. Confirm the separate GPF card appears under Combined, Niharika and Sarada, showing present balance, monthly payment, projected 12-month value and estimated interest.

You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
