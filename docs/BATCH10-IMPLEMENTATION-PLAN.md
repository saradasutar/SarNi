# SarNi Batch 10 — Coordinated Upgrade Plan (7 Nov 2026)

Status: **Approved for development; not deployed**. Priority: Sync (#4), Admin (#6), Security (#9) before visual upgrades. GitHub Pages is public/frontend only; Apps Script remains source of authority and data. No spreadsheet recreation, reset, migration, production change or automatic backend deployment is authorized.

## Invariants
- Preserve six quick entry types and all existing saving/editing/printing flows; no schema-altering migration without a verified export and reversible plan.
- Existing Sheet IDs, Apps Script deployment URL, Drive folder IDs, PWA and quick link validity remain unchanged by default.
- Existing login and edit/delete PIN rules remain intact until corresponding backend permissions are verified.
- All authorization must execute in backend; never trust client-supplied `isAdmin`, `role`, `ownerId` or feature flags.
- Never expose credentials, private notes, personal records, backend tokens or Drive originals in public GitHub.
- Rollback by reverting a reviewed frontend commit and redeploying a previously tested Apps Script version; rollback must not overwrite new user data.

## Delivery gates (in sequence)
### Gate A: Inventory and backup
Record exact frontend commit; backup private Apps Script source and Sheets/Drive metadata using user's existing secured storage. List backend routes, access rules, sync identifiers, q-link actions, data columns and existing triggers. Do not run `setupSystem()`.

### Gate B: #4 Permanent Sync & Repair Centre
Implement per-event stable idempotency key (source, entry ID, target). Keep original source entry as canonical. Server must reject duplicate processing for same idempotency key under a lock; bounded retries with backoff, retry cap and human-readable last error. Record queued/sending/synced/failed/conflict statuses, last attempt, destination record ID, and audit timestamp. Handle SarNi→HR Office Diary, SarNi→Analysis Stock Note/Investment, SarNi→MyFamily Family Expense; verify both source and target when accessible. No destructive retry or automatic deletion. Quick-link Recent entries display truthful status from server and offer Retry only when allowed.

### Gate C: #6 Administrator Control Centre
Backend-authorized settings: feature enable flags per viewer role, tab visibility, login/share validity, readonly mode, notice board text/speed/size/weight/text and background colours with transparent option, modules and safe public permission scopes. Restrict critical permissions to verified admin; default deny when config unavailable. Maintain a history of setting changes with time, actor and previous/new values. Do not break existing settings or hardcode secret administrator credentials in FE.

### Gate D: #9 Security, Backup & Recovery
Server check auth on each action including read, add, edit, delete, photo upload, sync retry and admin settings. Validate key/token expiry, request origin expectations, input length, IDs, supported media, ownership and requested action. Sanitize user text in DOM; avoid `innerHTML` with untrusted data. Rate-limit privileged & quick-link endpoints, protect against spreadsheet formula injection, ensure backups not in public repo, and document restore drill. GitHub pages cannot keep secrets.

### Gate E: #1 #2 #3 #5 #7 #8 #10
1. Premium compact responsive dashboard with accessible summary cards (real figures only).
2. Unified quick-add covering existing six types and preserving tab-specific fields.
3. Diary/task review showing complete/pending and optional completion remarks without removing old marks.
5. Global search over permitted datasets with backend paging and saved private filters.
7. Admin-scheduled scrolling notices with reduced-motion support; absent notice hides cleanly.
8. Lazy loading, JPEG thumbnail previews and PWA improvements without offline write claims.
10. Accurate activity/expense/investment charts with clear date filters and no double counting.

## Mandatory acceptance tests
- Admin and guest can use each of six quick tabs with current link permissions.
- Create, view, edit and delete only where authorized; expired/revoked links fail server-side.
- Duplicate sync/retry does not create duplicate destination rows; offline/timeout cases report status honestly.
- Unauthorized calls cannot change feature flags, notices, accounts or view private data.
- Existing photo originals remain in Drive; frontend loads thumbnails; unsupported file rejected.
- All existing dashboard links, forms, categories, monthly marks, mobile layout, PDF/print features (where present) remain functional.
- Confirm no secrets in git diff; run frontend health check and backend route smoke tests.
- Restore previous frontend version without losing new backend data; verify backend separately before publishing.

## Deployment
Changes are developed and reviewed in a feature branch. Do not merge to main, publish to GitHub Pages, change Apps Script deployment, or touch live Sheet data until full integration tests pass. A frontend-only commit does NOT implement backend-dependent features.
