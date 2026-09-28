// test_attendance_analytics_flow.js
require("dotenv").config();
const BASE_URL = "http://127.0.0.1:5000/api";
const {
  User,
  Role,
  UserRole,
  Company,
  EmploymentRecord,
  Attendance,
  Department,
  Position,
  WorkSchedule,
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
  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text().catch(() => "");
  }
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

async function runAttendanceAnalyticsTests() {
  console.log("==================================================");
  console.log("STARTING ATTENDANCE & SCHEDULE ANALYTICS TEST SUITE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  try {
    // 1. Setup Roles
    console.log("--- 1. Locating Core Roles ---");
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    assert(employerRole && employeeRole, "Required roles exist");

    // 2. Setup Actors
    console.log("\n--- 2. Setting Up Test Actors ---");
    const empAEmail = `att_analytics_empa_${timestamp}@test.com`;
    const [empA] = await User.findOrCreate({
      where: { email: empAEmail },
      defaults: { first_name: "Owner", last_name: "CompA", email: empAEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empA.id, role_id: employerRole.id } });

    const empBEmail = `att_analytics_empb_${timestamp}@test.com`;
    const [empB] = await User.findOrCreate({
      where: { email: empBEmail },
      defaults: { first_name: "Owner", last_name: "CompB", email: empBEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: empB.id, role_id: employerRole.id } });

    const workerEmail = `att_worker_${timestamp}@test.com`;
    const [worker] = await User.findOrCreate({
      where: { email: workerEmail },
      defaults: { first_name: "Test", last_name: "Worker", email: workerEmail, password_hash: passwordHash },
    });
    await UserRole.findOrCreate({ where: { user_id: worker.id, role_id: employeeRole.id } });

    // Login tokens
    const loginA = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: empAEmail, password: "Password123!" }),
    });
    assert(loginA.status === 200, "Employer A logged in");
    const tokenA = loginA.data.data.token;

    const loginB = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: empBEmail, password: "Password123!" }),
    });
    assert(loginB.status === 200, "Employer B logged in");
    const tokenB = loginB.data.data.token;

    const loginWorker = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: workerEmail, password: "Password123!" }),
    });
    assert(loginWorker.status === 200, "Worker logged in");
    const tokenWorker = loginWorker.data.data.token;

    // 3. Setup Company, Department, Schedules & Controlled Records
    console.log("\n--- 3. Setting Up Company Context & Data ---");
    const companyA = await Company.create({
      name: `Analytics Corp A ${timestamp}`,
      description: "Company A for Analytics",
      owner_id: empA.id,
    });
    const companyB = await Company.create({
      name: `Analytics Corp B ${timestamp}`,
      description: "Company B for Analytics",
      owner_id: empB.id,
    });

    const deptA = await Department.create({
      company_id: companyA.id,
      name: `Tech Dept ${timestamp}`,
      is_active: true,
    });

    const scheduleA1 = await WorkSchedule.create({
      company_id: companyA.id,
      name: `Morning Shift ${timestamp}`,
      start_time: "09:00",
      end_time: "17:00",
      grace_period_minutes: 15,
      expected_hours: 8.0,
      is_active: true,
    });

    const employmentA = await EmploymentRecord.create({
      user_id: worker.id,
      company_id: companyA.id,
      department_id: deptA.id,
      work_schedule_id: scheduleA1.id,
      status: "ACTIVE",
      start_date: "2026-09-01",
    });

    // Create controlled attendance records
    // Record 1: On-time completed shift (8.0 hours)
    await Attendance.create({
      user_id: worker.id,
      company_id: companyA.id,
      employment_record_id: employmentA.id,
      work_schedule_id: scheduleA1.id,
      check_in_time: new Date("2026-09-20T09:05:00Z"),
      check_in_lat: 13.7563,
      check_in_long: 100.5018,
      check_out_time: new Date("2026-09-20T17:05:00Z"),
      check_out_lat: 13.7563,
      check_out_long: 100.5018,
      is_late: false,
      late_minutes: 0,
      is_early_departure: false,
      early_departure_minutes: 0,
      actual_hours: 8.0,
      completion_percentage: 100,
      status: "ON_TIME",
    });

    // Record 2: Late arrival + Early departure (7.0 hours)
    await Attendance.create({
      user_id: worker.id,
      company_id: companyA.id,
      employment_record_id: employmentA.id,
      work_schedule_id: scheduleA1.id,
      check_in_time: new Date("2026-09-21T09:30:00Z"),
      check_in_lat: 13.7563,
      check_in_long: 100.5018,
      check_out_time: new Date("2026-09-21T16:30:00Z"),
      check_out_lat: 13.7563,
      check_out_long: 100.5018,
      is_late: true,
      late_minutes: 15, // 30 - 15 grace = 15 late
      is_early_departure: true,
      early_departure_minutes: 30,
      actual_hours: 7.0,
      completion_percentage: 88,
      status: "LATE_AND_EARLY_DEPARTURE",
    });

    // Record 3: In progress shift
    await Attendance.create({
      user_id: worker.id,
      company_id: companyA.id,
      employment_record_id: employmentA.id,
      work_schedule_id: scheduleA1.id,
      check_in_time: new Date("2026-09-22T09:00:00Z"),
      check_in_lat: 13.7563,
      check_in_long: 100.5018,
      check_out_time: null,
      is_late: false,
      late_minutes: 0,
      is_early_departure: false,
      early_departure_minutes: 0,
      actual_hours: null,
      completion_percentage: 0,
      status: "IN_PROGRESS",
    });

    console.log("✓ Test records prepared successfully");

    // 4. Test Attendance Analytics Overview API
    console.log("\n--- 4. Testing Attendance Analytics Overview ---");
    const analyticsRes = await apiRequest(`/analytics/company/${companyA.id}/attendance?from=2026-09-01&to=2026-09-30`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(analyticsRes.status === 200, "GET /api/analytics/company/:companyId/attendance returned 200");
    const analytics = analyticsRes.data.data;

    // Check KPIs
    assert(analytics.kpis.totalLogs === 3, `KPI totalLogs === 3 (actual: ${analytics.kpis.totalLogs})`);
    assert(analytics.kpis.completedShifts === 2, `KPI completedShifts === 2 (actual: ${analytics.kpis.completedShifts})`);
    assert(analytics.kpis.inProgressShifts === 1, `KPI inProgressShifts === 1 (actual: ${analytics.kpis.inProgressShifts})`);
    assert(analytics.kpis.onTimeCheckIns === 2, `KPI onTimeCheckIns === 2 (actual: ${analytics.kpis.onTimeCheckIns})`);
    assert(analytics.kpis.lateArrivals === 1, `KPI lateArrivals === 1 (actual: ${analytics.kpis.lateArrivals})`);
    assert(analytics.kpis.earlyDepartures === 1, `KPI earlyDepartures === 1 (actual: ${analytics.kpis.earlyDepartures})`);
    assert(analytics.kpis.lateAndEarlyDepartures === 1, `KPI lateAndEarlyDepartures === 1 (actual: ${analytics.kpis.lateAndEarlyDepartures})`);
    assert(analytics.kpis.avgWorkedHours > 0, `KPI avgWorkedHours > 0 (actual: ${analytics.kpis.avgWorkedHours})`);
    assert(analytics.kpis.avgExpectedHours === 8.0, `KPI avgExpectedHours === 8.0 (actual: ${analytics.kpis.avgExpectedHours})`);

    // Check Compliance
    assert(analytics.compliance.onTimeRate > 0, `Compliance onTimeRate > 0 (actual: ${analytics.compliance.onTimeRate})`);
    assert(analytics.compliance.lateRate > 0, `Compliance lateRate > 0 (actual: ${analytics.compliance.lateRate})`);
    assert(analytics.compliance.earlyDepartureRate > 0, `Compliance earlyDepartureRate > 0 (actual: ${analytics.compliance.earlyDepartureRate})`);
    assert(analytics.compliance.avgLateMinutes === 15, `Compliance avgLateMinutes === 15 (actual: ${analytics.compliance.avgLateMinutes})`);
    assert(analytics.compliance.avgEarlyDepartureMinutes === 30, `Compliance avgEarlyDepartureMinutes === 30 (actual: ${analytics.compliance.avgEarlyDepartureMinutes})`);

    // Check Trends
    assert(Array.isArray(analytics.trends), "Analytics trends is an array");
    assert(analytics.trends.length >= 3, `Trends has >= 3 days (actual: ${analytics.trends.length})`);
    const day1 = analytics.trends.find((t) => t.date === "2026-09-20");
    assert(day1 && day1.onTime === 1, "Day 2026-09-20 onTime === 1");

    // Check Department Breakdown
    assert(Array.isArray(analytics.departments), "Analytics departments is an array");
    const techDept = analytics.departments.find((d) => d.departmentName.includes("Tech Dept"));
    assert(techDept, "Department breakdown contains Tech Dept");
    assert(techDept.attendanceCount === 3, "Tech Dept attendanceCount === 3");

    // Check Schedule Breakdown
    assert(Array.isArray(analytics.schedules), "Analytics schedules is an array");
    const morningSched = analytics.schedules.find((s) => s.scheduleName.includes("Morning Shift"));
    assert(morningSched, "Schedule breakdown contains Morning Shift");
    assert(morningSched.attendanceCount === 3, "Morning Shift attendanceCount === 3");
    assert(morningSched.assignedEmployeesCount === 1, "Morning Shift assignedEmployeesCount === 1");

    // 5. Test Filters (Status & Date)
    console.log("\n--- 5. Testing Filters on Attendance Analytics ---");
    const filteredRes = await apiRequest(`/analytics/company/${companyA.id}/attendance?from=2026-09-01&to=2026-09-30&status=LATE_AND_EARLY_DEPARTURE`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(filteredRes.status === 200, "Filtered analytics returned 200");
    assert(filteredRes.data.data.kpis.totalLogs === 1, "Filtered analytics returns exactly 1 log");

    // 6. Test CSV Export
    console.log("\n--- 6. Testing CSV Report Export ---");
    const exportRes = await apiRequest(`/analytics/company/${companyA.id}/attendance/export?from=2026-09-01&to=2026-09-30`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(exportRes.status === 200, "Export returned 200");
    const contentType = exportRes.headers.get("content-type") || "";
    assert(contentType.includes("text/csv"), `Export content-type is text/csv (actual: ${contentType})`);
    const csv = typeof exportRes.data === "string" ? exportRes.data : "";
    assert(csv.includes("Employee,Email,Department,Work Schedule"), "CSV contains standard headers");
    assert(csv.includes(worker.first_name) && csv.includes("Morning Shift"), "CSV contains employee and schedule data");

    // 7. Test Tenant Isolation & Security Boundaries
    console.log("\n--- 7. Testing Tenant Isolation & Security Boundaries ---");
    // Employer B attempting to access Company A analytics
    const crossAccessRes = await apiRequest(`/analytics/company/${companyA.id}/attendance`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossAccessRes.status === 403, "TENANT PASS: Employer B blocked from Company A attendance analytics (403)");

    // Employer B attempting to export Company A attendance
    const crossExportRes = await apiRequest(`/analytics/company/${companyA.id}/attendance/export`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossExportRes.status === 403, "TENANT PASS: Employer B blocked from exporting Company A attendance (403)");

    // Employee attempting to access company attendance analytics
    const workerAccessRes = await apiRequest(`/analytics/company/${companyA.id}/attendance`, {
      headers: { Authorization: `Bearer ${tokenWorker}` },
    });
    assert(workerAccessRes.status === 403, "SECURITY PASS: Employee blocked from employer attendance analytics (403)");

    // Unauthenticated request
    const unauthRes = await apiRequest(`/analytics/company/${companyA.id}/attendance`);
    assert(unauthRes.status === 401, "SECURITY PASS: Unauthenticated request rejected (401)");

    // Invalid UUID
    const invalidUuidRes = await apiRequest("/analytics/company/not-a-valid-uuid/attendance", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(invalidUuidRes.status === 400, "VALIDATION PASS: Invalid company UUID rejected (400)");

    console.log("\n==================================================");
    console.log("ALL ATTENDANCE ANALYTICS TESTS PASSED 100%!");
    console.log("==================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runAttendanceAnalyticsTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
