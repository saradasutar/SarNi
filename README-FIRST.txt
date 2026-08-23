MYFINANCE V19.2.9 — ADMIN USER MANAGEMENT FIX
Frontend v19.2.9
Backend v3.15.4

THE PROBLEM
The earlier Users screen only implemented:
- Create user
- Reset password
- Enable / Disable

It had NO Edit User or Delete User backend actions.
Also, Create User required a strong password but the modal did not explain the full rule,
which could make creation look like it was simply failing.

FIXED

CREATE USER
- Strong temporary password is generated automatically.
- Password is visible so the administrator can copy it.
- Generate and Copy buttons included.
- Clear inline validation/error message.
- Backend can also generate a strong password if password is blank.
- Successful creation immediately refreshes the Users table.

EDIT USER
Admin can edit:
- Display name
- Role (User/Admin)
- Status (Active/Disabled)

Username is intentionally locked after creation so existing data remains linked correctly.

DELETE USER
- Delete button added.
- Cannot delete the account currently being used.
- Cannot delete the last active administrator.
- Deleting removes ONLY the login account and its sessions.
- Holdings, transactions, diary and other saved data are retained to prevent accidental data loss.

RESET PASSWORD
- Generates a compliant strong password suggestion.
- Password requirements are shown.
- New password is copied to clipboard where browser permission allows.

SAFETY
- You cannot disable your own logged-in admin account.
- You cannot remove your own Admin role.
- At least one active Admin must remain.

INSTALL — BOTH FRONTEND AND BACKEND

APPS SCRIPT
1. Replace the entire Code.gs with Code-v3.15.4.gs
2. Save
3. Deploy > Manage deployments > Edit existing Web App
4. Choose New version
5. Execute as: Me
6. Who has access: Anyone
7. Deploy

GITHUB
Upload/replace:
- index.html
- styles.css
- app-v19-2-9.js
- app-v19-2-8.js

Keep your CURRENT config.js and existing /exec URL.

OPEN
Use your normal SarNi URL with:
?v=1929

Then on Mac:
Command + Shift + R

EXPECTED VERSION
Frontend v19.2.9
Backend v3.15.4
