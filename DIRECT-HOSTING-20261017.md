# SarNi direct-hosting stabilization — 17 October 2026

## What is active

- **Public frontend:** https://saradasutar.github.io/SarNi/ from `index.html` on GitHub Pages.
- **Frontend assets:** `styles.css`, `app-v20-8-7.js`, `sarni-delight.css`, and `sarni-delight.js`.
- **Expected FE / BE:** 20.8.7 / 3.17.29. These version numbers are source references, **not** proof that the running backend is up-to-date.
- **Backend:** the separately deployed SarNi Google Apps Script `/exec` web app. It processes requests from the GitHub website. Do not point the browser's ordinary dashboard shortcut at `/exec?app=1`.

## Changes in this branch

1. Direct-hosting navigation guard returns to the current website's origin and base path, so a future domain change does not force users back to `saradasutar.github.io`.
2. Frontend loading failures now link to a safe on-site reload or `health.html`, rather than giving obsolete v20.7.0 instructions.
3. Replace a redundant same-origin preconnect with a backend-host preconnect.
4. Remove a duplicate contradictory theme-color metadata declaration.
5. Add `health.html`, a static file availability check. It sends no credentials and does not access Google Sheets or backend authentication.
6. Align `build-version.json` with the FE asset actually referenced by `index.html`.

No changes were made to the Apps Script backend, Sheets, authentication, password management, calendar records, user data, or feature logic.

## Post-merge verification (necessary)

1. Merge the PR and confirm GitHub Pages is configured to publish `main` at the repository root.
2. Open https://saradasutar.github.io/SarNi/ and check that the URL remains on GitHub Pages during sign-in, calendar navigation, expense entry, and logout.
3. Open https://saradasutar.github.io/SarNi/health.html and confirm all static assets are available.
4. Sign in with a test account, read a calendar/reminder, save and read back one harmless test expense or diary entry, and verify data only once in the expected SarNi Sheet.
5. Verify the logged-in backend version against **3.17.29**. If the actual SarNi backend is a different version, compare its actions before making frontend changes.
6. In Android Chrome, test normal mode (not only incognito), close/reopen, and installed shortcut behavior.
7. After monitoring, retire obsolete source files only when no HTML, deployment, or rollback plan references them. The older `app-v*.js` files in this public repository are not loaded by the current `index.html`; that does *not* make it safe to delete them before the Apps Script deployment and old links are audited.

## Known limitations

- The public GitHub repository does **not** contain the currently deployed `Code.gs` backend. It cannot be safely audited, cleaned or republished solely from the GitHub files.
- The static check cannot confirm whether an `/exec` endpoint belongs to SarNi rather than a different dashboard, whether it is deployed for intended users, or whether a real login/save succeeds. Those checks require backend access and authenticated testing.
- The frontend still includes large inherited UI modules in `app-v20-8-7.js`. Blindly deleting them risks breaking GPF, calendar, diary, account controls and old compatibility handlers. This release intentionally does not pretend to finish a full dead-code removal.
- GitHub Pages and Cloudflare can deliver static files quickly; they cannot by themselves reduce Apps Script/Sheets execution latency.

## Rollback

Revert the PR's frontend commits on `main`, or restore the pre-change `index.html` from GitHub history. This change does not require restoring or modifying your Google Sheet.

**Important:** Never put private Sheet exports, passwords, session tokens, photos, or backend secrets in this public repository.
