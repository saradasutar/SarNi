SarNi Native Secure Mode — Frontend v19.4.12
Backend v3.17.5 — THIS BACKEND UPDATE IS REQUIRED

WHY THIS VERSION IS DIFFERENT
The normal Chrome profile is blocking Apps Script when it is called as a cross-site iframe or JSONP polling script. Incognito works because it uses a clean browser profile. Repeating cache repairs cannot reliably change this browser policy.

SarNi v19.4.12 therefore opens the complete dashboard from Apps Script itself. Login and every later action use the built-in same-origin google.script.run bridge. There is no cross-site iframe and no polling endpoint.

WHAT REMAINS INCLUDED
1. Fast login and immediate dashboard display.
2. Shared holding-value recovery across desktop and mobile.
3. GPF present balance, monthly payment, interest rate and 12-month projection.
4. Unified family summary first, followed by Niharika and Sarada.
5. Overlap-proof summary metrics, distinct colours and compact mobile 2×2 cards.
6. Professional Daily/Monthly Diary, sticky notes, quotes, expenditure, SIP, watchlist and transactions.
7. Five-minute inactivity logout and saved username option.

STEP 1 — UPDATE THE APPS SCRIPT PROJECT
1. Open the existing SarNi Apps Script project.
2. Replace all content in Code.gs with Code-v3.17.5.gs from this package.
3. Click the + button beside Files, choose HTML, and create these four files exactly:
   - IndexApp
   - StylesApp
   - ConfigApp
   - AppApp
4. Paste the corresponding packaged file into each Apps Script HTML file:
   - IndexApp.html into IndexApp
   - StylesApp.html into StylesApp
   - ConfigApp.html into ConfigApp
   - AppApp.html into AppApp
5. Save the Apps Script project.
6. Choose Deploy > Manage deployments > Edit.
7. Select New version, confirm Execute as Me and Who has access: Anyone, then Deploy.
8. Keep the same /exec URL already present in config.js.

STEP 2 — UPLOAD SIX WEBSITE FILES TO GITHUB
Upload these files to the SarNi repository and commit them:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-12.js
   - build-version.json
   - repair-login.html

Do not upload IndexApp.html, StylesApp.html, ConfigApp.html, AppApp.html or Code-v3.17.5.gs to GitHub. Those five belong in Apps Script.

STEP 3 — TEST
1. Wait about two minutes for GitHub Pages to publish.
2. Open:
   https://saradasutar.github.io/SarNi/?v=19412-native1
3. The GitHub address will automatically open SarNi Native Secure Mode through Apps Script.
4. Confirm Frontend v19.4.12 and Backend v3.17.5.
5. Sign in in the normal Chrome window. The polling-endpoint error should no longer be possible in Native Secure Mode.
6. Confirm Holdings, GPF, Diary and the Unified/Niharika/Sarada summaries.

Direct Native Secure Mode test address:
https://script.google.com/macros/s/AKfycbx0Se_UHDk1zWdPHcKm3WRBFEVHl2CalsaPRqVa020qrpj0Crq-l7T1W_5I8ciGhF1w/exec?app=1&v=19412-native1

Older app-v19-4-x.js files may remain in GitHub; index.html no longer loads them.
