SarNi Mobile Login Fix — Frontend v19.4.3
Backend remains v3.17.1 (NO Apps Script change or redeployment required)

WHAT THIS FIX CHANGES
1. Mobile sign-in waits up to 120 seconds for a slow Apps Script response.
2. The dashboard opens immediately from the fresh data returned by login.
3. A second bootstrap request no longer blocks the login screen.
4. Missing-price repair runs in the background after the dashboard opens.
5. The immediate extra session-heartbeat request was removed to reduce mobile congestion.
6. The existing 5-minute inactivity auto-logout remains active.

HOW TO UPLOAD ON GITHUB
1. Open your SarNi repository.
2. Choose Add file > Upload files.
3. Upload all five website files from this folder:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-3.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

MOBILE TEST
1. Open:
   https://saradasutar.github.io/SarNi/?v=1943-mobilelogin2
2. Confirm the login screen shows:
   Frontend v19.4.3 and Backend v3.17.1
3. If the phone still shows an older frontend version, tap:
   Repair browser cache/session
4. Sign in once. The username can remain saved; the password is not stored.

You do not need to delete app-v19-4-2.js immediately. It is no longer loaded by index.html.
