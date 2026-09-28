require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User, Role, UserRole, Company, LeaveType, LeaveRequest } = require("./src/models");
const employmentService = require("./src/services/employment.service");
const BASE = "http://127.0.0.1:5000/api";
const assert = (ok, msg) => { if (!ok) throw new Error(msg); console.log(`PASS: ${msg}`); };
async function api(path, options = {}) { const r = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); return { status: r.status, data: await r.json().catch(() => ({})) }; }
async function run() {
  const t = Date.now(), password = "Password123!", password_hash = await bcrypt.hash(password, 10);
  try {
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    const worker = await User.create({ first_name: "Leave", last_name: "Worker", email: `leave_worker_${t}@test.com`, password_hash });
    const outsider = await User.create({ first_name: "Leave", last_name: "Outsider", email: `leave_out_${t}@test.com`, password_hash });
    const ownerA = await User.create({ first_name: "Leave", last_name: "Owner", email: `leave_owner_${t}@test.com`, password_hash });
    await Promise.all([UserRole.create({ user_id: worker.id, role_id: employeeRole.id }), UserRole.create({ user_id: outsider.id, role_id: employeeRole.id })]);
    const a = await Company.create({ owner_id: ownerA.id, name: `Leave A ${t}` }), b = await Company.create({ owner_id: ownerA.id, name: `Leave B ${t}` });
    await employmentService.createEmployment({ user_id: worker.id, company_id: a.id }); await employmentService.createEmployment({ user_id: worker.id, company_id: b.id });
    const typeA = await LeaveType.create({ company_id: a.id, name: "Annual A", default_days: 12 }); const typeB = await LeaveType.create({ company_id: b.id, name: "Annual B", default_days: 4 });
    const login = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: worker.email, password }) }); const auth = { Authorization: `Bearer ${login.data.data.token}` };
    const submit = (companyId, leave_type_id, start_date, end_date) => api("/leave/requests", { method: "POST", headers: auth, body: JSON.stringify({ companyId, leave_type_id, start_date, end_date, reason: "Test leave" }) });
    let result = await submit(a.id, typeA.id, "2026-10-10", "2026-10-12"); assert(result.status === 201 && result.data.data.company_id === a.id, "Company A leave is stored in Company A");
    result = await submit(b.id, typeB.id, "2026-10-10", "2026-10-12"); assert(result.status === 201, "Company B overlapping leave is independent");
    result = await submit(a.id, typeA.id, "2026-10-11", "2026-10-13"); assert(result.status === 409, "same-company overlap is rejected");
    result = await submit(a.id, typeB.id, "2026-11-01", "2026-11-01"); assert(result.status >= 400 && result.status < 500, "wrong-company leave type is rejected");
    result = await api(`/leave/balance?companyId=${a.id}`, { headers: auth }); assert(result.status === 200 && result.data.data.length === 1 && result.data.data[0].leave_type_id === typeA.id, "balance is company-scoped");
    const noEmploymentLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: outsider.email, password }) }); result = await api("/leave/requests", { method: "POST", headers: { Authorization: `Bearer ${noEmploymentLogin.data.data.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ companyId: a.id, leave_type_id: typeA.id, start_date: "2026-12-01", end_date: "2026-12-01", reason: "No employment" }) }); assert(result.status >= 400 && result.status < 500, "global EMPLOYEE without employment is rejected");
  } catch (e) { console.error(`FAIL: ${e.message}`); process.exitCode = 1; }
}
run();
