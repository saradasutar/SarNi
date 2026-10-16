# SarNi v20.8.6 · Local QA

## Pass
- Existing FE v20.8.5 was the base; new FE v20.8.6; backend v3.17.29 unchanged.
- HTML parsed successfully; all 681 element IDs are unique.
- The mobile dock contains exactly 5 controls; the new + sheet has six actions.
- Admin Settings desktop entry and existing mobile More admin entry retained (not duplicated).
- All 7 inline JS blocks passed Node syntax checking.
- Offline Chromium mobile widths: 320, 360, 390, 430, 820 px.
- Offline Chromium desktop: 1440 px; mobile dock not displayed.
- + sheet opens, closes with Escape and backdrop, aria-expanded updates.
- Preview images rendered at 390 px and 320 px without horizontal overflow.
- No credentials, Sheet IDs, original data, backend routines or permissions were changed by this UI patch.

## Not yet tested
- Live Apps Script authentication, calendar/smartpaste writes or mobile installed-app refresh.
- Actual production load time/network improvements; visual smoothing does not imply measured latency reduction.
- Remote GitHub Pages caching after deployment.

## Release rule
Deploy only to the existing Apps Script deployment using a NEW version, test after sign-in, and retain old version for rollback. Do not run setupSystem() or reset passwords.
