require("dotenv").config();

const bcrypt = require("bcryptjs");
const {
  User, Role, UserRole, Company, Job, Application, Department, Position,
  EmployeeProfile, EmploymentRecord,
} = require("./src/models");

const BASE_URL = "http://127.0.0.1:5000/api";

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
}

async function run() {
  const stamp = Date.now();
  const password = "Password123!";
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [employerRole, seekerRole, employeeRole] = await Promise.all(
      ["EMPLOYER", "JOB_SEEKER", "EMPLOYEE"].map((name) => Role.findOne({ where: { name } }))
    );
    assert(employerRole && seekerRole && employeeRole, "required global roles exist");

    const owner = await User.create({ first_name: "Structured", last_name: "Owner", email: `structured_owner_${stamp}@test.com`, password_hash });
    await UserRole.create({ user_id: owner.id, role_id: employerRole.id });
    const companyA = await Company.create({ owner_id: owner.id, name: `Structured A ${stamp}` });
    const companyB = await Company.create({ owner_id: owner.id, name: `Structured B ${stamp}` });
    const engineering = await Department.create({ company_id: companyA.id, name: "Engineering" });
    const finance = await Department.create({ company_id: companyA.id, name: "Finance" });
    const foreignDepartment = await Department.create({ company_id: companyB.id, name: "Foreign Department" });
    const inactiveDepartment = await Department.create({ company_id: companyA.id, name: "Inactive Department", is_active: false });
    const engineer = await Position.create({ company_id: companyA.id, department_id: engineering.id, title: "Engineer" });
    const accountant = await Position.create({ company_id: companyA.id, department_id: finance.id, title: "Accountant" });
    const foreignPosition = await Position.create({ company_id: companyB.id, title: "Foreign Position" });
    const inactivePosition = await Position.create({ company_id: companyA.id, title: "Inactive Position", is_active: false });
    const job = await Job.create({ company_id: companyA.id, title: "Structured Hiring", description: "Test job", employment_type: "FULL_TIME", location: "Phnom Penh", status: "PUBLISHED" });

    const login = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email: owner.email, password }) });
    assert(login.status === 200, "employer can authenticate");
    const headers = { Authorization: `Bearer ${login.data.data.token}` };
    const candidate = async (name, extraRoles = []) => {
      const user = await User.create({ first_name: name, last_name: "Candidate", email: `structured_${name}_${stamp}@test.com`, password_hash });
      await UserRole.create({ user_id: user.id, role_id: seekerRole.id });
      for (const role of extraRoles) await UserRole.create({ user_id: user.id, role_id: role.id });
      const application = await Application.create({ job_id: job.id, user_id: user.id, status: "ACCEPTED" });
      return { user, application };
    };
    const hire = (applicationId, body) => apiRequest(`/applications/${applicationId}/hire`, { method: "POST", headers, body: JSON.stringify(body) });

    const valid = await candidate("valid", [employerRole]);
    const validPayload = { departmentId: engineering.id, positionId: engineer.id, employmentType: "CONTRACT", startDate: "2026-10-01" };
    let result = await hire(valid.application.id, validPayload);
    assert(result.status === 200, "valid structured hire succeeds");
    const record = await EmploymentRecord.findOne({ where: { user_id: valid.user.id, company_id: companyA.id, status: "ACTIVE" } });
    assert(record.department_id === engineering.id && record.position_id === engineer.id, "employment record stores department and position");
    assert(record.employment_type === "CONTRACT" && record.start_date === "2026-10-01", "employment record stores type and DATEONLY start date");
    assert(await EmployeeProfile.count({ where: { user_id: valid.user.id, department: "Engineering" } }) === 1, "legacy profile mirrors selected department name");
    assert(await UserRole.count({ where: { user_id: valid.user.id, role_id: employeeRole.id } }) === 1, "EMPLOYEE is added once while existing roles remain");
    assert(result.data.data.employmentRecord.department.id === engineering.id, "hire response contains structured employment data");

    result = await hire(valid.application.id, { departmentId: finance.id, positionId: accountant.id, employmentType: "FULL_TIME", startDate: "2026-11-01" });
    assert(result.status === 200 && result.data.data.is_already_hired, "repeat hire returns existing employment");
    const unchanged = await EmploymentRecord.findByPk(record.id);
    assert(unchanged.department_id === engineering.id && unchanged.position_id === engineer.id, "repeat hire with different values does not mutate employment");
    assert(await EmploymentRecord.count({ where: { user_id: valid.user.id, company_id: companyA.id, status: "ACTIVE" } }) === 1, "repeat hire creates no duplicate active employment");

    const expectRejected = async (name, payload, message) => {
      const testCandidate = await candidate(name);
      const response = await hire(testCandidate.application.id, payload);
      assert(response.status >= 400 && response.status < 500, message);
      assert(await UserRole.count({ where: { user_id: testCandidate.user.id, role_id: employeeRole.id } }) === 0, `${message}: no partial EMPLOYEE role`);
      assert(await EmploymentRecord.count({ where: { user_id: testCandidate.user.id } }) === 0, `${message}: no partial employment record`);
    };

    await expectRejected("foreign_dept", { departmentId: foreignDepartment.id }, "cross-company department is rejected");
    await expectRejected("foreign_position", { positionId: foreignPosition.id }, "cross-company position is rejected");
    await expectRejected("inactive_dept", { departmentId: inactiveDepartment.id }, "inactive department is rejected");
    await expectRejected("inactive_position", { positionId: inactivePosition.id }, "inactive position is rejected");
    await expectRejected("mismatch", { departmentId: engineering.id, positionId: accountant.id }, "position and department mismatch is rejected");

    const derived = await candidate("derived");
    result = await hire(derived.application.id, { positionId: engineer.id, employmentType: "FULL_TIME", startDate: "2026-10-02" });
    assert(result.status === 200, "position-only structured hire succeeds");
    assert((await EmploymentRecord.findOne({ where: { user_id: derived.user.id, company_id: companyA.id } })).department_id === engineering.id, "position department is derived when department is omitted");
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
