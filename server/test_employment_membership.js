require("dotenv").config();

const bcrypt = require("bcryptjs");
const { User, Role, UserRole, Company, CompanyUserRole } = require("./src/models");
const employmentService = require("./src/services/employment.service");

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
  const timestamp = Date.now();
  const password = "Password123!";
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [employeeRole, hrRole] = await Promise.all([
      Role.findOne({ where: { name: "EMPLOYEE" } }),
      Role.findOne({ where: { name: "HR" } }),
    ]);
    assert(employeeRole && hrRole, "required employee and company roles exist");

    const owner = await User.create({ first_name: "Membership", last_name: "Owner", email: `membership_owner_${timestamp}@test.com`, password_hash });
    const member = await User.create({ first_name: "Active", last_name: "Member", email: `membership_member_${timestamp}@test.com`, password_hash });
    const companyAOnlyMember = await User.create({ first_name: "Company A", last_name: "Only", email: `membership_a_only_${timestamp}@test.com`, password_hash });
    const companyBOnlyMember = await User.create({ first_name: "Company B", last_name: "Only", email: `membership_b_only_${timestamp}@test.com`, password_hash });
    const globalOnly = await User.create({ first_name: "Global", last_name: "Only", email: `membership_global_${timestamp}@test.com`, password_hash });
    await UserRole.create({ user_id: globalOnly.id, role_id: employeeRole.id });
    const companyA = await Company.create({ owner_id: owner.id, name: `Membership A ${timestamp}` });
    const companyB = await Company.create({ owner_id: owner.id, name: `Membership B ${timestamp}` });

    await employmentService.createEmployment({ user_id: member.id, company_id: companyA.id, status: "ACTIVE" });
    await employmentService.createEmployment({ user_id: member.id, company_id: companyB.id, status: "ACTIVE" });
    await employmentService.createEmployment({ user_id: companyAOnlyMember.id, company_id: companyA.id, status: "ACTIVE" });
    await employmentService.createEmployment({ user_id: companyBOnlyMember.id, company_id: companyB.id, status: "ACTIVE" });
    assert((await employmentService.getActiveEmployments(member.id)).length === 2, "a user may have active employment at two companies");
    assert(await employmentService.hasActiveEmployment(member.id, companyA.id), "active employment lookup resolves by user and company");

    try {
      await employmentService.createEmployment({ user_id: member.id, company_id: companyA.id, status: "ACTIVE" });
      throw new Error("duplicate active employment was accepted");
    } catch (error) {
      assert(error.statusCode === 409, "duplicate active employment for the same company is rejected");
    }

    const terminated = await User.create({ first_name: "Former", last_name: "Member", email: `membership_terminated_${timestamp}@test.com`, password_hash });
    const terminatedOnly = await User.create({ first_name: "Past", last_name: "Only", email: `membership_terminated_only_${timestamp}@test.com`, password_hash });
    await employmentService.createEmployment({ user_id: terminated.id, company_id: companyA.id, status: "TERMINATED" });
    await employmentService.createEmployment({ user_id: terminatedOnly.id, company_id: companyA.id, status: "TERMINATED" });
    assert(!await employmentService.hasActiveEmployment(terminated.id, companyA.id), "terminated employment does not establish active membership");
    await employmentService.createEmployment({ user_id: terminated.id, company_id: companyA.id, status: "ACTIVE" });
    assert(await employmentService.hasActiveEmployment(terminated.id, companyA.id), "historical terminated employment permits a later active record");

    const login = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: owner.email, password }),
    });
    assert(login.status === 200, "company owner can authenticate");
    const headers = { Authorization: `Bearer ${login.data.data.token}` };
    let result = await apiRequest(`/companies/${companyA.id}/employees`, { headers });
    assert(result.status === 200, "company owner can list company employees");
    const listedIds = result.data.data.employees.map((entry) => entry.employee.user.id);
    assert(listedIds.includes(member.id) && listedIds.includes(companyAOnlyMember.id), "active Company A members appear in its directory");
    assert(!listedIds.includes(globalOnly.id), "global EMPLOYEE role without employment is not in company directory");
    assert(!listedIds.includes(terminatedOnly.id), "terminated employment is excluded from active company directory");
    assert(!listedIds.includes(companyBOnlyMember.id), "Company B employee is excluded from Company A directory");

    const assignRole = (companyId, user_id) => apiRequest(`/companies/${companyId}/team/roles`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id, role_name: "HR" }),
    });

    result = await assignRole(companyA.id, member.id);
    assert(result.status === 200, "active company member can receive HR role");
    result = await assignRole(companyA.id, member.id);
    assert(result.status === 200, "duplicate company role assignment remains idempotent");
    assert(await CompanyUserRole.count({ where: { user_id: member.id, company_id: companyA.id, role_id: hrRole.id } }) === 1, "duplicate company role creates no duplicate row");
    result = await assignRole(companyA.id, globalOnly.id);
    assert(result.status >= 400 && result.status < 500, "global EMPLOYEE without employment cannot receive company role");
    result = await assignRole(companyA.id, terminatedOnly.id);
    assert(result.status >= 400 && result.status < 500, "terminated employment cannot receive a company role");
    result = await assignRole(companyB.id, companyAOnlyMember.id);
    assert(result.status >= 400 && result.status < 500, "member of Company A cannot receive a Company B role without Company B employment");

    const hrLogin = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: member.email, password }),
    });
    const hrDirectory = await apiRequest(`/companies/${companyA.id}/employees`, {
      headers: { Authorization: `Bearer ${hrLogin.data.data.token}` },
    });
    assert(hrDirectory.status === 200, "HR with employees.view can list company employees");

    const outsider = await User.create({ first_name: "Outside", last_name: "User", email: `membership_outside_${timestamp}@test.com`, password_hash });
    const outsiderLogin = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: outsider.email, password }),
    });
    const denied = await apiRequest(`/companies/${companyA.id}/employees`, {
      headers: { Authorization: `Bearer ${outsiderLogin.data.data.token}` },
    });
    assert(denied.status >= 400 && denied.status < 500, "unauthorized user cannot list another company's employees");

    const teamResult = await apiRequest(`/companies/${companyA.id}/team`, { headers });
    const regularMember = teamResult.data.data.team.find((entry) => entry.user_id === companyAOnlyMember.id);
    assert(regularMember && regularMember.company_roles.length === 0, "regular employee remains separate from company role assignments");
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
