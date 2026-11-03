// test_attendance_phase2_control_center.js
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
  Notification,
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
  console.log("TESTING PHASE 2: ATTENDANCE CONTROL CENTER & BATCH REVIEW");
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

    // Company A & B
    const ownerA = await User.create({
      first_name: "Owner",
      last_name: "Alpha",
      email: `owner.alpha.p2.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: ownerA.id, role_id: employerRole.id });

    const companyA = await Company.create({
      name: `Alpha Corp P2 ${timestamp}`,
      owner_id: ownerA.id,
      status: "ACTIVE",
    });

    const ownerB = await User.create({
      first_name: "Owner",
      last_name: "Beta",
      email: `owner.beta.p2.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: ownerB.id, role_id: employerRole.id });

    const companyB = await Company.create({
      name: `Beta Corp P2 ${timestamp}`,
      owner_id: ownerB.id,
      status: "ACTIVE",
    });

    // Schedule A
    const scheduleA = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Day Shift Alpha",
      start_time: "09:00",
      end_time: "17:00",
      grace_period_minutes: 15,
      expected_hours: 8.0,
      is_active: true,
    });

    // Workers in Company A
    const worker1 = await User.create({
      first_name: "John",
      last_name: "Worker1",
      email: `john.w1.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: worker1.id, role_id: employeeRole.id });
    await EmploymentRecord.create({
      user_id: worker1.id,
      company_id: companyA.id,
      work_schedule_id: scheduleA.id,
      start_date: "2026-01-01",
      status: "ACTIVE",
    });

    const worker2 = await User.create({
      first_name: "Jane",
      last_name: "Worker2",
      email: `jane.w2.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: worker2.id, role_id: employeeRole.id });
    await EmploymentRecord.create({
      user_id: worker2.id,
      company_id: companyA.id,
      work_schedule_id: scheduleA.id,
      start_date: "2026-01-01",
      status: "ACTIVE",
    });

    // Worker in Company B
    const workerB = await User.create({
      first_name: "Ben",
      last_name: "WorkerB",
      email: `ben.wb.${timestamp}@test.com`,
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

    // HR in Company A
    const hrA = await User.create({
      first_name: "Helen",
      last_name: "HRA",
      email: `helen.hra.p2.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: hrA.id, role_id: employeeRole.id });
    await CompanyUserRole.create({
      user_id: hrA.id,
      company_id: companyA.id,
      role_id: hrRole.id,
    });

    // Admin
    const adminUser = await User.create({
      first_name: "Platform",
      last_name: "Admin",
      email: `admin.p2.${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: adminUser.id, role_id: adminRole.id });

    // Authenticate
    const login = async (email) => {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return res.data.data.token;
    };

    const tokenW1 = await login(worker1.email);
    const tokenW2 = await login(worker2.email);
    const tokenWB = await login(workerB.email);
    const tokenHRA = await login(hrA.email);
    const tokenOwnerB = await login(ownerB.email);
    const tokenAdmin = await login(adminUser.email);

    // ----------------------------------------------------
    // 2. Setup Attendances & Correction Requests
    // ----------------------------------------------------
    console.log("\n--- 2. Setting Up Shifts, Missing Punches & Correction Requests ---");

    // Check-in Worker 1
    const w1CheckIn = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenW1}` },
      body: JSON.stringify({ companyId: companyA.id, latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(w1CheckIn.status === 201, "Worker 1 checked in");
    const att1 = w1CheckIn.data.data.attendance;

    // Check-in Worker 2
    const w2CheckIn = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenW2}` },
      body: JSON.stringify({ companyId: companyA.id, latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(w2CheckIn.status === 201, "Worker 2 checked in");
    const att2 = w2CheckIn.data.data.attendance;

    // Check-in Worker B in Company B
    const wbCheckIn = await apiRequest("/attendance/check-in", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWB}` },
      body: JSON.stringify({ companyId: companyB.id, latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(wbCheckIn.status === 201, "Worker B checked in");
    const attB = wbCheckIn.data.data.attendance;

    // Simulate shifts in the past so checkout times are valid
    await Attendance.update(
      { check_in_time: new Date(Date.now() - 5 * 3600000) },
      { where: { id: att1.id } }
    );
    await Attendance.update(
      { check_in_time: new Date(Date.now() - 6 * 3600000) },
      { where: { id: att2.id } }
    );
    await Attendance.update(
      { check_in_time: new Date(Date.now() - 7 * 3600000) },
      { where: { id: attB.id } }
    );

    // Submit Correction for Worker 1 (Company A)
    const req1Res = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenW1}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: att1.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 3600000).toISOString(),
        reason: "Forgot to punch out before departure",
      }),
    });
    assert(req1Res.status === 201, "Worker 1 submitted correction request 1");
    const corr1 = req1Res.data.data.correction;

    // Submit Correction for Worker 2 (Company A)
    const req2Res = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenW2}` },
      body: JSON.stringify({
        companyId: companyA.id,
        attendanceId: att2.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 3600000).toISOString(),
        reason: "Device battery died at shift end",
      }),
    });
    assert(req2Res.status === 201, "Worker 2 submitted correction request 2");
    const corr2 = req2Res.data.data.correction;

    // Submit Correction for Worker B (Company B)
    const reqBRes = await apiRequest("/attendance/corrections", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenWB}` },
      body: JSON.stringify({
        companyId: companyB.id,
        attendanceId: attB.id,
        correctionType: "MISSING_CHECK_OUT",
        requestedCheckOutTime: new Date(Date.now() - 3600000).toISOString(),
        reason: "Worked on client site",
      }),
    });
    assert(reqBRes.status === 201, "Worker B submitted correction request B");
    const corrB = reqBRes.data.data.correction;

    // ----------------------------------------------------
    // 3. Notification Integration Verification
    // ----------------------------------------------------
    console.log("\n--- 3. Testing Notification Links & Navigation Targets ---");
    const hrNotifs = await Notification.findAll({
      where: { user_id: hrA.id, type: "ATTENDANCE_CORRECTION_REQUESTED" },
    });
    assert(hrNotifs.length >= 1, "Reviewer received in-app notification for correction request");
    assert(
      hrNotifs[0].link === "/employer/attendance/corrections",
      `Notification link targets '/employer/attendance/corrections' (was: ${hrNotifs[0].link})`
    );

    // ----------------------------------------------------
    // 4. Missing Punches & Stale Shifts Query
    // ----------------------------------------------------
    console.log("\n--- 4. Testing Missing Punches & Unclosed Shifts Queries ---");
    const compAUnclosed = await apiRequest(`/attendance/company/${companyA.id}?missingCheckout=true`, {
      headers: { Authorization: `Bearer ${tokenHRA}` },
    });
    assert(compAUnclosed.status === 200, "HR A fetched unclosed shifts query (200)");
    assert(
      compAUnclosed.data.data.attendances.every((a) => a.check_out_time === null),
      "All returned records have check_out_time === null"
    );

    // Admin cross-company missing punch visibility
    const adminUnclosed = await apiRequest("/attendance?missingCheckout=true", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminUnclosed.status === 200, "Admin queried global unclosed shifts (200)");
    assert(
      adminUnclosed.data.data.attendances.some((a) => a.id === att1.id) &&
      adminUnclosed.data.data.attendances.some((a) => a.id === attB.id),
      "Admin sees unclosed shifts across both Company A and Company B"
    );

    // ----------------------------------------------------
    // 5. Query Filtering & Scoping
    // ----------------------------------------------------
    console.log("\n--- 5. Testing Query Filtering by Type, Status & Company ---");
    // Filter by type
    const typeFilterRes = await apiRequest(
      `/attendance/corrections/company/${companyA.id}?correctionType=MISSING_CHECK_OUT`,
      { headers: { Authorization: `Bearer ${tokenHRA}` } }
    );
    assert(typeFilterRes.status === 200, "Filtered by correctionType successfully (200)");
    assert(
      typeFilterRes.data.data.corrections.every((c) => c.correction_type === "MISSING_CHECK_OUT"),
      "Results match correctionType filter"
    );

    // Tenant Isolation: HR A cannot query Company B
    const foreignQuery = await apiRequest(`/attendance/corrections/company/${companyB.id}`, {
      headers: { Authorization: `Bearer ${tokenHRA}` },
    });
    assert(foreignQuery.status === 403, "TENANT ISOLATION: HR A blocked from querying Company B (403)");

    // ----------------------------------------------------
    // 6. Batch Approval Execution & Partial Failure Reporting
    // ----------------------------------------------------
    console.log("\n--- 6. Testing Batch Approval & Partial Failure Reporting ---");

    // Empty array validation
    const emptyBatch = await apiRequest("/attendance/corrections/batch-review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({ correctionIds: [] }),
    });
    assert(emptyBatch.status === 400, "Validation blocked empty correctionIds array (400)");

    // Heterogeneous Batch: HR A attempts batch with:
    // - corr1 (Company A - authorized, PENDING -> should succeed)
    // - corrB (Company B - unauthorized -> should fail with 403)
    const mixedBatchRes = await apiRequest("/attendance/corrections/batch-review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({
        correctionIds: [corr1.id, corrB.id],
        decision: "APPROVED",
        reviewNote: "Batch approved by HR",
      }),
    });
    assert(mixedBatchRes.status === 200, "Batch endpoint executed and returned 200");
    const batchReport = mixedBatchRes.data.data;
    assert(batchReport.total === 2, "Batch report records total: 2");
    assert(batchReport.succeeded.length === 1, "Exactly 1 item succeeded");
    assert(batchReport.succeeded[0].id === corr1.id, "corr1 succeeded");
    assert(batchReport.failed.length === 1, "Exactly 1 item failed");
    assert(batchReport.failed[0].id === corrB.id, "corrB failed due to tenant boundaries");
    assert(batchReport.allSucceeded === false, "allSucceeded is correctly false");

    // Verify corr1 was actually approved and attendance updated
    const updatedAtt1 = await Attendance.findByPk(att1.id);
    assert(updatedAtt1.check_out_time !== null, "Attendance 1 check_out_time was safely populated");
    assert(updatedAtt1.is_corrected === true, "Attendance 1 is_corrected is true");
    assert(updatedAtt1.location_status === "MANUALLY_CORRECTED", "Attendance 1 is MANUALLY_CORRECTED");

    // Audit log check for batch item
    const batchAudit = await AuditLog.findOne({
      where: { entity_id: corr1.id, action: "ATTENDANCE_CORRECTION_APPROVED" },
    });
    assert(batchAudit !== null, "Audit log created for batch approved item");

    // Approve second request individually with HR A
    const batch2Res = await apiRequest("/attendance/corrections/batch-review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({
        correctionIds: [corr2.id],
        decision: "APPROVED",
      }),
    });
    assert(batch2Res.data.data.succeeded.length === 1, "corr2 bulk approved");

    // Attempting to re-approve already approved corr1 in a batch fails safely
    const reApproveBatch = await apiRequest("/attendance/corrections/batch-review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenHRA}` },
      body: JSON.stringify({ correctionIds: [corr1.id] }),
    });
    assert(
      reApproveBatch.data.data.failed.length === 1,
      "Re-approving already decided correction in batch reports failure"
    );

    // ----------------------------------------------------
    // 7. Platform Admin Global Batch Review
    // ----------------------------------------------------
    console.log("\n--- 7. Testing Platform Admin Global Batch Review ---");
    // Admin approves corrB in Company B
    const adminBatchRes = await apiRequest("/attendance/corrections/batch-review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        correctionIds: [corrB.id],
        decision: "APPROVED",
        reviewNote: "Platform admin approved",
      }),
    });
    assert(adminBatchRes.status === 200, "Admin batch endpoint succeeded");
    assert(adminBatchRes.data.data.succeeded.length === 1, "Admin successfully approved corrB across company boundary");

    console.log("\n==================================================");
    console.log("ALL PHASE 2 ATTENDANCE CONTROL CENTER TESTS PASSED (100%)");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
})();
