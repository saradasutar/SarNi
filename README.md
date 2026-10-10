# SarNi — personal-life dashboard

GitHub Pages launches the Google Apps Script dashboard. The current production frontend is `app-v20-2-2.js`; backend code and private Google Sheets remain in Google Apps Script/Google Drive, **not** this public repository.

## Current files
- `index.html`: lightweight page launching the existing Apps Script deployment.
- `app-v20-2-2.js`: active application code.
- `styles.css`: active styles.
- `favicon.svg`: icon.
- `build-version.json`: production release metadata.
- `config.js`: legacy compatibility configuration; only retain until confirmed unused across clients.
- `repair-login.html`: optional browser session recovery.

Obsolete older frontend versions and personally identifying portfolio exports were removed from the current repository. Git history can still contain historical data. Keep all private financial data in private Google Sheets and do not upload exports to public GitHub.

To deploy the next SarNi release, first upload the new referenced JavaScript to GitHub, then update `IndexApp.html` in the **existing** Apps Script project and redeploy the existing web app. Do not run `setupSystem()` on an established database.
