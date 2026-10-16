SarNi v20.8.6 — Mobile Premium Smooth UI
=======================================
Frontend: v20.8.6  |  Backend: v3.17.29 (unchanged)

WHAT CHANGED
- Android/mobile-only refinement inspired by your MyTrip mobile reference.
- Compact teal-and-ivory header; cleaner Today focus, large readable cards.
- Bottom dock: Home | Plan | + | Money | More.
- Center + opens an action sheet: Expense, Quick Diary, Smart Paste, Reminder, Life Experience, Task / Target.
- Less duplicate navigation in mobile; existing desktop sidebar and single Admin Settings placement preserved.
- Better small-phone spacing, safe-area padding, Escape/backdrop closing, keyboard-aware bottom dock,
  and reduced-motion support.
- No change to financial records, Google Sheets schema, logins, Apps Script APIs or Drive.

IMPORTANT: WHAT TO UPLOAD
This is primarily an IndexApp.html-only update. If your currently deployed Code.gs already
shows backend version v3.17.29, DO NOT replace Code.gs: leave it exactly as it is.
The ZIP includes the identical existing Code.gs and Code.gs.txt for convenience and backup only.

STEPS
1. Save a backup of your current IndexApp.html and Code.gs.
2. Open IndexApp.html.txt from ZIP in Notepad, select all text, and copy it.
3. In your EXISTING Google Apps Script project, open IndexApp.html, select all, paste, Save.
4. Deploy > Manage deployments > select the existing deployment > Edit > New version > Deploy.
5. On Android open https://saradasutar.github.io/SarNi/ and refresh/relaunch the installed shortcut.
6. Check FE v20.8.6 / BE v3.17.29 after login. Test Home, Plan, +, Money and More.
7. Verify + Expense, + Quick Diary, + Smart Paste, + Reminder and existing Admin Settings.

The new hosted matching script app-v20-8-6.js is already staged at:
https://github.com/saradasutar/SarNi/blob/main/app-v20-8-6.js
Do not remove prior app-v20-8-5.js; retain it for rollback.

ROLLBACK
Redeploy your previous working Apps Script version containing IndexApp.html with the old asset.
The rollback does not require reverting the sheet or user data.

TESTED
- HTML contains unique IDs; all inline JS code blocks passed node --check.
- Offline Chromium interaction tests: 320,360,390,430,820 px and desktop 1440px.
- Center + open/close, Escape, backdrop, responsive dock.
- The backend file is byte-identical to the v20.8.5 package.
- Real authenticated login, saving and network speed were NOT tested in production.

PREVIEW
preview.html is a self-contained interactive MOCKUP with demo records. It is not connected to your data.
