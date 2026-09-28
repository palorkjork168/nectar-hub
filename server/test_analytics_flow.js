// test_analytics_flow.js
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
  Attendance,
  Department,
  Position,
  LeaveType,
  LeaveRequest,
  CompanyUserRole,
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

async function runAnalyticsTestSuite() {
  console.log("==================================================");
  console.log("STARTING ANALYTICS & REPORTING VERIFICATION SUITE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  try {
    // 1. Roles Setup
    console.log("--- 1. Locating Core Roles ---");
    const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    const hrRole = await Role.findOne({ where: { name: "HR" } });

    assert(adminRole && employerRole && employeeRole && hrRole, "All required roles exist");

    // 2. Setup Actors
    console.log("\n--- 2. Setting Up Test Actors ---");
    // Admin
    const adminEmail = `analytics_admin_${timestamp}@test.com`;
    const [adminUser] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: { first_name: "Admin", last_name: "Tester", email: adminEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: adminUser.id, role_id: adminRole.id } });

    // Employer A (Owner of Company A)
    const empAEmail = `analytics_empa_${timestamp}@test.com`;
    const [empA] = await User.findOrCreate({
      where: { email: empAEmail },
      defaults: { first_name: "Owner", last_name: "CompanyA", email: empAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empA.id, role_id: employerRole.id } });

    // Employer B (Owner of Company B)
    const empBEmail = `analytics_empb_${timestamp}@test.com`;
    const [empB] = await User.findOrCreate({
      where: { email: empBEmail },
      defaults: { first_name: "Owner", last_name: "CompanyB", email: empBEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empB.id, role_id: employerRole.id } });

    // Candidate 1 (will be hired)
    const cand1Email = `cand1_${timestamp}@test.com`;
    const [cand1] = await User.findOrCreate({
      where: { email: cand1Email },
      defaults: { first_name: "Hired", last_name: "Candidate", email: cand1Email, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: cand1.id, role_id: employeeRole.id } });

    // Candidate 2 (accepted, NOT hired)
    const cand2Email = `cand2_${timestamp}@test.com`;
    const [cand2] = await User.findOrCreate({
      where: { email: cand2Email },
      defaults: { first_name: "Accepted", last_name: "Only", email: cand2Email, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: cand2.id, role_id: employeeRole.id } });

    // Candidate 3 (interview stage)
    const cand3Email = `cand3_${timestamp}@test.com`;
    const [cand3] = await User.findOrCreate({
      where: { email: cand3Email },
      defaults: { first_name: "Interview", last_name: "Candidate", email: cand3Email, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: cand3.id, role_id: employeeRole.id } });

    // Candidate 4 (reviewing stage)
    const cand4Email = `cand4_${timestamp}@test.com`;
    const [cand4] = await User.findOrCreate({
      where: { email: cand4Email },
      defaults: { first_name: "Reviewing", last_name: "Candidate", email: cand4Email, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: cand4.id, role_id: employeeRole.id } });

    // Candidate 5 (pending stage)
    const cand5Email = `cand5_${timestamp}@test.com`;
    const [cand5] = await User.findOrCreate({
      where: { email: cand5Email },
      defaults: { first_name: "Pending", last_name: "Candidate", email: cand5Email, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: cand5.id, role_id: employeeRole.id } });

    // Login function
    async function login(email) {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Password123!" }),
      });
      assert(res.ok, `Logged in successfully: ${email}`);
      return res.data.data.token;
    }

    const tokenAdmin = await login(adminEmail);
    const tokenEmpA = await login(empAEmail);
    const tokenEmpB = await login(empBEmail);
    const tokenCand1 = await login(cand1Email);

    // 3. Create Controlled Test Companies
    console.log("\n--- 3. Creating Test Companies & Departments ---");
    const companyA = await Company.create({
      name: `Alpha Corp Analytics ${timestamp}`,
      description: "Company A test bed",
      owner_id: empA.id,
      status: "ACTIVE",
    });

    const companyB = await Company.create({
      name: `Beta Corp Analytics ${timestamp}`,
      description: "Company B test bed",
      owner_id: empB.id,
      status: "ACTIVE",
    });

    // Create Departments and Positions for Company A
    const deptEngineering = await Department.create({
      name: `Engineering ${timestamp}`,
      company_id: companyA.id,
    });
    const deptHR = await Department.create({
      name: `Human Resources ${timestamp}`,
      company_id: companyA.id,
    });

    const posFrontend = await Position.create({
      title: `Frontend Engineer ${timestamp}`,
      department_id: deptEngineering.id,
      company_id: companyA.id,
    });
    const posHRAssociate = await Position.create({
      title: `HR Associate ${timestamp}`,
      department_id: deptHR.id,
      company_id: companyA.id,
    });

    // 4. Create Jobs & Applications (Controlled Funnel Numbers)
    console.log("\n--- 4. Creating Jobs & Controlled Applications Funnel ---");
    const jobA1 = await Job.create({
      title: `Frontend Developer ${timestamp}`,
      description: "Develop modern web apps",
      company_id: companyA.id,
      status: "PUBLISHED",
      location: "Phnom Penh",
      employment_type: "FULL_TIME",
    });

    const jobA2 = await Job.create({
      title: `DevOps Specialist ${timestamp}`,
      description: "Manage cloud infrastructure",
      company_id: companyA.id,
      status: "PUBLISHED",
      location: "Remote",
      employment_type: "FULL_TIME",
    });

    // 5 Applications for Job A1:
    // app1: ACCEPTED -> Hired (cand1)
    const app1 = await Application.create({
      job_id: jobA1.id,
      user_id: cand1.id,
      status: "ACCEPTED",
    });
    // app2: ACCEPTED -> NOT Hired (cand2)
    const app2 = await Application.create({
      job_id: jobA1.id,
      user_id: cand2.id,
      status: "ACCEPTED",
    });
    // app3: INTERVIEW (cand3)
    const app3 = await Application.create({
      job_id: jobA1.id,
      user_id: cand3.id,
      status: "INTERVIEW",
    });
    await Interview.create({
      application_id: app3.id,
      created_by: empA.id,
      scheduled_at: new Date(Date.now() + 86400000),
      duration_minutes: 45,
      status: "SCHEDULED",
    });
    // app4: REVIEWING (cand4)
    const app4 = await Application.create({
      job_id: jobA1.id,
      user_id: cand4.id,
      status: "REVIEWING",
    });
    // app5: PENDING (cand5)
    const app5 = await Application.create({
      job_id: jobA1.id,
      user_id: cand5.id,
      status: "PENDING",
    });

    // Convert cand1 to Employee (EmploymentRecord in Company A)
    const empRecord1 = await EmploymentRecord.create({
      user_id: cand1.id,
      company_id: companyA.id,
      department_id: deptEngineering.id,
      position_id: posFrontend.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // Add another active employee in Company A (HR)
    const empRecord2 = await EmploymentRecord.create({
      user_id: cand4.id,
      company_id: companyA.id,
      department_id: deptHR.id,
      position_id: posHRAssociate.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // 5. Create Controlled Attendance Sessions
    console.log("\n--- 5. Setting Up Controlled Attendance Records ---");
    // Session 1 for cand1: 8 hours (08:00 to 16:00 today)
    const today = new Date();
    const session1In = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0);
    const session1Out = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0);
    await Attendance.create({
      user_id: cand1.id,
      company_id: companyA.id,
      employment_record_id: empRecord1.id,
      check_in_time: session1In,
      check_out_time: session1Out,
      check_in_lat: 11.5564,
      check_in_long: 104.9282,
    });

    // Session 2 for cand4: 4 hours (09:00 to 13:00 today)
    const session2In = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
    const session2Out = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0);
    await Attendance.create({
      user_id: cand4.id,
      company_id: companyA.id,
      employment_record_id: empRecord2.id,
      check_in_time: session2In,
      check_out_time: session2Out,
      check_in_lat: 11.5564,
      check_in_long: 104.9282,
    });

    // Total completed hours = 8 + 4 = 12.0 hours.
    // Average session = 12.0 / 2 = 6.0 hours.

    // 6. Create Controlled Leave Records
    console.log("\n--- 6. Setting Up Controlled Leave Requests ---");
    const annualLeaveType = await LeaveType.create({
      company_id: companyA.id,
      name: `Annual Leave ${timestamp}`,
      default_days: 18,
      is_paid: true,
      is_active: true,
    });

    // Approved request: 3 days (e.g. tomorrow to 2 days after)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    await LeaveRequest.create({
      company_id: companyA.id,
      user_id: cand1.id,
      leave_type_id: annualLeaveType.id,
      start_date: tomorrow,
      end_date: threeDaysLater,
      reason: "Family vacation",
      status: "APPROVED",
    });

    // Pending request: 1 day
    await LeaveRequest.create({
      company_id: companyA.id,
      user_id: cand4.id,
      leave_type_id: annualLeaveType.id,
      start_date: tomorrow,
      end_date: tomorrow,
      reason: "Personal appointment",
      status: "PENDING",
    });

    // ----------------------------------------------------
    // TEST SECTION A: Admin Platform Overview
    // ----------------------------------------------------
    console.log("\n--- TEST SECTION A: Admin Platform Overview ---");
    const adminOverviewRes = await apiRequest("/analytics/admin/overview", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminOverviewRes.status === 200, "Admin overview returns 200");
    const adminData = adminOverviewRes.data.data;
    assert(adminData.overview.totalUsers >= 6, `Admin reports totalUsers >= 6 (actual: ${adminData.overview.totalUsers})`);
    assert(adminData.overview.totalCompanies >= 2, `Admin reports totalCompanies >= 2 (actual: ${adminData.overview.totalCompanies})`);
    assert(adminData.overview.totalApplications >= 5, `Admin reports totalApplications >= 5 (actual: ${adminData.overview.totalApplications})`);
    assert(adminData.overview.activeEmployees >= 2, `Admin reports activeEmployees >= 2 (actual: ${adminData.overview.activeEmployees})`);
    assert(Array.isArray(adminData.distributions.usersByRole), "Distributions: usersByRole is array");
    assert(Array.isArray(adminData.distributions.jobsByStatus), "Distributions: jobsByStatus is array");
    assert(Array.isArray(adminData.distributions.applicationsByStatus), "Distributions: applicationsByStatus is array");
    assert(Array.isArray(adminData.trends.applicationsSubmitted), "Trends: applicationsSubmitted is array");

    // Test Admin date filtering
    const pastFrom = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const adminFilteredRes = await apiRequest(`/analytics/admin/overview?from=${pastFrom}&to=${todayStr}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminFilteredRes.status === 200, "Admin overview with date filter returns 200");
    assert(adminFilteredRes.data.data.range.from === pastFrom, `Date range 'from' correctly preserved: ${pastFrom}`);
    assert(adminFilteredRes.data.data.range.to === todayStr, `Date range 'to' correctly preserved: ${todayStr}`);

    // ----------------------------------------------------
    // TEST SECTION B: Employer Company Analytics & Accuracy
    // ----------------------------------------------------
    console.log("\n--- TEST SECTION B: Company A Analytics & Data Accuracy ---");
    const compARes = await apiRequest(`/analytics/company/${companyA.id}/overview`, {
      headers: { Authorization: `Bearer ${tokenEmpA}` },
    });
    assert(compARes.status === 200, "Employer A overview returns 200");
    const compAData = compARes.data.data;

    // Verify Headcount & Structures
    assert(compAData.overview.headcount === 2, `Headcount is exactly 2 (actual: ${compAData.overview.headcount})`);
    assert(compAData.overview.departments === 2, `Departments count is exactly 2 (actual: ${compAData.overview.departments})`);
    assert(compAData.overview.positions === 2, `Positions count is exactly 2 (actual: ${compAData.overview.positions})`);
    assert(compAData.overview.jobsTotal === 2, `Total jobs is exactly 2 (actual: ${compAData.overview.jobsTotal})`);
    assert(compAData.overview.jobsPublished === 2, `Published jobs is exactly 2 (actual: ${compAData.overview.jobsPublished})`);

    // Verify Recruitment Funnel numbers
    console.log("Verifying Recruitment Funnel metrics:");
    console.log("Funnel:", JSON.stringify(compAData.funnel, null, 2));
    assert(compAData.funnel.applications === 5, `Funnel applications = 5 (actual: ${compAData.funnel.applications})`);
    // Reviewing includes: REVIEWING (1) + INTERVIEW (1) + ACCEPTED (2) = 4
    assert(compAData.funnel.reviewing === 4, `Funnel reviewing = 4 (actual: ${compAData.funnel.reviewing})`);
    // Interview includes app3 (scheduled interview) + app1, app2 accepted = 3
    assert(compAData.funnel.interview >= 1, `Funnel interview count >= 1 (actual: ${compAData.funnel.interview})`);
    // Accepted = 2 (cand1 and cand2)
    assert(compAData.funnel.accepted === 2, `Funnel accepted = 2 (actual: ${compAData.funnel.accepted})`);
    // Hired = 1 (cand1 has active EmploymentRecord in Company A; cand2 is NOT hired)
    assert(compAData.funnel.hired === 1, `Funnel hired = 1 (actual: ${compAData.funnel.hired})`);
    // Conversion rates
    assert(compAData.funnel.conversionRates.applicationToReviewRate === 80.0, `App->Review conversion rate is 80.0% (actual: ${compAData.funnel.conversionRates.applicationToReviewRate})`);
    assert(compAData.funnel.conversionRates.acceptedToHireRate === 50.0, `Accepted->Hire conversion rate is 50.0% (actual: ${compAData.funnel.conversionRates.acceptedToHireRate})`);
    assert(compAData.funnel.conversionRates.overallConversionRate === 20.0, `Overall conversion rate is 20.0% (actual: ${compAData.funnel.conversionRates.overallConversionRate})`);

    // Verify Attendance Aggregates
    console.log("Verifying Attendance Aggregates:");
    console.log("Attendance:", JSON.stringify(compAData.attendance, null, 2));
    assert(compAData.attendance.completedSessions === 2, `Completed sessions = 2 (actual: ${compAData.attendance.completedSessions})`);
    assert(compAData.attendance.totalHoursCompleted === 12.0, `Total hours completed = 12.0 (actual: ${compAData.attendance.totalHoursCompleted})`);
    assert(compAData.attendance.avgSessionDurationHours === 6.0, `Average session duration = 6.0 hours (actual: ${compAData.attendance.avgSessionDurationHours})`);
    assert(compAData.attendance.checkedInToday === 2, `Checked in today = 2 (actual: ${compAData.attendance.checkedInToday})`);
    assert(compAData.attendance.unsupportedMetricsNotice.includes("Lateness rate"), "Explicit unsupported metrics notice is returned");

    // Verify Leave Aggregates
    console.log("Verifying Leave Aggregates:");
    console.log("Leave:", JSON.stringify(compAData.leave, null, 2));
    assert(compAData.leave.summary.approved === 1, `Leave summary approved = 1 (actual: ${compAData.leave.summary.approved})`);
    assert(compAData.leave.summary.pending === 1, `Leave summary pending = 1 (actual: ${compAData.leave.summary.pending})`);
    // Approved leave days: start to start+2 days -> Math.ceil(2 days) + 1 = 3 days
    assert(compAData.leave.approvedLeaveDays === 3, `Approved leave days = 3 (actual: ${compAData.leave.approvedLeaveDays})`);

    // Verify Workforce Breakdown
    assert(compAData.workforce.byDepartment.length === 2, "Workforce has 2 departments");
    assert(compAData.workforce.byPosition.length === 2, "Workforce has 2 positions");

    // ----------------------------------------------------
    // TEST SECTION C: Company Isolation & Security
    // ----------------------------------------------------
    console.log("\n--- TEST SECTION C: Company Isolation & Security Checks ---");
    // Employer B attempting to access Company A analytics -> 403 Forbidden
    const compBUnauthorizedRes = await apiRequest(`/analytics/company/${companyA.id}/overview`, {
      headers: { Authorization: `Bearer ${tokenEmpB}` },
    });
    assert(compBUnauthorizedRes.status === 403, `Cross-company access blocked with 403 Forbidden (status: ${compBUnauthorizedRes.status})`);

    // Employee attempting to access Company A analytics -> 403 Forbidden
    const employeeCompRes = await apiRequest(`/analytics/company/${companyA.id}/overview`, {
      headers: { Authorization: `Bearer ${tokenCand1}` },
    });
    assert(employeeCompRes.status === 403, `Employee blocked from company analytics with 403 Forbidden (status: ${employeeCompRes.status})`);

    // Employee attempting to access Admin analytics -> 403 Forbidden
    const employeeAdminRes = await apiRequest("/analytics/admin/overview", {
      headers: { Authorization: `Bearer ${tokenCand1}` },
    });
    assert(employeeAdminRes.status === 403, `Employee blocked from admin analytics with 403 Forbidden (status: ${employeeAdminRes.status})`);

    // Unauthenticated request -> 401 Unauthorized
    const unauthRes = await apiRequest(`/analytics/company/${companyA.id}/overview`);
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 Unauthorized (status: ${unauthRes.status})`);

    // Invalid UUID -> 400 Bad Request
    const invalidUuidRes = await apiRequest("/analytics/company/not-a-valid-uuid/overview", {
      headers: { Authorization: `Bearer ${tokenEmpA}` },
    });
    assert(invalidUuidRes.status === 400, `Invalid UUID returned 400 Bad Request (status: ${invalidUuidRes.status})`);

    // ----------------------------------------------------
    // TEST SECTION D: Employee Personal Analytics
    // ----------------------------------------------------
    console.log("\n--- TEST SECTION D: Employee Personal Analytics ---");
    const cand1PersonalRes = await apiRequest("/analytics/me/overview", {
      headers: { Authorization: `Bearer ${tokenCand1}` },
    });
    assert(cand1PersonalRes.status === 200, "Employee personal analytics returns 200");
    const cand1Data = cand1PersonalRes.data.data;
    assert(cand1Data.employment !== null, "Employee has employment details attached");
    assert(cand1Data.employment.companyName === companyA.name, `Company name matches: ${companyA.name}`);
    assert(cand1Data.attendance.thisMonthSessions >= 1, `Attendance sessions this month >= 1 (actual: ${cand1Data.attendance.thisMonthSessions})`);
    assert(cand1Data.attendance.completedHoursThisMonth >= 8.0, `Completed hours this month >= 8.0 (actual: ${cand1Data.attendance.completedHoursThisMonth})`);
    assert(cand1Data.leave.approvedRequestsThisYear === 1, `Approved leave requests this year = 1 (actual: ${cand1Data.leave.approvedRequestsThisYear})`);
    assert(cand1Data.leave.approvedDaysThisYear === 3, `Approved leave days this year = 3 (actual: ${cand1Data.leave.approvedDaysThisYear})`);

    console.log("\n==================================================");
    console.log("ALL ANALYTICS TESTS PASSED WITH 100% ACCURACY!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SUITE FAILED WITH ERROR:", error);
    process.exit(1);
  }
}

runAnalyticsTestSuite();
