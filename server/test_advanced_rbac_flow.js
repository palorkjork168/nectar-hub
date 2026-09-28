// test_advanced_rbac_flow.js
require("dotenv").config();
const BASE_URL = "http://127.0.0.1:5000/api";
const {
  User,
  Role,
  UserRole,
  Company,
  Job,
  Application,
  Interview,
  EmploymentRecord,
  Department,
  Position,
  LeaveType,
  LeaveRequest,
  CompanyUserRole,
  Permission,
} = require("./src/models");
const bcrypt = require("bcryptjs");

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

async function runAdvancedRBACTests() {
  console.log("==================================================");
  console.log("STARTING ADVANCED RBAC & PERMISSIONS E2E SUITE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  try {
    // ----------------------------------------------------
    // 1. Roles & Permissions Verification
    // ----------------------------------------------------
    console.log("--- 1. Verifying Database Roles & Permissions Setup ---");
    const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    const jobSeekerRole = await Role.findOne({ where: { name: "JOB_SEEKER" } });
    const hrRole = await Role.findOne({ where: { name: "HR" } });
    const recruiterRole = await Role.findOne({ where: { name: "RECRUITER" } });
    const managerRole = await Role.findOne({ where: { name: "MANAGER" } });

    assert(adminRole && employerRole && employeeRole && jobSeekerRole, "Core roles exist");
    assert(hrRole && recruiterRole && managerRole, "Organizational roles (HR, RECRUITER, MANAGER) exist");

    const totalPermissions = await Permission.count();
    assert(totalPermissions >= 20, `Domain permissions seeded successfully (count: ${totalPermissions})`);

    // ----------------------------------------------------
    // 2. Setting Up Test Actors
    // ----------------------------------------------------
    console.log("\n--- 2. Setting up Test Actors ---");

    // Admin
    const adminEmail = `rbac_admin_${timestamp}@test.com`;
    const [adminUser] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: { first_name: "Admin", last_name: "User", email: adminEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: adminUser.id, role_id: adminRole.id } });

    // Employer A (Owner of Company A)
    const empAEmail = `rbac_emp_a_${timestamp}@test.com`;
    const [empA] = await User.findOrCreate({
      where: { email: empAEmail },
      defaults: { first_name: "Owner", last_name: "Alpha", email: empAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empA.id, role_id: employerRole.id } });

    // Employer B (Owner of Company B)
    const empBEmail = `rbac_emp_b_${timestamp}@test.com`;
    const [empB] = await User.findOrCreate({
      where: { email: empBEmail },
      defaults: { first_name: "Owner", last_name: "Beta", email: empBEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empB.id, role_id: employerRole.id } });

    // User X: HR at Company A, and Employee at Company B
    const userXEmail = `rbac_user_x_${timestamp}@test.com`;
    const [userX] = await User.findOrCreate({
      where: { email: userXEmail },
      defaults: { first_name: "Multi", last_name: "UserX", email: userXEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: userX.id, role_id: employeeRole.id } });

    // User Recruiter A: Recruiter assigned at Company A
    const recruiterAEmail = `rbac_recruiter_a_${timestamp}@test.com`;
    const [recruiterA] = await User.findOrCreate({
      where: { email: recruiterAEmail },
      defaults: { first_name: "Recruiter", last_name: "Alpha", email: recruiterAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: recruiterA.id, role_id: employeeRole.id } });

    // User Manager A: Manager assigned at Company A
    const managerAEmail = `rbac_manager_a_${timestamp}@test.com`;
    const [managerA] = await User.findOrCreate({
      where: { email: managerAEmail },
      defaults: { first_name: "Manager", last_name: "Alpha", email: managerAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: managerA.id, role_id: employeeRole.id } });

    // Plain Employee at Company A
    const employeeAEmail = `rbac_employee_a_${timestamp}@test.com`;
    const [employeeA] = await User.findOrCreate({
      where: { email: employeeAEmail },
      defaults: { first_name: "Regular", last_name: "Worker", email: employeeAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: employeeA.id, role_id: employeeRole.id } });

    // Job Seeker
    const seekerEmail = `rbac_seeker_${timestamp}@test.com`;
    const [seekerUser] = await User.findOrCreate({
      where: { email: seekerEmail },
      defaults: { first_name: "Job", last_name: "Candidate", email: seekerEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: seekerUser.id, role_id: jobSeekerRole.id } });

    // Login tokens
    async function loginUser(email) {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Password123!" }),
      });
      assert(res.ok, `Login succeeded for ${email}`);
      return res.data.data.token;
    }

    const tokenAdmin = await loginUser(adminEmail);
    const tokenEmpA = await loginUser(empAEmail);
    const tokenEmpB = await loginUser(empBEmail);
    const tokenUserX = await loginUser(userXEmail);
    const tokenRecruiterA = await loginUser(recruiterAEmail);
    const tokenManagerA = await loginUser(managerAEmail);
    const tokenEmployeeA = await loginUser(employeeAEmail);
    const tokenSeeker = await loginUser(seekerEmail);

    // ----------------------------------------------------
    // 3. Creating Company A and Company B
    // ----------------------------------------------------
    console.log("\n--- 3. Setting up Companies, Employment & Company Roles ---");

    const compARes = await apiRequest("/companies", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        name: `Acme Corp ${timestamp}`,
        industry: "Technology",
        city: "Phnom Penh",
        country: "Cambodia",
      }),
    });
    assert(compARes.ok, "Company A created by Employer A");
    const companyA = compARes.data.data.company;

    const compBRes = await apiRequest("/companies", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpB}` },
      body: JSON.stringify({
        name: `Beta Logistics ${timestamp}`,
        industry: "Logistics",
        city: "Siem Reap",
        country: "Cambodia",
      }),
    });
    assert(compBRes.ok, "Company B created by Employer B");
    const companyB = compBRes.data.data.company;


    // Establish Employment Records:
    // User X employed at Company A and Company B
    await EmploymentRecord.create({
      user_id: userX.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    await EmploymentRecord.create({
      user_id: userX.id,
      company_id: companyB.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // Recruiter A, Manager A, Employee A employed at Company A
    await EmploymentRecord.create({
      user_id: recruiterA.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    await EmploymentRecord.create({
      user_id: managerA.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    await EmploymentRecord.create({
      user_id: employeeA.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // Assign Company Roles in Company A:
    // Employer A assigns HR to User X, RECRUITER to Recruiter A, MANAGER to Manager A
    const assignHRRes = await apiRequest(`/companies/${companyA.id}/team/roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({ user_id: userX.id, role_name: "HR" }),
    });
    assert(assignHRRes.ok, "Employer A assigned HR role to User X in Company A");

    const assignRecruiterRes = await apiRequest(`/companies/${companyA.id}/team/roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({ user_id: recruiterA.id, role_name: "RECRUITER" }),
    });
    assert(assignRecruiterRes.ok, "Employer A assigned RECRUITER role to Recruiter A in Company A");

    const assignManagerRes = await apiRequest(`/companies/${companyA.id}/team/roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({ user_id: managerA.id, role_name: "MANAGER" }),
    });
    assert(assignManagerRes.ok, "Employer A assigned MANAGER role to Manager A in Company A");

    // ----------------------------------------------------
    // 4. Team API Security & Cross-Company Boundary Tests
    // ----------------------------------------------------
    console.log("\n--- 4. Testing Team API Security & Cross-Tenant Boundaries ---");

    // Employer B attempting to assign role in Company A -> blocked
    const crossAssignRes = await apiRequest(`/companies/${companyA.id}/team/roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpB}` },
      body: JSON.stringify({ user_id: userX.id, role_name: "HR" }),
    });
    assert(crossAssignRes.status === 403, "SECURITY PASS: Employer B assigning role in Company A blocked (403)");

    // Employer A attempting to assign invalid role (e.g. ADMIN) -> rejected
    const invalidRoleRes = await apiRequest(`/companies/${companyA.id}/team/roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({ user_id: userX.id, role_name: "ADMIN" }),
    });
    assert(invalidRoleRes.status === 400, "SECURITY PASS: Attempting to assign global ADMIN role rejected (400)");

    // Employer A views team list
    const teamRes = await apiRequest(`/companies/${companyA.id}/team`, {
      headers: { Authorization: `Bearer ${tokenEmpA}` },
    });
    assert(teamRes.ok && teamRes.data.data.team.length >= 4, "Employer A retrieved Company A team list");

    // Employer B viewing Company A team -> blocked
    const crossViewTeamRes = await apiRequest(`/companies/${companyA.id}/team`, {
      headers: { Authorization: `Bearer ${tokenEmpB}` },
    });
    assert(crossViewTeamRes.status === 403, "SECURITY PASS: Employer B viewing Company A team blocked (403)");

    // ----------------------------------------------------
    // 5. Multi-Company Isolation Tests (Phase 30)
    // ----------------------------------------------------
    console.log("\n--- 5. Testing Multi-Company Isolation (Phase 30) ---");
    // User X is HR at Company A, and regular Employee at Company B

    // User X creates department in Company A -> SUCCESS (201)
    const createDeptARes = await apiRequest("/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({ companyId: companyA.id, name: `Engineering ${timestamp}` }),
    });
    assert(createDeptARes.status === 201, "MULTI-COMPANY PASS: User X (HR at A) created department in Company A (201)");
    const deptA = createDeptARes.data.data;

    // User X creates department in Company B -> FORBIDDEN (403)
    const createDeptBRes = await apiRequest("/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({ companyId: companyB.id, name: `Ops ${timestamp}` }),
    });
    assert(createDeptBRes.status === 403, "MULTI-COMPANY PASS: User X (Employee at B) blocked from managing Company B (403)");

    // Leave Policy in Company A by User X -> SUCCESS (201)
    const createLeaveTypeARes = await apiRequest("/leave/types", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: `Annual Leave ${timestamp}`,
        days_allowed: 18,
      }),
    });
    assert(createLeaveTypeARes.status === 201, "MULTI-COMPANY PASS: User X created leave type in Company A (201)");
    const leaveTypeA = createLeaveTypeARes.data.data;

    // Leave Policy in Company B by User X -> FORBIDDEN (403)
    const createLeaveTypeBRes = await apiRequest("/leave/types", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({
        companyId: companyB.id,
        name: `Annual Leave ${timestamp}`,
        days_allowed: 18,
      }),
    });
    assert(createLeaveTypeBRes.status === 403, "MULTI-COMPANY PASS: User X blocked from configuring Company B leave policy (403)");

    // User X submits own leave request for Company B as an Employee -> SUCCESS (201)
    // First, Employer B creates a leave type in Company B
    const createLeaveTypeBByOwnerRes = await apiRequest("/leave/types", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmpB}` },
      body: JSON.stringify({
        companyId: companyB.id,
        name: `Standard Leave ${timestamp}`,
        days_allowed: 14,
      }),
    });
    assert(createLeaveTypeBByOwnerRes.status === 201, "Employer B created leave type for Company B");
    const leaveTypeB = createLeaveTypeBByOwnerRes.data.data;

    const submitLeaveForBRes = await apiRequest("/leave/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({
        companyId: companyB.id,
        company_id: companyB.id,
        leave_type_id: leaveTypeB.id,
        start_date: "2026-10-01",
        end_date: "2026-10-03",
        reason: "Personal vacation",
      }),
    });
    assert(submitLeaveForBRes.status === 201, "MULTI-COMPANY PASS: User X successfully submitted own employee leave in Company B (201)");
    const leaveRequestB = submitLeaveForBRes.data.data;

    // User X tries to review/approve their own or anyone's leave in Company B -> FORBIDDEN (403)
    const reviewLeaveBByUserX = await apiRequest(`/leave/requests/${leaveRequestB.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenUserX}` },
      body: JSON.stringify({ companyId: companyB.id, review_note: "Trying to self-approve" }),
    });
    assert(reviewLeaveBByUserX.status === 403, "MULTI-COMPANY PASS: User X blocked from approving leave in Company B (403)");

    // ----------------------------------------------------
    // 6. Recruiter Role & Permissions Tests (Phase 18, 31)
    // ----------------------------------------------------
    console.log("\n--- 6. Testing Recruiter Capabilities & Boundaries (Phase 18, 31) ---");

    // Recruiter A creates job in Company A -> SUCCESS (201)
    const createJobRes = await apiRequest("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({
        company_id: companyA.id,
        title: `Senior Recruited Engineer ${timestamp}`,
        description: "Looking for top engineers",
        location: "Phnom Penh",
        employment_type: "FULL_TIME",
        experience_level: "MID",
        salary_min: 1500,
        salary_max: 3000,
      }),
    });
    assert(createJobRes.status === 201, "RECRUITER PASS: Recruiter A created job in Company A (201)");
    const jobA = createJobRes.data.data.job;

    // Recruiter A adds skills to Job A -> SUCCESS (201)
    const addSkillRes = await apiRequest(`/jobs/${jobA.id}/skills`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ skill_name: "PostgreSQL", is_required: true }),
    });
    assert(addSkillRes.status === 201, "RECRUITER PASS: Recruiter A added skill to Job A (201)");

    // Recruiter A updates Job A -> SUCCESS (200)
    const updateJobRes = await apiRequest(`/jobs/${jobA.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    assert(updateJobRes.status === 200, "RECRUITER PASS: Recruiter A published Job A (200)");

    // Recruiter A tries to create job in Company B -> FORBIDDEN (403)
    const recruiterInCompB = await apiRequest("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({
        company_id: companyB.id,
        title: "Malicious Job",
        description: "Attempting to create job in Company B unauthorized",
        location: "Remote",
        employment_type: "FULL_TIME",
        experience_level: "SENIOR",
      }),
    });
    assert(recruiterInCompB.status === 403, "SECURITY PASS: Recruiter A creating job in Company B blocked (403)");

    // Recruiter A tries to manage departments in Company A -> FORBIDDEN (403)
    const recruiterDeptRes = await apiRequest("/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ companyId: companyA.id, name: "HR Dept by Recruiter" }),
    });
    assert(recruiterDeptRes.status === 403, "SECURITY PASS: Recruiter A blocked from managing departments (403)");

    // Recruiter A tries to review leave requests in Company A -> FORBIDDEN (403)
    const recruiterLeaveReviewRes = await apiRequest(`/leave/company/${companyA.id}/requests`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    assert(recruiterLeaveReviewRes.status === 403, "SECURITY PASS: Recruiter A blocked from viewing leave requests (403)");

    // ----------------------------------------------------
    // 7. Applicant & Interview Pipeline with Recruiter
    // ----------------------------------------------------
    console.log("\n--- 7. Candidate Pipeline & Interview Execution by Recruiter ---");

    // Candidate applies for Job A
    const applyRes = await apiRequest(`/applications/jobs/${jobA.id}/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({ cover_letter: "Excited to join Acme Corp!" }),
    });
    assert(applyRes.status === 201, "Candidate applied to Job A (201)");
    const applicationA = applyRes.data.data.application;

    // Recruiter A views applicants for Job A -> SUCCESS (200)
    const viewAppsRes = await apiRequest(`/applications/job/${jobA.id}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    assert(viewAppsRes.status === 200, "RECRUITER PASS: Recruiter A viewed Job A applicants (200)");

    // Recruiter A updates application status to REVIEWING -> SUCCESS (200)
    const updateAppStatusRes = await apiRequest(`/applications/${applicationA.id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ status: "REVIEWING" }),
    });
    assert(updateAppStatusRes.status === 200, "RECRUITER PASS: Recruiter A advanced candidate status to REVIEWING (200)");

    // Recruiter A schedules interview -> SUCCESS (201)
    const scheduleRes = await apiRequest("/interviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({
        application_id: applicationA.id,
        scheduled_at: "2026-10-15T10:00:00.000Z",
        duration_minutes: 45,
        interview_type: "VIDEO",
        meeting_link: "https://meet.google.com/sakol-test-room",
      }),
    });
    assert(scheduleRes.status === 201, "RECRUITER PASS: Recruiter A scheduled interview (201)");
    const interviewA = scheduleRes.data.data.interview;


    // Recruiter A reschedules interview -> SUCCESS (200)
    const updateInterviewRes = await apiRequest(`/interviews/${interviewA.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ duration_minutes: 60 }),
    });
    assert(updateInterviewRes.status === 200, "RECRUITER PASS: Recruiter A updated interview duration (200)");

    // Recruiter A marks interview completed -> SUCCESS (200)
    const completeInterviewRes = await apiRequest(`/interviews/${interviewA.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ notes: "Strong technical background" }),
    });
    assert(completeInterviewRes.status === 200, "RECRUITER PASS: Recruiter A completed interview (200)");

    // ----------------------------------------------------
    // 8. Manager Role & Permissions Tests (Phase 20, 31)
    // ----------------------------------------------------
    console.log("\n--- 8. Testing Manager Capabilities & Boundaries (Phase 20, 31) ---");

    // Employee A submits leave request in Company A
    const empALeaveRes = await apiRequest("/leave/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
      body: JSON.stringify({
        company_id: companyA.id,
        leave_type_id: leaveTypeA.id,
        start_date: "2026-11-01",
        end_date: "2026-11-02",
        reason: "Family event",
      }),
    });
    assert(empALeaveRes.status === 201, "Employee A submitted leave request in Company A");
    const leaveReqA = empALeaveRes.data.data;

    // Manager A reviews Company A leave requests -> SUCCESS (200)
    const managerViewLeavesRes = await apiRequest(`/leave/company/${companyA.id}/requests`, {
      headers: { Authorization: `Bearer ${tokenManagerA}` },
    });
    assert(managerViewLeavesRes.status === 200, "MANAGER PASS: Manager A viewed company leave requests (200)");

    // Manager A approves Employee A leave -> SUCCESS (200)
    const managerApproveRes = await apiRequest(`/leave/requests/${leaveReqA.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenManagerA}` },
      body: JSON.stringify({ companyId: companyA.id, review_note: "Approved by Team Manager" }),
    });
    assert(managerApproveRes.status === 200, "MANAGER PASS: Manager A approved leave request (200)");

    // Manager A tries to create a job -> FORBIDDEN (403)
    const managerCreateJobRes = await apiRequest("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenManagerA}` },
      body: JSON.stringify({
        company_id: companyA.id,
        title: "Unauthorized Job",
        description: "Manager should not create jobs",
        location: "Phnom Penh",
        employment_type: "FULL_TIME",
        experience_level: "MID",
      }),
    });
    assert(managerCreateJobRes.status === 403, "SECURITY PASS: Manager A blocked from creating jobs (403)");

    // Manager A tries to manage departments -> FORBIDDEN (403)
    const managerDeptRes = await apiRequest("/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenManagerA}` },
      body: JSON.stringify({ companyId: companyA.id, name: "Manager Department" }),
    });
    assert(managerDeptRes.status === 403, "SECURITY PASS: Manager A blocked from managing departments (403)");

    // ----------------------------------------------------
    // 9. Regular Employee & Job Seeker Boundaries (Phase 32)
    // ----------------------------------------------------
    console.log("\n--- 9. Direct API Security Tests on Regular Employee & Seeker (Phase 32) ---");

    // Regular Employee tries POST /departments -> FORBIDDEN (403)
    const empDeptRes = await apiRequest("/departments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
      body: JSON.stringify({ companyId: companyA.id, name: "Employee Department" }),
    });
    assert(empDeptRes.status === 403, "SECURITY PASS: Plain Employee blocked from creating departments (403)");

    // Regular Employee tries POST /jobs -> FORBIDDEN (403)
    const empJobRes = await apiRequest("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
      body: JSON.stringify({
        company_id: companyA.id,
        title: "Employee Job",
        description: "None",
        location: "None",
        employment_type: "FULL_TIME",
        experience_level: "ENTRY",
      }),
    });
    assert(empJobRes.status === 403, "SECURITY PASS: Plain Employee blocked from creating jobs (403)");

    // Job Seeker tries POST /interviews -> FORBIDDEN (403)
    const seekerInterviewRes = await apiRequest("/interviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        application_id: applicationA.id,
        scheduled_at: "2026-10-20T10:00:00.000Z",
        duration_minutes: 30,
        interview_format: "PHONE",
      }),
    });
    assert(seekerInterviewRes.status === 403, "SECURITY PASS: Job Seeker blocked from scheduling interviews (403)");

    // ----------------------------------------------------
    // 10. Admin Governance & Safe Role Modification (Phase 14, 27, 28)
    // ----------------------------------------------------
    console.log("\n--- 10. Admin Role & Permission APIs & Safety Controls (Phase 14, 28) ---");

    // Admin views all roles
    const adminRolesRes = await apiRequest("/admin/roles", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminRolesRes.ok && adminRolesRes.data.data.roles.length >= 7, "Admin retrieved all roles with counts");

    // Admin views all permissions
    const adminPermsRes = await apiRequest("/admin/permissions", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminPermsRes.ok && adminPermsRes.data.data.permissions.length >= 20, "Admin retrieved grouped permissions");

    // Admin attempts to strip critical 'roles.manage' from ADMIN role -> REJECTED (400)
    const stripAdminPermRes = await apiRequest(`/admin/roles/${adminRole.id}/permissions`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ permission_names: ["company.view"] }),
    });
    assert(stripAdminPermRes.status === 400, "SAFETY PASS: Stripping critical management permissions from ADMIN rejected (400)");

    // Non-admin (Employer A) attempting to access /admin/roles -> FORBIDDEN (403)
    const employerAccessAdminRes = await apiRequest("/admin/roles", {
      headers: { Authorization: `Bearer ${tokenEmpA}` },
    });
    assert(employerAccessAdminRes.status === 403, "SECURITY PASS: Non-admin accessing admin role API blocked (403)");

    // ----------------------------------------------------
    // 11. Auth /me Payload Permissions & Company Roles
    // ----------------------------------------------------
    console.log("\n--- 11. Verifying Auth /me Payload (Phase 23) ---");
    const meRes = await apiRequest("/auth/me", {
      headers: { Authorization: `Bearer ${tokenUserX}` },
    });
    assert(meRes.ok, "GET /api/auth/me returned 200 for User X");
    const meData = meRes.data.data.user;
    assert(Array.isArray(meData.permissions), "User payload contains 'permissions' array");
    assert(Array.isArray(meData.companyRoles), "User payload contains 'companyRoles' array");
    assert(
      meData.companyRoles.some((cr) => cr.company_id === companyA.id && cr.role === "HR"),
      "User X /auth/me reflects HR role in Company A"
    );

    console.log("\n==================================================");
    console.log("ALL ADVANCED RBAC & PERMISSION TESTS PASSED 100%!");
    console.log("==================================================");
  } catch (error) {
    console.error("Test execution aborted due to error:", error);
    process.exit(1);
  }
}

runAdvancedRBACTests();
