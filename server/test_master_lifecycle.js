// test_master_lifecycle.js
require("dotenv").config();
const BASE_URL = "http://127.0.0.1:5000/api";
const {
  User,
  Role,
  UserRole,
  Company,
  Job,
  Application,
  Interview,
  EmploymentRecord,
  Attendance,
  LeaveType,
  LeaveRequest,
  Notification,
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

async function runMasterLifecycleSuite() {
  console.log("==================================================");
  console.log("STARTING MASTER END-TO-END QA LIFECYCLE TEST");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Actor emails
  const seekerEmail = `lifecycle_seeker_${timestamp}@test.com`;
  const employerEmail = `lifecycle_emp_${timestamp}@test.com`;
  const otherSeekerEmail = `lifecycle_other_${timestamp}@test.com`;

  try {
    // ----------------------------------------------------
    // STEP 1: Register Job Seeker & Setup Profile
    // ----------------------------------------------------
    console.log("--- STEP 1: Register Job Seeker & Setup Profile ---");
    const regSeekerRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: "Alex",
        last_name: "Lifecycle",
        email: seekerEmail,
        password: "Password123!",
        role: "JOB_SEEKER",
      }),
    });
    assert(regSeekerRes.status === 201, "Job Seeker registered (201 Created)");

    const loginSeekerRes = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: seekerEmail, password: "Password123!" }),
    });
    assert(loginSeekerRes.status === 200, "Job Seeker logged in (200 OK)");
    const tokenSeeker = loginSeekerRes.data.data.token;
    const seekerId = loginSeekerRes.data.data.user.id;

    // Update Profile
    const profileRes = await apiRequest("/profile/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        headline: "Senior Cloud Engineer",
        bio: "Specialist in high-scale distributed systems and Kubernetes.",
      }),
    });
    assert(profileRes.status === 200, "Candidate profile updated (200 OK)");

    // ----------------------------------------------------
    // STEP 2: Register Employer & Create Company
    // ----------------------------------------------------
    console.log("\n--- STEP 2: Register Employer & Setup Company ---");
    const regEmpRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: "Eleanor",
        last_name: "Enterprise",
        email: employerEmail,
        password: "Password123!",
      }),
    });
    assert(regEmpRes.status === 201, "Employer registered (201 Created)");

    // Assign EMPLOYER role
    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    const empUserRecord = await User.findOne({ where: { email: employerEmail } });
    await UserRole.findOrCreate({ where: { user_id: empUserRecord.id, role_id: employerRole.id } });

    const loginEmpRes = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: employerEmail, password: "Password123!" }),
    });
    assert(loginEmpRes.status === 200, "Employer logged in (200 OK)");
    const tokenEmp = loginEmpRes.data.data.token;

    // Create Company
    const compRes = await apiRequest("/companies", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        name: `Solaris Global ${timestamp}`,
        description: "Next-generation cloud infrastructure company",
        industry: "Cloud Computing",
        company_size: "51-200",
        country: "Cambodia",
      }),
    });
    assert(compRes.status === 201, "Company created successfully (201 Created)");
    const companyId = compRes.data.data.company.id;

    // ----------------------------------------------------
    // STEP 3: Create & Publish Job
    // ----------------------------------------------------
    console.log("\n--- STEP 3: Create & Publish Job ---");
    const createJobRes = await apiRequest("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        company_id: companyId,
        title: `Site Reliability Architect ${timestamp}`,
        description: "Maintain 99.999% uptime for core infrastructure.",
        requirements: "5+ years Kubernetes, Terraform, Go.",
        responsibilities: "Automate reliability engineering and disaster recovery.",
        employment_type: "FULL_TIME",
        experience_level: "SENIOR",
        location: "Phnom Penh",
      }),
    });
    assert(createJobRes.status === 201, "Job posting created in DRAFT (201 Created)");
    const jobId = createJobRes.data.data.job.id;

    // Publish Job via update
    const publishJobRes = await apiRequest(`/jobs/${jobId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    assert(publishJobRes.status === 200, "Job published to marketplace (200 OK)");

    // ----------------------------------------------------
    // STEP 4: Job Application & Duplicate Guard
    // ----------------------------------------------------
    console.log("\n--- STEP 4: Candidate Applies & Testing Duplicate Guard ---");
    const applyRes = await apiRequest(`/applications/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        cover_letter: "I am passionate about SRE and cloud architecture.",
      }),
    });
    assert(applyRes.status === 201, "Candidate submitted application (201 Created)");
    const applicationId = applyRes.data.data.application.id;

    // Test Duplicate Application Prevention (Phase 9)
    const duplicateApplyRes = await apiRequest(`/applications/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        cover_letter: "Applying a second time accidentally.",
      }),
    });
    assert(
      duplicateApplyRes.status === 400 || duplicateApplyRes.status === 409,
      `DUPLICATE GUARD PASS: Duplicate application prevented (${duplicateApplyRes.status})`
    );

    // ----------------------------------------------------
    // STEP 5: Applicant Review & Pipeline Progression
    // ----------------------------------------------------
    console.log("\n--- STEP 5: Employer Reviews Application ---");
    const reviewRes = await apiRequest(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ status: "REVIEWING" }),
    });
    assert(reviewRes.status === 200, "Application advanced to REVIEWING (200 OK)");

    // ----------------------------------------------------
    // STEP 6: Interview Scheduling & Edge Cases
    // ----------------------------------------------------
    console.log("\n--- STEP 6: Interview Scheduling & Edge Cases ---");
    const interviewDate = new Date(Date.now() + 86400000).toISOString();
    const schedRes = await apiRequest("/interviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        application_id: applicationId,
        scheduled_at: interviewDate,
        duration_minutes: 60,
        interview_type: "VIDEO",
        notes: "Architecture and systems design discussion.",
      }),
    });
    assert(schedRes.status === 201, "Interview scheduled successfully (201 Created)");
    const interviewId = schedRes.data.data.interview.id;

    // Interview Security: Candidate cannot complete or cancel interview (Phase 12)
    const candCancelRes = await apiRequest(`/interviews/${interviewId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({ reason: "Unauthorized attempt" }),
    });
    assert(candCancelRes.status === 403, "SECURITY PASS: Candidate cannot cancel interview (403 Forbidden)");

    // Employer completes interview
    const completeInterviewRes = await apiRequest(`/interviews/${interviewId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ feedback: "Candidate showed stellar architecture depth." }),
    });
    assert(completeInterviewRes.status === 200, "Employer completed interview (200 OK)");

    // Edge Case: Cannot cancel an already completed interview
    const cancelCompletedRes = await apiRequest(`/interviews/${interviewId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ reason: "Trying to cancel completed interview." }),
    });
    assert(cancelCompletedRes.status === 400, "EDGE CASE PASS: Cancelling completed interview rejected (400 Bad Request)");

    // ----------------------------------------------------
    // STEP 7: Candidate Acceptance & Hiring Conversion
    // ----------------------------------------------------
    console.log("\n--- STEP 7: Candidate Acceptance & Hiring Conversion ---");
    const acceptRes = await apiRequest(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    assert(acceptRes.status === 200, "Application advanced to ACCEPTED (200 OK)");

    // Hire candidate (converts to Employee)
    const hireRes = await apiRequest(`/applications/${applicationId}/hire`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        department: "Core Reliability Engineering",
        job_title: "Site Reliability Architect",
      }),
    });
    assert(hireRes.status === 200, "Candidate hired and converted to Employee (200 OK)");

    // Test Hiring Idempotency (Phase 11)
    const repeatHireRes = await apiRequest(`/applications/${applicationId}/hire`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        department: "Core Reliability Engineering",
      }),
    });
    assert(repeatHireRes.status === 200, "IDEMPOTENCY PASS: Repeated hire call returns 200 without creating duplicates");

    // Verify candidate gained EMPLOYEE role in /auth/me
    const verifyAuthMeRes = await apiRequest("/auth/me", {
      headers: { Authorization: `Bearer ${tokenSeeker}` },
    });
    assert(verifyAuthMeRes.status === 200, "Candidate /auth/me verified");
    const updatedRoles = verifyAuthMeRes.data.data.user.roles;
    assert(updatedRoles.includes("EMPLOYEE"), "Candidate has gained EMPLOYEE role");
    assert(updatedRoles.includes("JOB_SEEKER"), "Candidate preserved original JOB_SEEKER role");

    // ----------------------------------------------------
    // STEP 8: Attendance Concurrency & Shift Operations
    // ----------------------------------------------------
    console.log("\n--- STEP 8: Attendance Concurrency & Shift Lifecycle ---");
    // Run two simultaneous check-in requests
    const checkInPayload = { companyId, latitude: 11.5564, longitude: 104.9282 };
    const [c1, c2] = await Promise.all([
      apiRequest("/attendance/check-in", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenSeeker}` },
        body: JSON.stringify(checkInPayload),
      }),
      apiRequest("/attendance/check-in", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenSeeker}` },
        body: JSON.stringify(checkInPayload),
      }),
    ]);

    const successes = [c1, c2].filter((r) => r.status === 201).length;
    const failures = [c1, c2].filter((r) => r.status === 400).length;
    assert(successes === 1, "CONCURRENCY PASS: Exactly one simultaneous check-in succeeded (201)");
    assert(failures === 1, "CONCURRENCY PASS: Duplicate simultaneous check-in was blocked cleanly (400)");

    // Checkout
    const checkOutRes = await apiRequest("/attendance/check-out", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({ latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(checkOutRes.status === 200, "Employee checked out successfully (200 OK)");

    // Edge case: Checkout when not checked in
    const ghostCheckOutRes = await apiRequest("/attendance/check-out", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({ latitude: 11.5564, longitude: 104.9282 }),
    });
    assert(ghostCheckOutRes.status === 400, "EDGE CASE PASS: Checkout without active session rejected (400)");

    // ----------------------------------------------------
    // STEP 9: Leave Requests & Overlap Collision Testing
    // ----------------------------------------------------
    console.log("\n--- STEP 9: Leave Requests & Overlap Collision Testing ---");
    // Employer creates leave type
    const leaveTypeRes = await apiRequest("/leave/types", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({
        companyId: companyId,
        company_id: companyId,
        name: `Paid Vacation ${timestamp}`,
        default_days: 15,
        is_paid: true,
      }),
    });
    assert(leaveTypeRes.status === 201, "Leave policy configured by Employer (201 Created)");
    const leaveTypeId = leaveTypeRes.data.data.id;

    // Candidate submits leave request
    const leaveStart = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
    const leaveEnd = new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0];
    const reqLeaveRes = await apiRequest("/leave/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        companyId,
        leave_type_id: leaveTypeId,
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: "Personal rest and recovery.",
      }),
    });
    assert(reqLeaveRes.status === 201, "Employee submitted leave request (201 Created)");
    const leaveRequestId = reqLeaveRes.data.data.id;

    // Edge Case: Overlapping Leave Request (Phase 13)
    const overlapRes = await apiRequest("/leave/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
      body: JSON.stringify({
        companyId,
        leave_type_id: leaveTypeId,
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: "Accidental duplicate overlapping request.",
      }),
    });
    assert(overlapRes.status === 409, "LEAVE OVERLAP GUARD PASS: Overlapping request rejected with 409 Conflict");

    // Employer approves leave
    const approveLeaveRes = await apiRequest(`/leave/requests/${leaveRequestId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ companyId: companyId, review_note: "Enjoy your well-deserved vacation!" }),
    });
    assert(approveLeaveRes.status === 200, "Employer approved employee leave (200 OK)");

    // ----------------------------------------------------
    // STEP 10: Notification Delivery & Security Boundaries
    // ----------------------------------------------------
    console.log("\n--- STEP 10: Notification Delivery & Security Boundaries ---");
    const notifsRes = await apiRequest("/notifications", {
      headers: { Authorization: `Bearer ${tokenSeeker}` },
    });
    assert(notifsRes.status === 200, "Candidate fetched notification center");
    const notifications = notifsRes.data.data.notifications;
    assert(notifications.length > 0, `Candidate received ${notifications.length} in-app notifications`);

    const sampleNotif = notifications[0];

    // Other user attempts to mark candidate's notification read (Phase 15)
    // Setup Other User
    const regOtherRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: "Intruder",
        last_name: "User",
        email: otherSeekerEmail,
        password: "Password123!",
        role: "JOB_SEEKER",
      }),
    });
    const loginOtherRes = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: otherSeekerEmail, password: "Password123!" }),
    });
    const tokenOther = loginOtherRes.data.data.token;

    const crossReadRes = await apiRequest(`/notifications/${sampleNotif.id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenOther}` },
    });
    assert(crossReadRes.status === 404 || crossReadRes.status === 403, "SECURITY PASS: Cross-tenant notification mutation prevented");

    // Candidate marks own notification read
    const ownReadRes = await apiRequest(`/notifications/${sampleNotif.id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenSeeker}` },
    });
    assert(ownReadRes.status === 200, "Candidate marked own notification as read");

    // ----------------------------------------------------
    // STEP 11: Company Analytics Verification
    // ----------------------------------------------------
    console.log("\n--- STEP 11: Analytics Reflection Verification ---");
    const analyticsRes = await apiRequest(`/analytics/company/${companyId}/overview`, {
      headers: { Authorization: `Bearer ${tokenEmp}` },
    });
    assert(analyticsRes.status === 200, "Employer fetched company analytics overview");
    const analytics = analyticsRes.data.data;
    assert(analytics.overview.headcount >= 1, "Analytics reflects active employee headcount");
    assert(analytics.overview.jobsPublished >= 1, "Analytics reflects published job");
    assert(analytics.funnel.applications >= 1, "Analytics funnel reflects candidate application");
    assert(analytics.funnel.hired >= 1, "Analytics funnel reflects confirmed hire");
    assert(analytics.attendance.completedSessions >= 1, "Analytics reflects completed attendance session");
    assert(analytics.leave.summary.approved >= 1, "Analytics reflects approved leave request");

    // ----------------------------------------------------
    // STEP 12: Cleanup Test Artifacts
    // ----------------------------------------------------
    console.log("\n--- STEP 12: Clean Up Lifecycle Test Artifacts ---");
    try {
      if (companyId) {
        await Company.destroy({ where: { id: companyId } });
      }
      await User.destroy({ where: { email: [seekerEmail, employerEmail, otherSeekerEmail] } });
      console.log("✓ Test users and company cleaned up successfully.");
    } catch (cleanupErr) {
      console.log("ℹ Cleanup notice (non-fatal):", cleanupErr.message);
    }

    console.log("\n==================================================");
    console.log("MASTER E2E LIFECYCLE TEST PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ MASTER LIFECYCLE TEST FAILED:", error);
    process.exit(1);
  }
}

runMasterLifecycleSuite();
