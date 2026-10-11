# SarNi FE v20.3.6 / BE v3.17.18 — Quick Use + Detailed View

## Included upgrades
- Expense Insights preview on Home (category donut and six-month trend on desktop); detailed charts (12-month trend, category donut, major-head breakdown, month-over-month comparison) inside Expenses. No third-party charts or extra API calls.
- Quick Use / Detailed View buttons scroll to the correct workflow.
- Inline expenses save with one tap, confirm backend result and keep selected date, category, head and payment context for the next entry; save errors leave user input intact.
- Search all expense fields, including across **all months**; filter by head, edit rows, and print/export the filtered statement. Report totals reflect the search result.
- Quick Diary is visible in the sidebar on desktop, directly reachable on mobile, with direct writing and backup draft; recent entries searchable, tagged Learning/Target/Important and printable.
- English/Saka calendar and important dates, person-wise summary, GPF, user photos, optional budget and admin logout settings preserved.
- No new Google Sheet columns, new backend actions, or additional permissions required.

## Installation (backup first)
1. Backup existing SarNi Google Sheet and Apps Script. Do not run `setupSystem()`.
2. Upload **only files inside `FRONTEND-GITHUB`** to GitHub repo saradasutar/SarNi and ensure main branch updated. Do not upload private Sheets exports.
3. Google Apps Script SarNi project: replace existing `IndexApp.html` contents with `BACKEND-COPY-PASTE-TXT/IndexApp-html.txt`.
4. Backend `Code.gs` remains BE v3.17.18; if your running BE already is v3.17.18, leave it unchanged. Else compare/back up and replace it using `BACKEND-COPY-PASTE-TXT/Code-gs.txt`.
5. Save > Deploy > Manage deployments > Edit current deployment > New version > Deploy. Retain existing URL.
6. Sign in at https://saradasutar.github.io/SarNi/ and verify FE **20.3.6** / BE **3.17.18**.

## Practical smoke tests
- Save expense, check actual Google Sheet and chart summary match once; Save & Next should keep selected head/category/date and clear amount/description.
- Set Expense Centre Search all months, search for a previous transaction, edit a row, then export CSV and print: all use the same filtered records.
- Print an all-month filtered statement: heading must say All dates, with count and total.
- Save diary text and check Quick Diary search / print, including Learning/Target/Important.
- Check dual calendar, mobile screens 360/390/428px, user photo permissions, admin timeout and normal logout.

These are *local source changes*, not a live deployment. Live response times, permissions and save paths require validation after deployment. Printing uses the browser Print dialog to save as PDF.
