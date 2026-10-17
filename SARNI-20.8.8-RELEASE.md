# SarNi 20.8.8 — originals in Drive, fast entry, safe cleanup

## What changed on GitHub Pages

- Active entrypoint: `index.html` → `app-v20-8-8.js` + `sarni-entry-polish.css`.
- Photos: original JPG/PNG/WebP file is sent unchanged to the existing private Drive photo folder. A lightweight separate JPEG thumbnail is shown in Life Experiences and profile views. No photo is stored in the public GitHub repository.
- The 2 MB restriction has been replaced with a **20 MB transfer ceiling** for photo uploads in both areas. This ceiling is deliberate: Apps Script is not a resumable large-file upload service.
- Form usability: calm teal / violet accents, larger touch targets, clear focus states, and up to four previous expense descriptions to reuse locally (the value/amount is intentionally not auto-copied). Your existing save & next, duplicate detection, private diary entry, calendar entry, and category controls remain.
- Cleanup: thirteen unreferenced obsolete release files totaling approximately 7.5 MB removed from this branch. No database rows or Sheets were removed. Files still referenced by historical recovery pages, plus v20.8.7 as a rollback, were retained. Earlier versions can be recovered from Git commit history.

## **Required** existing Apps Script update

The GitHub source repository does not deploy Google Apps Script automatically. Without this separate update, photos above the former 2 MB limit will still be rejected by backend 3.17.29.

1. Back up your current **SarNi** Apps Script project and private Google Sheet.
2. In that same Apps Script project, replace the text of the existing **Code.gs** with the supplied **SarNi_Code_gs_v3.17.30_COPY_PASTE.txt**. Keep the script properties and Sheet identifiers intact. Never add a second copy as a separate .gs file.
3. In the Apps Script editor save, then use **Deploy → Manage deployments → Edit → New version → Deploy** on the existing working production web app.
4. Open the configured `/exec` root to verify JSON reports `SarNi Personal Finance` backend **3.17.30**. Do not change `index.html` or `config.js` to a new URL if the existing deployment was edited.
5. On the GitHub Pages dashboard, sign in and save one sample text expense and one Life Experience with a JPG above 2 MB. Confirm the original exists privately in Drive, and the new experience has a thumbnail. Test mobile profile photo updates if used.

## Technical limits

- The entire original image goes through the Apps Script web app. Base64 expands transfer payload by approximately 33%, so 20 MB originals generate requests roughly 27 MB or more. A browser or Apps Script transport can still reject those; this is not guaranteed across all devices and networks.
- No unconditional upload success is claimed until real integration tests pass against the deployed backend.
- Thumbnails are deliberately small, independent of original size; records remain private based on SarNi authorization.
- The 20 MB ceiling is not a Drive capacity limit. Truly unlimited large-photo uploads would need a different authenticated and resumable upload flow.

## Recovery

If any part of the new UI fails, restore the last GitHub commit that served `app-v20-8-7.js` (the file itself has been retained). No original files, accounts or sheet structures were deleted by the frontend changes.

**Never** run `setupSystem()` against the existing database; never paste backend code in a second Apps Script .gs file.
