MYFINANCE V19.4 — LOGIN ERROR HANDLING FIX

Your screenshot already shows:
Frontend v19.3
Backend v3.16.0

That proves the frontend CAN reach the backend.

I found a frontend bug in the polling code:
When Apps Script returned a real application error such as:
- Incorrect username/password
- Too many failed sign-in attempts
- A server-side login error

the polling loop caught that real response, discarded it, kept polling, and finally showed the
misleading message:
"The backend did not return a result."

V19.4 fixes that.

CHANGES
- Real backend login errors are shown immediately.
- Wrong credentials now show "Incorrect username or password" instead of a backend timeout.
- Other backend errors are also shown directly.
- Login timeout increased from 30 seconds to 60 seconds.
- Backend remains v3.16.0.
- No Apps Script redeployment is required.

GITHUB
Replace:
- index.html
- app-v19-3.js  (compatibility file)

Add:
- app-v19-4.js

Keep unchanged:
- styles.css
- config.js
- Apps Script Backend v3.16.0

Open your CURRENT GitHub Pages URL with:
?v=1940

Then hard refresh:
Mac: Command + Shift + R

Expected:
Frontend v19.4
Backend v3.16.0

If the password is wrong, the page will now tell you that directly instead of falsely saying the backend failed.
