SarNi Smooth Login + GPF Holdings — Frontend v19.4.8
Backend v3.17.4 (Apps Script update and NEW deployment are required)

WHAT THIS FIX CHANGES
1. Login now opens the dashboard immediately after authentication; holdings and full details update quietly afterward.
2. The browser no longer starts many rapid polling requests while Apps Script is still working.
3. Successful Apps Script replies are delivered directly to the page, with delayed polling only as a fallback.
4. Normal authenticated requests use the server session cache and avoid repeated session-sheet reads and writes.
5. A verified holdings snapshot remains shared across desktop, mobile and tablet to repair temporary zero values.
6. GPF can be added as a holding with present balance, monthly payment, annual interest rate and balance date.
7. GPF present balance is included in combined holdings; its card and details show a 12-month payment, interest and balance projection.
8. Holdings continue checking in the background and when the app returns to the foreground.
9. The professional diary layout and comfortable mobile text remain included.

STEP 1 — UPDATE APPS SCRIPT BACKEND
1. Open the Apps Script project currently used by SarNi.
2. Replace the full Code.gs contents with Code-v3.17.4.gs from this package.
3. Click Deploy > Manage deployments > Edit.
4. Select New version, then click Deploy.
5. Keep the same /exec URL; config.js does not need changing.

STEP 2 — UPLOAD WEBSITE FILES ON GITHUB
1. Open your SarNi repository.
2. Choose Add file > Upload files.
3. Upload all five website files from this folder:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-8.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

SMOOTH LOGIN AND GPF TEST
1. On the affected phone, open:
   https://saradasutar.github.io/SarNi/?v=1948-smoothlogin-gpf1
2. Confirm the login screen shows Frontend v19.4.8 and Backend v3.17.4.
3. Sign in. The dashboard should open as soon as authentication succeeds; holdings may fill in quietly afterward.
4. If an older version appears, tap Repair browser cache/session once, then sign in again.
5. In Holdings, confirm the expected holding count and values on desktop and both phones.
6. Tap Add, choose GPF, enter the present balance, monthly payment, editable interest rate and balance date, then save.
7. Confirm the GPF present balance appears in the combined holding total and its details show the 12-month projection.

You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
