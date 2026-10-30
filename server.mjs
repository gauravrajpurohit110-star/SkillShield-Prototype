import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const root = dirname(fileURLToPath(import.meta.url));
const dataDir = join(root, 'data');
const accountsPath = join(dataDir, 'accounts.json');
const jobsPath = join(dataDir, 'jobs.json');
const applicationsPath = join(dataDir, 'applications.json');
const secretPath = join(dataDir, 'session.secret');
const htmlPath = join(root, 'SkillShield_Prototype.html');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 4173);
const cookieName = 'skillshield_session';
const sessionAge = 30 * 24 * 60 * 60;
const fakeSalt = Buffer.from('skillshield-invalid-account-salt');
const scryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

await mkdir(dataDir, { recursive: true });

const defaultAccounts = [
  {
    email: 'kaushimishra29@gmail.com',
    name: 'Kaustubh Sharma',
    role: 'seeker',
    profile: {
      education: 'Grade 12 / upper secondary completed',
      experience: '0',
      targetRole: 'Ethical Hacker',
      location: 'Jaipur',
      workMode: 'Hybrid'
    },
    passwordSalt: '4bfd13cf18f0ac85fc8453b44b355e4f',
    passwordHash: '135ad831993eed7d0b193a729d834def8d33183e31afacd8fbf67d4de1f036ec41b33ab0c592cafce2ed096b631e69f5fc5fb9102a3c7b879c88feff720a2560',
    createdAt: new Date().toISOString()
  },
  {
    email: 'recruiter@cybershield.com',
    name: 'CyberShield Systems',
    role: 'employer',
    profile: {
      contactName: 'Sarah Jenkins',
      industry: 'Technology',
      size: '51–200 employees',
      location: 'Jaipur',
      website: 'https://cybershield.example.com',
      about: 'Protecting cloud infrastructure with next-generation cybersecurity.'
    },
    passwordSalt: '4bfd13cf18f0ac85fc8453b44b355e4f',
    passwordHash: '135ad831993eed7d0b193a729d834def8d33183e31afacd8fbf67d4de1f036ec41b33ab0c592cafce2ed096b631e69f5fc5fb9102a3c7b879c88feff720a2560',
    createdAt: new Date().toISOString()
  }
];

