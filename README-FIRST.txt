MYFINANCE V19.2.5 — RELIABLE AUTOMATIC MUTUAL-FUND REFRESH
Frontend v19.2.5
Backend v3.15.2

WHY THIS VERSION
Earlier backend performance refresh processed only the first 40 MF Performance rows.
Old/obsolete rows could occupy those positions, so an active Motilal Oswal or another
fund could remain stale even though AMFI data was available.

WHAT IS FIXED

1. ACTIVE MF ONLY
The backend now builds the refresh list from active Mutual Funds in:
- Holdings
- Watchlist
Old Quote/Performance rows are ignored and cannot crowd out current funds.

2. NO 40-FUND LIMIT
All active MF performance rows are refreshed in batches of 50.
This avoids the old slice(0,40) limitation while staying safer for Apps Script calls.

3. ISIN / CODE / NAME FALLBACK
For each active MF the backend attempts:
- current AMFI code
- SourceCode if it is an AMFI code
- ISIN match
- exact normalized scheme-name match
- scheme-name fuzzy fallback
If an old AMFI code has been phased out and a current scheme can be resolved,
the active Holding/Watchlist Code is automatically remapped.

4. FRESH AMFI REQUEST ON REFRESH
Manual/scheduled refresh bypasses the 6-hour AMFI universe cache so it can fetch
the latest available AMFI NAV data immediately.

5. SCHEDULED REFRESH IS STRONGER
The existing refreshMutualFundNav trigger now refreshes:
- NAV
- active MF performance
The existing six-hour trigger can remain in place.

6. CLEAR NAV HEALTH IN THE DASHBOARD
Every MF price/NAV cell now displays:
- AMFI · <date> when fresh
- STALE NAV in red when older than 2 business days
- NAV PENDING in red when no NAV exists
- MANUAL OVERRIDE in amber when Manual Price is overriding automatic NAV

The Holdings saved-view bar also shows an MF NAV health summary:
MF NAV · X fresh · Y stale · Z pending · N manual

7. MANUAL REFRESH DIAGNOSTICS
When you press Refresh, the toast now reports for example:
MF NAV 12/12 · MF performance 12/12
If a code was automatically remapped, it also reports the remap count.

INSTALL — BOTH FRONTEND AND BACKEND

APPS SCRIPT
1. Replace the entire Code.gs with Code-v3.15.2.gs
2. Save
3. Deploy > Manage deployments
4. Edit the EXISTING Web App deployment
5. Choose New version
6. Execute as: Me
7. Who has access: Anyone
8. Deploy

GITHUB
Upload/replace:
- index.html
- styles.css
- app-v19-2-5.js
- app-v19-2-4.js (compatibility)

Keep your CURRENT working config.js and /exec URL.

OPEN
Use your normal GitHub Pages URL with:
?v=1925
Then press Command + Shift + R.

EXPECTED VERSION
Frontend v19.2.5
Backend v3.15.2

NOTE
Mutual-fund NAV is normally end-of-day rather than live intraday.
Weekends/holidays can therefore legitimately show an older NAV date without being a failure.
The red stale warning uses a business-day test rather than simple calendar days.
