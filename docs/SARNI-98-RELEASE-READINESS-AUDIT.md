# SarNi — 9.8/10 Release Readiness Audit & Single-Approval Upgrade Package
**Audited:** 7 November 2026 | **Status:** Development branch only; no production deployment, no access to private Apps Script sources or user records.

## What was actually inspected
- GitHub branch `upgrade/batch10-stabilization-20261107`: `index.html`, `q/index.html`, `app-v20-10-3.js`, `styles.css`, visual, administrator, productivity and health files, quick-entry SW and manifests.
- Automated static CI and mocked Chromium desktop/mobile tests from Batch 10–20; these are not real backend integration tests.
- Public site addresses were attempted but could not be retrieved using the available external browsing environment. No live Lighthouse/Web Vitals audit or authenticated session test is claimed.

## Grounded findings
| Finding | Evidence | Severity | Remedy |
|---|---|---|---|
| JS and CSS startup payload large | `app-v20-10-3.js` ~631K characters, `styles.css` ~487K characters (uncompressed, not actual transfer bytes) | High | Profile with Lighthouse, split by authenticated module, pre-load only critical assets; preserve release compatibility |
| Quick Entry page is a large monolithic document | `q/index.html` ~302K characters, includes substantial inline CSS/JS | High | Separate stable CSS/JS only with versioned rollout and strict regression tests |
| Sync, roles and backup cannot be independently verified from public FE | Apps Script private project absent | **Release blocker** | Inspect private backend, audit route grants, idempotency and logs, then test with non-sensitive records |
| Multiple navigation layers may crowd the viewport | Workspace search/results, favorites/recent, additional quick tiles | Medium | Reversible mobile-first Focus view (implemented in development branch) |
| Existing site-check page omitted recent additions | `health.html` list missing new batch and Quick Entry assets | Medium | Include new assets and clarify frontend-only status (implemented in development branch) |
| Browser storage and HTML render surfaces require review | Core JS ~107 `localStorage` references and ~110 `.innerHTML=` assignments; numbers are occurrences, **not confirmed vulnerabilities** | High | Manual trust-boundary inventory, DOM escaping review and secret-storage audit |
| Public PWA app shell needs careful scope checks | Quick-entry worker `q/sw.js`; cached shell not private entry data according to code | Medium | Test install/update/offline/expiry/revocation on devices; never cache private API responses |
| Public startup error handling exists | `sarNiAssetFailed` and `health.html` | Low | Expand checks, collect voluntary privacy-safe diagnostic results |
| Accessibility and interaction suites are incomplete | Mocked Chromium tests check nav/mobile/role UI but not screen readers or real input | Medium | WCAG 2.2 AA manual and automated audit, keyboard + assistive tech checks |

## Approved one-package worklist — 25 high-impact upgrades
Backend-dependent items remain pending until verified; do not enable switches that simulate server enforcement.

### Release blockers: correctness, security and recovery
1. Audit and fix **server-side per-action permissions** (view/add/edit/delete/photo/admin/retry).
2. Implement **idempotent cross-dashboard sync** with canonical IDs, explicit destination confirmation and safe retry.
3. Build **admin-backed feature visibility** across roles and public quick links (deny by default).
4. End-to-end test all six Quick Entry forms with guest, admin, expired/revoked link and edit/delete PIN.
5. Verify **login, email OTP, logout and 24-hour configurable timeout** where supported by existing backend.
6. Confirm Apps Script **daily backups**, private retention, restore drill and photo-original recovery.
7. Protect **browser storage**: no persistent tokens/PIN grants/secret URLs/plain private entries.
8. Audit input handling for **DOM injection, Sheet formula injection, file type/size, CORS and scopes**.
9. Add server-side audit history for settings changes and sync failures.
10. Prepare reversible deployment including feature flags, backups, smoke tests and rollback instructions.

### Speed and usability
11. Improve load times by module-splitting large JS and CSS behind feature flags, after measuring.
12. Split Quick Entry HTML into tested versioned assets without changing action payloads.
13. Adopt **compact Focus view** as reversible mobile-first UI, keep full view available (staged).
14. Clarify dashboard information hierarchy and prevent duplicate navigation layers.
15. Make global search permission-scoped, keyboard accessible and date-filterable.
16. Optimize images: private original in Drive, thumbnail lazy loading, JPEG/mobile compression where permitted.
17. PWA reliability: offline disclosure, service worker cache versioning, safe update and link expiry.
18. Mobile touch layout, bottom-tab safe areas, keyboard focus and no nested scrollbars.
19. Accessibility: WCAG 2.2 AA color contrast, semantic controls, screen reader announcements.
20. Print design: clear read-only printable reports and consistent filters without navigation chrome.

### Product polish
21. Standardized typography, spacing, color system and expandable details across all existing modules.
22. Diary/Office/Stock Note consistent status/marking vocabulary while respecting individual module rules.
23. Admin-controlled notices only when **backend save and visibility policy** are verified.
24. Helpful empty/error/saving/uncertain states; never claim saved or synced without evidence.
25. Real-data monthly and yearly insights, not placeholders, with reconciliation against source records.

## Objective 9.8+ acceptance gate (target, not a measured score)
- Every critical real save/read/edit/delete/sync pathway completes a reversible, documented test.
- 0 known critical or high severity security findings and verified least-privilege server rules.
- No duplicate destination entries after repeated retries, timeouts, browser reloads or link changes.
- Tested backup restoration to isolated files: existing production data never overwritten during drill.
- Target **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS ≤ 0.1** at p75 on representative mobile devices/network (must actually measure).
- WCAG 2.2 AA for major routes, verified keyboard and manual accessibility checks.
- Responsive at 320, 375, 768, 1024, 1440px, with no content clipping or accidental body-level scrollbars.
- No regression of login, six quick tabs, photo, print, search, settings, daily diary, calendars or family integrations.
- Main and Quick Entry frontend health checks and automated browser CI green.

## Security hardening committed in this iteration
- Added `<meta name="referrer" content="origin">` to `q/index.html` before any resources load. This prevents sending the `?k=` private Quick Entry token in HTTP Referer headers, while preserving the site origin. It does **not** remove the token from the browser address bar, history or screenshots, and does **not** replace expiring or revoking share links.
- Added an automated static release check ensuring the policy remains in place. Backend request and token validation logic is unchanged.
- Do not add a strict `event.source` check to the Apps Script iframe message bridge without verifying the HtmlService sandbox embedding in real backends: the reply can originate from an inner iframe.
- Neither frontend hardening nor current test suites certify server-side authorization or actual sync delivery.

## Deliverable and deployment policy
One reviewed PR can collect the approved front-end work. Backend modifications must be validated in the private Apps Script project separately. **Do not merge or deploy solely because static CI passes.** Keep current live Sheet/Drive IDs, access rules and data intact. No new spreadsheet or reset. Any production rollout requires an approved actual release candidate plus evidence from the above gates.
