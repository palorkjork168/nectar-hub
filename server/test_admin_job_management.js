require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User, Role, UserRole, Company, Job } = require("./src/models");

const BASE = "http://127.0.0.1:5000/api";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
};

async function apiRequest(path, options = {}) {
  const url = `${BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

(async () => {
  console.log("==================================================");
  console.log("TESTING ADMIN JOB MANAGEMENT & COMPANY AUTHORIZATION");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Roles
  const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
  const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });

  // 2. Actors
  const adminUser = await User.create({
    first_name: "Admin",
    last_name: "Boss",
    email: `adm_job_${timestamp}@test.com`,
    password_hash: passwordHash,
  });
  await UserRole.create({ user_id: adminUser.id, role_id: adminRole.id });

  const employerA = await User.create({
    first_name: "Owner",
    last_name: "A",
    email: `owner_a_${timestamp}@test.com`,
    password_hash: passwordHash,
  });
  await UserRole.create({ user_id: employerA.id, role_id: employerRole.id });

  const employerB = await User.create({
    first_name: "Owner",
    last_name: "B",
    email: `owner_b_${timestamp}@test.com`,
    password_hash: passwordHash,
  });
  await UserRole.create({ user_id: employerB.id, role_id: employerRole.id });

  // 3. Companies
  const companyA = await Company.create({
    owner_id: employerA.id,
    name: `Alpha Inc ${timestamp}`,
    industry: "Fintech",
    city: "Phnom Penh",
    country: "Cambodia",
  });

  const companyB = await Company.create({
    owner_id: employerB.id,
    name: `Beta Labs ${timestamp}`,
    industry: "AI",
    city: "Siem Reap",
    country: "Cambodia",
  });

  // 4. Logins
  const adminLogin = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminUser.email, password: "Password123!" }),
  });
  assert(adminLogin.ok, "Admin logged in");
  const adminToken = adminLogin.data.data.token;

  const empALogin = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: employerA.email, password: "Password123!" }),
  });
  assert(empALogin.ok, "Employer A logged in");
  const empAToken = empALogin.data.data.token;

  const empBLogin = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: employerB.email, password: "Password123!" }),
  });
  assert(empBLogin.ok, "Employer B logged in");
  const empBToken = empBLogin.data.data.token;

  // 5. Check GET /api/companies/my for Admin vs Employer A
  console.log("\n--- Checking Company Retrieval (GET /api/companies/my) ---");
  const adminCompaniesRes = await apiRequest("/companies/my", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminCompaniesRes.ok, "Admin can query /companies/my");
  const adminCompanies = adminCompaniesRes.data.data.companies;
  assert(
    adminCompanies.some((c) => c.id === companyA.id) &&
      adminCompanies.some((c) => c.id === companyB.id),
    "Admin retrieves all companies across tenants"
  );

  const empACompaniesRes = await apiRequest("/companies/my", {
    headers: { Authorization: `Bearer ${empAToken}` },
  });
  assert(empACompaniesRes.ok, "Employer A can query /companies/my");
  const empACompanies = empACompaniesRes.data.data.companies;
  assert(
    empACompanies.some((c) => c.id === companyA.id) &&
      !empACompanies.some((c) => c.id === companyB.id),
    "Employer A ONLY retrieves their own company"
  );

  // 6. Admin creates a job for Company A
  console.log("\n--- Admin Creating Job for Company A ---");
  const adminCreateJobA = await apiRequest("/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      company_id: companyA.id,
      title: "Admin-Created Lead Engineer",
      description: "Comprehensive software engineering role published by platform admin.",
      employment_type: "FULL_TIME",
      location: "Phnom Penh",
      status: "PUBLISHED",
    }),
  });
  assert(adminCreateJobA.status === 201, "Admin successfully creates job for Company A");
  const jobA = adminCreateJobA.data.data.job;
  assert(jobA.company_id === companyA.id, "Job is assigned to Company A");

  // 7. Admin creates a job for Company B
  console.log("\n--- Admin Creating Job for Company B ---");
  const adminCreateJobB = await apiRequest("/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      company_id: companyB.id,
      title: "Admin-Created Research Scientist",
      description: "Advanced scientific role published by platform admin for Company B.",
      employment_type: "CONTRACT",
      location: "Siem Reap",
      status: "PUBLISHED",
    }),
  });
  assert(adminCreateJobB.status === 201, "Admin successfully creates job for Company B");
  const jobB = adminCreateJobB.data.data.job;
  assert(jobB.company_id === companyB.id, "Job is assigned to Company B");

  // 8. Security: Employer B tries to create job for Company A -> 403
  console.log("\n--- Security: Cross-Tenant Job Creation Guard ---");
  const badCreateJob = await apiRequest("/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${empBToken}` },
    body: JSON.stringify({
      company_id: companyA.id,
      title: "Hacked Job Posting",
      description: "Unauthorized job publication attempt by non-owner employer.",
      employment_type: "FULL_TIME",
      location: "Phnom Penh",
      status: "PUBLISHED",
    }),
  });
  assert(badCreateJob.status === 403, "Employer B is blocked from creating job for Company A (403 Forbidden)");

  // 9. Validation: Missing company_id fails with 400
  console.log("\n--- Validation: Missing Company ID ---");
  const missingCompanyJob = await apiRequest("/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: "Job with No Company",
      description: "Should fail validation because company_id is required.",
      employment_type: "FULL_TIME",
      location: "Phnom Penh",
    }),
  });
  assert(missingCompanyJob.status === 400, "Missing company_id fails with 400 Bad Request");

  // 10. Querying GET /api/jobs/my for Admin vs Employer A
  console.log("\n--- Querying /api/jobs/my for Admin vs Employer A ---");
  const adminJobsRes = await apiRequest("/jobs/my", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminJobsRes.ok, "Admin queries /api/jobs/my successfully");
  const adminJobs = adminJobsRes.data.data.jobs;
  assert(
    adminJobs.some((j) => j.id === jobA.id) && adminJobs.some((j) => j.id === jobB.id),
    "Admin sees jobs from both Company A and Company B"
  );

  const empAJobsRes = await apiRequest("/jobs/my", {
    headers: { Authorization: `Bearer ${empAToken}` },
  });
  assert(empAJobsRes.ok, "Employer A queries /api/jobs/my successfully");
  const empAJobs = empAJobsRes.data.data.jobs;
  assert(
    empAJobs.some((j) => j.id === jobA.id) && !empAJobs.some((j) => j.id === jobB.id),
    "Employer A ONLY sees Company A jobs, zero leakage from Company B"
  );

  // 11. Admin updates Job in Company A
  console.log("\n--- Admin Updating Job in Company A ---");
  const adminUpdateJob = await apiRequest(`/jobs/${jobA.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: "Admin-Updated Principal Engineer",
    }),
  });
  assert(adminUpdateJob.ok, "Admin can update job in Company A");

  // 12. Security: Employer B tries to update Job in Company A -> 403
  const badUpdateJob = await apiRequest(`/jobs/${jobA.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${empBToken}` },
    body: JSON.stringify({
      title: "Hacked Title",
    }),
  });
  assert(badUpdateJob.status === 403, "Employer B blocked from modifying Company A job (403)");

  console.log("\n==================================================");
  console.log("ALL ADMIN JOB MANAGEMENT VERIFICATION CHECKS PASSED!");
  console.log("==================================================");
  process.exit(0);
})().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
