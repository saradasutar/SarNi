SarNi Shared Holdings Recovery + Professional Diary — Frontend v19.4.7
Backend v3.17.3 (Apps Script update and NEW deployment are required)

WHAT THIS FIX CHANGES
1. A verified holdings snapshot is now kept on the backend, so it is shared by desktop, mobile and tablet.
2. A newly used phone can recover the last verified holding values even when that phone has no local cache.
3. Missing or temporary zero values are repaired per holding without replacing newer valid live values.
4. The fast holdings request automatically retries with shared recovery when the first response is incomplete.
5. The holdings status shows the holding count, visible-value count and shared-recovery count.
6. Login remains lightweight: authentication completes first, holdings load next, and full diary/SIP/expense details continue in the background.
7. Values continue checking every 30 seconds and when the app returns to the foreground.
8. The daily diary editor is full width. Recent entries and searchable history are below it and cannot overlap.
9. The diary adds writing starters, a clearer reflection area, live word count and estimated reading time.
10. Larger mobile text, light loading and the 5-minute inactivity auto-logout remain included.

STEP 1 — UPDATE APPS SCRIPT BACKEND
1. Open the Apps Script project currently used by SarNi.
2. Replace the full Code.gs contents with Code-v3.17.3.gs from this package.
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
   - app-v19-4-7.js
   - build-version.json
4. Choose Commit changes.
5. Wait about 2 minutes for GitHub Pages to publish.

FIRST SHARED-RECOVERY TEST
1. On the desktop or phone that currently shows correct holdings, sign in once so Backend v3.17.3 stores the verified shared snapshot.
2. On the affected phone, open:
   https://saradasutar.github.io/SarNi/?v=1947-sharedrecovery1
3. Confirm the login screen shows Frontend v19.4.7 and Backend v3.17.3.
4. If an older version appears, tap Repair browser cache/session once, then sign in again.
5. In Holdings, confirm the status shows the expected holding count and all values visible.

You do not need to delete older app-v19-4-x.js files immediately. They are no longer loaded by index.html.
