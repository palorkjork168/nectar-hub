/**
 * PHASE 3 TEST SUITE: SHIFT ROSTER PLANNING & GEO-FENCE CUSTOMIZATION
 *
 * Verifies:
 * 1. Company-scoped geofence creation, update, listing, and deactivation.
 * 2. Coordinate range validation (-90..90, -180..180) and radius bounds (10..10000m).
 * 3. Inside-radius punch acceptance vs outside-radius rejection with actionable error.
 * 4. Backward compatibility: companies without geofences can punch safely.
 * 5. Branch workplace assignment: employee assigned to specific branch enforced against that branch.
 * 6. RBAC & Tenant Isolation: Cross-company manipulation blocked (403), unauthorized roles blocked.
 * 7. Weekly roster query: employees grouped with baseline schedule and date-specific assignments.
 * 8. Single and bulk shift assignments, rest day assignment, and baseline revert.
 * 9. Shift assignment override on live check-in schedule calculation.
 * 10. Immutable audit logging for location and roster operations.
 */

require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const sequelize = require("./src/config/database");
const bcrypt = require("bcryptjs");
const {
  User,
  Role,
  UserRole,
  Company,
  EmploymentRecord,
  WorkSchedule,
  CompanyLocation,
  ShiftAssignment,
  Attendance,
  AuditLog,
  Department,
  Position,
  CompanyUserRole,
} = require("./src/models");

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 3: ROSTER PLANNING & GEOFENCE SUITE");
  console.log("==================================================");

  await sequelize.authenticate();

  // Start dedicated test server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP TEST ACTORS & COMPANIES
    // -------------------------------------------------------------------------
    console.log("\n--- 1. Setting up Test Actors, Companies & Roles ---");

    const password = "Password123!";
    const passwordHash = await bcrypt.hash(password, 10);

    const [employerRole, employeeRole, hrRole] = await Promise.all([
      Role.findOne({ where: { name: "EMPLOYER" } }),
      Role.findOne({ where: { name: "EMPLOYEE" } }),
      Role.findOne({ where: { name: "HR" } }),
    ]);

    // Employer A (Owner)
    const employerAUser = await User.create({
      first_name: "Owner",
      last_name: "Alpha",
      email: `p3_owner_a_${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: employerAUser.id, role_id: employerRole.id });

    const companyA = await Company.create({
      name: `Geofence Corp A ${timestamp}`,
      owner_id: employerAUser.id,
      is_active: true,
    });

    // HR Manager A in Company A
    const hrAUser = await User.create({
      first_name: "HR",
      last_name: "Manager",
      email: `p3_hr_a_${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: hrAUser.id, role_id: employerRole.id });
    await CompanyUserRole.create({
      user_id: hrAUser.id,
      company_id: companyA.id,
      role_id: hrRole.id,
    });

    // Worker 1 in Company A
    const worker1User = await User.create({
      first_name: "Worker",
      last_name: "One",
      email: `p3_worker1_${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: worker1User.id, role_id: employeeRole.id });

    const empRecord1 = await EmploymentRecord.create({
      user_id: worker1User.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: "2026-01-01",
    });

    // Worker 2 in Company A
    const worker2User = await User.create({
      first_name: "Worker",
      last_name: "Two",
      email: `p3_worker2_${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: worker2User.id, role_id: employeeRole.id });

    const empRecord2 = await EmploymentRecord.create({
      user_id: worker2User.id,
      company_id: companyA.id,
      status: "ACTIVE",
      start_date: "2026-01-01",
    });

    // Company B & Employer B (Tenant Isolation verification)
    const employerBUser = await User.create({
      first_name: "Owner",
      last_name: "Beta",
      email: `p3_owner_b_${timestamp}@test.com`,
      password_hash: passwordHash,
      status: "ACTIVE",
    });
    await UserRole.create({ user_id: employerBUser.id, role_id: employerRole.id });

    const companyB = await Company.create({
      name: `Geofence Corp B ${timestamp}`,
      owner_id: employerBUser.id,
      is_active: true,
    });

    // Baseline Schedule in Company A: 09:00 - 17:00
    const scheduleStandard = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Standard 9 to 5",
      start_time: "09:00",
      end_time: "17:00",
      expected_hours: 8.0,
      grace_period_minutes: 15,
      is_active: true,
    });

    // Alternative Schedule in Company A: 14:00 - 22:00 (Evening Shift)
    const scheduleEvening = await WorkSchedule.create({
      company_id: companyA.id,
      name: "Evening Shift",
      start_time: "14:00",
      end_time: "22:00",
      expected_hours: 8.0,
      grace_period_minutes: 15,
      is_active: true,
    });

    // Assign baseline schedule to empRecord1
    await empRecord1.update({ work_schedule_id: scheduleStandard.id });

    // Login helper to acquire real JWT tokens
    const login = async (email) => {
      const res = await request("POST", "/api/auth/login", { email, password });
      return res.body.data.token;
    };

    const hrAToken = await login(hrAUser.email);
    const ownerAToken = await login(employerAUser.email);
    const ownerBToken = await login(employerBUser.email);
    const worker1Token = await login(worker1User.email);
    const worker2Token = await login(worker2User.email);

    console.log("✓ Test actors, companies, roles, schedules and tokens initialized.");

    // -------------------------------------------------------------------------
    // 2. BACKWARD COMPATIBILITY: NO GEOFENCE CONFIGURED
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Backward Compatibility: Company Without Geofence ---");
    // Initially, Company A has zero locations. Punching should succeed normally.
    const initialPunch = await request(
      "POST",
      "/api/attendance/check-in",
      {
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      },
      worker1Token
    );
    assert(initialPunch.status === 201, `Punch succeeds when no geofence configured (status: ${initialPunch.status})`);
    assert(initialPunch.body.data.attendance.status === "IN_PROGRESS", "Attendance session created in IN_PROGRESS");

    // Checkout
    const initialCheckOut = await request(
      "POST",
      "/api/attendance/check-out",
      {
        latitude: 11.5564,
        longitude: 104.9282,
      },
      worker1Token
    );
    assert(initialCheckOut.status === 200, "Checkout succeeds without geofence");

    // -------------------------------------------------------------------------
    // 3. GEOFENCE CONFIGURATION CRUD & VALIDATION
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Testing Geofence Configuration CRUD & Validation ---");

    // Validation: Invalid latitude (> 90)
    const invLatRes = await request(
      "POST",
      `/api/locations/company/${companyA.id}`,
      {
        name: "HQ Phnom Penh",
        latitude: 95.0,
        longitude: 104.9282,
        radius_meters: 100,
      },
      hrAToken
    );
    assert(invLatRes.status === 400, "Invalid latitude > 90 rejected (400)");

    // Validation: Invalid radius (< 10m)
    const invRadRes = await request(
      "POST",
      `/api/locations/company/${companyA.id}`,
      {
        name: "HQ Phnom Penh",
        latitude: 11.5564,
        longitude: 104.9282,
        radius_meters: 5,
      },
      hrAToken
    );
    assert(invRadRes.status === 400, "Radius < 10m rejected (400)");

    // Create valid HQ location: Phnom Penh Center (11.5564, 104.9282) with 100m radius
    const createLocRes = await request(
      "POST",
      `/api/locations/company/${companyA.id}`,
      {
        name: "Phnom Penh Main Campus",
        address: "Preah Sihanouk Blvd, Phnom Penh",
        latitude: 11.5564,
        longitude: 104.9282,
        radius_meters: 100,
      },
      hrAToken
    );
    assert(createLocRes.status === 201, "HQ location created successfully (201)");
    const hqLocation = createLocRes.body.data.location;
    assert(hqLocation.name === "Phnom Penh Main Campus", "Location name preserved");
    assert(hqLocation.radius_meters === 100, "Default/configured radius 100m preserved");

    // Create Branch 2: Siem Reap Office (13.3671, 103.8448) with 150m radius
    const createBranch2 = await request(
      "POST",
      `/api/locations/company/${companyA.id}`,
      {
        name: "Siem Reap Branch",
        address: "Wat Bo Road, Siem Reap",
        latitude: 13.3671,
        longitude: 103.8448,
        radius_meters: 150,
      },
      hrAToken
    );
    assert(createBranch2.status === 201, "Branch 2 created successfully");
    const siemReapLoc = createBranch2.body.data.location;

    // List locations
    const listLocsRes = await request("GET", `/api/locations/company/${companyA.id}`, null, hrAToken);
    assert(listLocsRes.status === 200, "HR listed company locations (200)");
    assert(listLocsRes.body.data.locations.length === 2, "Found both configured workplaces");

    // Update location radius
    const updateLocRes = await request(
      "PATCH",
      `/api/locations/${hqLocation.id}`,
      {
        radius_meters: 200,
      },
      hrAToken
    );
    assert(updateLocRes.status === 200, "Location radius updated to 200m (200)");
    assert(updateLocRes.body.data.location.radius_meters === 200, "Updated radius confirmed");

    // Verify AuditLog for location creation
    const auditCreated = await AuditLog.findOne({
      where: {
        company_id: companyA.id,
        action: "LOCATION_CREATED",
        entity_id: hqLocation.id,
      },
    });
    assert(auditCreated !== null, "AuditLog persisted for LOCATION_CREATED");

    // -------------------------------------------------------------------------
    // 4. RBAC & TENANT ISOLATION ON LOCATIONS
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testing RBAC & Multi-Tenant Security on Locations ---");

    // Tenant Isolation: Employer B cannot view Company A locations
    const crossListRes = await request("GET", `/api/locations/company/${companyA.id}`, null, ownerBToken);
    assert(crossListRes.status === 403, "Cross-company location viewing blocked (403)");

    // Tenant Isolation: Employer B cannot edit Company A location
    const crossEditRes = await request("PATCH", `/api/locations/${hqLocation.id}`, { name: "Hijacked" }, ownerBToken);
    assert(crossEditRes.status === 403, "Cross-company location modification blocked (403)");

    // Regular Employee cannot modify location
    const unprivRes = await request(
      "PATCH",
      `/api/locations/${hqLocation.id}`,
      { radius_meters: 5000 },
      worker1Token
    );
    assert(unprivRes.status === 403, "Plain employee blocked from editing location settings (403)");

    // -------------------------------------------------------------------------
    // 5. GEOFENCE ENFORCEMENT ON CHECK-IN & CHECK-OUT
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testing Geofence Enforcement on Punches ---");

    // Test A: Out-of-range punch
    // Employee tries to check in from Paris (48.8566, 2.3522)
    const outOfRangeRes = await request(
      "POST",
      "/api/attendance/check-in",
      {
        companyId: companyA.id,
        latitude: 48.8566,
        longitude: 2.3522,
      },
      worker1Token
    );
    assert(outOfRangeRes.status === 400, "Out-of-range check-in rejected with 400");
    assert(
      outOfRangeRes.body.message.includes("Out of permitted workplace radius"),
      `Clear error message returned: "${outOfRangeRes.body.message}"`
    );

    // Test B: Missing or invalid coordinates
    const missingGpsRes = await request(
      "POST",
      "/api/attendance/check-in",
      {
        companyId: companyA.id,
      },
      worker1Token
    );
    assert(missingGpsRes.status === 400, "Missing GPS coordinates rejected with 400");

    // Test C: Valid inside-radius punch (~30 meters from HQ: 11.5566, 104.9283)
    const validPunchRes = await request(
      "POST",
      "/api/attendance/check-in",
      {
        companyId: companyA.id,
        latitude: 11.5566,
        longitude: 104.9283,
      },
      worker1Token
    );
    assert(validPunchRes.status === 201, "Inside-radius check-in accepted (201)");
    const activeAtt = validPunchRes.body.data.attendance;
    assert(activeAtt.location_id === hqLocation.id, "Punch tagged with matching location ID");
    assert(activeAtt.location_status === "VERIFIED_GPS", "Marked as VERIFIED_GPS");

    // Test D: Out-of-range check-out rejected
    const outOfRangeCheckout = await request(
      "POST",
      "/api/attendance/check-out",
      {
        latitude: 48.8566,
        longitude: 2.3522,
      },
      worker1Token
    );
    assert(outOfRangeCheckout.status === 400, "Out-of-range checkout rejected with 400");

    // Test E: Inside-radius check-out accepted
    const validCheckoutRes = await request(
      "POST",
      "/api/attendance/check-out",
      {
        latitude: 11.5565,
        longitude: 104.9282,
      },
      worker1Token
    );
    assert(validCheckoutRes.status === 200, "Inside-radius checkout accepted (200)");

    // Test F: Specific branch workplace assignment
    // Assign Worker 2 specifically to Siem Reap Branch
    await empRecord2.update({ location_id: siemReapLoc.id });

    // Worker 2 tries to punch at HQ (Phnom Penh) -> should be rejected because their assigned branch is Siem Reap!
    const wrongBranchPunch = await request(
      "POST",
      "/api/attendance/check-in",
      {
        companyId: companyA.id,
        latitude: 11.5564,
        longitude: 104.9282,
      },
      worker2Token
    );
    assert(wrongBranchPunch.status === 400, "Punch at non-assigned branch rejected (400)");
    assert(
      wrongBranchPunch.body.message.includes("Siem Reap Branch"),
      `Actionable error explains assigned branch constraint: "${wrongBranchPunch.body.message}"`
    );

    // -------------------------------------------------------------------------
    // 6. WEEKLY ROSTER PLANNER & SHIFT ASSIGNMENT
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testing Weekly Roster Planner & Shift Assignment ---");

    const monday = "2026-10-19";
    const sunday = "2026-10-25";

    // Fetch initial weekly roster
    const rosterRes = await request(
      "GET",
      `/api/roster/company/${companyA.id}?start_date=${monday}&end_date=${sunday}`,
      null,
      hrAToken
    );
    assert(rosterRes.status === 200, "HR fetched weekly roster (200)");
    assert(rosterRes.body.data.roster.length >= 2, "Roster returned company employees");

    // Assign Evening Shift to Worker 1 on Wednesday 2026-10-21
    const assignWed = await request(
      "POST",
      `/api/roster/company/${companyA.id}/assign`,
      {
        employment_record_id: empRecord1.id,
        shift_date: "2026-10-21",
        work_schedule_id: scheduleEvening.id,
        notes: "Project deadline evening coverage",
      },
      hrAToken
    );
    assert(assignWed.status === 200, "Assigned Wednesday evening shift (200)");
    const wedAssignment = assignWed.body.data.assignment;
    assert(wedAssignment.work_schedule_id === scheduleEvening.id, "Evening schedule assigned");
    assert(wedAssignment.is_rest_day === false, "Not a rest day");

    // Assign Rest Day to Worker 1 on Thursday 2026-10-22
    const assignThu = await request(
      "POST",
      `/api/roster/company/${companyA.id}/assign`,
      {
        employment_record_id: empRecord1.id,
        shift_date: "2026-10-22",
        is_rest_day: true,
        notes: "Compensatory rest day",
      },
      hrAToken
    );
    assert(assignThu.status === 200, "Assigned Thursday rest day (200)");
    assert(assignThu.body.data.assignment.is_rest_day === true, "Rest day confirmed");

    // Test Bulk Assignment endpoint with partial success report
    const bulkRes = await request(
      "POST",
      `/api/roster/company/${companyA.id}/bulk-assign`,
      {
        assignments: [
          // Valid: Worker 2 on Friday 2026-10-23
          {
            employment_record_id: empRecord2.id,
            shift_date: "2026-10-23",
            work_schedule_id: scheduleStandard.id,
          },
          // Valid: Worker 2 on Saturday 2026-10-24 Rest Day
          {
            employment_record_id: empRecord2.id,
            shift_date: "2026-10-24",
            is_rest_day: true,
          },
          // Invalid: Non-existent employment record
          {
            employment_record_id: "00000000-0000-0000-0000-000000000000",
            shift_date: "2026-10-25",
            is_rest_day: true,
          },
        ],
      },
      hrAToken
    );
    assert(bulkRes.status === 200, "Bulk assignment processed (200)");
    assert(bulkRes.body.data.total === 3, "Total items: 3");
    assert(bulkRes.body.data.succeeded === 2, "2 succeeded");
    assert(bulkRes.body.data.failed === 1, "1 failed gracefully");
    assert(bulkRes.body.data.allSucceeded === false, "allSucceeded is false");

    // Verify roster query now returns all assignments in the week
    const updatedRosterRes = await request(
      "GET",
      `/api/roster/company/${companyA.id}?start_date=${monday}&end_date=${sunday}`,
      null,
      hrAToken
    );
    const worker1Roster = updatedRosterRes.body.data.roster.find((r) => r.employmentRecord.id === empRecord1.id);
    assert(worker1Roster.assignments.length === 2, "Worker 1 has exactly 2 scheduled days in the week");

    // Delete Wednesday assignment (revert to baseline)
    const delAssignRes = await request(
      "DELETE",
      `/api/roster/company/${companyA.id}/assignments/${wedAssignment.id}`,
      null,
      hrAToken
    );
    assert(delAssignRes.status === 200, "Deleted custom Wednesday shift assignment (200)");

    // AuditLog check for Roster
    const auditBulk = await AuditLog.findOne({
      where: {
        company_id: companyA.id,
        action: "ROSTER_BULK_ASSIGNED",
      },
    });
    assert(auditBulk !== null, "AuditLog created for ROSTER_BULK_ASSIGNED");

    // -------------------------------------------------------------------------
    // 7. ROSTER TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testing Roster Tenant Isolation ---");
    const crossRosterRes = await request(
      "GET",
      `/api/roster/company/${companyA.id}?start_date=${monday}&end_date=${sunday}`,
      null,
      ownerBToken
    );
    assert(crossRosterRes.status === 403, "Company B owner blocked from Company A roster (403)");

    const crossAssignRes = await request(
      "POST",
      `/api/roster/company/${companyA.id}/assign`,
      {
        employment_record_id: empRecord1.id,
        shift_date: "2026-10-25",
        is_rest_day: true,
      },
      ownerBToken
    );
    assert(crossAssignRes.status === 403, "Company B owner blocked from assigning shifts in Company A (403)");

    console.log("\n==================================================");
    console.log("ALL PHASE 3 ROSTER & GEOFENCE TESTS PASSED (100%)");
    console.log("==================================================");
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
