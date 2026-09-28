require("dotenv").config();

const BASE_URL = "http://127.0.0.1:5000/api";
const bcrypt = require("bcryptjs");
const { User, Role, UserRole, EmployeeProfile } = require("./src/models");

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function run() {
  const timestamp = Date.now();
  const password = "Password123!";
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [adminRole, jobSeekerRole, employeeRole, employerRole] = await Promise.all(
      ["ADMIN", "JOB_SEEKER", "EMPLOYEE", "EMPLOYER"].map((name) => Role.findOne({ where: { name } }))
    );
    assert(adminRole && jobSeekerRole && employeeRole && employerRole, "required global roles exist");

    const adminEmail = `role_safety_admin_${timestamp}@test.com`;
    const employeeEmail = `role_safety_user_${timestamp}@test.com`;
    const admin = await User.create({ first_name: "Role", last_name: "Admin", email: adminEmail, password_hash });
    const employee = await User.create({ first_name: "Role", last_name: "Safety", email: employeeEmail, password_hash });
    await Promise.all([
      UserRole.create({ user_id: admin.id, role_id: adminRole.id }),
      UserRole.create({ user_id: employee.id, role_id: jobSeekerRole.id }),
      EmployeeProfile.create({ user_id: employee.id }),
    ]);

    const login = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: adminEmail, password }),
    });
    assert(login.status === 200, "admin can authenticate");
    const auth = { Authorization: `Bearer ${login.data.data.token}` };

    const legacyCreate = await apiRequest("/employees", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ first_name: "Orphan", last_name: "Attempt", email: `orphan_${timestamp}@test.com`, password }),
    });
    assert(legacyCreate.status === 410, "platform admin cannot create an orphan employee");

    const assign = async (role) => apiRequest(`/employees/${employee.id}/role`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ role }),
    });
    const roleNames = async () => (await User.findByPk(employee.id, {
      include: [{ model: Role, through: { attributes: [] } }],
    })).Roles.map((role) => role.name).sort();

    let result = await assign("EMPLOYEE");
    assert(result.status === 200, "assigning EMPLOYEE succeeds");
    assert(JSON.stringify(await roleNames()) === JSON.stringify(["EMPLOYEE", "JOB_SEEKER"]), "adding EMPLOYEE preserves JOB_SEEKER");

    result = await assign("EMPLOYER");
    assert(result.status === 200, "assigning EMPLOYER succeeds");
    assert(JSON.stringify(await roleNames()) === JSON.stringify(["EMPLOYEE", "EMPLOYER", "JOB_SEEKER"]), "adding EMPLOYER preserves all prior roles");

    result = await assign("EMPLOYEE");
    assert(result.status === 200, "duplicate EMPLOYEE assignment succeeds");
    assert(await UserRole.count({ where: { user_id: employee.id, role_id: employeeRole.id } }) === 1, "duplicate assignment creates no junction duplicate");

    result = await assign("HR");
    assert(result.status >= 400 && result.status < 500, "company role is rejected by global role endpoint");
    result = await assign("NOT_A_ROLE");
    assert(result.status >= 400 && result.status < 500, "unknown role is rejected");
    assert(JSON.stringify(await roleNames()) === JSON.stringify(["EMPLOYEE", "EMPLOYER", "JOB_SEEKER"]), "rejected assignments do not modify existing roles");
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
