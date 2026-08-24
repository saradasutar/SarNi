SarNi Automatic Login Repair + Clear Holdings Summary — Frontend v19.4.10
Backend v3.17.4 (no backend change is required if v3.17.4 is already deployed)

WHAT THIS FIX CHANGES
1. A new frontend update no longer deletes a valid signed-in session or forces another login.
2. Old SarNi caches and SarNi-scoped service workers are removed before the new app starts, followed by one clean reload.
3. If a login transport request still times out, SarNi performs one automatic browser-cache repair and retries the same sign-in once.
4. A separate repair-login.html recovery page is included for a browser profile that is still controlled by an old cached site version.
5. Saved username, portfolio value snapshots, diary drafts and display preferences are preserved during automatic repair.
6. Login opens the dashboard immediately after authentication; holdings and full details update quietly afterward.
7. The Holdings Summary is reorganised: the Unified family portfolio is prominent across the top; Niharika and Sarada are side by side below on wide screens.
8. Summary labels and amounts now use separate lines, preventing Growth/Loss values and percentages from overlapping.
9. Mobile remains compact with two cards per row and no sideways summary scrolling.
10. Total is blue, Mutual Funds green, Stocks/ETFs orange and GPF teal; investor groups retain their own colours.
11. GPF present balance, monthly payment, projected 12-month value and estimated interest remain included.
12. Shared holding-value recovery, professional diary and comfortable mobile text remain included.

STEP 1 — CHECK APPS SCRIPT BACKEND
1. If SarNi already shows Backend v3.17.4, do not change or redeploy the backend.
2. If it shows an older backend, replace Code.gs with Code-v3.17.4.gs and deploy a New version using the same /exec URL.

STEP 2 — UPLOAD WEBSITE FILES ON GITHUB
1. Open your SarNi repository.
2. Choose Add file > Upload files.
3. Upload all six website files from this folder:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-10.js
   - build-version.json
   - repair-login.html
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

LOGIN AND SUMMARY TEST
1. In the affected normal browser, open:
   https://saradasutar.github.io/SarNi/?v=19410-loginheal1
2. The page may show “Preparing a clean, secure sign-in…” briefly and reload once.
3. Confirm Frontend v19.4.10 and Backend v3.17.4 appear.
4. Sign in. The dashboard should open immediately; holdings may fill in quietly afterward.
5. If an old cached page still controls that browser, open this one-time repair address:
   https://saradasutar.github.io/SarNi/repair-login.html?v=19410-loginheal1
6. In Holdings, open the summary. Confirm Unified appears first and Niharika/Sarada below, with no text overlap.
7. Confirm expected holding count, values and all GPF figures on desktop and both phones.

You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
