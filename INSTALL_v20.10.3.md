# SarNi FE v20.10.3 — MyTrip-style Add / Quick Add popup

## What's new
- Centre-screen Quick Entry popup visually adapted to the MyTrip expense popup: large rupee amount field, straightforward labels, clean card and teal Save & Add Another.
- Expense, Diary and Stock Note modes in the **same popup**, with an A−/A+ text-size control.
- **Add expense**, **Quick Add**, home Add expense and Quick Diary shortcuts open this popup without navigating to the full page.
- Date and category are side by side on large screens, and stacked on narrow mobile screens for readability.
- Existing advanced fields remain under **More expense details / More note options**. **More / Full Entry** still opens the full SarNi editor.
- Existing logged-in mobile + and separate no-login shareable link are retained. This does not change link access permissions or backend storage.

## Install (frontend only)
1. **Back up** your existing GitHub repository and keep the previous FE ZIP for rollback.
2. Extract `SarNi_FE_v20.10.3_MyTrip_Popup_Direct_Upload.zip`.
3. In `saradasutar/SarNi`, upload extracted files to the **root** and replace matching filenames. Do **not** delete other existing repository files.
4. The ZIP intentionally **omits config.js** to protect your current working Apps Script `/exec` URL. Keep the existing config.js unchanged.
5. Commit and check `https://saradasutar.github.io/SarNi/?v=20.10.3` after publication.
6. Sign in; test + on mobile, Quick Add on Home, + Add expense in Expenditure, Quick Diary, Stock Note, Full Entry, and saved records.

## Backend
No backend changes. Continue with the current working `Code.gs`, `StockDiary.gs`, `DiaryKnowledge.gs` and deployed web-app URL. Never run `setupSystem()` for this UI change.

## Verification scope
Static HTML/resource inspection and JavaScript syntax checks are run. Browser-level isolated simulations verify modal opening, expense save request, diary save request, monthly-highlight flag and text-size controls on desktop/mobile. **This is not an authenticated live saving test.**

## Privacy and limits
The popup is for already authenticated SarNi users. It does **not** expose data without login; the existing admin-controlled Quick Expense shareable link continues separately. A receipt upload was not added because its live upload/storage integration is not verified. There is no MyTrip shared-expense settlement logic in personal SarNi expenses.
