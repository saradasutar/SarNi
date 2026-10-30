# SarNi 20.9.2 — Quality and usability review (30 October 2026)

## Delivered changes

- **Diary & Knowledge**: history browsing by a day, month, year, custom date range, or all dates. Single text search matches title, body, tags, company symbol/name, investment decision, and related metadata. Filters for type, stock company, important, monthly highlights and sorting. Includes older Monthly Diary archives without duplicating their source records.
- **Monthly Highlights**: existing monthly markers and legacy read-only monthly diary items appear in one view; print the filtered results or save as PDF using the browser.
- **No second diary calendar**: date pickers in the history filter are ordinary form controls. Main English/Odia Kohinoor Calendar stays in the separate Calendar module.
- **Expenditure**: optional expense register, spending-by-user and spending-trend panels collapse to readable headers; charts remember their visibility; one 'Show/hide reports' shortcut. Quick Expense and key summary cards remain visible.
- **Notes & Quotes**: existing collapsible drawer is retained. There is no separate Chat module in the supplied source; therefore no new chat was invented.
- **Navigation**: Diary/Stock/Wisdom remain grouped in Diary & Knowledge; Credit Cards stay inside Expenditure. Book Writing remains a separate main module.
- **Version**: FE 20.9.2 references and build-version.json aligned. BE remains 3.17.36, because this update is frontend-only.

## Checks completed (static, synthetic)

- Existing quality/check.mjs: 714 HTML IDs, 31 relative script/style references checked, 39 JavaScript source files with valid syntax. No missing referenced local assets or duplicate HTML IDs flagged by the checker.
- 12 filter/search test cases passed: day, month, year, date range, company, old monthly archive, multiword/quoted phrase matching, importance, monthly flags and sorting.
- ZIP CRC integrity passed. The complete root frontend and all four existing backend modules are included (BE for reference and recovery only).
- All user records remain in their current Sheets/Drive. No migration, cleanup or live changes performed.

## Not verified — do not advertise a 9.5/10 score yet

- This environment's Chromium browser was blocked by an administrator policy; no full browser visual/regression run was possible.
- Live login, permissions, saving, Odia calendar conversions, stock attachments, phone layout, notifications, historical PDF exports, photo upload, speed, restore and backend deployment remain untested.
- No Lighthouse or real-user Web Vitals sample was available. Performance targets: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at 75th percentile.
- No penetration test, OWASP security review, screen-reader audit or backup-restore drill has been completed.
- Search works over text already returned by the authenticated `dkList` action. It does NOT index full text within separate PDF attachments or Drive documents.
- The app still carries historical frontend scripts. Do not delete them before confirming active references and rollback needs.

## 9.5+/10 acceptance criteria (target; not a measured rating)

Every module should meet: (a) no data loss with old records, (b) one obvious way to complete common tasks, (c) no layout overlap at 360, 768 and 1365 px widths, (d) keyboard and screen reader access, (e) correct permissions, (f) stable error recovery, (g) complete data export plus tested restore, and (h) measured good Web Vitals on real phones. If any gate fails, the dashboard does not qualify as 9.5+.

## Safe deployment sequence

1. Download GitHub source and back up current Apps Script source and Master Spreadsheet/Drive IDs. DO NOT run setupSystem().
2. Upload all contents (not a folder wrapper) from `SarNi_FE_v20.9.2_Diary_History_Collapsible.zip` to the existing `SarNi` GitHub root. Keep the current config.js backend endpoint.
3. Do **not** replace a newer live Apps Script backend with the included v3.17.36 reference copy. This release requires no backend redeployment if StockDiary.gs, DiaryKnowledge.gs and their routes already work.
4. Wait until GitHub Pages publishes the commit, then hard refresh. Check FE v20.9.2 and live-reported BE version independently.
5. Sign in and test Personal Diary > Browse history with old and new entries, Monthly highlights, Stock notes, Investment Wisdom; test Expenditure collapse + open detailed register and user reports; test logout/login and mobile.
6. If any issue arises, restore the GitHub backup. Source records will not have been migrated by the FE update.