// Load accounts
let accounts;
try {
  accounts = JSON.parse(await readFile(accountsPath, 'utf8'));
  if (!Array.isArray(accounts)) throw new Error('Account data must be a list.');
  if (accounts.length === 0) {
    accounts = defaultAccounts;
    await writeFile(accountsPath, JSON.stringify(accounts, null, 2) + '\n');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  accounts = defaultAccounts;
  await writeFile(accountsPath, JSON.stringify(accounts, null, 2) + '\n');
}

// Initial sample jobs for prototype demonstrations
const sampleJobs = [
  {
    id: 'job-sample-1',
    title: 'Ethical Hacker / Penetration Tester',
    company: 'CyberShield Systems',
    location: 'Remote',
    mode: 'Remote',
    skills: ['Ethical Hacking', 'Network Security', 'Penetration Testing', 'Python'],
    requiredDocs: ['Resume or CV', 'Security Certification (CEH/CompTIA)', 'ID Proof'],
    ownerEmail: 'recruiter@cybershield.com',
    by: 'recruiter',
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-sample-2',
    title: 'Junior SOC Analyst',
    company: 'Apex Threat Intelligence',
    location: 'Jaipur',
    mode: 'Hybrid',
    skills: ['SIEM', 'Incident Response', 'Wireshark', 'Linux'],
    requiredDocs: ['Resume or CV', 'Academic Certificate'],
    ownerEmail: 'hiring@apexthreat.com',
    by: 'recruiter',
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-sample-3',
    title: 'Cloud Security Associate',
    company: 'Nimbus Infotech',
    location: 'On-site',
    mode: 'On-site',
    skills: ['Cloud Security', 'AWS/GCP', 'Firewalls', 'Docker'],
    requiredDocs: ['Resume or CV', 'Cloud Certification'],
    ownerEmail: 'jobs@nimbusinfo.com',
    by: 'recruiter',
    createdAt: new Date().toISOString()
  }
];

// Load jobs
let jobs;
try {
  jobs = JSON.parse(await readFile(jobsPath, 'utf8'));
  if (!Array.isArray(jobs)) throw new Error('Job data must be a list.');
  if (jobs.length === 0) {
    jobs = sampleJobs;
    await writeFile(jobsPath, JSON.stringify(jobs, null, 2) + '\n');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  jobs = sampleJobs;
  await writeFile(jobsPath, JSON.stringify(jobs, null, 2) + '\n');
}

// Load applications
let applications;
try {
  applications = JSON.parse(await readFile(applicationsPath, 'utf8'));
  if (!Array.isArray(applications)) throw new Error('Applications data must be a list.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  applications = [];
  await writeFile(applicationsPath, '[]\n', { flag: 'wx' });
}

// Load session secret
let sessionSecret;
try {
  sessionSecret = await readFile(secretPath);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  sessionSecret = randomBytes(48);
  await writeFile(secretPath, sessionSecret, { flag: 'wx', mode: 0o600 });
}

// Thread-safe writes
let accountWrites = Promise.resolve();
function saveAccounts() {
  accountWrites = accountWrites.then(async () => {
    const tempPath = `${accountsPath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(accounts, null, 2)}\n`, { mode: 0o600 });
    await rename(tempPath, accountsPath);
  });
  return accountWrites;
}

let jobWrites = Promise.resolve();
function saveJobs() {
  jobWrites = jobWrites.then(async () => {
    const tempPath = `${jobsPath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(jobs, null, 2)}\n`, { mode: 0o600 });
    await rename(tempPath, jobsPath);
  });
  return jobWrites;
}

let appWrites = Promise.resolve();
function saveApplications() {
  appWrites = appWrites.then(async () => {
    const tempPath = `${applicationsPath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(applications, null, 2)}\n`, { mode: 0o600 });
    await rename(tempPath, applicationsPath);
  });
  return appWrites;
}

function sendJson(res, status, value, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(JSON.stringify(value));
}

