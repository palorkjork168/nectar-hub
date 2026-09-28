# Sakol Universe

**Sakol Universe** is an enterprise-grade job marketplace and workforce management platform connecting job seekers, employers, and employees in a unified ecosystem. It integrates recruitment, interview pipelines, hiring-to-employee onboarding, attendance tracking, HR leave management, multi-role granular RBAC, and executive analytics.

---

## 🌟 Key Features

- **Public Job Portal**: Fast faceted search, job details, and category/location filtering.
- **Job Seeker Experience**: Resume & avatar uploads, skills/education/experience portfolios, saved jobs, application status tracking, and interview schedules.
- **Employer Recruitment**: Company branding, multi-step job publishing, applicant review funnel, interview scheduling, and team management.
- **Hiring-to-Employee Conversion**: One-click idempotent onboarding converting applicants to employees with preserved profiles and multi-portal roles.
- **Workforce Management**: Concurrency-protected attendance check-in/out, leave policy configuration, collision-guarded leave requests, and approval workflows.
- **Advanced RBAC**: Multi-role support (`ADMIN`, `EMPLOYER`, `EMPLOYEE`, `JOB_SEEKER`) plus company-scoped roles (`HR`, `RECRUITER`, `MANAGER`) with granular permission boundaries.
- **In-App Notifications**: Real-time actionable alerts for recruitment, interviews, hiring, and leave events.
- **Analytics & Reporting**: Interactive platform-level, company-level, and employee-level analytics with conversion funnels and trends.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v7.
- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL.
- **Security**: Helmet, CORS, Express Rate Limit, JWT Bearer tokens, bcryptjs.
- **Media**: Cloudinary integration for resume and avatar assets.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Cloudinary account

### 1. Repository Setup
```bash
git clone https://github.com/palorkjork168/sakol-universe.git
cd sakol-universe
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials, JWT secret, and Cloudinary keys
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

### 4. Running Locally
Run the backend:
```bash
cd server
npm run dev
```

Run the frontend:
```bash
cd client
npm run dev
```

### Database migrations

Existing databases are the migration baseline; migrations apply only intentional V2 changes going forward. Run migrations explicitly before deploying the API:

```bash
cd server
npm run db:migrate
npm run db:migrate:status
# Revert only the most recently applied migration when its down migration is safe
npm run db:migrate:down
```

Never use `sequelize.sync({ force: true })` or `sequelize.sync({ alter: true })`. Development retains non-destructive `sequelize.sync()` temporarily; production connects without syncing and expects migrations to be applied first.

Frontend API configuration uses `client/.env` with `VITE_API_URL`. Development defaults to the local API only when unset; production uses the configured URL or same-origin `/api`.

Frontend runs at `http://localhost:5173` and backend runs at `http://localhost:5000`.

---

## 🧪 Testing & Quality Assurance

Run any of the end-to-end integration test suites from the `server` directory:

```bash
cd server

# Flagship Master Lifecycle E2E Test
node test_master_lifecycle.js

# Auth, Security & Validation Test
node test_auth_security.js

# Advanced RBAC & Multi-Tenant Isolation
node test_advanced_rbac_flow.js

# Analytics & Reporting
node test_analytics_flow.js

# In-App Notifications
node test_notification_flow.js

# Hiring & Employee Conversion
node test_hiring_flow.js

# Interview Lifecycle
node test_interview_flow.js

# Employer Recruitment
node test_employer_recruitment_flow.js

# Job Seeker Experience
node test_job_seeker_flow.js
```

### Production Build
```bash
cd client
npm run build
```

---

## 📖 Documentation
- [API Documentation](docs/API.md)
- [Release Readiness Checklist](docs/RELEASE_CHECKLIST.md)
