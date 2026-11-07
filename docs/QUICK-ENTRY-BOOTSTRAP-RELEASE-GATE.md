# SarNi Quick Entry — optional combined startup (NOT LIVE)

**Purpose:** Reduce Google Apps Script startup overhead by replacing three independent startup requests (`qeInfo`, `hubGuestInfo`, `qpinInfo`) with one `qeBootstrap` request. This is an **opt-in**, non-destructive integration candidate. It has no effect until both private backend and frontend are explicitly activated.

## Frontend in this branch
- Default-off flag: `window.SARNI_QE_BOOTSTRAP_ENABLED === true` is required. No flag is set by this branch or by existing `config.js`.
- Strictly validates `{ok:true,version:1,main,hub,pin}`, including existing `quickAccess`, explicit Office and Investment booleans, and the PIN config key.
- On missing, incomplete or unsupported combined response, uses the **existing** `qeInfo` + `hubGuestInfo` calls and then `qpinInfo`. The original six-tab renderer, form handlers, save/retry behavior, and PWA cache are otherwise unchanged.
- An Apps Script cold start can still exceed two seconds; no guaranteed two-second load time is claimed.

## Private backend implementation
A standalone, additive `SarNi_QE_Bootstrap_Optional.gs` file and installation guide were prepared from dated, older SarNi backend snapshots. **These are not verified current live sources.** The private `.gs` patch is not committed here because a public GitHub Pages repository is not a suitable home for private Apps Script sources.

1. Back up and inspect the actual Apps Script project (all `.gs` files, current deployment, settings).
2. Confirm the three handlers `qeInfo_`, `hubGuestInfo_`, `qpinInfo_` exist with the tested response contract.
3. Add the separate read-only `qeBootstrap_` handler and insert `case 'qeBootstrap': return qeBootstrap_(request);` **once** in the existing `processApiRequest_` switch. No schema changes, migrations, or new Sheets.
4. Test live granted, denied, expired and revoked links; PIN policy; six form types; recent entries; and save/edit/delete permissions.
5. Enable the frontend flag only after authenticated backend validation, and verify startup timings and rollback.

## Acceptance criteria
- Existing six-tab baseline passes without setting the flag.
- With mocked valid combined response, exactly one startup request supplies all three response objects; Save remains gated by the existing PIN setup function.
- With unsupported or partial responses, fallback restores all three legacy requests; no assumptions of permission grants.
- Browser tests do not send real records or contact the actual Apps Script endpoint.
- No private link tokens or credentials are cached, logged, embedded in public code or uploaded to GitHub.
- Confirm cold and repeat-load timings on a real device before assigning a score.

## Rollback
Leave the flag unset or set it to false. The original access route and rendering logic remains intact. The backend handler may safely remain unused or be removed after restoring the previous deployment version.
