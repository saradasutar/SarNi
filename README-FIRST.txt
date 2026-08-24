SarNi Fast Login + Holdings Recovery — Frontend v19.4.6
Backend v3.17.2 (Apps Script update and NEW deployment are required)

WHAT THIS FIX CHANGES
1. Backend authenticates first instead of loading the whole dashboard before login completes.
2. Holdings load through a smaller fast request; full diary, SIP and expenditure data follows in the background.
3. The last complete portfolio appears immediately after authentication on a previously used device.
4. An empty temporary backend response can no longer replace correct holdings with ₹0 or 0/0.
5. A device-only filter that hides every holding is cleared automatically on first load.
6. Holdings values are checked every 30 seconds and whenever the app returns to the foreground.
7. Missing prices remain unavailable while repairing, never presented as a real ₹0.
8. Larger mobile text and the light loading banner remain included.
9. The same correction applies to desktop, mobile and tablet.
10. The 5-minute inactivity auto-logout remains active.

STEP 1 — UPDATE APPS SCRIPT BACKEND
1. Open the Apps Script project currently used by SarNi.
2. Replace the full Code.gs contents with Code-v3.17.2.gs from this package.
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
   - app-v19-4-6.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

MOBILE TEST
1. Open:
   https://saradasutar.github.io/SarNi/?v=1946-fastlogin2
2. Confirm the login screen shows:
   Frontend v19.4.6 and Backend v3.17.2
3. If the phone still shows an older frontend version, tap:
   Repair browser cache/session
4. Sign in once. The username can remain saved; the password is not stored.

On the affected phone, use Repair browser cache/session once after publishing, then sign in again.
You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
