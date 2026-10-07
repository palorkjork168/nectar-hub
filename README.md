# Sakol Universe (v1.0)

**Sakol Universe** is an enterprise-grade job marketplace and workforce management platform connecting job seekers, employers, and employees in a unified ecosystem. It integrates job recruitment, candidate profiling, interview pipelines, hiring-to-employee onboarding, GPS-verified attendance with work schedule intelligence, HR leave management, multi-role granular RBAC, transactional emails, immutable audit logging, and platform analytics.

---

## 🌟 Key Capabilities

- **Public Job Portal**: Fast faceted search, job details, and category/location filtering.
- **Job Seeker Experience**: Resume & avatar uploads, skills/education/experience portfolios, saved jobs, application status tracking, and interview schedules.
- **Employer Recruitment**: Company branding, multi-step job publishing, applicant review funnel, interview scheduling, and team management.
- **Hiring-to-Employee Conversion**: One-click idempotent onboarding converting applicants to employees with preserved profiles and multi-portal roles.
- **Work Schedules & Attendance Intelligence**: Flexible work schedules (start/end times, grace periods, default rules), GPS attendance tracking, automated lateness, early departure, and worked hours calculations.
- **HR Leave Management**: Company-scoped leave types, collision-guarded leave requests, leave balance tracking, and approval/rejection workflows.
- **Advanced RBAC & Multi-Tenancy**: Platform roles (`ADMIN`, `EMPLOYER`, `EMPLOYEE`, `JOB_SEEKER`) and company-scoped roles (`HR`, `RECRUITER`, `MANAGER`) with strict tenant boundary enforcement.
- **Transactional Email System**: Unified email service supporting SMTP, Mock, and Development providers with failure isolation (business actions never fail if email provider is down).
- **Security & Immutable Audit Trail**: Append-only audit logs capturing critical mutations, failed logins, and administrative actions without logging passwords or secrets.
- **Analytics & Reporting**: Interactive platform-level, company-level, and employee-level analytics with conversion funnels and CSV report exports.

---

## 🏗️ Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                       Sakol Universe                        |
+-------------------------------------------------------------+
|  Frontend (Client)                                          |
|  - React 19 + TypeScript + Vite                             |
|  - React Router v7 (Lazy routes, Role-based protection)     |
|  - TanStack Query (Server state caching)                    |
|  - Lucide Icons + Responsive CSS UI                         |
|  - Entry Bundle: ~93 kB (Gzip ~28 kB)                       |
+-------------------------------------------------------------+
                              │ REST APIs (JSON)
+-----------------------------▼-------------------------------+
|  Backend (Server)                                           |
|  - Node.js + Express                                        |
|  - Security: Helmet, CORS, Express Rate Limit, bcryptjs     |
|  - Authentication: JWT Bearer Tokens (7-day validity)       |
|  - Authorization: RBAC & Company-Scoped Permission Engine   |
|  - Validation: Zod schemas for all mutations                |
|  - Uploads: Multer + Cloudinary (Safe extension filters)    |
|  - Email: Transports (SMTP, Mock, Dev) with failure guard   |
|  - Audit: Immutable append-only audit trail                 |
|  - Health: GET /api/health (DB probe + uptime)              |
+-------------------------------------------------------------+
                              │ Sequelize ORM
+-----------------------------▼-------------------------------+
|  Database (PostgreSQL)                                      |
|  - Relational Schema with Foreign Keys & Cascade Protections|
|  - Chronological Umzug Migrations                           |
|  - Strict Multi-Tenant Isolation by Company ID              |
+-------------------------------------------------------------+
```

---

## 📋 Prerequisites & Requirements

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Cloudinary Account**: For file uploads (avatars, resumes, logos)
- **SMTP Service**: (Optional in dev/test; Mailtrap, SendGrid, Amazon SES, or custom SMTP for production)

---

## ⚙️ Environment Variables

### Backend Configuration (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```env
# Server Port & Mode
PORT=5000
NODE_ENV=development

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sakol_universe
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
# Alternatively:
# DATABASE_URL=postgres://user:password@localhost:5432/sakol_universe

# Authentication & JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Frontend CORS Origin (comma-separated for multiple origins)
CLIENT_URL=http://localhost:5173

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Transactional Email System ('smtp' | 'mock' | 'development')
EMAIL_PROVIDER=mock
EMAIL_FROM=noreply@sakoluniverse.com
EMAIL_FROM_NAME="Sakol Universe"
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_SECURE=false
```

### Frontend Configuration (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```env
# API Base URL (defaults to http://localhost:5000/api in development, /api in production)
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Local Development

### 1. Clone Repository
```bash
git clone https://github.com/palorkjork168/sakol-universe.git
cd sakol-universe
```

### 2. Backend Setup & Migrations
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
npm run db:migrate
npm run db:migrate:status
```

### 3. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
```

### 4. Running the Application Locally
In terminal 1 (Backend):
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
# Client runs at http://localhost:5173
```

---

## 🧪 Testing & Verification

Sakol Universe includes a complete automated regression test suite covering all business flows, tenant isolation boundaries, and security policies.

### Run All Backend Regression Tests (16 Suites)
```bash
cd server
npm test
```

This runs all 16 test suites sequentially:
1. `test_attendance_schedule_integration.js` - Attendance & schedule calculations
2. `test_shift_schedule_flow.js` - Shift CRUD and employee assignment
3. `test_attendance_tenant_safety.js` - Multi-tenant attendance isolation
4. `test_leave_tenant_safety.js` - Multi-tenant leave policy isolation
5. `test_master_lifecycle.js` - Full end-to-end recruitment lifecycle
6. `test_advanced_rbac_flow.js` - Role-based access control & permission checks
7. `test_analytics_flow.js` - Analytics computations and tenant scoping
8. `test_notification_flow.js` - Real-time in-app notification events
9. `test_employment_membership.js` - Structured employee membership
10. `test_global_role_safety.js` - Global role immutability and guards
11. `test_cors_security.js` - CORS origin allowlists and credentials
12. `test_structured_hiring_flow.js` - Structured hiring and department derivation
13. `test_attendance_analytics_flow.js` - Attendance reporting and CSV export
14. `test_security_audit_flow.js` - Immutable audit logging & secret sanitization
15. `test_email_flow.js` - Transactional email providers and failure isolation
16. `test_v1_production_readiness.js` - Release hardening, health probes, and role matrices

### Run Frontend Production Build Check
```bash
cd client
npm run build
```
Requirements:
- 0 TypeScript errors
- 0 Vite errors
- 0 Vite warnings
- Initial entry chunk < 95 kB

---

## 🚢 Production Deployment Guide

1. **Environment**: Set `NODE_ENV=production` on the server.
2. **Secrets**: Set high-entropy `JWT_SECRET` and genuine `DATABASE_URL` (with SSL), `CLOUDINARY_*` keys, and `SMTP_*` credentials.
3. **Database Migrations**: Always execute migrations prior to booting the app:
   ```bash
   npm run db:migrate
   ```
4. **Health Probe**: Configure container or load balancer health check to probe:
   ```http
   GET /api/health
   ```
   A healthy service returns HTTP 200 with `{ "status": "ok", "database": "connected" }`.
5. **Process Manager**: Use a production process manager (e.g., PM2, Docker, or Kubernetes) to manage Node.js processes. Graceful shutdown (`SIGTERM`/`SIGINT`) is built-in.
6. **Frontend Static Hosting**: Build the frontend (`npm run build`) and serve `client/dist` through a CDN or Nginx reverse proxy routing `/api` to the backend.

---

## 📄 License
ISC License.
