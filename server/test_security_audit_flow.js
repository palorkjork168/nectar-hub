// test_security_audit_flow.js
// Dedicated Phase 8 Security & Audit Hardening Integration Test Suite
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User, Role, UserRole, Company, EmploymentRecord, WorkSchedule, LeaveType, LeaveRequest, AuditLog } = require("./src/models");

const BASE = "http://127.0.0.1:5000/api";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ PASS: ${message}`);
}

const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

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
  console.log("RUNNING SECURITY & AUDIT HARDENING TEST SUITE");
  console.log("==================================================\n");

  try {
    const timestamp = Date.now();
    const rawPassword = "Password123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });

    // 1. Create two separate companies with different owners
    const ownerA = await User.create({
      first_name: "OwnerA",
      last_name: "Audit",
      email: `ownera_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerA.id, role_id: employerRole.id });

    const ownerB = await User.create({
      first_name: "OwnerB",
      last_name: "Audit",
      email: `ownerb_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: ownerB.id, role_id: employerRole.id });

    const employeeA = await User.create({
      first_name: "EmpA",
      last_name: "Audit",
      email: `empa_${timestamp}@example.com`,
      password_hash: passwordHash,
    });
    await UserRole.create({ user_id: employeeA.id, role_id: employeeRole.id });

    const companyA = await Company.create({
      owner_id: ownerA.id,
      name: `Company A ${timestamp}`,
    });

    const companyB = await Company.create({
      owner_id: ownerB.id,
      name: `Company B ${timestamp}`,
    });

    await EmploymentRecord.create({
      user_id: employeeA.id,
      company_id: companyA.id,
      status: "ACTIVE",
    });

    // ----------------------------------------------------
    // TEST 1: Authentication Hardening (401s)
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Authentication Hardening ---");

    // Unauthenticated request
    let res = await api(`/audit/company/${companyA.id}`);
    assert(res.status === 401, "Unauthenticated request to audit endpoint returns 401 Unauthorized");

    // Invalid JWT token
    res = await api(`/audit/company/${companyA.id}`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    assert(res.status === 401, "Invalid JWT token returns 401 Unauthorized");

    // Malformed Authorization header
    res = await api(`/audit/company/${companyA.id}`, {
      headers: { Authorization: "Basic notatoken" },
    });
    assert(res.status === 401, "Malformed Authorization header returns 401 Unauthorized");

    // ----------------------------------------------------
    // TEST 2: Login Audit Logging & Password Protection
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Login Audit Events & Sanitization ---");

    // Login with wrong password -> triggers LOGIN_FAILED
    const badLoginRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerA.email, password: "WrongPassword999!" }),
    });
    assert(badLoginRes.status === 401, "Invalid credentials rejected with 401");
    await sleep();

    // Verify LOGIN_FAILED audit log exists and credentials are sanitized
    const failedLog = await AuditLog.findOne({
      where: { action: "LOGIN_FAILED" },
      order: [["created_at", "DESC"]],
    });
    assert(failedLog !== null, "LOGIN_FAILED event is recorded in audit_logs");
    assert(failedLog.metadata?.email === ownerA.email, "Failed login records attempt identifier");
    assert(!failedLog.metadata?.password || failedLog.metadata?.password === "[REDACTED]", "Password is strictly omitted or redacted in failed login metadata");

    // Login successfully -> triggers LOGIN_SUCCESS
    const loginARes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerA.email, password: rawPassword }),
    });
    assert(loginARes.status === 200, "OwnerA login succeeds with 200");
    const tokenA = loginARes.data.data.token;
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };
    await sleep();

    const successLog = await AuditLog.findOne({
      where: { action: "LOGIN_SUCCESS", actor_user_id: ownerA.id },
      order: [["created_at", "DESC"]],
    });
    assert(successLog !== null, "LOGIN_SUCCESS event recorded for OwnerA");
    assert(!successLog.metadata?.password, "Password is not stored in login metadata");

    // OwnerB login
    const loginBRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerB.email, password: rawPassword }),
    });
    const tokenB = loginBRes.data.data.token;
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    // EmployeeA login
    const loginEmpRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: employeeA.email, password: rawPassword }),
    });
    const tokenEmp = loginEmpRes.data.data.token;
    const authHeadersEmp = { Authorization: `Bearer ${tokenEmp}` };

    // ----------------------------------------------------
    // TEST 3: Authorization & Tenant Isolation for Audit Logs
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Authorization & Tenant Isolation ---");

    // Regular employee accessing Company A audit logs -> 403 Forbidden
    res = await api(`/audit/company/${companyA.id}`, { headers: authHeadersEmp });
    assert(res.status === 403, "Regular employee without audit.view is forbidden from viewing audit logs (403)");

    // OwnerB accessing Company A audit logs -> 403 Forbidden
    res = await api(`/audit/company/${companyA.id}`, { headers: authHeadersB });
    assert(res.status === 403, "OwnerB (cross-company employer) cannot view Company A audit logs (403)");

    // OwnerA accessing Company A audit logs -> 200 OK
    res = await api(`/audit/company/${companyA.id}`, { headers: authHeadersA });
    assert(res.status === 200, "OwnerA (company owner) can view Company A audit logs (200)");
    assert(Array.isArray(res.data.data), "Audit logs data is returned as an array");
    assert(res.data.pagination && res.data.pagination.page === 1, "Audit logs return pagination structure");

    // ----------------------------------------------------
    // TEST 4: Schedule Mutations & Scoped Audit Trail
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Schedule Mutation & Audit Event Generation ---");

    // Create a schedule in Company A by OwnerA
    const schedulePayload = {
      companyId: companyA.id,
      name: "Security Audit Shift",
      schedule_type: "FIXED",
      start_time: "09:00",
      end_time: "17:00",
      work_days: [1, 2, 3, 4, 5],
      late_threshold_minutes: 15,
      early_leave_threshold_minutes: 15,
    };
    const schedRes = await api("/shifts", {
      method: "POST",
      headers: authHeadersA,
      body: JSON.stringify(schedulePayload),
    });
    assert(schedRes.status === 201, "OwnerA creates schedule in Company A (201)");
    const createdScheduleId = schedRes.data.data.id;
    await sleep();

    // Cross-company mutation attempt: OwnerB attempts to update OwnerA's schedule
    const crossUpdateRes = await api(`/shifts/${createdScheduleId}`, {
      method: "PUT",
      headers: authHeadersB,
      body: JSON.stringify({ name: "Hacked Schedule" }),
    });
    assert(crossUpdateRes.status === 403, "Cross-company schedule update blocked with 403 Forbidden");

    // Cross-company deletion attempt: OwnerB attempts to delete OwnerA's schedule
    const crossDeleteRes = await api(`/shifts/${createdScheduleId}`, {
      method: "DELETE",
      headers: authHeadersB,
    });
    assert(crossDeleteRes.status === 403, "Cross-company schedule delete blocked with 403 Forbidden");

    // Verify SCHEDULE_CREATED audit record exists in Company A's audit logs
    const companyALogsRes = await api(`/audit/company/${companyA.id}?action=SCHEDULE_CREATED`, {
      headers: authHeadersA,
    });
    assert(companyALogsRes.status === 200, "OwnerA fetches filtered audit logs for SCHEDULE_CREATED");
    const createdSchedLogs = companyALogsRes.data.data.filter(
      (l) => l.action === "SCHEDULE_CREATED" && l.entity_id === createdScheduleId
    );
    assert(createdSchedLogs.length > 0, "SCHEDULE_CREATED audit log found with correct entity_id");
    assert(createdSchedLogs[0].company_id === companyA.id, "Audit log belongs to Company A");
    assert(createdSchedLogs[0].actor_user_id === ownerA.id, "Audit log records OwnerA as actor");

    // Verify Company B audit logs DO NOT contain Company A's events
    const companyBLogsRes = await api(`/audit/company/${companyB.id}`, {
      headers: authHeadersB,
    });
    assert(companyBLogsRes.status === 200, "OwnerB fetches Company B audit logs");
    const leakedLog = companyBLogsRes.data.data.find((l) => l.entity_id === createdScheduleId);
    assert(!leakedLog, "Company B audit logs contain NO records from Company A (Strict Tenant Isolation)");

    // ----------------------------------------------------
    // TEST 5: Leave Request Audit Event
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Leave Request Audit Events ---");

    // Setup leave type
    const leaveType = await LeaveType.create({
      company_id: companyA.id,
      name: `Audit Annual Leave ${timestamp}`,
      days_allowed: 15,
      is_paid: true,
      requires_approval: true,
    });

    // EmployeeA submits leave request
    const leaveRes = await api("/leave/requests", {
      method: "POST",
      headers: authHeadersEmp,
      body: JSON.stringify({
        companyId: companyA.id,
        leave_type_id: leaveType.id,
        start_date: "2026-10-01",
        end_date: "2026-10-02",
        reason: "Security testing leave",
      }),
    });
    assert(leaveRes.status === 201, "EmployeeA submits leave request (201)");
    const leaveId = leaveRes.data.data.id;
    await sleep();

    // Verify LEAVE_CREATED audit log exists
    const leaveLog = await AuditLog.findOne({
      where: { action: "LEAVE_CREATED", entity_id: leaveId },
    });
    assert(leaveLog !== null, "LEAVE_CREATED audit log recorded");
    assert(leaveLog.company_id === companyA.id, "LEAVE_CREATED recorded under Company A");
    assert(leaveLog.actor_user_id === employeeA.id, "Actor recorded as EmployeeA");

    // ----------------------------------------------------
    // TEST 6: Input Security & Error Sanitization (No SQL/Stack leak)
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Input Security & Error Sanitization ---");

    // Non-UUID parameter rejected cleanly with 400 Bad Request
    const invalidUuidRes = await api("/audit/company/not-a-valid-uuid", {
      headers: authHeadersA,
    });
    assert(invalidUuidRes.status === 400, "Invalid UUID parameter returns 400 Bad Request");
    assert(
      !invalidUuidRes.data.stack && !JSON.stringify(invalidUuidRes.data).includes("SequelizeDatabaseError"),
      "Response does not leak SequelizeDatabaseError or server stack traces"
    );

    console.log("\n==================================================");
    console.log("✓ ALL SECURITY & AUDIT TESTS PASSED SUCCESSFULLY");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", error);
    process.exit(1);
  }
})();
