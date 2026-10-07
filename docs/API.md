# Nectar Hub API Documentation
*(formerly Sakol Universe)*

This document outlines the RESTful API endpoints available in Nectar Hub, specifying authentication requirements, role/permission requirements, and request/response specifications.

---

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<your-domain>/api`

---

## Authentication & Session
Authentication uses JWT Bearer tokens passed via the `Authorization: Bearer <token>` HTTP header.

### `GET /api/health`
- **Auth**: None (Public)
- **Description**: Probes backend service health and live PostgreSQL database connectivity.
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "status": "ok",
    "timestamp": "2026-09-22T16:00:00.000Z",
    "database": "connected"
  }
  ```

### `POST /api/auth/register`
- **Auth**: None (Public)
- **Rate Limit**: 100 requests per 15 minutes
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "StrongPassword123!",
    "role": "JOB_SEEKER" | "EMPLOYER"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }
    }
  }
  ```

### `POST /api/auth/login`
- **Auth**: None (Public)
- **Rate Limit**: 100 requests per 15 minutes
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "token": "jwt.token.here",
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "roles": ["JOB_SEEKER"]
    }
  }
  ```

### `GET /api/auth/me`
- **Auth**: Bearer Token
- **Description**: Returns authenticated user profile, global roles, permissions, and company-scoped roles.
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "roles": ["EMPLOYER"],
      "permissions": ["jobs.create", "jobs.edit"],
      "companyRoles": [{ "companyId": "uuid", "role": "HR" }]
    }
  }
  ```

---

## Companies

### `POST /api/companies`
- **Auth**: Authenticated (`EMPLOYER` or `ADMIN`)
- **Body**: `{ "name": "Acme Corp", "description": "...", "website": "https://acme.com", "location": "Phnom Penh" }`
- **Response**: `201 Created`

### `GET /api/companies/my`
- **Auth**: Authenticated (`EMPLOYER`)
- **Response**: `200 OK` (User's owned company)

### `GET /api/companies/:id`
- **Auth**: None (Public)
- **Response**: `200 OK`

### `PUT /api/companies/:id`
- **Auth**: Authenticated (Company Owner or `ADMIN`)
- **Body**: Company fields to update
- **Response**: `200 OK`

---

## Jobs

### `GET /api/jobs`
- **Auth**: None (Public)
- **Query Params**: `search`, `type`, `location`, `page`, `limit`
- **Response**: `200 OK` (Only `PUBLISHED` jobs returned publicly)

### `GET /api/jobs/:id`
- **Auth**: None (Public)
- **Response**: `200 OK`

### `POST /api/jobs`
- **Auth**: Authenticated (`EMPLOYER`, `RECRUITER`, `ADMIN`)
- **Body**: `{ "companyId": "uuid", "title": "Software Engineer", "type": "FULL_TIME", "workplaceType": "REMOTE", "description": "...", "location": "...", "salaryMin": 1500, "salaryMax": 2500 }`
- **Response**: `201 Created`

### `PUT /api/jobs/:id`
- **Auth**: Authenticated (Owner, `RECRUITER`, `ADMIN`)
- **Body**: `{ "status": "PUBLISHED" | "CLOSED" | "DRAFT", ... }`
- **Response**: `200 OK`

### `POST /api/jobs/:id/skills` & `DELETE /api/jobs/:id/skills/:skillId`
- **Auth**: Authenticated (Company Job Manager)
- **Body**: `{ "skillId": "uuid", "isMandatory": true, "proficiency": "INTERMEDIATE" }`

---

## Applications

### `POST /api/applications/jobs/:jobId/apply`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **Body**: `{ "coverLetter": "..." }`
- **Response**: `201 Created` (Enforces unique application constraint; returns `409 Conflict` on duplicates)

### `GET /api/applications/my`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **Response**: `200 OK`

### `GET /api/applications/jobs/:jobId`
- **Auth**: Authenticated (Company Reviewer)
- **Response**: `200 OK`

### `PATCH /api/applications/:id/status`
- **Auth**: Authenticated (Company Reviewer)
- **Body**: `{ "status": "REVIEWING" | "INTERVIEW" | "ACCEPTED" | "REJECTED" }`
- **Response**: `200 OK`

---

## Candidate Profiles

### `GET /api/profile/me` & `PUT /api/profile/me`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **Body**: `{ "title": "Full Stack Dev", "bio": "...", "phone": "+855...", "portfolioUrl": "..." }`

### `POST /api/profile/avatar`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **Payload**: `multipart/form-data` with `avatar` image file (PNG/JPEG/WEBP <= 5MB)

### `POST /api/profile/resume`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **Payload**: `multipart/form-data` with `resume` document file (PDF <= 10MB)

### `POST /api/profile/skills`, `POST /api/profile/education`, `POST /api/profile/experience`
- **Auth**: Authenticated (`JOB_SEEKER`)
- **CRUD**: Full CRUD for candidate career assets

---

## Hiring & Conversion

### `POST /api/applications/:id/hire`
- **Auth**: Authenticated (`EMPLOYER`, Company `HR`, `ADMIN`)
- **Body**: `{ "departmentId": "uuid", "positionId": "uuid", "salary": 2000, "startDate": "2026-10-01" }`
- **Behavior**:
  - Idempotent: safe for duplicate calls.
  - Preserves user identity and existing `JOB_SEEKER` role.
  - Grants global `EMPLOYEE` role.
  - Creates `EmployeeProfile` and active `EmploymentRecord`.
- **Response**: `200 OK`

---

## Attendance

### `POST /api/attendance/check-in`
- **Auth**: Authenticated (`EMPLOYEE`)
- **Behavior**: Concurrency protected. One active check-in per user. Duplicate simultaneous check-ins fail cleanly with `400 Bad Request`.
- **Response**: `201 Created`

### `POST /api/attendance/check-out`
- **Auth**: Authenticated (`EMPLOYEE`)
- **Behavior**: Checks out active shift. Rejects if no active shift (`400 Bad Request`).
- **Response**: `200 OK`

### `GET /api/attendance/me`
- **Auth**: Authenticated (`EMPLOYEE`)
- **Response**: `200 OK`

---

## HR & Leave Management

### `POST /api/leave/types`
- **Auth**: Authenticated (`EMPLOYER`, Company `HR`)
- **Body**: `{ "companyId": "uuid", "name": "Annual Leave", "daysAllowed": 18, "isPaid": true }`

### `POST /api/leave/requests`
- **Auth**: Authenticated (`EMPLOYEE`)
- **Body**: `{ "leaveTypeId": "uuid", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "reason": "..." }`
- **Behavior**: Overlap-protected. Collision with existing leave returns `409 Conflict`.

### `PATCH /api/leave/requests/:id/approve` & `PATCH /api/leave/requests/:id/reject`
- **Auth**: Authenticated (`EMPLOYER`, Company `HR`, Company `MANAGER`)
- **Body**: `{ "companyId": "uuid" }`

---

## In-App Notifications

### `GET /api/notifications`
- **Auth**: Authenticated (All users)
- **Response**: `200 OK` with user-isolated notifications

### `GET /api/notifications/unread-count`
- **Auth**: Authenticated
- **Response**: `200 OK` `{ "unreadCount": 3 }`

### `PATCH /api/notifications/:id/read`
- **Auth**: Authenticated (Strict recipient ownership checked)

### `PATCH /api/notifications/read-all`
- **Auth**: Authenticated

---

## Analytics & Reporting

### `GET /api/analytics/admin/overview`
- **Auth**: Authenticated (`ADMIN`)
- **Query Params**: `from`, `to`
- **Response**: Platform-wide metrics, distribution charts, user/company trends.

### `GET /api/analytics/company/:companyId/overview`
- **Auth**: Authenticated (Company Owner, HR, Manager, Recruiter, Admin)
- **Query Params**: `from`, `to`
- **Response**: Headcount, job metrics, recruitment funnel, attendance hours, and leave breakdown.

### `GET /api/analytics/employee/me`
- **Auth**: Authenticated (`EMPLOYEE`)
- **Response**: Personal attendance sessions, total hours, and leave usage.
