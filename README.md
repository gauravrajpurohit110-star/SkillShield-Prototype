# SkillShield - Career & Hiring Workspace

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/gauravrajpurohit110-star/SkillShield-Prototype)

A cloud-ready, full-stack prototype bridging job seekers and hiring employers with live role posting, candidate application tracking, and secure authentication.

---

## 🚀 Live Cloud Deployment (1-Click)

You can deploy this application directly to **Render** (Free Tier):

1. Click the button above or visit:  
   👉 **[Deploy to Render](https://render.com/deploy?repo=https://github.com/gauravrajpurohit110-star/SkillShield-Prototype)**
2. Sign in with GitHub.
3. Click **Apply / Deploy**.
4. Render will automatically read `render.yaml`, start the Node.js server, and give you a free public HTTPS URL (e.g., `https://skillshield-prototype.onrender.com`).

---

## 🔑 Pre-Configured Demo Accounts

Both roles are pre-seeded and ready to use immediately:

### 1. Job Seeker
- **Email:** `kaushimishra29@gmail.com`
- **Password:** `SkillShield123`
- **Capabilities:** Browse all employer-posted roles, assess skill match, submit applications, upload/attach documents, and track interview status updates in real time.

### 2. Hiring Employer / Recruiter
- **Email:** `recruiter@cybershield.com`
- **Password:** `SkillShield123`
- **Capabilities:** Post open positions ("demand hiring"), view candidate submissions in real time, review candidate resumes, and update applicant statuses (*Under Review*, *Interview*, *Hired*, etc.).

*(You can also click **Sign up** to register any new account as a job seeker or employer, or use **Forgot password?** to reset passwords).*

---

## 🛠️ Architecture & Shared Database

- **Unified Server:** Pure Node.js HTTP server (`server.mjs`) with zero third-party production dependencies.
- **Shared Data Storage (`data/`):**
  - `accounts.json`: User authentication with salt + scrypt password hashing and signed HTTP cookies.
  - `jobs.json`: All roles posted by employers, instantly visible across the entire platform.
  - `applications.json`: Real-time candidate applications linked to employer job listings.
- **Cross-Device Sync:** When an employer posts a role on one device, job seekers on any computer or mobile browser can immediately view and apply for it.

---

## 💻 Running Locally

1. Install [Node.js 18+](https://nodejs.org/).
2. Double-click `start.bat` (on Windows), or run:
   ```bash
   npm start
   ```
3. Open **http://127.0.0.1:4173** in your browser.