function makeCookie(email, req) {
  const isHttps = req && (req.headers['x-forwarded-proto'] === 'https' || req.socket?.encrypted);
  const payload = Buffer.from(JSON.stringify({ email, expires: Math.floor(Date.now() / 1000) + sessionAge })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${cookieName}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionAge}${isHttps ? '; Secure' : ''}`;
}

function readSession(req) {
  const pair = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  if (!pair) return null;
  const token = pair.slice(cookieName.length + 1);
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const supplied = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(createHmac('sha256', sessionSecret).update(payload).digest('base64url'));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.email || data.expires < Math.floor(Date.now() / 1000)) return null;
    return accounts.find((account) => account.email === data.email) || null;
  } catch {
    return null;
  }
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 65_536) throw new Error('Request is too large.');
  }
  return JSON.parse(raw || '{}');
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function publicUser(account) {
  return { email: account.email, name: account.name, role: account.role, profile: account.profile || null };
}

const attempts = new Map();
function allowAttempt(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 25) return false;
  recent.push(now);
  attempts.set(ip, recent);
  return true;
}

const server = createServer(async (req, res) => {
  const hostHeader = req.headers.host || `${host}:${port}`;
  const requestUrl = new URL(req.url || '/', `http://${hostHeader}`);
  const pathname = requestUrl.pathname;

  // Serve Static HTML Frontend
  if (req.method === 'GET' && (pathname === '/' || pathname === '/SkillShield_Prototype.html' || pathname === '/index.html')) {
    try {
      const html = await readFile(htmlPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      return res.end(html);
    } catch {
      return sendJson(res, 500, { error: 'SkillShield page is unavailable.' });
    }
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    const ip = req.socket.remoteAddress || 'local';
    if (!allowAttempt(ip)) return sendJson(res, 429, { error: 'Too many requests. Please wait a moment.' });

    // Auth: Current user session
    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const account = readSession(req);
      return sendJson(res, 200, { user: account ? publicUser(account) : null });
    }

    // Auth: Sign out
    if (req.method === 'POST' && pathname === '/api/auth/signout') {
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
    }

    // Jobs: List all open jobs (public to all authenticated users)
    if (req.method === 'GET' && pathname === '/api/jobs') {
      return sendJson(res, 200, { jobs });
    }

    // Applications: Get applications relevant to current user
    if (req.method === 'GET' && pathname === '/api/applications') {
      const account = readSession(req);
      if (!account) return sendJson(res, 401, { error: 'Sign in to view applications.' });
      if (account.role === 'employer') {
        const employerApps = applications.filter((a) => a.employerEmail === account.email || jobs.some((j) => j.id === a.jobId && j.ownerEmail === account.email));
        return sendJson(res, 200, { applications: employerApps });
      } else {
        const seekerApps = applications.filter((a) => a.candidateEmail === account.email);
        return sendJson(res, 200, { applications: seekerApps });
      }
    }

    // All remaining API calls require JSON body
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.method !== 'DELETE' && req.headers['content-type']?.split(';')[0] !== 'application/json') {
        return sendJson(res, 415, { error: 'Send request details as JSON.' });
      }

      let body = {};
      try {
        body = await readJson(req);
      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON request.' });
      }

      // Switch Role
      if (pathname === '/api/auth/switch-role') {
        const account = readSession(req);
        if (!account) return sendJson(res, 401, { error: 'Sign in again to switch workspaces.' });
        if (!['seeker', 'employer'].includes(body.role)) return sendJson(res, 400, { error: 'Choose a valid workspace.' });
        account.role = body.role;
        await saveAccounts();
        return sendJson(res, 200, { user: publicUser(account) });
      }

      // Update Company Profile
      if (pathname === '/api/auth/update-profile') {
        const account = readSession(req);
        if (!account) return sendJson(res, 401, { error: 'Sign in again to save your profile.' });
        if (account.role !== 'employer') return sendJson(res, 400, { error: 'Only company profiles can be edited here.' });
        const keys = ['contactName', 'industry', 'size', 'location', 'website', 'about'];
        const profile = Object.fromEntries(keys.map((key) => {
          const value = typeof body.profile?.[key] === 'string' ? body.profile[key].trim() : '';
          const limit = key === 'about' ? 600 : key === 'website' ? 200 : 100;
          return [key, value.slice(0, limit)];
        }));
        if (['contactName', 'industry', 'size', 'location', 'about'].some((key) => !profile[key])) {
          return sendJson(res, 400, { error: 'Complete all required company profile details.' });
        }
        account.profile = profile;
        await saveAccounts();
        return sendJson(res, 200, { user: publicUser(account) });
      }

      // Password Reset
      if (pathname === '/api/auth/reset-password') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!validEmail(email) || password.length < 8 || password.length > 128) {
          return sendJson(res, 400, { error: 'Enter a valid email and a password with at least 8 characters.' });
        }
        const account = accounts.find((item) => item.email === email);
        if (!account) return sendJson(res, 404, { error: 'No account found with this email address.' });
        const salt = randomBytes(16);
        const passwordHash = await scrypt(password, salt, 64, scryptOptions);
        account.passwordSalt = salt.toString('hex');
        account.passwordHash = passwordHash.toString('hex');
        await saveAccounts();
        return sendJson(res, 200, { user: publicUser(account) }, { 'Set-Cookie': makeCookie(email, req) });
      }

      // Sign In
      if (pathname === '/api/auth/signin') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!validEmail(email) || password.length < 8 || password.length > 128) {
          return sendJson(res, 400, { error: 'Enter a valid email and a password with at least 8 characters.' });
        }
        const account = accounts.find((item) => item.email === email);
        const salt = account ? Buffer.from(account.passwordSalt, 'hex') : fakeSalt;
        const expectedHash = account ? Buffer.from(account.passwordHash, 'hex') : Buffer.alloc(64);
        const suppliedHash = await scrypt(password, salt, 64, scryptOptions);
        const accepted = expectedHash.length === suppliedHash.length && timingSafeEqual(expectedHash, suppliedHash);
        if (!account || !accepted) return sendJson(res, 401, { error: 'Email or password is incorrect.' });
        return sendJson(res, 200, { user: publicUser(account) }, { 'Set-Cookie': makeCookie(email, req) });
      }

      // Sign Up
      if (pathname === '/api/auth/signup') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!validEmail(email) || password.length < 8 || password.length > 128) {
          return sendJson(res, 400, { error: 'Enter a valid email and a password with at least 8 characters.' });
        }
        if (!name || name.length > 80) return sendJson(res, 400, { error: 'Enter a name of up to 80 characters.' });
        if (!['seeker', 'employer'].includes(body.role)) return sendJson(res, 400, { error: 'Choose a valid workspace.' });
        if (accounts.some((account) => account.email === email)) {
          return sendJson(res, 409, { error: 'An account already uses this email. Please sign in.' });
        }
        const salt = randomBytes(16);
        const passwordHash = await scrypt(password, salt, 64, scryptOptions);
        if (accounts.some((account) => account.email === email)) {
          return sendJson(res, 409, { error: 'An account already uses this email. Please sign in.' });
        }
        const profileKeys = body.role === 'employer'
          ? ['contactName', 'industry', 'size', 'location', 'website', 'about']
          : ['education', 'experience', 'targetRole', 'location', 'workMode'];
        const profile = Object.fromEntries(profileKeys.map((key) => {
          const value = typeof body.profile?.[key] === 'string' ? body.profile[key].trim() : '';
          const limit = key === 'about' ? 600 : key === 'website' ? 200 : 100;
          return [key, value.slice(0, limit)];
        }));
        if (body.role === 'employer' && ['contactName', 'industry', 'size', 'location', 'about'].some((key) => !profile[key])) {
          return sendJson(res, 400, { error: 'Complete all required company profile details.' });
        }
        const account = { email, name, role: body.role, profile, passwordSalt: salt.toString('hex'), passwordHash: passwordHash.toString('hex'), createdAt: new Date().toISOString() };
        accounts.push(account);
        await saveAccounts();
        return sendJson(res, 201, { user: publicUser(account) }, { 'Set-Cookie': makeCookie(email, req) });
      }

      // Jobs: Post a role (Employer)
      if (req.method === 'POST' && pathname === '/api/jobs') {
        const account = readSession(req);
        if (!account || account.role !== 'employer') {
          return sendJson(res, 403, { error: 'Only employers can post roles.' });
        }
        const title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '';
        const company = typeof body.company === 'string' ? body.company.trim().slice(0, 100) : account.name;
        const location = typeof body.location === 'string' ? body.location.trim().slice(0, 100) : 'Remote';
        const mode = ['On-site', 'Hybrid', 'Remote'].includes(body.mode) ? body.mode : 'On-site';
        const skills = Array.isArray(body.skills) ? body.skills.map(String).filter(Boolean).slice(0, 20) : [];
        const requiredDocs = Array.isArray(body.requiredDocs) ? body.requiredDocs.map(String).filter(Boolean).slice(0, 30) : [];

        if (!title) return sendJson(res, 400, { error: 'Provide a role title.' });

        const job = {
          id: 'job-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
          title,
          company,
          location,
          mode,
          skills,
          requiredDocs,
          ownerEmail: account.email,
          by: 'recruiter',
          createdAt: new Date().toISOString()
        };
        jobs.unshift(job);
        await saveJobs();
        return sendJson(res, 201, { job });
      }

      // Jobs: Delete a role (Employer)
      if (req.method === 'DELETE' && pathname === '/api/jobs') {
        const account = readSession(req);
        if (!account) return sendJson(res, 401, { error: 'Sign in to delete roles.' });
        const jobId = String(requestUrl.searchParams.get('id') || body.id || '');
        const index = jobs.findIndex((j) => j.id === jobId && (j.ownerEmail === account.email || account.role === 'employer'));
        if (index === -1) return sendJson(res, 404, { error: 'Role not found or not owned by you.' });
        jobs.splice(index, 1);
        await saveJobs();
        return sendJson(res, 200, { ok: true });
      }

      // Applications: Submit an application (Job Seeker)
      if (req.method === 'POST' && pathname === '/api/applications') {
        const account = readSession(req);
        if (!account || account.role !== 'seeker') {
          return sendJson(res, 403, { error: 'Sign in as a job seeker to apply for jobs.' });
        }
        const jobId = String(body.jobId || '');
        const targetJob = jobs.find((j) => j.id === jobId);
        const title = typeof body.title === 'string' ? body.title : (targetJob ? targetJob.title : 'Job');
        const company = typeof body.company === 'string' ? body.company : (targetJob ? targetJob.company : 'Employer');
        const location = typeof body.location === 'string' ? body.location : (targetJob ? targetJob.location : '');
        const employerEmail = targetJob ? targetJob.ownerEmail : String(body.employerEmail || '');
        const documents = Array.isArray(body.documents) ? body.documents : [];

        // Check if already applied
        const existing = applications.find((a) => a.jobId === jobId && a.candidateEmail === account.email);
        if (existing) {
          return sendJson(res, 409, { error: 'You have already applied for this role.' });
        }

        const application = {
          id: 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
          jobId,
          applicantName: account.name || 'Candidate',
          candidateEmail: account.email,
          employerEmail,
          title,
          company,
          location,
          appliedAt: new Date().toISOString().slice(0, 10),
          status: 'Applied',
          owner: 'self',
          source: 'SkillShield',
          note: typeof body.note === 'string' ? body.note.slice(0, 300) : '',
          documents,
          history: [{ status: 'Applied', date: new Date().toLocaleDateString(), by: account.name || 'You' }]
        };

        applications.unshift(application);
        await saveApplications();
        return sendJson(res, 201, { application });
      }

      // Applications: Update status (Employer)
      if (req.method === 'PATCH' && pathname === '/api/applications') {
        const account = readSession(req);
        if (!account || account.role !== 'employer') {
          return sendJson(res, 403, { error: 'Only employers can update candidate status.' });
        }
        const id = String(body.id || '');
        const status = String(body.status || '');
        const validStatuses = ['Applied', 'Under Review', 'Interview', 'Offer Received', 'Hired', 'Not Selected', 'Withdrawn'];
        if (!validStatuses.includes(status)) {
          return sendJson(res, 400, { error: 'Invalid application status.' });
        }
        const app = applications.find((a) => a.id === id);
        if (!app) return sendJson(res, 404, { error: 'Application not found.' });

        app.status = status;
        app.owner = 'recruiter';
        app.history = app.history || [];
        app.history.push({ status, date: new Date().toLocaleDateString(), by: account.name || 'Company' });
        await saveApplications();
        return sendJson(res, 200, { application: app });
      }
    }

    return sendJson(res, 404, { error: 'API endpoint not found.' });
  }

  sendJson(res, 404, { error: 'Page not found.' });
});

server.listen(port, host, () => {
  console.log(`SkillShield is running at http://${host}:${port}`);
  console.log('Shared database active in data/ (accounts.json, jobs.json, applications.json)');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
