SarNi FE v20.9.2 — Diary browsing and improved search (2026-10-30)

NEW
- Diary & Knowledge > Browse history: select exact day, month, year, custom date range or All dates.
- One search field across personal Diary, Stock Research, Investment Wisdom, tags, company name/symbol, decisions and older Monthly Diary archive records.
- Multi-word search requires all words, with quoted phrases supported.
- Type, company, important/monthly flags, and sort filters; result count, Show More and Print/PDF of selected results.
- Monthly Highlights still includes marked entries plus existing historical monthly diary text; no duplicate save.
- No calendar grid within Diary; original Calendar main module unchanged.

DEPLOY: upload ALL the contents of this FE ZIP at the GitHub repository root (not the outer directory). Keep current working config.js endpoint.
Frontend v20.9.2. Backend stays 3.17.36: no Apps Script redeployment required for these filters if that backend is already working.
The BE archive supplied alongside this release is a copy of the previous 3.17.36 code and is included for completeness only. Do not replace modified live backend with an older copy.

CHECK: open Browse history, test day/month/year/range, search text/title/tag/company, older monthly archives, edit existing entry, Monthly highlights and print. Sign in required.
No live records are moved or duplicated.

COLLAPSIBLE EXPENDITURE, CHARTS & REPORTS
- Optional expense register, monthly spending trend and person-wise reports can be expanded/collapsed.
- Expense charts already use native <details>, now remember the open/closed choice.
- Main quick expense form, monthly totals and critical notices remain visible.
- A compact Show/hide reports shortcut is placed next to the Expenditure heading.
- Clicking Detailed View or View records automatically opens the register.
- Only panel visibility preferences are stored in the browser; no finance data.
- No new independent chat feed is introduced; existing sticky notes/notes drawer remains intact.
