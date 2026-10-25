# SarNi quality gate

This folder provides a **dependency-free automated static check** of the existing GitHub frontend.

Run \`node quality/check.mjs\` from the repository root (Node 20+).

Checks: assets linked by index.html exist, no duplicate HTML IDs, critical feature entry points still exist (Expenses, Book Chapters, Odia Calendar and Yearbook), login autocomplete, basic password/expense UX controls, shared-expense noindex, secure request IDs, and all root JavaScript files parse.

The GitHub workflow runs these checks on new pushes and pull requests. It does not open or change the database, credentials, Drive photos or manuscripts.

## Getting above 9.5/10

Ratings are a target, not a declaration. Measure on a real Android phone and desktop with Lighthouse/DevTools and an authenticated test account. Standard thresholds: LCP <= 2.5 seconds, INP <= 200 ms, CLS <= .10 at the 75th percentile. Test login/logout, OTP email recovery, share-link expiry/revocation, offline/poor-network expense submission without duplicates, backup recovery, Odia calendar dates against the printed Kohinoor Panjika, and 20 MB uploads. Accessibility target: WCAG 2.2 AA.

The in-app Admin Settings diagnostics are **local measurements only**, not telemetry or a secret endpoint. Do not paste screenshots containing financial data, tokens or personal names into public issues.

**Important:** Backend v3.17.33 add-on is not deployed by this workflow; password recovery and Drive uploads cannot be certified until the Apps Script deployment is updated and tested.
