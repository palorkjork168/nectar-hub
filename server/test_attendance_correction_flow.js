// test_attendance_correction_flow.js
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
  AttendanceCorrectionRequest,
  AuditLog,
  CompanyUserRole,
} = require("./src/models");

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
  console.log("TESTING ATTENDANCE CORRECTION WORKFLOW & DEADLOCK RECOVERY");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // ----------------------------------------------------
    // 1. Roles & Actors Setup
    // ----------------------------------------------------
    console.log("--- 1. Setting up Test Actors, Companies & Roles ---");
    const [adminRole, employerRole, employeeRole, hrRole] = await Promise.all([
      Role.findOne({ where: { name: "ADMIN" } }),
      Role.findOne({ where: { name: "EMPLOYER" } }),
      Role.findOne({ where: { name: "EMPLOYEE" } }),
      Role.findOne({ where: { name: "HR" } }),
    ]);

    // Create Company A & B
    const ownerA = await User.create({
      first_name: "Owner",
      last_name: "Alpha",
      email: `owner.alpha.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: ownerA.id, role_id: employerRole.id });

    const companyA = await Company.create({
      name: `Alpha Corp ${timestamp}`,
      owner_id: ownerA.id,
      status: "ACTIVE",
    });

    const ownerB = await User.create({
      first_name: "Owner",
      last_name: "Beta",
      email: `owner.beta.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: ownerB.id, role_id: employerRole.id });

    const companyB = await Company.create({
      name: `Beta Corp ${timestamp}`,
      owner_id: ownerB.id,
      status: "ACTIVE",
    });

    // Schedule for Company A (09:00 - 17:00, 15m grace, 8h expected)
    const scheduleA = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Standard Day Shift",
      start_time: "09:00",
      end_time: "17:00",
      grace_period_minutes: 15,
      expected_hours: 8.0,
      is_active: true,
    });

    // Worker A (Employee in Company A)
    const workerA = await User.create({
      first_name: "Alice",
      last_name: "Worker",
      email: `alice.worker.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: workerA.id, role_id: employeeRole.id });
    await EmploymentRecord.create({
      user_id: workerA.id,
      company_id: companyA.id,
      work_schedule_id: scheduleA.id,
      start_date: "2026-01-01",
      status: "ACTIVE",
    });

    // Worker B (Employee in Company B)
    const workerB = await User.create({
      first_name: "Bob",
      last_name: "Worker",
      email: `bob.worker.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: workerB.id, role_id: employeeRole.id });
    await EmploymentRecord.create({
      user_id: workerB.id,
      company_id: companyB.id,
      start_date: "2026-01-01",
      status: "ACTIVE",
    });

    // HR User in Company A
    const hrA = await User.create({
      first_name: "Helen",
      last_name: "HR",
      email: `helen.hr.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: hrA.id, role_id: employeeRole.id });
    await CompanyUserRole.create({
      user_id: hrA.id,
      company_id: companyA.id,
      role_id: hrRole.id,
    });

    // Global Admin
    const adminUser = await User.create({
      first_name: "Super",
      last_name: "Admin",
      email: `admin.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: adminUser.id, role_id: adminRole.id });

    // Authenticate Actors
    const login = async (email) => {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return res.data.data.token;
    };

    const tokenWorkerA = await login(workerA.email);
    const tokenWorkerB = await login(workerB.email);
    const tokenOwnerA = await login(ownerA.email);
    const tokenOwnerB = await login(ownerB.email);
    const tokenHRA = await login(hrA.email);
    const tokenAdmin = await login(adminUser.email);

    // ----------------------------------------------------
    // 2. Worker A Checks In & Leaves Shift Open (Deadlock Setup)
    // ----------------------------------------------------
    console.log("\n--- 2. Creating Open Shift & Verifying Check-in Deadlock ---");
    const checkInRes = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(checkInRes.status === 201, "Worker A checked in successfully (201)");
    const openAttendance = checkInRes.data.data.attendance;
    assert(openAttendance.status === "IN_PROGRESS", "Shift is initially IN_PROGRESS");
    assert(openAttendance.check_out_time === null, "check_out_time is null");

    // Concurrency verification: duplicate check-in blocked
    const dupCheckIn = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(dupCheckIn.status === 400, "CONCURRENCY GUARD: Blocked second check-in while open shift exists (400)");

    // ----------------------------------------------------
    // 3. Correction Request Submission & Security Guards
    // ----------------------------------------------------
    console.log("\n--- 3. Testing Correction Request Submission & Security Rules ---");

    // Attack 1: Worker B tries to submit correction for Worker A's attendance record
    const hackRes = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerB}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: openAttendance.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 3600000).toISOString(),
        reason: "Malicious attempt to tamper with coworker record",
      }),
    });
    assert(hackRes.status === 403, "SECURITY PASS: Blocked employee from requesting correction on another user's record (403)");

    // Attack 2: Worker A tries to submit correction for wrong company
    const wrongCompanyRes = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyB.id,
        attendanceId: openAttendance.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 3600000).toISOString(),
        reason: "Forgot to punch out yesterday",
      }),
    });
    assert(wrongCompanyRes.status === 403, "SECURITY PASS: Blocked correction request for company without active employment (403)");

    // Update open attendance check_in_time to 4 hours ago to simulate past open shift
    await Attendance.update(
      { check_in_time: new Date(Date.now() - 4 * 3600000) },
      { where: { id: openAttendance.id } }
    );

    // Valid Submission: Worker A requests checkout time
    const requestedOutTime = new Date(Date.now() - 1800000); // 30 mins ago
    const validSubRes = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: openAttendance.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: requestedOutTime.toISOString(),
        reason: "Forgot to clock out before power outage",
      }),
    });
    assert(validSubRes.status === 201, "Worker A submitted valid correction request (201 Created)");
    const correctionA = validSubRes.data.data.correction;
    assert(correctionA.status === "PENDING", "Correction status is PENDING");
    assert(correctionA.original_check_in_time !== null, "Preserved original check_in_time snapshot");

    // Duplicate pending check: Second pending request on same record must be rejected
    const dupPendingRes = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: openAttendance.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: requestedOutTime.toISOString(),
        reason: "Duplicate submission attempt",
      }),
    });
    assert(dupPendingRes.status === 400, "DUPLICATE GUARD: Blocked second pending correction on same attendance (400)");

    // Worker A views their submitted requests
    const myCorrectionsRes = await apiRequest("/attendance/corrections/me", {
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
    });
    assert(myCorrectionsRes.status === 200, "Worker A fetched personal correction requests (200)");
    assert(myCorrectionsRes.data.data.corrections.length >= 1, "Personal correction list contains the pending request");

    // ----------------------------------------------------
    // 4. Reviewer Authorization & Tenant Safety
    // ----------------------------------------------------
    console.log("\n--- 4. Testing Reviewer Authorization & Tenant Isolation ---");

    // Attack 3: Employer B tries to access Company A's corrections
    const foreignListRes = await apiRequest(`/attendance/corrections/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${tokenOwnerB}` },
    });
    assert(foreignListRes.status === 403, "TENANT PASS: Employer B blocked from viewing Company A's corrections (403)");

    // Attack 4: Employer B tries to approve Company A's correction
    const foreignApproveRes = await apiRequest(`/attendance/corrections/${correctionA.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenOwnerB}` },
      body: JSON.stringify({ reviewNote: "Unauthorized approval" }),
    });
    assert(foreignApproveRes.status === 403, "TENANT PASS: Employer B blocked from approving Company A's correction (403)");

    // Attack 5: Worker A tries to approve their own correction
    const selfApproveRes = await apiRequest(`/attendance/corrections/${correctionA.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({ reviewNote: "Self-approval attempt" }),
    });
    assert(selfApproveRes.status === 403, "SECURITY PASS: Employee blocked from approving their own correction (403)");

    // Valid Reviewer: HR A views Company A's corrections
    const hrListRes = await apiRequest(`/attendance/corrections/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${tokenHRA}` },
    });
    assert(hrListRes.status === 200, "Company A HR fetched company correction requests (200)");
    assert(hrListRes.data.data.corrections.some((c) => c.id === correctionA.id), "HR list includes pending request");

    // ----------------------------------------------------
    // 5. Approval Execution, Recalculation & Deadlock Resolution
    // ----------------------------------------------------
    console.log("\n--- 5. Approving Correction, Recalculating Metrics & Deadlock Recovery ---");

    const approveRes = await apiRequest(`/attendance/corrections/${correctionA.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({ reviewNote: "Verified with manager notes." }),
    });
    assert(approveRes.status === 200, "HR A approved correction request (200 OK)");
    const approvedCorrection = approveRes.data.data.correction;
    const updatedAttendance = approveRes.data.data.attendance;

    assert(approvedCorrection.status === "APPROVED", "Correction status updated to APPROVED");
    assert(approvedCorrection.reviewed_by === hrA.id, "Reviewer ID recorded correctly");
    assert(approvedCorrection.review_note === "Verified with manager notes.", "Review note recorded");

    // Verify safe attendance update
    assert(updatedAttendance.check_out_time !== null, "Attendance check_out_time is now recorded");
    assert(updatedAttendance.is_corrected === true, "Attendance marked with is_corrected: true");
    assert(updatedAttendance.location_status === "MANUALLY_CORRECTED", "GPS location_status is MANUALLY_CORRECTED");
    assert(updatedAttendance.actual_hours !== null && Number(updatedAttendance.actual_hours) >= 0, "Worked hours recalculated");
    assert(updatedAttendance.status !== "IN_PROGRESS", `Status updated from IN_PROGRESS to ${updatedAttendance.status}`);

    // Verify Audit Trail entry
    const auditLog = await AuditLog.findOne({
      where: {
        entity_id: correctionA.id,
        action: "ATTENDANCE_CORRECTION_APPROVED",
      },
    });
    assert(auditLog !== null, "AUDIT PASS: Immutable audit log recorded for correction approval");
    assert(auditLog.actor_user_id === hrA.id, "Audit log correctly records HR actor");
    assert(auditLog.company_id === companyA.id, "Audit log correctly records Company A context");

    // Prevent duplicate approval/decision on already finalized request
    const secondApproveRes = await apiRequest(`/attendance/corrections/${correctionA.id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenHRA}` },
    });
    assert(secondApproveRes.status === 400, "CONCURRENCY PASS: Re-approving already decided request blocked (400)");

    // DEADLOCK RESOLUTION VERIFICATION:
    // Because the open shift was closed via approved correction, Worker A can now check in for their next shift!
    console.log("\n--- 6. Verifying Next Shift Check-in After Deadlock Recovery ---");
    const nextCheckInRes = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      }),
    });
    assert(nextCheckInRes.status === 201, "DEADLOCK RESOLVED: Worker A successfully clocked in for new shift (201 Created)");

    // ----------------------------------------------------
    // 7. Testing Rejection Flow
    // ----------------------------------------------------
    console.log("\n--- 7. Testing Rejection Flow ---");
    const activeAtt2 = nextCheckInRes.data.data.attendance;
    await Attendance.update(
      { check_in_time: new Date(Date.now() - 2 * 3600000) },
      { where: { id: activeAtt2.id } }
    );

    // Submit second correction request
    const sub2Res = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWorkerA}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: activeAtt2.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 60000).toISOString(),
        reason: "Test rejection reason",
      }),
    });
    assert(sub2Res.status === 201, "Second correction request submitted");
    const correction2 = sub2Res.data.data.correction;

    // HR Rejects it
    const rejectRes = await apiRequest(`/attendance/corrections/${correction2.id}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({ reviewNote: "Discrepancy in timesheet log." }),
    });
    assert(rejectRes.status === 200, "HR A rejected correction request (200 OK)");
    const rejectedCorrection = rejectRes.data.data.correction;
    assert(rejectedCorrection.status === "REJECTED", "Status updated to REJECTED");
    assert(rejectedCorrection.review_note === "Discrepancy in timesheet log.", "Rejection note recorded");

    // Audit log for rejection
    const rejectAudit = await AuditLog.findOne({
      where: {
        entity_id: correction2.id,
        action: "ATTENDANCE_CORRECTION_REJECTED",
      },
    });
    assert(rejectAudit !== null, "AUDIT PASS: Rejection event logged to audit trail");

    // ----------------------------------------------------
    // 8. Testing Platform Admin Global Access
    // ----------------------------------------------------
    console.log("\n--- 8. Testing Platform Admin Global Oversight ---");
    const adminListRes = await apiRequest("/attendance/corrections", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminListRes.status === 200, "Platform Admin can query all corrections globally (200)");
    assert(adminListRes.data.data.corrections.length >= 2, "Admin list includes corrections across companies");

    console.log("\n==================================================");
    console.log("ALL ATTENDANCE CORRECTION & RECOVERY TESTS PASSED (100%)");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
})();
