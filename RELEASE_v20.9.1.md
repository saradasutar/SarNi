# SarNi FE v20.9.1

SarNi FE 20.9.1 + BE 3.17.36 — DIRECT DEPLOYMENT PACKAGE
Date: 30 October 2026

SOURCE
FE: user-supplied SarNi-main (8).zip (84 entries)
BE Code.gs: user-supplied pasted Code.gs source, v3.17.35
BE StockDiary.gs and DiaryKnowledge.gs: previous SarNi update packages (latest live contents not supplied).

IMPORTANT SAFETY
1. Back up your current GitHub main branch and all live Apps Script files before changing anything.
2. Do not execute setupSystem(), resetAdminPassword(), or replace existing Google Sheets / Drive IDs.
3. This package does NOT access your live Apps Script deployment, Google Sheets or private Drive.
4. Preserve current Apps Script HTML files (IndexApp.html, AppApp.html, StylesApp.html, ConfigApp.html, private book script etc); only Code.gs, StockDiary.gs, DiaryKnowledge.gs and SarNiDriveStorage.gs are included here.
5. If StockDiary.gs or DiaryKnowledge.gs have been changed manually since their previous package, compare and merge rather than overwriting newer changes.
6. Script project version badge only reflects BE 3.17.36 after deploying a NEW Apps Script version (not simply saving source).

INSTALL FRONTEND
Unzip SarNi_FE_v20.9.1.zip. Upload the CONTENTS at repository ROOT (index.html, app-v20-9-1.js, config.js, styles.css and others); do not put the outer folder on GitHub. Keep all files. Commit to main.

INSTALL BACKEND
In your EXISTING SarNi Apps Script project, back up and replace Code.gs with enclosed Code.gs. Keep other project HTML files intact. Add/update the enclosed StockDiary.gs and DiaryKnowledge.gs after comparing with your current copies. Run setupSarNiStockDiary() and setupSarNiDiaryKnowledge() only if the corresponding tables are not set up already. Never run setupSystem(). Deploy > Manage deployments > Edit > New version > Deploy. Ensure frontend config.js points to this same /exec deployment (no need to change if edited existing deployment).

FUNCTIONALITY
• One Diary & Knowledge menu, unified editor and no duplicate diary calendar; historical monthly plan remains accessible.
• Stock Research and Wisdom are backed by private Apps Script actions (sd* and dk*).
• Credit Cards remains available within Expenditure, not as a separate left-hand item.
• MyTrip-inspired amount-first expense editor with optional details tucked away; uses existing expense save APIs; no new no-login link or settlement feature.
• Compact notifications based on saved regular/planned expense counts, with a link to the main Calendar. Does not create push notifications, email reminders or new data records.
• One Drive root: sarniDriveInventory() previews existing resources; sarniOrganizeDrive() consolidates known SarNi sheet, script project (if accessible), photo, stock attachment and backup folders without changing IDs.
• Daily JSON backup includes all current master spreadsheet tabs (including Stock Diary and Diary Knowledge), while backup retention touches only SarNi backup files. Photo originals remain in Drive and are not copied into JSON.
• Existing Book Writing workflow retained; new book preview is NOT merged into this release.
• Central FE version updated to 20.9.1 in the active app and build-version.json; BE expected 3.17.36, backend returns actual status.

TEST AFTER DEPLOYMENT
1. Logged out: sign-in screen only. Login and logout normally.
2. Check FE 20.9.1, then BE 3.17.36 AFTER backend deployment.
3. Diary & Knowledge > Write > Personal > Monthly Highlight: save and verify All entries and Monthly Highlights.
4. Stock > Add company > Save research > promote to Wisdom.
5. Main Calendar still works. No duplicate diary calendar.
6. Expenditure > Quick Expense: amount, reason, category, date, paid-from; save exactly once and verify totals.
7. Expenditure > Credit cards & bills; ensure purchases do not count twice; verify statements.
8. Book Writing: open existing book, edit one test chapter, export/print.
9. Notifications bell: regular and planned counts show appropriately; verify on mobile.
10. Security: private records cannot be queried without login. Test backup and restore separately.

KNOWN LIMITATIONS
• The stock/knowledge backend modules came from prior packages, not a fresh export of those two live .gs files.
• Live authenticated actions and data restoration cannot be tested here.
• Only known SarNi file/folder IDs and known direct subfolders can be consolidated automatically. Other unregistered SarNi projects/files require manual identification. A container-bound Apps Script project may not be movable as a standalone Drive item.
• All sheet tabs are included in backup JSON, but photo originals/attachments remain as separate private Drive files; JSON backups alone do not duplicate their bytes.
• Version numbers are release constants, not a GitHub commit counter; next release must update the manifest and app version together.
• This is a code package, not a live deployment.
