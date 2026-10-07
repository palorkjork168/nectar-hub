# Nectar Hub - Production Release Checklist (v1.0)
*(formerly Sakol Universe)*

Before releasing Nectar Hub v1.0 to staging or production environments, verify every item below:

---

## 1. Environment & Configuration
- [x] Environment variables provisioned based on `server/.env.example` and `client/.env.example`
- [x] `NODE_ENV` set to `production`
- [x] `JWT_SECRET` generated with a high-entropy string (e.g., `openssl rand -hex 64`)
- [x] `CLIENT_URL` explicitly configured to production frontend domain(s) (comma-separated if multiple)
- [x] `DATABASE_URL` pointing to production PostgreSQL instance with SSL enabled
- [x] Cloudinary credentials verified (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- [x] Transactional email provider configured (`EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)
- [x] Zero hardcoded secrets, test credentials, or temporary debug code in tracked files

## 2. Database & Migration Readiness
- [x] Production database accessible with valid connection credentials
- [x] Safe startup confirmed: `sequelize.sync({ force: true })` and `{ alter: true }` are NEVER executed in production
- [x] Run `cd server && npm run db:migrate` before API deployment; verify with `npm run db:migrate:status`
- [x] All 7 database migrations applied sequentially without pending migrations:
  - `20260923_000_baseline.js`
  - `20260923_001_attendance_tenant_context.js`
  - `20260927_002_work_schedules.js`
  - `20260927_003_attendance_work_schedules.js`
  - `20260928_004_attendance_intelligence.js`
  - `20260929_005_audit_logs.js`
  - `20260929_006_email_notifications_enabled.js`
- [x] Audit logs table is append-only (`updatedAt: false`) and indexed for high-performance multi-tenant querying
- [x] Automated backup schedule and point-in-time recovery configured on PostgreSQL database

## 3. Backend Production Hardening & Security
- [x] Helmet security headers active on all HTTP responses
- [x] CORS restricted to configured `CLIENT_URL` origins (credentials enabled, untrusted origins rejected)
- [x] Rate limiting active on authentication endpoints (`/api/auth/login`, `/api/auth/register`)
- [x] Global error handler sanitizes internal 500 errors in production (no stack traces, SQL, or filesystem paths leaked)
- [x] Unhandled endpoints respond with standard JSON 404
- [x] Passwords securely hashed using bcrypt (10 rounds)
- [x] Strict Multi-Tenant isolation enforced across all companies, teams, schedules, attendances, leave, and audit logs
- [x] File uploads guarded: safe filename check (no null bytes, path traversals), MIME/extension whitelist, size limits (5MB / 10MB)
- [x] Immutable audit trail automatically captures security, schedule, leave, and hiring events without storing sensitive credentials
- [x] Transactional email failures isolated: failures logged to audit trail without failing business operations

## 4. Quality Assurance & Regression Suite
- [x] Full regression suite passes 100% (`npm test` in `server` / 16 of 16 suites):
  - `test_attendance_schedule_integration.js`
  - `test_shift_schedule_flow.js`
  - `test_attendance_tenant_safety.js`
  - `test_leave_tenant_safety.js`
  - `test_master_lifecycle.js`
  - `test_advanced_rbac_flow.js`
  - `test_analytics_flow.js`
  - `test_notification_flow.js`
  - `test_employment_membership.js`
  - `test_global_role_safety.js`
  - `test_cors_security.js`
  - `test_structured_hiring_flow.js`
  - `test_attendance_analytics_flow.js`
  - `test_security_audit_flow.js`
  - `test_email_flow.js`
  - `test_v1_production_readiness.js`

## 5. Frontend Production Readiness & Performance
- [x] Client production build passes (`npm run build`) with 0 TypeScript errors, 0 Vite errors, 0 Vite warnings
- [x] Entry bundle optimized (< 95 kB entry chunk) with code-splitting across all routes
- [x] Global Error Boundary active to catch and display graceful UI fallbacks
- [x] Route-level suspense with `PageLoading` indicators
- [x] Role-based protected routes authorize users by global and company roles
- [x] Responsive layout verified across Desktop (1440px), Laptop (1280px), Tablet (768px), and Mobile (390px)
- [x] Zero uncaught exceptions in browser console

## 6. Observability & Deployment Health
- [x] Health check endpoint active and responding: `GET /api/health` returns `200 OK` with database probe
- [x] Graceful shutdown verified on `SIGTERM` and `SIGINT` (closes HTTP server and connection pools)
- [x] Production process manager (PM2 / Docker / Kubernetes) configured to manage Node server
