# SarNi FE 20.10.2 — Login alignment repair

Built from the supplied SarNi FE v20.10.1 direct-upload ZIP.

## Changes
- Password recovery is now a separate clickable row, just below the password field. The Show/Hide control remains inside the field.
- New main application file `app-v20-10-2.js`, with the same 20.10.1 feature set and a new FE release version.
- The unauthenticated login screen indicates BE verification occurs after signing in. The actual backend version must come from the live authenticated API.
- Updated frontend asset cache keys and build-version.json.
- No Google Sheets, Drive, stock research, diary data, passwords or backend actions are changed.

## Installation
1. Back up GitHub repository.
2. Extract the full FE ZIP and upload all extracted files **into the GitHub repository root** (not inside a folder). Replace `index.html`, `styles.css` and `sarni-security-storage.js`; add `app-v20-10-2.js`. Keep `config.js` pointing to the existing Apps Script endpoint.
3. Commit, wait for GitHub Pages to publish, then open `https://saradasutar.github.io/SarNi/?v=20.10.2`.
4. Check that the sign-in screen says FE v20.10.2 and Forgot password is below, not over, the password field.
5. After sign-in, verify the backend label returns the live Apps Script version. If it stays unavailable, use the existing backend connection checker.

No backend redeployment or setupSystem() is required for this login repair.
