# SarNi — Personal Life Dashboard

**Open the website:** https://saradasutar.github.io/SarNi/

SarNi's frontend is hosted directly on GitHub Pages. Google Apps Script is the **backend service only**. Use the GitHub Pages address to sign in and navigate; do not open the Apps Script `/exec?app=1` link as the dashboard.

## Current GitHub Pages frontend

- Frontend: **v20.8.9** (`index.html` loads `app-v20-8-9.js`)
- Expected backend: **v3.17.30** — upload and deploy separately for original photos above 2 MB (verify against your active Apps Script deployment)
- User interface: `styles.css`, `sarni-delight.css`, `sarni-delight.js`, and `sarni-entry-polish.css`
- App installation: `manifest.webmanifest`
- Frontend checks: [Site Check](./health.html)
- Deployment notes and rollback: [Direct-hosting guide](./DIRECT-HOSTING-20261017.md)

The existing dashboard includes personal expenses, GPF, diary, calendar/reminders, life experiences, smart paste, user management and mobile quick actions. Investments in stocks/MF/ETF are intended to be managed in the separate Analysis dashboard.

## Safety

Do not run `setupSystem()` against the existing Google Sheet. Do not overwrite `Code.gs` from an old ZIP without verifying backend action compatibility. Back up the Apps Script project and Sheet before backend deployment. Never commit personal records, passwords, tokens or private Drive content to this public repository.

Legacy `IndexApp.html` and earlier versioned assets have been retained for compatibility/rollback; the live GitHub Pages site is served from **`index.html`**.

## 20.8.8 photo and entry upgrade

- Original JPG, PNG and WebP photos in Life Experiences and admin profile photos are stored **unchanged** in private Google Drive; only a small JPEG thumbnail is shown in the dashboard.
- The old 2 MB cap has been replaced by a **20 MB per-image transfer ceiling**, to avoid overwhelming Apps Script. Files larger than that need an alternative resumable upload mechanism; this release does not claim unlimited uploads.
- More colourful, keyboard-friendly entry forms, with quick reuse of previous expense descriptions and categories; expense save semantics and duplicate protection remain unchanged.
- 13 completely unreferenced obsolete frontend release files removed (~7.5 MB of GitHub repository files), but active scripts and rollback-linked files remain. Git history retains older releases.
- **Before large-image uploads** update the EXISTING Google Apps Script project's Code.gs from the matching v3.17.30 text file after backing up, then publish a NEW VERSION of the existing Web app deployment. Do not create an extra duplicate .gs file or run `setupSystem()`. Until then, uploads above 2 MB can still fail on the old backend.

See [Deployment/verification details](./SARNI-20.8.8-RELEASE.md).

## v20.8.9 photo decoder and text clarity

The frontend now reuses the selected photograph's thumbnail when saving, rather than attempting a second full-size image decode. If a browser cannot use `createImageBitmap`, it falls back to the standard image-element decoder. The preview explicitly says the original is **not yet saved** until Save Experience succeeds. Form text, buttons, table entries, and headings have been enlarged and made bolder on desktop and mobile while retaining accessible focus and responsive layouts. The existing backend v3.17.30 is unchanged.
