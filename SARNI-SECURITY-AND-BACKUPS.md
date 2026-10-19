# SarNi personal — security and backup guide (19 Oct 2026)

This guide applies **only to SarNi**. It does not modify MyFamily, MyTrip, Malipatana, Analysis, or other projects.

## Authentication — FE v20.8.17
- Bearer login tokens now use **sessionStorage** rather than **localStorage**. A previous localStorage token is migrated once for the open tab and removed from persistent storage.
- On a new tab or fresh browser session you may need to sign in again. Username-only Remember Me still works. The existing Apps Script backend enforces role checks, a configurable inactivity timeout, an absolute session expiry, token hashing and per-username login throttling.
- Tab-scoped storage reduces token persistence, but it is not MFA and does not protect a compromised browser or JavaScript XSS. **Do not** place Google Sheet IDs with edit rights, passwords, API secrets, or backup JSON in public GitHub Pages code. Do not use the public site as a privileged auth proxy.
- The backend and account passwords were NOT changed by the frontend update. Keep all Apps Script deployment permissions and Google Sheet sharing restricted to the correct owner.

## Private backup from your phone (ready after the frontend is deployed)
1. Open your GitHub Pages SarNi dashboard and sign in as an **administrator**.
2. Tap **More → Backup Now**, or on desktop open **Admin Settings → Back up SarNi now**.
3. Confirm once, wait for a file name beginning with `sarni-personal-backup-`.
4. The Google Apps Script backend writes that JSON file to the private Drive folder identified by its `BACKUP_FOLDER_ID` script property. It never uploads personal records to GitHub.

### One-time daily automatic backup verification
In the same existing SarNi Apps Script project, open **Executions/Triggers** and confirm a time-driven `backupData` trigger exists and is working. If there is no trigger, its existing **`runAll()`** maintenance function installs/repairs it safely; it does **not** run `setupSystem()` or create a new database. From Android Chrome, enable Desktop site to reach the function selector and press Run. Then check that the execution log says **`"scheduledBackup":true`**. The installer configures one daily backup trigger, nominally in the 2am time window; Google time-driven triggers run within a window rather than at an exact minute.

**Do not** run `setupSystem()`, reset admin passwords or create new backend projects just to enable backups.

### Important coverage and retention
- The built-in backup serializes supported SarNi personal Google **Sheet tables** (diary, expenses, accounts, notes, dates, planning and supporting personal records) to JSON. A maximum of **30 newest files** are kept in the dedicated backup folder.
- The JSON snapshots do **not** duplicate photo originals in separate Google Drive folders, and they may include sensitive account/record metadata. Keep the backup folder private and separate from other files.
- For stronger recovery, independently back up the original photos and consider a separately owned second copy. Restoration has **not** been exercised or verified as part of this change.
- We cannot verify or install a trigger in your Google project through GitHub access alone. A successful in-dashboard Backup Now confirms a manual snapshot, **not** that the daily schedule ran.

## Performance and cleanup
- Removed an uncalled old investment-cache migration helper and bypassed old holdings/watchlist startup initializers. Those portfolio functions moved to Analysis; they are not part of active SarNi navigation.
- Keep historical app bundles that recovery pages or browser-cached HTML may still request. Removing a bundled archive from GitHub does not automatically speed current-page loading and could break cached phones. Do not delete backend `.gs` files on the strength of this frontend audit.
- The active frontend is v20.8.17; its calendar/reminder/target, Odia planner, Life Experiences, mobile quick-entry and credit-card modules remain linked and unchanged.

## Verification checklist
1. Open SarNi with `?v=20817-security`; confirm FE v20.8.17 and existing login works.
2. Sign out, refresh and confirm private dashboard data and session token do not remain accessible. The saved username may remain.
3. Log back in, save one **small test expense or diary note** and ensure the data is present after reload.
4. As admin, tap Backup Now and confirm the success file name.
5. Verify daily `backupData` in Apps Script **Triggers** and a successful subsequent run in **Executions**.
6. Confirm that calendar, reminders, targets, festivals and Life Experiences remain accessible.

The updates in GitHub are statically checked; the authentication/login, successful photo uploads, Drive backup action and timed Google trigger still need owner-side integration checks.
