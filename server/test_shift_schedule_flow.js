// test_shift_schedule_flow.js
require("dotenv").config();
const BASE_URL = "http://127.0.0.1:5000/api";
const {
  User,
  Role,
  UserRole,
  Company,
  EmploymentRecord,
  Department,
  Position,
  WorkSchedule,
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

async function runShiftScheduleTests() {
  console.log("==================================================");
  console.log("STARTING SHIFT & WORK SCHEDULE API TEST SUITE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  try {
    // ----------------------------------------------------
    // 1. Setup Roles & Test Actors
    // ----------------------------------------------------
    console.log("--- 1. Setting up Test Actors & Roles ---");
    const [adminRole, employerRole, employeeRole, seekerRole, hrRole, managerRole] =
      await Promise.all([
        Role.findOne({ where: { name: "ADMIN" } }),
        Role.findOne({ where: { name: "EMPLOYER" } }),
        Role.findOne({ where: { name: "EMPLOYEE" } }),
        Role.findOne({ where: { name: "JOB_SEEKER" } }),
        Role.findOne({ where: { name: "HR" } }),
        Role.findOne({ where: { name: "MANAGER" } }),
      ]);

    assert(adminRole && employerRole && employeeRole && hrRole && managerRole, "Required roles found in DB");

    // Helper to create and authenticate user
    async function createUser(emailPrefix, globalRole) {
      const email = `${emailPrefix}_${timestamp}@test.com`;
      const [user] = await User.findOrCreate({
        where: { email },
        defaults: {
          first_name: emailPrefix,
          last_name: "Tester",
          email,
          password_hash: passwordHash,
        },
      });
      if (globalRole) {
        await UserRole.findOrCreate({
          where: { user_id: user.id, role_id: globalRole.id },
          defaults: { user_id: user.id, role_id: globalRole.id },
        });
      }
      const loginRes = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Password123!" }),
      });
      assert(loginRes.ok, `Login succeeded for ${email}`);
      return { user, token: loginRes.data.data.token };
    }

    const admin = await createUser("shift_admin", adminRole);
    const employerA = await createUser("shift_emp_a", employerRole);
    const employerB = await createUser("shift_emp_b", employerRole);
    const hrUserA = await createUser("shift_hr_a", employeeRole);
    const managerA = await createUser("shift_mgr_a", employeeRole);
    const workerA1 = await createUser("shift_worker_a1", employeeRole);
    const workerA2 = await createUser("shift_worker_a2", employeeRole);
    const workerB1 = await createUser("shift_worker_b1", employeeRole);
    const plainSeeker = await createUser("shift_seeker", seekerRole);

    // ----------------------------------------------------
    // 2. Setup Companies & Employment
    // ----------------------------------------------------
    console.log("\n--- 2. Setting up Companies, Employment & Company Roles ---");
    const compARes = await apiRequest("/companies", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        name: `Acme Corp Shifts ${timestamp}`,
        industry: "Technology",
        city: "Phnom Penh",
        country: "Cambodia",
      }),
    });
    assert(compARes.ok, "Company A created");
    const companyA = compARes.data.data.company;

    const compBRes = await apiRequest("/companies", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerB.token}` },
      body: JSON.stringify({
        name: `Beta Logistics Shifts ${timestamp}`,
        industry: "Logistics",
        city: "Siem Reap",
        country: "Cambodia",
      }),
    });
    assert(compBRes.ok, "Company B created");
    const companyB = compBRes.data.data.company;

    // Create Employment Records
    const empRecordA1 = await EmploymentRecord.create({
      user_id: workerA1.user.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    const empRecordA2 = await EmploymentRecord.create({
      user_id: workerA2.user.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    const empRecordB1 = await EmploymentRecord.create({
      user_id: workerB1.user.id,
      company_id: companyB.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    const empRecordHRA = await EmploymentRecord.create({
      user_id: hrUserA.user.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });
    const empRecordMgrA = await EmploymentRecord.create({
      user_id: managerA.user.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: new Date(),
    });

    // Delegate Company Roles in Company A
    await CompanyUserRole.create({
      user_id: hrUserA.user.id,
      company_id: companyA.id,
      role_id: hrRole.id,
    });
    await CompanyUserRole.create({
      user_id: managerA.user.id,
      company_id: companyA.id,
      role_id: managerRole.id,
    });
    assert(true, "Employment and company-scoped roles assigned");

    // ----------------------------------------------------
    // 3. Testing Authentication & Permissions
    // ----------------------------------------------------
    console.log("\n--- 3. Testing Authentication & Permissions ---");

    // Unauthenticated request -> 401
    const unauthRes = await apiRequest(`/shifts/company/${companyA.id}`);
    assert(unauthRes.status === 401, "SECURITY PASS: Unauthenticated access blocked (401)");

    // Job Seeker without company access -> 403
    const seekerRes = await apiRequest(`/shifts/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${plainSeeker.token}` },
    });
    assert(seekerRes.status === 403, "SECURITY PASS: Plain Job Seeker blocked from company schedules (403)");

    // Manager A cannot create schedule (lacks shifts.manage) -> 403
    const mgrCreateRes = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${managerA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: "Unauthorized Schedule",
        start_time: "09:00",
        end_time: "17:00",
      }),
    });
    assert(mgrCreateRes.status === 403, "SECURITY PASS: Manager blocked from creating schedule (403)");

    // ----------------------------------------------------
    // 4. Testing CRUD Operations
    // ----------------------------------------------------
    console.log("\n--- 4. Testing CRUD Operations by Employer, HR & Admin ---");

    // Employer A creates standard schedule
    const createRes1 = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: "Standard Office Shift",
        description: "Monday to Friday standard office working hours",
        start_time: "09:00",
        end_time: "17:00",
        grace_period_minutes: 15,
        expected_hours: 8.0,
      }),
    });
    assert(createRes1.status === 201, "EMPLOYER PASS: Employer A created standard work schedule (201)");
    const scheduleA1 = createRes1.data.data;
    assert(scheduleA1.name === "Standard Office Shift", "Schedule name correctly saved");
    assert(scheduleA1.start_time === "09:00" && scheduleA1.end_time === "17:00", "Times saved in HH:mm format");
    assert(Number(scheduleA1.expected_hours) === 8.0, "Expected hours saved");
    assert(scheduleA1.grace_period_minutes === 15, "Grace period default saved");
    assert(scheduleA1.is_active === true, "Schedule active by default");

    // HR User A creates second schedule in Company A
    const createRes2 = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${hrUserA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: "Early Morning Shift",
        description: "07:00 to 15:30 with 30 min grace period",
        start_time: "07:00",
        end_time: "15:30",
        grace_period_minutes: 30,
        expected_hours: 8.5,
      }),
    });
    assert(createRes2.status === 201, "HR PASS: HR User A created second work schedule (201)");
    const scheduleA2 = createRes2.data.data;

    // Admin creates schedule in Company B
    const createAdminRes = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({
        companyId: companyB.id,
        name: "Logistics Day Shift",
        start_time: "08:00",
        end_time: "16:00",
      }),
    });
    assert(createAdminRes.status === 201, "ADMIN PASS: Global Admin created schedule in Company B (201)");
    const scheduleB1 = createAdminRes.data.data;

    // Manager A lists Company A schedules -> 200 (has shifts.view)
    const mgrListRes = await apiRequest(`/shifts/company/${companyA.id}`, {
      headers: { Authorization: `Bearer ${managerA.token}` },
    });
    assert(mgrListRes.status === 200, "MANAGER PASS: Manager A viewed company schedules (200)");
    assert(mgrListRes.data.data.length >= 2, "Company A has 2 schedules listed");

    // Employer A gets single schedule by ID
    const getRes = await apiRequest(`/shifts/${scheduleA1.id}`, {
      headers: { Authorization: `Bearer ${employerA.token}` },
    });
    assert(getRes.status === 200, "Employer A retrieved single schedule by ID");
    assert(getRes.data.data.id === scheduleA1.id, "Correct schedule returned");
    assert(getRes.data.data.assignedCount === 0, "Initial assignedCount is 0");

    // Employer A updates schedule
    const updateRes = await apiRequest(`/shifts/${scheduleA1.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        name: "Standard Office Shift (Updated)",
        grace_period_minutes: 20,
      }),
    });
    assert(updateRes.status === 200, "Employer A updated schedule details (200)");
    assert(updateRes.data.data.name === "Standard Office Shift (Updated)", "Updated name verified");
    assert(updateRes.data.data.grace_period_minutes === 20, "Updated grace period verified");

    // ----------------------------------------------------
    // 5. Testing Schedule Assignment to EmploymentRecord
    // ----------------------------------------------------
    console.log("\n--- 5. Testing Schedule Assignment & Unassignment ---");

    // HR User A assigns Schedule A1 to Worker A1
    const assignRes1 = await apiRequest(`/shifts/employment/${empRecordA1.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrUserA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });
    assert(assignRes1.status === 200, "HR User A assigned Schedule A1 to Worker A1 (200)");
    assert(assignRes1.data.data.work_schedule_id === scheduleA1.id, "Employment record references Schedule A1");

    // Employer A assigns Schedule A1 to Worker A2 via /api/employment/:id/schedule route
    const assignRes2 = await apiRequest(`/employment/${empRecordA2.id}/schedule`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });
    assert(assignRes2.status === 200, "Employer A assigned schedule via /employment/:id/schedule (200)");

    // Verify assigned employee count on Schedule A1
    const getCountRes = await apiRequest(`/shifts/${scheduleA1.id}`, {
      headers: { Authorization: `Bearer ${employerA.token}` },
    });
    assert(getCountRes.data.data.assignedCount === 2, "Schedule A1 assignedCount correctly reports 2");

    // View assigned employees for Schedule A1
    const assignedEmpsRes = await apiRequest(`/shifts/${scheduleA1.id}/employees`, {
      headers: { Authorization: `Bearer ${employerA.token}` },
    });
    assert(assignedEmpsRes.status === 200, "Retrieved employees assigned to Schedule A1");
    assert(assignedEmpsRes.data.data.length === 2, "Exactly 2 assigned employees returned");
    assert(
      assignedEmpsRes.data.data.some((e) => e.user_id === workerA1.user.id),
      "Worker A1 appears in assigned employee list"
    );

    // Worker A1 inspects personal assigned schedule
    const mySchedRes = await apiRequest(`/shifts/my/current?companyId=${companyA.id}`, {
      headers: { Authorization: `Bearer ${workerA1.token}` },
    });
    assert(mySchedRes.status === 200, "Worker A1 retrieved current assigned schedule");
    assert(mySchedRes.data.data.id === scheduleA1.id, "Worker A1 active schedule matches Schedule A1");

    // Change Worker A1 schedule from A1 to A2
    const changeSchedRes = await apiRequest(`/shifts/employment/${empRecordA1.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrUserA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA2.id }),
    });
    assert(changeSchedRes.status === 200, "Changed Worker A1 schedule from A1 to A2 (200)");
    assert(changeSchedRes.data.data.work_schedule_id === scheduleA2.id, "Schedule changed successfully");

    // Unassign Worker A2 schedule (workScheduleId: null)
    const unassignRes = await apiRequest(`/shifts/employment/${empRecordA2.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: null }),
    });
    assert(unassignRes.status === 200, "Unassigned Worker A2 schedule via null body (200)");
    assert(unassignRes.data.data.work_schedule_id === null, "Worker A2 work_schedule_id is now null");

    // ----------------------------------------------------
    // 6. Testing Inactive Schedule Rules & Survival
    // ----------------------------------------------------
    console.log("\n--- 6. Testing Inactive Schedule Rules & Assignment Survival ---");

    // Re-assign Schedule A1 to Worker A2
    await apiRequest(`/shifts/employment/${empRecordA2.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });

    // Deactivate Schedule A1
    const deactivateRes = await apiRequest(`/shifts/${scheduleA1.id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ is_active: false }),
    });
    assert(deactivateRes.status === 200, "Schedule A1 deactivated (200)");
    assert(deactivateRes.data.data.is_active === false, "is_active is now false");

    // Existing assignment survives: Worker A2 still has scheduleA1 assigned
    const checkWorkerA2 = await EmploymentRecord.findByPk(empRecordA2.id);
    assert(
      checkWorkerA2.work_schedule_id === scheduleA1.id,
      "SURVIVAL PASS: Existing employment assignment survives schedule deactivation"
    );

    // Attempting to newly assign inactive Schedule A1 to Worker A1 -> REJECTED (400)
    const assignInactiveRes = await apiRequest(`/shifts/employment/${empRecordA1.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });
    assert(assignInactiveRes.status === 400, "BUSINESS RULE PASS: Assigning inactive schedule rejected (400)");

    // Reactivate Schedule A1
    const reactivateRes = await apiRequest(`/shifts/${scheduleA1.id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ is_active: true }),
    });
    assert(reactivateRes.status === 200, "Schedule A1 reactivated (200)");

    // ----------------------------------------------------
    // 7. Testing Strict Multi-Tenant Isolation
    // ----------------------------------------------------
    console.log("\n--- 7. Testing Strict Multi-Tenant Isolation Boundaries ---");

    // Employer A lists Company B schedules -> 403
    const crossListRes = await apiRequest(`/shifts/company/${companyB.id}`, {
      headers: { Authorization: `Bearer ${employerA.token}` },
    });
    assert(crossListRes.status === 403, "TENANT PASS: Employer A cannot list Company B schedules (403)");

    // Employer A gets Company B schedule -> 403
    const crossGetRes = await apiRequest(`/shifts/${scheduleB1.id}`, {
      headers: { Authorization: `Bearer ${employerA.token}` },
    });
    assert(crossGetRes.status === 403, "TENANT PASS: Employer A cannot get Company B schedule (403)");

    // Employer A updates Company B schedule -> 403
    const crossUpdateRes = await apiRequest(`/shifts/${scheduleB1.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ name: "Hacked Schedule" }),
    });
    assert(crossUpdateRes.status === 403, "TENANT PASS: Employer A cannot update Company B schedule (403)");

    // Employer A assigns Company B schedule to Company A employee -> 400 rejected
    const crossAssignRes = await apiRequest(`/shifts/employment/${empRecordA1.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleB1.id }),
    });
    assert(
      crossAssignRes.status === 400,
      "TENANT PASS: Assigning Company B schedule to Company A employee rejected (400)"
    );

    // Employer B assigns Company A schedule to Company B employee -> 400 rejected
    const crossAssignRes2 = await apiRequest(`/shifts/employment/${empRecordB1.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerB.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });
    assert(
      crossAssignRes2.status === 400,
      "TENANT PASS: Assigning Company A schedule to Company B employee rejected (400)"
    );

    // Employer B deletes Company A schedule -> 403
    const crossDeleteRes = await apiRequest(`/shifts/${scheduleA1.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employerB.token}` },
    });
    assert(crossDeleteRes.status === 403, "TENANT PASS: Employer B cannot delete Company A schedule (403)");

    // ----------------------------------------------------
    // 8. Testing Validation Defenses
    // ----------------------------------------------------
    console.log("\n--- 8. Testing Validation Defenses ---");

    // Invalid time format ("9:00 AM" instead of HH:mm) -> 400
    const badTimeRes = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: "Bad Time Shift",
        start_time: "9:00 AM",
        end_time: "17:00",
      }),
    });
    assert(badTimeRes.status === 400, "VALIDATION PASS: Non-24h time format rejected (400)");

    // Negative grace period -> 400
    const negGraceRes = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        name: "Negative Grace",
        start_time: "09:00",
        end_time: "17:00",
        grace_period_minutes: -10,
      }),
    });
    assert(negGraceRes.status === 400, "VALIDATION PASS: Negative grace period rejected (400)");

    // Missing name -> 400
    const missingNameRes = await apiRequest("/shifts", {
      method: "POST",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({
        companyId: companyA.id,
        start_time: "09:00",
        end_time: "17:00",
      }),
    });
    assert(missingNameRes.status === 400, "VALIDATION PASS: Missing name rejected (400)");

    // Invalid UUID for employment -> 404/400
    const badUuidRes = await apiRequest("/shifts/employment/invalid-uuid", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${employerA.token}` },
      body: JSON.stringify({ workScheduleId: scheduleA1.id }),
    });
    assert(badUuidRes.status >= 400, "VALIDATION PASS: Invalid employment UUID rejected");

    console.log("\n==================================================");
    console.log("ALL SHIFT & WORK SCHEDULE API TESTS PASSED 100%!");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ SUITE FAILED WITH ERROR:", err);
    process.exit(1);
  }
}

runShiftScheduleTests();
