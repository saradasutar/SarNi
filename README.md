# SarNi — Personal Life Dashboard

**Open the website:** https://saradasutar.github.io/SarNi/

SarNi's frontend is hosted directly on GitHub Pages. Google Apps Script is the **backend service only**. Use the GitHub Pages address to sign in and navigate; do not open the Apps Script `/exec?app=1` link as the dashboard.

## Current GitHub Pages frontend

- Frontend: **v20.8.14** (`index.html` loads `app-v20-8-14.js`)
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

## v20.8.10 Life Experience editor

You can format selected experience text as bold, italic, coloured or highlighted. Formatting is stored as restricted markup inside the existing authenticated Lesson field—no new Sheet columns or backend deployments are required. Older unformatted entries remain editable. Reminder text, search, and export use the readable plain text. Pasted material is converted to plain text, and unknown HTML tags/attributes are discarded before display. The editor uses browser rich-text commands (compatibility may differ across mobile keyboards), so test saving and reopening a short sample entry.

**Photo upload note:** A remaining error `Choose an image of at most 2 MB` is returned by a still-outdated production Apps Script deployment, not the GitHub frontend. Confirm the production `/exec` JSON reports backend version `3.17.30`, and verify the deployment is running the updated `Code.gs` from the same project. The FE's expected version badge does not verify live backend version.

## v20.8.11: accurate photo validation and backend status
- SarNi now checks the real configured Apps Script backend version from within Life Experiences. Use the new **Check backend version** button, with no need to open the Apps Script editor.
- Previous SarNi incorrectly interpreted `The original image or thumbnail is too large` as proof of the older 2 MB limit. That message also exists in backend 3.17.30, which can reject thumbnails over **14,500 decoded bytes**. Now the original error and actual version are differentiated.
- Automatically generate an 84–100px JPEG thumbnail under **12,500 decoded bytes** before sending unchanged original bytes to Drive. The original remains untouched.
- If confirmed backend 3.17.29 is connected and the original exceeds 2 MB, stop before transferring the large file and show the exact expected deployment fix.
- Backend Code.gs is not modified by this frontend release. The actual live backend version must be checked from the app and an original above 2 MB test saved successfully before upload support is considered verified.

## Mobile + button (v20.8.12)

The centre **+** shows only **Quick Expense** and **Quick Diary**. Each opens the existing secure inline form, focuses the essential amount/diary text input, and preserves current save, duplicate alerts, visibility and sharing settings. **More tools** opens the existing **More** menu, which now additionally includes **Add Reminder** and **Smart Paste**. Life Experiences, Credit Cards, complete Diary history, Notes & Targets, writing and settings remain there.

Under Quick Expense is a small **Last 3 expenses** collapsible list. Quick Diary has a collapsible **Last 3 diary entries** list (closed by default for privacy). Both use only the current user's authenticated records already in memory; no new API, storage or save operations. They refresh after an entry is saved and are cleared on sign-out. Read-only recent cards cannot accidentally edit, overwrite or duplicate a record. Complete records are still available in Money / Diary.

## v20.8.13 startup fix

Resolved the `Cannot access 'sariWords' before initialization` error: initial authenticated application startup (`init()`) now runs only after the Life Experience module and all other top-level declarations have been initialized. The v20.8.12 + button, recent quick entries, rich editor and backend connection remain unchanged. No sheet, account, photos or Apps Script deployment was changed.

## v20.8.14 · MyFamily-style English/Odia calendar and festivals

- The Calendar page now has prominent Calendar, Reminder, Target and Festivals shortcuts, including from the mobile More menu. The centre + button remains intentionally limited to Quick Expense and Quick Diary.
- Selecting an English date shows its Odia month, paksha and lunar tithi using the existing authenticated Bhubaneswar-sunrise calculation. The displayed lunar conversion is an **estimate**, not an official Kohinoor publication.
- Existing reminder and target saving continues through SarNi's private Google Sheet and Apps Script v3.17.30. Existing recurring occasions can repeat by English date, Odia lunar tithi, or both.
- Admin-visible Festival editor uses existing `saveImportantDate` and `deleteImportantDate` operations, saving a private record of type `OTHER` with the `[SARNI_FESTIVAL_V1]` notes marker, and `repeatYearly=true`. The admin may select English-date or Odia-lunar-tithi recurrence. The year-by-year occurrence is calculated by the existing backend as the calendar is browsed.
- **Data scope:** Custom festival records are stored in the *signed-in administrator's account*. They do not automatically propagate to other users. The administrator restriction is frontend-only; centrally shared and backend-enforced admin-managed festivals require a separately deployed Apps Script backend change. No additional `Code.gs` replacement is needed for the current personal-account version.
- Built-in official/published dates are limited; other computed festival dates require checking against the printed Kohinoor Panjika. Backend per-year verified overrides for recurring occasions continue to work.
- No Google Sheet structures, accounts, passwords, security settings or remote backend links were changed by this frontend release.

## MyFamily-inspired Planning Centre (additive module v20.8.15)

- Available in **Calendar → Targets / Reminders**, including the existing mobile More-menu shortcuts. The existing English/Odia calendar and yearly Festival editor are retained unchanged.
- **Targets:** dedicated mobile-friendly cards for existing authenticated SarNi sticky-note targets, with due/overdue indicators, search, edit, mark completed, active/completed filters and completion history. The percentage is **completed tasks / all saved tasks**. It is **not** MyFamily's monetary target / contribution progress.
- **Reminders:** searchable cards displaying the existing private important dates and quick sticky reminders. Displays annual English/Odia/both recurrence as saved, opens the original editor to preserve Odia verification and reminder settings, and shows upcoming occurrences returned by the existing authenticated backend.
- Saving, editing and completing actions continue using the original Apps Script operations and original Google Sheet. This release does **not** create another database or alter the Apps Script backend, login flow, photos, finance ledger or notification trigger.
- MyFamily's **shared-family email recipients, reminder photo attachments, and financial goal contributions** are not added here, because SarNi currently lacks matching backend storage and permissions. They need a separately reviewed backend migration if wanted.
- Files: `sarni-family-planner-v20-8-15.js` and `sarni-family-planner-v20-8-15.css`; the existing FE app remains v20.8.14 until a full FE-version release.
- Safety: source records are read only from the current authenticated state; the upcoming-occurrence cache is cleared when the signed-in username changes. Avoid storing private names/records in public GitHub source.
