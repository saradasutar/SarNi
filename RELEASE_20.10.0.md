# SarNi 20.10.0 productivity release

## Implemented in this release
- Global keyboard-accessible search/command overlay for Diary, Stock Research, Investment Wisdom plus workspace navigation. Ctrl/Command + K. Results load only after authentication and stay in memory. Expense register still uses its existing search; PDFs are not indexed.
- Book Writing chapter Focus mode, Ctrl/Command+S saves chapters. No changes to book storage.
- Accessible search dialog, reduced-motion CSS, better labels and visible focus.
- Frontend version constant, displayed badges, build-version manifest, main asset name and cache query brought to FE v20.10.0; backend is not falsely incremented.
- Read-only Apps Script audit function sarniCheckReleaseHealth() checks worksheet/folder presence, recent JSON backup availability and backup trigger (does NOT restore backups).
- Prior 20.9.2 features retained: unified Diary/Monthly Highlights/Stock/Wisdom, MyTrip-inspired expense entry, single Odia/English Calendar, notification bell, 24-hour session control, Drive organisation, Book Writing, collapse of detailed expense panels, diagnostics.

## Not included / must be verified live
- No new offline sync, PDF/OCR full-text indexing, server-side global finance search, automatic Odia accuracy guarantees or backup restoration.
- User-authenticated end-to-end flows, actual permissions, mobile performance and backup restoration need live testing.

## Deployment
Upload FE archive contents (not wrapper) to GitHub repo root. Keep current config.js URL. BE reference archive is provided solely for recovery; do not overwrite a newer live Code.gs. If you need the health audit, add only SarNiHealthAudit.gs to the *existing* Apps Script project (no Code.gs change, deploy not required to run editor-only function). DO NOT run setupSystem().
