MYFINANCE MOBILE PRICE FIX V9

PROBLEM FIXED
Desktop/web shows MF and stock prices correctly, but mobile may show 0 because an older local browser cache can be restored or because one of the returned live price fields is temporarily blank/zero.

V9 CHANGES
- Uses a new versioned browser cache (V9), so old zero-price cache is ignored.
- Removes older MyFinance portfolio-cache entries automatically.
- Always performs a fresh server bootstrap after opening the dashboard.
- If live MF/stock/ETF prices are still missing after bootstrap, performs ONE automatic refreshPrices request.
- If Current Value is available but Current Price is missing, derives Current Price = Current Value / Units.
- If Current Price is available but Current Value is missing, derives Current Value = Current Price × Units.
- Manual price is used only as an existing fallback if already saved.
- Re-syncs after the phone returns online, after browser back/forward cache restore, or after the app has been in the background for more than 5 minutes.
- No price is invented: calculations only use values already returned by your backend or your saved manual price.

BACKEND
No Apps Script change is required if desktop prices are already working.

GITHUB INSTALL
1. Keep config.js unchanged.
2. Replace index.html.
3. Replace styles.css.
4. Upload app-v9.js as a NEW file.
5. Commit.
6. On your phone open:
   https://saradasutar.github.io/MyFinance/?v=1500
7. Close any older MyFinance tab first, then open the URL above.
8. Sign in and tap Refresh once if needed.

If mobile still shows 0 after V9 while desktop shows a real price, send a mobile screenshot showing the holding name and the 0 price.
