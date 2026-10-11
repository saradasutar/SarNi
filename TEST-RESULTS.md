# SarNi v20.3.6 — local verification

- `node --check`: pass for new `app-v20-3-6.js`.
- Desktop/mobile Chromium: passed initialization and navigation at 360px, 390px, 428px, and 1280px; no page-wide horizontal scrolling or JS errors in tested states.
- New Quick Use / Detailed View buttons: click and state check passed.
- Sample expense aggregation: 2026-10 selected month = ₹1,250; filter electricity = ₹1,000; search all months = ₹1,850 including a 2025 record. Chart totals match sample records.
- Charts: Home donut and detailed trend/category/head/comparison render on sample records; print stylesheet and print-only section tested with a stub browser print callback.
- Save & Next: mocked `saveExpense` API receives correct fields; context retained, amount/description cleared after success; double-click control is disabled while saving.
- No extra backend actions or database schema changes; the existing `Code.gs` is byte-identical to BE v3.17.18.

**Not tested against live Google Apps Script / Google Sheets:** real saves and read permissions, photos in Drive, login and admin inactivity policies, long-running performance, and real printer output. The release is not yet deployed. No 9.5/10 production rating is claimed before those tests.
