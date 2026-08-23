SARNI ROLLBACK — LAST STABLE V18.3 / BACKEND V3.8.0

PURPOSE
This package intentionally removes all later connection experiments and restores the
older GitHub Pages + Apps Script setup.

FRONTEND
v18.3

BACKEND
v3.8.0

WHAT THIS ROLLBACK KEEPS
- Holdings / Watchlist / Diary
- Auto prices
- Personal Home
- Quotes / sticky notes
- Adjustable table widths
- Saved table layout
- In-page Print Preview
- Print row-height / column-width adjustment

WHAT THIS ROLLBACK DOES NOT INCLUDE
- V18.4+ custom columns
- V19 transaction-history tab / stock tradebook
- Later relay / polling / native Apps Script experiments

APPS SCRIPT — DO THIS FIRST
1. Open the SAME Apps Script project used by this deployment:
   https://script.google.com/macros/s/AKfycbyVYGOHu5aJf7jHd0N6n64F988GxDbKwdzCAkOX_LQ7nNU0StqKUACFkfbrsh_WDfe7/exec

2. Replace the ENTIRE Code.gs with:
   Code-v3.8.gs

3. Save.

4. Deploy > Manage deployments > Edit the SAME Web App deployment.
   Version: New version
   Execute as: Me
   Who has access: Anyone
   Deploy.

5. Open the base /exec URL:
   https://script.google.com/macros/s/AKfycbyVYGOHu5aJf7jHd0N6n64F988GxDbKwdzCAkOX_LQ7nNU0StqKUACFkfbrsh_WDfe7/exec

   It should show backend version 3.8.0.

GITHUB SarNi
In the ROOT of the SarNi repository upload/replace ALL:
- index.html
- styles.css
- config.js
- app-v18-3.js
- app-v18-2.js

Do not use the V20 launcher index.html.

OPEN
https://saradasutar.github.io/SarNi/?v=rollback183

Hard refresh on Mac:
Command + Shift + R

EXPECTED LOGIN BADGES
Frontend v18.3
Backend v3.8.0

IMPORTANT
This is a rollback package. Do not mix V18.3 files with V19/V20 files.
