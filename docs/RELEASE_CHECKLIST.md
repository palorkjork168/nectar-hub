# Sakol Universe - Production Release Checklist

Before releasing Sakol Universe to staging or production environments, verify every item below:

---

## 1. Environment & Configuration
- [ ] Environment variables provisioned based on `server/.env.example`
- [ ] `NODE_ENV` set to `production`
- [ ] `JWT_SECRET` generated with a high-entropy string (e.g., `openssl rand -hex 64`)
- [ ] `CLIENT_URL` explicitly configured to production frontend domain (e.g. `https://sakol-universe.com`)
- [ ] `DATABASE_URL` pointing to production PostgreSQL instance with SSL enabled
- [ ] Cloudinary credentials verified (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)

## 2. Database & Data Integrity
- [ ] Production database accessible with valid connection credentials
- [ ] Safe startup confirmed: `sequelize.sync({ force: true })` and `{ alter: true }` are NEVER executed in production
- [ ] Run `cd server && npm run db:migrate` before API deployment; verify with `npm run db:migrate:status`
- [ ] Migration strategy verified: existing schema is baseline; no force/alter sync, table recreation, or destructive reset is used
- [ ] Automated backup schedule configured on PostgreSQL database
- [ ] Point-in-time recovery enabled on database provider

## 3. Security Hardening
- [ ] Helmet security headers active (`helmet()` configured in Express pipeline)
- [ ] CORS restricted to production `CLIENT_URL` (no wildcard `*` with credentials)
- [ ] Rate limiting active on auth endpoints (`/api/auth/login`, `/api/auth/register`)
- [ ] Global error handler sanitizes internal 500 errors in production (no stack traces, SQL, or filesystem paths leaked)
- [ ] Unknown endpoints respond with standard JSON 404
- [ ] Passwords stored using bcrypt with minimum 10-12 salt rounds
- [ ] File uploads limited by MIME type (PNG/JPEG/WEBP for avatar, PDF for resume) and size limits (5MB / 10MB)

## 4. Quality Assurance & Regression Suite
- [ ] Auth & Security Suite passed (`node test_auth_security.js`)
- [ ] Master E2E Lifecycle Suite passed (`node test_master_lifecycle.js`)
- [ ] Analytics & Reporting Suite passed (`node test_analytics_flow.js`)
- [ ] In-App Notification Suite passed (`node test_notification_flow.js`)
- [ ] Advanced RBAC & Multi-Tenant Suite passed (`node test_advanced_rbac_flow.js`)
- [ ] Hiring Conversion Suite passed (`node test_hiring_flow.js`)
- [ ] Interview Management Suite passed (`node test_interview_flow.js`)
- [ ] Employer Recruitment Suite passed (`node test_employer_recruitment_flow.js`)
- [ ] Job Seeker Flow Suite passed (`node test_job_seeker_flow.js`)

## 5. Build & Performance
- [ ] Client production build passes with 0 TypeScript/Vite errors (`npm run build`)
- [ ] Production assets minified and bundled in `client/dist`
- [ ] Health check probe active and responding (`GET /api/health` returns `200 OK` with database connected)
- [ ] Graceful shutdown verified on `SIGTERM` and `SIGINT` (closes HTTP server and connection pools)

## 6. Business Flow Sanity Check
- [ ] Guest browsing: View published jobs and job details
- [ ] Job Seeker flow: Register, login, edit profile, apply to job, view notifications
- [ ] Employer flow: Post job, publish job, view applicants, schedule interview, hire candidate
- [ ] Employee flow: Check in, check out, submit leave request, view employee analytics
- [ ] Admin flow: View platform analytics, view employees, inspect roles and permissions
