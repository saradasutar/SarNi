# SarNi — Personal Life Centre

**Frontend:** v20.10.3 — MyTrip-style Quick Add popup and direct feature navigation.

**Live dashboard:** https://saradasutar.github.io/SarNi/

## Hosting and architecture
- This public GitHub repository contains only **frontend** assets. `index.html` loads `app-v20-10-3.js`.
- Google Apps Script provides authenticated backend API and private Google Sheets/Drive data.
- The installed no-login Quick Expense app uses `quick-expense.html`, its supporting JavaScript, manifest, icons and service worker; these files must remain deployed.
- Keep `config.js` and the existing Apps Script endpoint when updating; it is not bundled with every frontend release.

## Updating
1. Backup the GitHub repository and existing Apps Script project.
2. Copy all **clean frontend files** to the repository root, replacing matching files.
3. Remove obsolete legacy files from GitHub **in the same commit** using the accompanying cleanup checklist, if applicable.
4. Commit and publish. Check `health.html`, sign-in, Expense, Diary, Stock Notes, Calendar, Book Writing and no-login Quick Expense.
5. Keep the previous Git commit as a rollback point.

## Backend safety
- A frontend cleanup does **not** require changing `Code.gs` or recreating the spreadsheet.
- Never run `setupSystem()` on an existing SarNi database.
- Never commit private records, passwords, API secrets, photo originals, spreadsheets or Drive backups to this public repository.
- Deleted repository files remain recoverable from Git history; deleting a file is not a security-erasure procedure.

See `SARNI-SECURITY-AND-BACKUPS.md` for additional historical notes. Keep GitHub `.github/workflows/` and `quality/` until their current use is independently reviewed; the frontend ZIP does not include them.
