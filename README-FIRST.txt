SarNi Instant Values + Comfort Text — Frontend v19.4.5
Backend remains v3.17.1 (NO Apps Script change or redeployment required)

WHAT THIS FIX CHANGES
1. Last verified holding values appear immediately after login on desktop and mobile.
2. A live backend price refresh starts about 0.1 second after login.
3. While the app is open, shared values are checked every 60 seconds on both devices.
4. Fresh live values replace saved values silently as soon as the backend responds.
5. Missing prices show as unavailable while updating, never as a false ₹0.
6. Mobile text remains larger, bolder and comfortable to read.
7. Login inputs remain 16px to avoid automatic zoom on iPhone browsers.
8. Loading remains a small, light mobile banner instead of a heavy full-screen layer.
9. Desktop sizes and layout remain unchanged.
10. The mobile sign-in reliability fix and 5-minute inactivity auto-logout remain active.

HOW TO UPLOAD ON GITHUB
1. Open your SarNi repository.
2. Choose Add file > Upload files.
3. Upload all five website files from this folder:
   - index.html
   - styles.css
   - config.js
   - app-v19-4-5.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

MOBILE TEST
1. Open:
   https://saradasutar.github.io/SarNi/?v=1945-instantvalues1
2. Confirm the login screen shows:
   Frontend v19.4.5 and Backend v3.17.1
3. If the phone still shows an older frontend version, tap:
   Repair browser cache/session
4. Sign in once. The username can remain saved; the password is not stored.

You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
