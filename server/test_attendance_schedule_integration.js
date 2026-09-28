// test_attendance_schedule_integration.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
  User,
  Role,
  UserRole,
  Company,
  EmploymentRecord,
  WorkSchedule,
  Attendance,
  CompanyUserRole,
} = require("./src/models");
const attendanceScheduleService = require("./src/services/attendanceSchedule.service");

const BASE_URL = "http://127.0.0.1:5000/api";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

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

(async () => {
  console.log("==================================================");
  console.log("TESTING ATTENDANCE & WORK SCHEDULE INTELLIGENCE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // ----------------------------------------------------
    // SECTION 1: Pure Calculation Logic Unit Verification
    // ----------------------------------------------------
    console.log("--- 1. Testing Deterministic Time Calculations ---");
    const today = new Date("2026-09-28T00:00:00.000Z");

    // Case 1: On-time check-in (09:00:00 for 09:00 start)
    const t0900 = new Date(today);
    t0900.setHours(9, 0, 0, 0);
    const onTime = attendanceScheduleService.calculateLateMinutes(t0900, "09:00", 15);
    assert(onTime.isLate === false && onTime.lateMinutes === 0, "09:00 check-in is on time (late: 0)");

    // Case 2: Within grace period (09:10:00 with 15m grace)
    const t0910 = new Date(today);
    t0910.setHours(9, 10, 0, 0);
    const withinGrace = attendanceScheduleService.calculateLateMinutes(t0910, "09:00", 15);
    assert(withinGrace.isLate === false && withinGrace.lateMinutes === 0, "09:10 check-in inside grace period is not late (late: 0)");

    // Case 3: Late check-in past grace period (09:18:00 with 15m grace -> 3 min late)
    const t0918 = new Date(today);
    t0918.setHours(9, 18, 0, 0);
    const late3Min = attendanceScheduleService.calculateLateMinutes(t0918, "09:00", 15);
    assert(late3Min.isLate === true && late3Min.lateMinutes === 3, "09:18 check-in with 15m grace results in 3 late minutes (09:18 - 09:15 = 3)");

    // Case 4: Early departure (16:40:00 check-out for 17:00 end -> 20 min early)
    const t1640 = new Date(today);
    t1640.setHours(16, 40, 0, 0);
    const early20Min = attendanceScheduleService.calculateEarlyDeparture(t1640, "17:00", "09:00");
    assert(early20Min.isEarlyDeparture === true && early20Min.earlyDepartureMinutes === 20, "16:40 check-out for 17:00 end results in 20 early departure minutes");

    // Case 5: Normal on-time departure (17:00:00 for 17:00 end)
    const t1700 = new Date(today);
    t1700.setHours(17, 0, 0, 0);
    const onTimeDep = attendanceScheduleService.calculateEarlyDeparture(t1700, "17:00", "09:00");
    assert(onTimeDep.isEarlyDeparture === false && onTimeDep.earlyDepartureMinutes === 0, "17:00 check-out for 17:00 end is not an early departure (early: 0)");

    // Case 6: Worked hours calculation (09:10 to 17:05 -> 7.92 hours)
    const t1705 = new Date(today);
    t1705.setHours(17, 5, 0, 0);
    const workedHours = attendanceScheduleService.calculateWorkedHours(t0910, t1705);
    assert(workedHours === 7.92, `Worked hours calculated accurately: ${workedHours}h`);

    // Case 7: Completion percentage (4.00h of 8.00h expected -> 50%)
    const pct50 = attendanceScheduleService.calculateCompletionPercentage(4.00, 8.00);
    assert(pct50 === 50, "Completion percentage for 4h / 8h is 50%");

    // Case 8: Completion percentage capped at 100% (9.00h worked of 8.00h expected -> 100%)
    const pctCapped = attendanceScheduleService.calculateCompletionPercentage(9.00, 8.00);
    assert(pctCapped === 100, "Completion percentage is capped at 100%");

    // Case 9: Deterministic status states
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: false, hasSchedule: true }) === "IN_PROGRESS",
      "Open shift status is IN_PROGRESS"
    );
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: true, hasSchedule: false }) === "COMPLETED",
      "Shift without schedule is COMPLETED"
    );
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: true, hasSchedule: true, isLate: false, isEarlyDeparture: false }) === "ON_TIME",
      "Completed shift with no lateness and no early departure is ON_TIME"
    );
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: true, hasSchedule: true, isLate: true, isEarlyDeparture: false }) === "LATE",
      "Completed shift with lateness only is LATE"
    );
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: true, hasSchedule: true, isLate: false, isEarlyDeparture: true }) === "EARLY_DEPARTURE",
      "Completed shift with early departure only is EARLY_DEPARTURE"
    );
    assert(
      attendanceScheduleService.determineAttendanceStatus({ isCompleted: true, hasSchedule: true, isLate: true, isEarlyDeparture: true }) === "LATE_AND_EARLY_DEPARTURE",
      "Completed shift with both is LATE_AND_EARLY_DEPARTURE"
    );

    // ----------------------------------------------------
    // SECTION 2: Live API & Database E2E Verification
    // ----------------------------------------------------
    console.log("\n--- 2. Setting up Test Actors, Companies & Schedules ---");
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const hrRole = await Role.findOne({ where: { name: "HR" } });

    // Company A & B owners
    const ownerA = await User.create({
      first_name: "OwnerA",
      last_name: "ShiftTest",
      email: `att_ownera_${timestamp}@test.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerA.id, role_id: employerRole.id });

    const ownerB = await User.create({
      first_name: "OwnerB",
      last_name: "ShiftTest",
      email: `att_ownerb_${timestamp}@test.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerB.id, role_id: employerRole.id });

    // Employees
    const workerA1 = await User.create({
      first_name: "WorkerA1",
      last_name: "Scheduled",
      email: `att_workera1_${timestamp}@test.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: workerA1.id, role_id: employeeRole.id });

    const workerA2 = await User.create({
      first_name: "WorkerA2",
      last_name: "NoSchedule",
      email: `att_workera2_${timestamp}@test.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: workerA2.id, role_id: employeeRole.id });

    const workerB1 = await User.create({
      first_name: "WorkerB1",
      last_name: "CompanyB",
      email: `att_workerb1_${timestamp}@test.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: workerB1.id, role_id: employeeRole.id });

    // Logins
    const [loginOwnerA, loginOwnerB, loginA1, loginA2] = await Promise.all([
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email: ownerA.email, password }) }),
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email: ownerB.email, password }) }),
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email: workerA1.email, password }) }),
      apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email: workerA2.email, password }) }),
    ]);

    const tokenOwnerA = loginOwnerA.data.data.token;
    const tokenOwnerB = loginOwnerB.data.data.token;
    const tokenA1 = loginA1.data.data.token;
    const tokenA2 = loginA2.data.data.token;

    // Companies
    const companyA = await Company.create({ owner_id: ownerA.id, name: `Company A ${timestamp}` });
    const companyB = await Company.create({ owner_id: ownerB.id, name: `Company B ${timestamp}` });

    // Schedules
    const scheduleA1 = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Schedule A1 (00:01 - 08:01)",
      start_time: "00:01",
      end_time: "08:01",
      grace_period_minutes: 5,
      expected_hours: 8.00,
      is_active: true,
    });

    const scheduleA2 = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Schedule A2 (23:59 - 06:00)",
      start_time: "23:59",
      end_time: "06:00",
      grace_period_minutes: 15,
      expected_hours: 6.00,
      is_active: true,
    });

    // Employments
    const empRecordA1 = await EmploymentRecord.create({
      user_id: workerA1.id,
      company_id: companyA.id,
      work_schedule_id: scheduleA1.id,
      status: "ACTIVE",
    });

    const empRecordA2 = await EmploymentRecord.create({
      user_id: workerA2.id,
      company_id: companyA.id,
      work_schedule_id: null, // No schedule
      status: "ACTIVE",
    });

    const empRecordB1 = await EmploymentRecord.create({
      user_id: workerB1.id,
      company_id: companyB.id,
      status: "ACTIVE",
    });

    // ----------------------------------------------------
    // SECTION 3: Live Check-In With Schedule & Status
    // ----------------------------------------------------
    console.log("\n--- 3. Testing Check-In With Schedule & Status ---");
    const checkInResA1 = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(checkInResA1.status === 201, "Worker A1 check-in succeeded (201 Created)");
    const attA1 = await Attendance.findByPk(checkInResA1.data.data.attendance.id);
    assert(attA1.work_schedule_id === scheduleA1.id, "Attendance record references Schedule A1");
    assert(attA1.status === "IN_PROGRESS", "Initial attendance status is IN_PROGRESS");
    assert(attA1.is_late === true, "Lateness correctly detected for 00:01 shift");
    assert(attA1.late_minutes > 0, `Late minutes computed: ${attA1.late_minutes}`);

    // Fallback check-in (no schedule)
    const checkInResA2 = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA2}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(checkInResA2.status === 201, "Worker A2 (no schedule) check-in succeeded (201 Created)");
    const attA2 = await Attendance.findByPk(checkInResA2.data.data.attendance.id);
    assert(attA2.work_schedule_id === null, "Fallback worker has null work_schedule_id");
    assert(attA2.status === "IN_PROGRESS", "Fallback worker status is IN_PROGRESS");

    // Concurrency test: Worker A1 tries checking in again while open
    const duplicateRes = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(duplicateRes.status === 400, "CONCURRENCY PASS: Duplicate check-in blocked cleanly (400)");

    // ----------------------------------------------------
    // SECTION 4: Live Check-Out With Intelligence
    // ----------------------------------------------------
    console.log("\n--- 4. Testing Check-Out & Final Attendance Status ---");
    // Simulate Worker A1 check_in_time 4 hours ago and checkout
    attA1.check_in_time = new Date(Date.now() - 4 * 3600 * 1000);
    await attA1.save();

    const checkOutResA1 = await apiRequest("/attendance/check-out", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA1}` },
      body: JSON.stringify({ latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(checkOutResA1.status === 200, "Worker A1 checked out (200 OK)");
    const updatedAttA1 = await Attendance.findByPk(attA1.id);
    assert(updatedAttA1.check_out_time !== null, "check_out_time is recorded");
    assert(parseFloat(updatedAttA1.actual_hours) >= 3.99, `actual_hours is ~4.0h (actual: ${updatedAttA1.actual_hours})`);
    assert(updatedAttA1.completion_percentage === 50, `completion_percentage is 50% (actual: ${updatedAttA1.completion_percentage}%)`);
    assert(
      ["LATE", "LATE_AND_EARLY_DEPARTURE"].includes(updatedAttA1.status),
      `Final status correctly reflects lateness (actual: ${updatedAttA1.status})`
    );

    // Fallback checkout (Worker A2)
    const checkOutResA2 = await apiRequest("/attendance/check-out", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA2}` },
      body: JSON.stringify({ latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(checkOutResA2.status === 200, "Worker A2 checked out (200 OK)");
    const updatedAttA2 = await Attendance.findByPk(attA2.id);
    assert(updatedAttA2.status === "COMPLETED", "Fallback worker final status is COMPLETED");
    assert(updatedAttA2.completion_percentage === null, "Fallback worker completion_percentage is null");

    // ----------------------------------------------------
    // SECTION 5: Historical Schedule Preservation (Step 11)
    // ----------------------------------------------------
    console.log("\n--- 5. Testing Historical Schedule Preservation ---");
    // Change Worker A1's active employment schedule to Schedule A2
    empRecordA1.work_schedule_id = scheduleA2.id;
    await empRecordA1.save();

    // Verify historical attendance record still references Schedule A1
    const historicalAtt = await Attendance.findByPk(attA1.id);
    assert(
      historicalAtt.work_schedule_id === scheduleA1.id,
      "HISTORICAL INTEGRITY PASS: Past attendance still references Schedule A1 despite employee being reassigned to Schedule A2"
    );
    assert(historicalAtt.is_late === true, "Historical attendance is_late remains true from original calculation");

    // ----------------------------------------------------
    // SECTION 6: Schedule Deactivation Survival
    // ----------------------------------------------------
    console.log("\n--- 6. Testing Schedule Deactivation Survival ---");
    scheduleA1.is_active = false;
    await scheduleA1.save();

    const deactAtt = await Attendance.findByPk(attA1.id, {
      include: [{ model: WorkSchedule, as: "schedule" }],
    });
    assert(deactAtt.schedule !== null, "Historical attendance can still load deactivated Schedule A1 details");
    assert(deactAtt.schedule.name === "Schedule A1 (00:01 - 08:01)", "Historical schedule details match");

    // ----------------------------------------------------
    // SECTION 7: Company Attendance API & Strict Tenant Isolation
    // ----------------------------------------------------
    console.log("\n--- 7. Testing Company Attendance Endpoint & Tenant Isolation ---");
    // Company A owner can view Company A attendance
    const compARes = await apiRequest(`/attendance/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${tokenOwnerA}` },
    });
    assert(compARes.status === 200, "Owner A fetched Company A attendance (200 OK)");
    assert(compARes.data.data.attendances.length >= 2, "Company A attendance list contains Company A records");
    assert(
      compARes.data.data.attendances.every((a) => a.company_id === companyA.id),
      "All returned attendance records belong exclusively to Company A"
    );

    // Company A owner CANNOT view Company B attendance (Cross-Tenant Boundary)
    const crossTenantRes = await apiRequest(`/attendance/company/${companyB.id}`, {
      headers: { Authorization: `Bearer ${tokenOwnerA}` },
    });
    assert(crossTenantRes.status === 403, "TENANT PASS: Owner A blocked from Company B attendance (403 Forbidden)");

    // Company B owner can view Company B attendance (empty for now)
    const compBRes = await apiRequest(`/attendance/company/${companyB.id}`, {
      headers: { Authorization: `Bearer ${tokenOwnerB}` },
    });
    assert(compBRes.status === 200, "Owner B fetched Company B attendance (200 OK)");
    assert(
      compBRes.data.data.attendances.every((a) => a.company_id === companyB.id),
      "Company B attendance contains zero records from Company A"
    );

    console.log("\n==================================================");
    console.log("ALL ATTENDANCE & SCHEDULE INTELLIGENCE TESTS PASSED!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
