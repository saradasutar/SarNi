# SarNi Batch 10 — Traceability Checklist

| Upgrade | Needs FE | Needs Apps Script BE | Test gate |
| --- | --- | --- | --- |
| 4 Sync centre | Yes | Yes, idempotency + audit | 3 destination integrations, retry |
| 6 Admin control | Yes | Yes, settings + per-route enforcement | unauthorized deny, admin allow |
| 9 Security & restore | Yes | Yes, auth / backup | expired link, restore drill |
| 1 Premium home | Yes | Aggregate endpoints as needed | real data, mobile |
| 2 Universal quick entry | Yes | existing routes re-used | six entry types |
| 3 Diary review | Yes | status writes/reads | preserve old tags |
| 5 Global search | Yes | permission-scoped query | no cross-user leaks |
| 7 Moving notices | Yes | admin save/schedule | motion/accessibility |
| 8 PWA speed | Yes | no required schema change | install, loading |
| 10 Insights | Yes | summaries as needed | compare with raw totals |

## Observed in main at review time
- `index.html` declares FE build 20261031-20103 and loads existing assets.
- `README.md` identifies FE v20.10.3, Google Apps Script API and private Sheets/Drive; warns not to run setupSystem on live data.
- `q/index.html` exists and contains the guest quick-entry UI.
- `health.html` checks public assets only, and explicitly does not verify login or backend.

## Not yet verified
- Private Code.gs source, token verification, Apps Script deployments, Google Sheet schema, triggers, existing reconciliation IDs, real backends for HR/Analysis/MyFamily, production login and saving.
- Therefore all backend-dependent upgrades remain pending implementation, not described as installed.
