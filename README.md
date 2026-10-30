# SkillShield local website

## Start

1. Install Node.js 18 or newer if it is not already installed.
2. Open a terminal in this folder.
3. Run `npm start`.
4. Open http://127.0.0.1:4173 in your browser.

Keep the terminal open while using SkillShield. Do not open the HTML file directly; account sign-in requires the local server.

## Accounts and passwords

Accounts are saved in `data/accounts.json`. The file stores each email, name, workspace, and the profile details entered during sign-up. Company profiles include a hiring contact, industry, company size, location, and company summary; later company profile edits are also saved there. Passwords are stored as a unique salt and scrypt hash; the raw password is never saved. A signed, HTTP-only browser cookie keeps a user signed in for up to 30 days.

The server listens only on this computer at `127.0.0.1`. Accounts and application data do not sync to other computers. Back up the `data` folder if you want to preserve accounts. Do not share `data/accounts.json` or `data/session.secret`.

Later profile edits, roles, applications and uploaded documents remain in the browser's local storage. Uploaded files are not transmitted online.

