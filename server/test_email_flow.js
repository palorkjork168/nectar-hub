// test_email_flow.js
// Dedicated Phase 9 Communication & Transactional Email Integration Test Suite
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User, Role, UserRole, Company, Department, Position, Job, Application, LeaveType, LeaveRequest, AuditLog } = require("./src/models");
const emailService = require("./src/services/email.service");
const MockProvider = require("./src/services/email/providers/MockProvider");
const SmtpProvider = require("./src/services/email/providers/SmtpProvider");
const DevelopmentProvider = require("./src/services/email/providers/DevelopmentProvider");

const BASE = "http://127.0.0.1:5000/api";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ PASS: ${message}`);
}

const sleep = (ms = 150) => new Promise((r) => setTimeout(r, ms));

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
  console.log("RUNNING COMMUNICATION & TRANSACTIONAL EMAIL TEST SUITE");
  console.log("==================================================\n");

  try {
    // ----------------------------------------------------
    // TEST 1: Provider Abstraction & Safe Initialization
    // ----------------------------------------------------
    console.log("--- TEST 1: Provider Abstraction & Fallbacks ---");

    // 1.1 DevelopmentProvider initializes without SMTP credentials
    const devProvider = new DevelopmentProvider();
    assert(typeof devProvider.send === "function", "DevelopmentProvider implements send interface");
    const devSend = await devProvider.send({ to: "test@example.com", subject: "Hello Dev", text: "Test text" });
    assert(devSend.simulated === true, "DevelopmentProvider simulates send safely without crashing");

    // 1.2 SmtpProvider gracefully reports unconfigured when credentials are absent
    const unconfiguredSmtp = new SmtpProvider({ host: null });
    assert(!unconfiguredSmtp.isConfigured(), "SmtpProvider isConfigured is false without credentials");

    // 1.3 MockProvider captures emails in memory
    const mockProvider = new MockProvider();
    mockProvider.clear();
    emailService.setProvider(mockProvider);
    assert(emailService.getProvider() === mockProvider, "MockProvider successfully injected into EmailService");

    const directSend = await emailService.sendEmail({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
      templateName: "custom",
    });
    assert(directSend.success === true, "sendEmail returns success: true");
    assert(mockProvider.getSentEmails().length === 1, "MockProvider captured 1 email");
    assert(mockProvider.getLastEmail().to === "recipient@example.com", "Captured email matches recipient");
    assert(mockProvider.getLastEmail().subject === "Test Subject", "Captured email matches subject");

    mockProvider.clear();

    // ----------------------------------------------------
    // TEST 2: Registration Welcome Email
    // ----------------------------------------------------
    console.log("\n--- TEST 2: User Registration Welcome Email ---");

    const timestamp = Date.now();
    const candidateEmail = `candidate_email_${timestamp}@example.com`;
    const regRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: "Bruce",
        last_name: "Wayne",
        email: candidateEmail,
        password: "Password123!",
      }),
    });
    assert(regRes.status === 201, "Candidate registers successfully (201)");
    await sleep(200);

    const welcomeEmail = mockProvider.getLastEmail();
    assert(welcomeEmail !== null, "Welcome email was dispatched to MockProvider");
    assert(welcomeEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Welcome email addressed to candidate");
    assert(welcomeEmail.subject.includes("Welcome to Nectar Hub"), "Welcome email subject verified");
    assert(welcomeEmail.html.includes("Bruce Wayne"), "Welcome email body contains candidate greeting");

    // Login candidate
    const candidateLogin = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: candidateEmail, password: "Password123!" }),
    });
    const candidateToken = candidateLogin.data.data.token;
    const candidateHeaders = { Authorization: `Bearer ${candidateToken}` };

    // Setup Employer & Company
    const employerEmail = `employer_email_${timestamp}@example.com`;
    const empRegRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: "Lucius",
        last_name: "Fox",
        email: employerEmail,
        password: "Password123!",
      }),
    });
    assert(empRegRes.status === 201, "Employer registers successfully (201)");
    const empLogin = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: employerEmail, password: "Password123!" }),
    });
    const employerToken = empLogin.data.data.token;
    const employerHeaders = { Authorization: `Bearer ${employerToken}` };

    const employerRole = await Role.findOne({ where: { name: "EMPLOYER" } });
    await UserRole.create({ user_id: empLogin.data.data.user.id, role_id: employerRole.id });

    // Create Company
    const companyRes = await api("/companies", {
      method: "POST",
      headers: employerHeaders,
      body: JSON.stringify({
        name: `Wayne Enterprises ${timestamp}`,
        description: "Applied sciences and defense",
        industry: "Technology",
      }),
    });
    assert(companyRes.status === 201, "Company created (201)");
    const companyId = companyRes.data.data?.company?.id || companyRes.data.data?.id;

    // Create Department and Position directly via models
    const department = await Department.create({
      company_id: companyId,
      name: `Applied Sciences ${timestamp}`,
    });
    const deptId = department.id;

    const position = await Position.create({
      company_id: companyId,
      department_id: deptId,
      title: "Lead Systems Architect",
    });
    const posId = position.id;

    // Post and Publish Job
    const jobRes = await api("/jobs", {
      method: "POST",
      headers: employerHeaders,
      body: JSON.stringify({
        company_id: companyId,
        title: "Chief Systems Engineer",
        description: "Oversee advanced robotics and systems in mission-critical infrastructure.",
        requirements: "10+ years experience in mission-critical infrastructure",
        location: "Gotham City",
        employment_type: "FULL_TIME",
        status: "PUBLISHED",
      }),
    });
    assert(jobRes.status === 201, "Job created (201)");
    const jobId = jobRes.data.data?.job?.id || jobRes.data.data?.id;

    mockProvider.clear();

    // ----------------------------------------------------
    // TEST 3: Job Application & Status Change Emails
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Job Application & Status Change Emails ---");

    // Candidate applies for job
    const applyRes = await api(`/applications/jobs/${jobId}/apply`, {
      method: "POST",
      headers: candidateHeaders,
      body: JSON.stringify({
        cover_letter: "I am uniquely qualified to protect and engineer these systems.",
      }),
    });
    assert(applyRes.status === 201, "Candidate submitted application (201)");
    const applicationId = applyRes.data.data?.application?.id || applyRes.data.data?.id;
    await sleep(200);

    const appSubmittedEmail = mockProvider.getLastEmail();
    assert(appSubmittedEmail !== null, "Application confirmation email received by mock provider");
    assert(appSubmittedEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Confirmation sent to candidate email");
    assert(appSubmittedEmail.subject.includes("Application Received"), "Subject indicates application confirmation");
    assert(appSubmittedEmail.html.includes("Chief Systems Engineer"), "Email body specifies the correct job title");

    mockProvider.clear();

    // Employer updates status to REVIEWING
    const reviewStatusRes = await api(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: employerHeaders,
      body: JSON.stringify({ status: "REVIEWING" }),
    });
    assert(reviewStatusRes.status === 200, "Employer advanced application to REVIEWING");
    await sleep(200);

    let statusEmail = mockProvider.getLastEmail();
    assert(statusEmail !== null, "Candidate status update email dispatched");
    assert(statusEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Status email sent to candidate");
    assert(statusEmail.subject.includes("REVIEWING"), "Subject specifies new status");

    // Employer updates status to ACCEPTED
    mockProvider.clear();
    const acceptStatusRes = await api(`/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: employerHeaders,
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    assert(acceptStatusRes.status === 200, "Employer advanced application to ACCEPTED");
    await sleep(200);

    statusEmail = mockProvider.getLastEmail();
    assert(statusEmail !== null, "Candidate accepted status email dispatched");
    assert(statusEmail.subject.includes("ACCEPTED"), "Subject specifies ACCEPTED status");

    // ----------------------------------------------------
    // TEST 4: Interview Scheduled, Rescheduled, Cancelled Emails
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Interview Lifecycle Emails ---");

    mockProvider.clear();

    // 4.1 Schedule Interview
    const scheduledDate = new Date(Date.now() + 86400000 * 3).toISOString();
    const interviewRes = await api("/interviews", {
      method: "POST",
      headers: employerHeaders,
      body: JSON.stringify({
        application_id: applicationId,
        scheduled_at: scheduledDate,
        interview_type: "VIDEO",
        meeting_link: "https://meet.sakoluniverse.com/room-secure",
        location: "Virtual Meeting Room",
        notes: "Technical deep-dive with engineering leadership",
      }),
    });
    assert(interviewRes.status === 201, "Interview scheduled successfully (201)");
    const interviewId = interviewRes.data.data?.interview?.id || interviewRes.data.data?.id;
    await sleep(200);

    const schedEmail = mockProvider.getLastEmail();
    assert(schedEmail !== null, "Interview scheduled email received");
    assert(schedEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Interview scheduled email addressed to candidate");
    assert(schedEmail.subject.includes("Interview Scheduled"), "Interview scheduled subject verified");
    assert(schedEmail.html.includes("VIDEO"), "Interview format is included");

    // 4.2 Reschedule Interview
    mockProvider.clear();
    const newScheduledDate = new Date(Date.now() + 86400000 * 4).toISOString();
    const updateRes = await api(`/interviews/${interviewId}`, {
      method: "PUT",
      headers: employerHeaders,
      body: JSON.stringify({
        scheduled_at: newScheduledDate,
      }),
    });
    assert(updateRes.status === 200, "Interview rescheduled (200)");
    await sleep(200);

    const reschedEmail = mockProvider.getLastEmail();
    assert(reschedEmail !== null, "Interview rescheduled email received");
    assert(reschedEmail.subject.includes("Interview Rescheduled"), "Interview rescheduled subject verified");

    // 4.3 Cancel Interview
    mockProvider.clear();
    const cancelRes = await api(`/interviews/${interviewId}/cancel`, {
      method: "PATCH",
      headers: employerHeaders,
    });
    assert(cancelRes.status === 200, "Interview cancelled (200)");
    await sleep(200);

    const cancelEmail = mockProvider.getLastEmail();
    assert(cancelEmail !== null, "Interview cancelled email received");
    assert(cancelEmail.subject.includes("Interview Cancelled"), "Interview cancelled subject verified");

    // ----------------------------------------------------
    // TEST 5: Hiring & Employment Confirmation Email
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Candidate Hired & Welcome Email ---");

    mockProvider.clear();
    const hireRes = await api(`/applications/${applicationId}/hire`, {
      method: "POST",
      headers: employerHeaders,
      body: JSON.stringify({
        departmentId: deptId,
        positionId: posId,
        startDate: "2026-10-15",
        employmentType: "FULL_TIME",
      }),
    });
    assert(hireRes.status === 200, "Candidate hired successfully (200)");
    await sleep(200);

    const hiredEmail = mockProvider.getLastEmail();
    assert(hiredEmail !== null, "Hired welcome email received");
    assert(hiredEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Hired email addressed to candidate");
    assert(hiredEmail.subject.includes("You have been hired"), "Hiring email subject confirmed");
    assert(hiredEmail.html.includes("Welcome to the Team!"), "Hiring email body verified");

    // ----------------------------------------------------
    // TEST 6: Leave Request Lifecycle Emails
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Leave Request Lifecycle Emails ---");

    // Create Leave Type
    const leaveType = await LeaveType.create({
      company_id: companyId,
      name: `Special Research Leave ${timestamp}`,
      days_allowed: 12,
      is_paid: true,
      requires_approval: true,
    });

    // Candidate (now employee) submits leave request
    mockProvider.clear();
    const leaveSubmitRes = await api("/leave/requests", {
      method: "POST",
      headers: candidateHeaders,
      body: JSON.stringify({
        companyId,
        leave_type_id: leaveType.id,
        start_date: "2026-11-01",
        end_date: "2026-11-03",
        reason: "Applied research conference",
      }),
    });
    assert(leaveSubmitRes.status === 201, "Employee submits leave request (201)");
    const leaveRequestId = leaveSubmitRes.data.data.id;
    await sleep(200);

    const leaveSubmittedEmail = mockProvider.getLastEmail();
    assert(leaveSubmittedEmail !== null, "Leave submission confirmation email sent");
    assert(leaveSubmittedEmail.to.toLowerCase() === candidateEmail.toLowerCase(), "Leave submitted email sent to employee");
    assert(leaveSubmittedEmail.subject.includes("Leave Request Submitted"), "Leave submitted subject confirmed");

    // Employer reviews & approves leave
    mockProvider.clear();
    const approveRes = await api(`/leave/requests/${leaveRequestId}/approve`, {
      method: "PATCH",
      headers: employerHeaders,
      body: JSON.stringify({ review_note: "Approved by leadership" }),
    });
    assert(approveRes.status === 200, "Leave request approved (200)");
    await sleep(200);

    const leaveApprovedEmail = mockProvider.getLastEmail();
    assert(leaveApprovedEmail !== null, "Leave approved email sent to employee");
    assert(leaveApprovedEmail.subject.includes("Leave Request Approved"), "Leave approved subject confirmed");

    // Submit second leave to test rejection email
    mockProvider.clear();
    const leaveRejectSubmitRes = await api("/leave/requests", {
      method: "POST",
      headers: candidateHeaders,
      body: JSON.stringify({
        companyId,
        leave_type_id: leaveType.id,
        start_date: "2026-11-10",
        end_date: "2026-11-12",
        reason: "Additional personal time",
      }),
    });
    const secondLeaveId = leaveRejectSubmitRes.data.data.id;

    const rejectRes = await api(`/leave/requests/${secondLeaveId}/reject`, {
      method: "PATCH",
      headers: employerHeaders,
      body: JSON.stringify({ review_note: "Coverage unavailable during project deployment" }),
    });
    assert(rejectRes.status === 200, "Leave request rejected (200)");
    await sleep(200);

    const leaveRejectedEmail = mockProvider.getLastEmail();
    assert(leaveRejectedEmail !== null, "Leave rejected email sent to employee");
    assert(leaveRejectedEmail.subject.includes("Leave Request Update"), "Leave rejected subject confirmed");
    assert(leaveRejectedEmail.html.includes("Coverage unavailable"), "Review note is included for employee context");

    // ----------------------------------------------------
    // TEST 7: Security & Credential Hygiene in Email Content
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Security & Secret Sanitization in Emails ---");

    const allSentEmails = mockProvider.getSentEmails();
    for (const email of allSentEmails) {
      const serialized = JSON.stringify(email);
      assert(!serialized.includes("Password123!"), "Email content does not leak plain passwords");
      assert(!serialized.includes("$2a$") && !serialized.includes("$2b$"), "Email content does not leak bcrypt hashes");
      assert(!serialized.includes("Bearer eyJ"), "Email content does not leak JWT bearer tokens");
      assert(!serialized.includes("cloudinary://"), "Email content does not leak Cloudinary secrets");
    }
    assert(true, "All captured email payloads are completely free of credentials and secrets");

    // ----------------------------------------------------
    // TEST 8: Failure Isolation (Business Action Survives Provider Outage)
    // ----------------------------------------------------
    console.log("\n--- TEST 8: Failure Isolation (Zero Business Disruption on SMTP Error) ---");

    // Force mock provider to throw an error on all subsequent send requests
    mockProvider.setSimulateFailure(true, new Error("SMTP connection timed out [ETIMEDOUT]"));

    // Submit a leave request during provider outage
    const resilientLeaveRes = await api("/leave/requests", {
      method: "POST",
      headers: candidateHeaders,
      body: JSON.stringify({
        companyId,
        leave_type_id: leaveType.id,
        start_date: "2026-12-01",
        end_date: "2026-12-02",
        reason: "Year-end holiday",
      }),
    });
    assert(resilientLeaveRes.status === 201, "Business action succeeds with 201 despite email provider failure");
    assert(resilientLeaveRes.data.success === true, "API response returns success: true");
    assert(!JSON.stringify(resilientLeaveRes.data).includes("SMTP connection timed out"), "No internal provider error leaked to client");
    await sleep(200);

    // Verify operational audit event was safely recorded in audit_logs
    const auditFailureRecord = await AuditLog.findOne({
      where: { action: "EMAIL_DELIVERY_FAILED" },
      order: [["created_at", "DESC"]],
    });
    assert(auditFailureRecord !== null, "EMAIL_DELIVERY_FAILED event recorded in audit_logs");
    assert(auditFailureRecord.metadata?.error.includes("ETIMEDOUT"), "Audit log accurately captured failure reason");

    // Restore provider to healthy state
    mockProvider.setSimulateFailure(false);

    console.log("\n==================================================");
    console.log("✓ ALL COMMUNICATION & EMAIL TESTS PASSED (100%)");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ EMAIL TEST SUITE FAILED WITH ERROR:", error);
    process.exit(1);
  }
})();
