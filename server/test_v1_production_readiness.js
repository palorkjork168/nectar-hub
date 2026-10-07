// test_v1_production_readiness.js
// Phase 10: Production Readiness & Release Hardening Verification Suite
require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
  User,
  Role,
  UserRole,
  Company,
  EmploymentRecord,
  WorkSchedule,
  LeaveType,
  LeaveRequest,
  AuditLog,
  Job,
  JobApplication,
} = require("./src/models");

const BASE = "http://127.0.0.1:5000/api";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ PASS: ${message}`);
}

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  console.log("\n==================================================");
  console.log("PHASE 10: V1.0 PRODUCTION READINESS TEST SUITE");
  console.log("==================================================\n");

  try {
    const timestamp = Date.now();
    const rawPassword = "Password123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // ==========================================
    // 1. HEALTH ENDPOINT VERIFICATION
    // ==========================================
    console.log("--- 1. Testing GET /api/health ---");
    const health = await api("/health");
    assert(health.status === 200, "Health check endpoint returns 200 OK");
    assert(health.data.success === true, "Health response success flag is true");
    assert(health.data.status === "ok", "Health status is 'ok'");
    assert(health.data.database === "connected", "Database probe reports 'connected'");
    assert(typeof health.data.uptime === "number", "Uptime is reported as number");
    assert(Boolean(health.data.timestamp), "Timestamp is present in health response");

    // ==========================================
    // 2. ERROR SANITIZATION & HTTP STATUS VERIFICATION
    // ==========================================
    console.log("\n--- 2. Testing Production Error Sanitization ---");
    // 404 for unhandled routes
    const notFound = await api("/unhandled-production-route-xyz");
    assert(notFound.status === 404, "Unknown API route returns 404 Not Found");
    assert(notFound.data.success === false, "404 response has success: false");
    assert(notFound.data.message.includes("not found"), "404 message cleanly indicates not found");
    assert(!JSON.stringify(notFound.data).includes("stack"), "404 does not leak stack trace");

    // 401 for unauthenticated request
    const unauth = await api("/attendance/me");
    assert(unauth.status === 401, "Unauthenticated request returns 401 Unauthorized");
    assert(unauth.data.success === false, "401 response has success: false");

    // 401 for malformed token
    const malformed = await api("/attendance/me", {
      headers: { Authorization: "Bearer this-is-an-invalid-token" },
    });
    assert(malformed.status === 401, "Malformed token returns 401 Unauthorized");

    // 400 for invalid UUID parameter (Sequelize error translation)
    const invalidUuid = await api("/audit/company/not-a-valid-uuid", {
      headers: { Authorization: "Bearer fake-token" },
    });
    assert([400, 401].includes(invalidUuid.status), "Invalid UUID returns sanitized 400 or 401");
    const invalidUuidBody = JSON.stringify(invalidUuid.data).toLowerCase();
    assert(!invalidUuidBody.includes("syntax error"), "No SQL syntax error leaked in UUID error");
    assert(!invalidUuidBody.includes("select "), "No SQL query leaked in UUID error");
    assert(!invalidUuidBody.includes("stack"), "No stack trace leaked in UUID error");

    // ==========================================
    // 3. SETTING UP TEST ACTORS FOR ROLE MATRIX
    // ==========================================
    console.log("\n--- 3. Setting Up Test Actors & Roles ---");
    const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    const seekerRole = await Role.findOne({ where: { name: "JOB_SEEKER" } });

    // Job Seeker
    const seeker = await User.create({
      first_name: "Seeker",
      last_name: "Test",
      email: `seeker_v1_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: seeker.id, role_id: seekerRole.id });

    // Company A Owner & Company
    const ownerA = await User.create({
      first_name: "OwnerA",
      last_name: "Alpha",
      email: `ownera_v1_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerA.id, role_id: employerRole.id });

    const companyA = await Company.create({
      owner_id: ownerA.id,
      name: `Alpha V1 Corp ${timestamp}`,
      description: "Company A for V1 release hardening",
      industry: "Technology",
      location: "Bangkok",
    });

    // Company B Owner & Company
    const ownerB = await User.create({
      first_name: "OwnerB",
      last_name: "Beta",
      email: `ownerb_v1_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerB.id, role_id: employerRole.id });

    const companyB = await Company.create({
      owner_id: ownerB.id,
      name: `Beta V1 Corp ${timestamp}`,
      description: "Company B for cross-tenant testing",
      industry: "Finance",
      location: "Chiang Mai",
    });

    // Employee of Company A
    const empUserA = await User.create({
      first_name: "WorkerA",
      last_name: "Alpha",
      email: `workera_v1_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: empUserA.id, role_id: employeeRole.id });
    const empRecA = await EmploymentRecord.create({
      user_id: empUserA.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // Admin user
    const adminUser = await User.create({
      first_name: "Super",
      last_name: "Admin",
      email: `admin_v1_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: adminUser.id, role_id: adminRole.id });

    // Authenticate all actors to obtain JWTs
    const loginSeeker = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: seeker.email, password: rawPassword }),
    });
    const seekerToken = loginSeeker.data.data?.token || loginSeeker.data.token;
    assert(loginSeeker.status === 200 && Boolean(seekerToken), "Job seeker authenticated successfully");

    const loginOwnerA = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerA.email, password: rawPassword }),
    });
    const ownerAToken = loginOwnerA.data.data?.token || loginOwnerA.data.token;
    assert(loginOwnerA.status === 200 && Boolean(ownerAToken), "Owner A authenticated successfully");

    const loginOwnerB = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerB.email, password: rawPassword }),
    });
    const ownerBToken = loginOwnerB.data.data?.token || loginOwnerB.data.token;
    assert(loginOwnerB.status === 200 && Boolean(ownerBToken), "Owner B authenticated successfully");

    const loginEmpA = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: empUserA.email, password: rawPassword }),
    });
    const empAToken = loginEmpA.data.data?.token || loginEmpA.data.token;
    assert(loginEmpA.status === 200 && Boolean(empAToken), "Employee A authenticated successfully");

    const loginAdmin = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: adminUser.email, password: rawPassword }),
    });
    const adminToken = loginAdmin.data.data?.token || loginAdmin.data.token;
    assert(loginAdmin.status === 200 && Boolean(adminToken), "Admin authenticated successfully");

    // ==========================================
    // 4. CROSS-ROLE SECURITY MATRIX (NEGATIVE TESTS)
    // ==========================================
    console.log("\n--- 4. Cross-Role Security Authorization Matrix ---");
    // A. JOB_SEEKER attempting employer endpoints -> 403
    const seekerCreatingJob = await api("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${seekerToken}` },
      body: JSON.stringify({
        title: "Unauthorized Job",
        description: "Desc",
        location: "Bangkok",
        job_type: "FULL_TIME",
        company_id: companyA.id,
      }),
    });
    assert(seekerCreatingJob.status === 403, "JOB_SEEKER blocked from creating jobs (403)");

    const seekerCreatingSchedule = await api("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${seekerToken}` },
      body: JSON.stringify({
        company_id: companyA.id,
        name: "Illegal Schedule",
        start_time: "09:00",
        end_time: "17:00",
      }),
    });
    assert(seekerCreatingSchedule.status === 403, "JOB_SEEKER blocked from creating work schedules (403)");

    // B. EMPLOYEE attempting admin endpoints -> 403
    const empAccessingAdminRoles = await api("/admin/roles", {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert(empAccessingAdminRoles.status === 403, "EMPLOYEE blocked from admin roles API (403)");

    const empAccessingAdminDashboard = await api("/admin/dashboard", {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert(empAccessingAdminDashboard.status === 403, "EMPLOYEE blocked from admin dashboard (403)");

    // C. EMPLOYEE attempting company analytics -> 403
    const empAccessingCompanyAnalytics = await api(`/analytics/company/${companyA.id}/overview`, {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert(empAccessingCompanyAnalytics.status === 403, "EMPLOYEE blocked from company-wide analytics (403)");

    // D. Cross-Company Tenant Isolation
    // Owner B attempts to view Company A audit logs -> 403
    const crossAudit = await api(`/audit/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${ownerBToken}` },
    });
    assert(crossAudit.status === 403, "Cross-company Owner B blocked from Company A audit logs (403)");

    // Owner B attempts to list Company A employees -> 403
    const crossEmployees = await api(`/companies/${companyA.id}/employees`, {
      headers: { Authorization: `Bearer ${ownerBToken}` },
    });
    assert(crossEmployees.status === 403, "Cross-company Owner B blocked from Company A employee list (403)");

    // Owner B attempts to access Company A analytics -> 403
    const crossAnalytics = await api(`/analytics/company/${companyA.id}/overview`, {
      headers: { Authorization: `Bearer ${ownerBToken}` },
    });
    assert(crossAnalytics.status === 403, "Cross-company Owner B blocked from Company A analytics (403)");

    // ==========================================
    // 5. END-TO-END FLOW A: JOB SEEKER LIFECYCLE
    // ==========================================
    console.log("\n--- 5. Flow A: Job Seeker End-to-End ---");
    // Update profile
    const profileUpdate = await api("/profile/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${seekerToken}` },
      body: JSON.stringify({
        professional_title: "Senior Fullstack Lead",
        bio: "Senior Fullstack Engineer with 7 years experience in Node and React",
        city: "Bangkok",
        country: "Thailand",
      }),
    });
    assert(profileUpdate.status === 200, "Candidate updated profile successfully (200)");

    // Browse published jobs
    const publicJobs = await api("/jobs");
    assert(publicJobs.status === 200, "Candidate can browse public jobs list (200)");

    // Employer creates job for candidate to apply
    const createdJob = await api("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        title: `Fullstack Lead V1 ${timestamp}`,
        description: "Lead the engineering team on core platforms for Sakol Universe v1.0",
        requirements: "TypeScript, Node, React, PostgreSQL",
        location: "Bangkok",
        employment_type: "FULL_TIME",
        company_id: companyA.id,
        status: "PUBLISHED",
      }),
    });
    assert(createdJob.status === 201, "Employer A posted new job vacancy (201)");
    const jobId = createdJob.data.data?.job?.id || createdJob.data.data?.id;

    // View job details
    const jobDetails = await api(`/jobs/${jobId}`);
    assert(jobDetails.status === 200, "Candidate can view specific job details (200)");

    // Candidate applies for the job
    const applyRes = await api(`/applications/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${seekerToken}` },
      body: JSON.stringify({
        cover_letter: "Excited to apply for Sakol Universe v1.0 lead role!",
      }),
    });
    assert(applyRes.status === 201, "Candidate submitted application (201)");
    const applicationId = applyRes.data.data?.application?.id || applyRes.data.data?.id;

    // Candidate views own applications
    const myApps = await api("/applications/my", {
      headers: { Authorization: `Bearer ${seekerToken}` },
    });
    assert(myApps.status === 200, "Candidate fetched own applications list (200)");
    const appList = myApps.data.data?.applications || myApps.data.data || [];
    const foundApp = appList.find((a) => a.id === applicationId);
    assert(Boolean(foundApp), "Candidate application appears in personal application history");

    // ==========================================
    // 6. END-TO-END FLOW B: EMPLOYER / HR LIFECYCLE
    // ==========================================
    console.log("\n--- 6. Flow B: Employer / HR End-to-End ---");
    // Employer views applicants for company jobs
    const applicants = await api(`/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    assert(applicants.status === 200, "Employer A retrieved applicants list (200)");

    // Update application status to REVIEWING
    const reviewApp = await api(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({ status: "REVIEWING" }),
    });
    assert(reviewApp.status === 200, "Employer A advanced application status to REVIEWING (200)");

    // Schedule interview
    const interviewDate = new Date(Date.now() + 86400000).toISOString();
    const scheduleInterview = await api("/interviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        application_id: applicationId,
        scheduled_at: interviewDate,
        interview_type: "VIDEO",
        meeting_link: "https://meet.google.com/sakol-v1-ready",
        notes: "Technical interview with engineering panel",
      }),
    });
    assert(scheduleInterview.status === 201, "Employer A scheduled candidate interview (201)");
    const interviewId = scheduleInterview.data.data?.interview?.id || scheduleInterview.data.data?.id;

    // Reschedule interview
    const rescheduledDate = new Date(Date.now() + 172800000).toISOString();
    const reschedule = await api(`/interviews/${interviewId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        scheduled_at: rescheduledDate,
        notes: "Adjusted panel timing",
      }),
    });
    assert(reschedule.status === 200, "Employer A rescheduled interview (200)");

    // Accept application
    const acceptApp = await api(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    assert(acceptApp.status === 200, "Employer A accepted candidate application (200)");

    // Hire candidate -> converts candidate to company employee
    const hireRes = await api(`/applications/${applicationId}/hire`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        startDate: new Date().toISOString().split("T")[0],
      }),
    });
    assert(hireRes.status === 200, "Employer A hired candidate into Company A (200)");

    // Verify candidate is now in Company A directory
    const empList = await api(`/companies/${companyA.id}/employees`, {
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    assert(empList.status === 200, "Employer A retrieved updated employee roster (200)");
    const employees = empList.data.data?.employees || [];
    const hiredRecord = employees.find((e) => e.employee?.user?.id === seeker.id);
    assert(Boolean(hiredRecord), "Hired candidate is registered as active employee in Company A");
    const hiredEmploymentId = hiredRecord.employment.id;

    // ==========================================
    // 7. END-TO-END FLOW C: EMPLOYEE OPERATIONS
    // ==========================================
    console.log("\n--- 7. Flow C: Employee Operations End-to-End ---");
    // Create work schedule for Company A and assign it to employee
    const createSchedule = await api("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        company_id: companyA.id,
        name: "Standard Core Shift 09:00-18:00",
        start_time: "09:00",
        end_time: "18:00",
        grace_period_minutes: 15,
        is_default: true,
      }),
    });
    assert(createSchedule.status === 201, "Employer A created company work schedule (201)");
    const scheduleId = createSchedule.data.data?.schedule?.id || createSchedule.data.data?.id;

    // Assign schedule to hired employee
    const assignSched = await api(`/shifts/employment/${hiredEmploymentId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        workScheduleId: scheduleId,
      }),
    });
    assert(assignSched.status === 200, "Schedule assigned to employee (200)");

    // Re-login hired candidate to get refreshed JWT with EMPLOYEE capabilities
    const loginHired = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: seeker.email, password: rawPassword }),
    });
    const hiredToken = loginHired.data.data?.token || loginHired.data.token;

    // Employee views current schedule
    const mySchedule = await api("/shifts/my/current", {
      headers: { Authorization: `Bearer ${hiredToken}` },
    });
    assert(mySchedule.status === 200, "Employee retrieved assigned schedule (200)");

    // GPS Check In
    const checkIn = await api("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${hiredToken}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 13.7563,
        longitude: 100.5018,
      }),
    });
    assert(checkIn.status === 201, "Employee checked in with GPS (201)");

    // GPS Check Out
    const checkOut = await api("/attendance/check-out", {
      method: "POST",
      headers: { Authorization: `Bearer ${hiredToken}` },
      body: JSON.stringify({
        latitude: 13.7563,
        longitude: 100.5018,
      }),
    });
    assert(checkOut.status === 200, "Employee checked out with GPS (200)");

    // View Attendance History
    const history = await api("/attendance/me", {
      headers: { Authorization: `Bearer ${hiredToken}` },
    });
    assert(history.status === 200, "Employee viewed personal attendance history (200)");
    const attList = Array.isArray(history.data.data?.attendances)
      ? history.data.data.attendances
      : (Array.isArray(history.data.data) ? history.data.data : []);
    assert(attList.length > 0, "Attendance history contains the completed check-in/out session");

    // Employee Leave Request Flow
    // Create LeaveType for Company A
    const leaveType = await LeaveType.create({
      company_id: companyA.id,
      name: `Annual Leave ${timestamp}`,
      days_allowed: 15,
      is_paid: true,
      is_active: true,
    });

    const leaveReq = await api("/leave/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${hiredToken}` },
      body: JSON.stringify({
        companyId: companyA.id,
        leave_type_id: leaveType.id,
        start_date: "2026-11-10",
        end_date: "2026-11-12",
        reason: "Family vacation for v1.0",
      }),
    });
    assert(leaveReq.status === 201, "Employee submitted leave request (201)");
    const leaveReqId = leaveReq.data.data?.id || leaveReq.data.id;

    // View personal leave requests
    const myLeaves = await api("/leave/my", {
      headers: { Authorization: `Bearer ${hiredToken}` },
    });
    assert(myLeaves.status === 200, "Employee retrieved personal leave requests (200)");

    // Employer reviews leave request (approve)
    const approveLeave = await api(`/leave/requests/${leaveReqId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ownerAToken}` },
      body: JSON.stringify({
        review_note: "Approved by management for v1.0",
      }),
    });
    assert(approveLeave.status === 200, "Employer approved employee leave request (200)");

    // ==========================================
    // 8. END-TO-END FLOW D: ADMIN GOVERNANCE
    // ==========================================
    console.log("\n--- 8. Flow D: Admin Governance End-to-End ---");
    // Admin dashboard overview
    const adminDashboard = await api("/admin/dashboard", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDashboard.status === 200, "Admin accessed platform dashboard stats (200)");

    // Admin lists roles
    const adminRoles = await api("/admin/roles", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminRoles.status === 200, "Admin listed platform roles (200)");

    // Admin views permissions
    const adminPerms = await api("/admin/permissions", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPerms.status === 200, "Admin listed platform permissions (200)");

    // Admin overview analytics
    const adminAnalytics = await api("/analytics/admin/overview", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAnalytics.status === 200, "Admin accessed global analytics overview (200)");

    // Safety check: stripping critical permission from ADMIN must be rejected
    const stripAdmin = await api(`/admin/roles/${adminRole.id}/permissions`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ permission_ids: [] }),
    });
    assert(stripAdmin.status === 400, "SAFETY: Stripping critical management permissions from ADMIN rejected (400)");

    // ==========================================
    // 9. AUDIT TRAIL IMMUTABILITY & ISOLATION
    // ==========================================
    console.log("\n--- 9. Verifying Audit Trail Integrity ---");
    await new Promise((r) => setTimeout(r, 400));
    const companyAuditLogs = await api(`/audit/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    assert(companyAuditLogs.status === 200, "Company A owner retrieved company audit logs (200)");
    const auditEntries = Array.isArray(companyAuditLogs.data.data) ? companyAuditLogs.data.data : [];
    assert(auditEntries.length > 0, "Company A has recorded immutable audit events");

    // Verify all audit entries belong exclusively to Company A
    const foreignLogs = auditEntries.filter((log) => log.company_id && log.company_id !== companyA.id);
    assert(foreignLogs.length === 0, "Zero cross-company contamination in audit trail");

    // Verify zero secrets leaked in audit metadata
    const auditPayloadStr = JSON.stringify(companyAuditLogs.data);
    assert(!auditPayloadStr.includes(rawPassword), "Plain passwords never present in audit logs");
    assert(!auditPayloadStr.includes("$2a$") && !auditPayloadStr.includes("$2b$"), "Password hashes never present in audit logs");

    console.log("\n==================================================");
    console.log("ALL V1.0 PRODUCTION READINESS CHECKS PASSED (100%)");
    console.log("==================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("Test Suite Error:", error);
    process.exit(1);
  }
})();
