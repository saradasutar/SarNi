MYFINANCE V19.2.6 — MOTILAL / ZERO-NAV HARD FIX
Frontend v19.2.6
Backend v3.15.3

YOUR SCREENSHOT
The three Motilal Oswal funds still had:
- valid AMFI scheme codes
- valid ISINs
- ₹0.00 current NAV
- DATE UNKNOWN

The codes are valid:
152354 = Motilal Oswal Large Cap Direct Plan Growth
127042 = Motilal Oswal Midcap Direct Plan Growth
152237 = Motilal Oswal Small Cap Direct Growth

V19.2.6 therefore does not depend on a single NAV path.

WHAT CHANGED

1. DIRECT AMFI PORTAL
Backend now calls:
https://portal.amfiindia.com/spages/NAVAll.txt
directly, instead of relying on the www.amfiindia.com redirect.

2. SECOND NAV SOURCE / FALLBACK
AMFI is still primary.
If an active MF remains zero/missing after the AMFI refresh, Backend v3.15.3 calls:
https://api.mfapi.in/mf/<AMFI_CODE>
and writes the latest valid NAV/date into Quotes as:
MFAPI fallback

3. AUTOMATIC REPAIR ON LOGIN / PAGE RELOAD
If any active MF has a zero/missing NAV or no NAV date, the backend immediately tries repair.
You do not need to wait 15 minutes.

4. ZERO NAV IS NOT TREATED AS A REAL PRICE
If both sources fail, the dashboard now shows:
NAV PENDING / —
instead of ₹0.00 and a false huge loss.

5. REFRESH REPORT
Manual Refresh can report:
MF NAV 12/12 · 3 fallback repaired · MF performance 12/12

INSTALL

APPS SCRIPT
1. Replace the entire Code.gs with Code-v3.15.3.gs
2. Save
3. Deploy > Manage deployments > Edit existing Web App
4. New version
5. Execute as Me
6. Who has access: Anyone
7. Deploy

GITHUB
Replace/upload:
- index.html
- styles.css
- app-v19-2-6.js
- app-v19-2-5.js

Keep the CURRENT working config.js and /exec URL.

TEST
Open your GitHub site with:
?v=1926

Then:
Command + Shift + R

Reload/login once. Missing MF NAVs will be repaired immediately.
You can also click the circular Refresh button once.

EXPECTED
Motilal Large Cap, Midcap and Small Cap should show a positive NAV and NAV date.
Source will be either:
AMFI
or
MFAPI fallback

If neither source can be fetched, it will show NAV PENDING instead of ₹0.00.
