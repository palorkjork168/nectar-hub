const { renderEmailLayout, escapeHtml } = require("./layout");

const CLIENT_BASE = process.env.CLIENT_URL || "http://localhost:5173";

const templates = {
  /**
   * 1. Registration Welcome Email
   */
  welcome: (data) => {
    const name = data.name || "Member";
    const subject = "Welcome to Nectar Hub!";
    const introText = "Welcome to Nectar Hub! Your account has been registered successfully. Explore career opportunities, manage company workforces, and optimize your schedule all in one place.";
    const actionUrl = `${CLIENT_BASE}/login`;
    const actionText = "Sign In to Your Account";

    const html = renderEmailLayout({
      title: "Welcome to Nectar Hub",
      recipientName: name,
      introText,
      actionUrl,
      actionText,
    });

    const text = `Hello ${name},\n\nWelcome to Nectar Hub! Your account has been registered successfully.\n\nSign in at: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 2. Application Submitted (Candidate Confirmation)
   */
  applicationSubmitted: (data) => {
    const candidateName = data.candidateName || "Candidate";
    const jobTitle = data.jobTitle || "the position";
    const companyName = data.companyName || "the employer";
    const subject = `Application Received: ${jobTitle} at ${companyName}`;
    const introText = `Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been successfully received. The recruiting team will review your qualifications and reach out with updates.`;
    const actionUrl = `${CLIENT_BASE}/job-seeker/applications`;
    const actionText = "Track Your Application";

    const html = renderEmailLayout({
      title: "Application Received",
      recipientName: candidateName,
      introText,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nYour application for "${jobTitle}" at ${companyName} has been received.\n\nTrack your application at: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 3. Application Status Changed
   */
  applicationStatusChanged: (data) => {
    const candidateName = data.candidateName || "Candidate";
    const jobTitle = data.jobTitle || "the position";
    const status = data.status || "UPDATED";
    const companyName = data.companyName || "the company";
    const subject = `Application Update: ${jobTitle} (${status})`;

    let messageDesc = `Your application status for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> is now: <strong>${escapeHtml(status)}</strong>.`;
    if (status === "REVIEWING") {
      messageDesc = `Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> is currently under active review by the hiring team.`;
    } else if (status === "ACCEPTED") {
      messageDesc = `Congratulations! Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been accepted.`;
    } else if (status === "REJECTED") {
      messageDesc = `Thank you for taking the time to apply for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>. Although you were not selected for this position, we encourage you to explore other opportunities.`;
    }

    const actionUrl = `${CLIENT_BASE}/job-seeker/applications`;
    const actionText = "View Application Details";

    const html = renderEmailLayout({
      title: "Application Status Update",
      recipientName: candidateName,
      introText: messageDesc,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nYour application for "${jobTitle}" at ${companyName} has been updated to ${status}.\n\nView details at: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 4. Interview Scheduled
   */
  interviewScheduled: (data) => {
    const candidateName = data.candidateName || "Candidate";
    const jobTitle = data.jobTitle || "the position";
    const companyName = data.companyName || "the company";
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }) : "Scheduled time";
    const interviewType = data.type || "Interview";
    const location = data.location || "Online / To be shared";
    const subject = `Interview Scheduled: ${jobTitle} at ${companyName}`;

    const detailsHtml = `
      <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px;">
        <p style="margin: 0 0 8px 0;"><strong>Position:</strong> ${escapeHtml(jobTitle)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${escapeHtml(scheduledAt)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Format:</strong> ${escapeHtml(interviewType)}</p>
        <p style="margin: 0;"><strong>Location/Link:</strong> ${escapeHtml(location)}</p>
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/job-seeker/interviews`;
    const actionText = "View Interview Details";

    const html = renderEmailLayout({
      title: "Interview Scheduled",
      recipientName: candidateName,
      introText: `An interview has been scheduled for your application for <strong>${escapeHtml(jobTitle)}</strong> with <strong>${escapeHtml(companyName)}</strong>.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nAn interview has been scheduled for "${jobTitle}" at ${companyName} on ${scheduledAt}.\nLocation/Format: ${location}\n\nView details: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 5. Interview Rescheduled
   */
  interviewRescheduled: (data) => {
    const candidateName = data.candidateName || "Candidate";
    const jobTitle = data.jobTitle || "the position";
    const companyName = data.companyName || "the company";
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }) : "Updated time";
    const subject = `Interview Rescheduled: ${jobTitle} at ${companyName}`;

    const detailsHtml = `
      <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px;">
        <p style="margin: 0 0 8px 0;"><strong>Position:</strong> ${escapeHtml(jobTitle)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0;"><strong>New Date & Time:</strong> ${escapeHtml(scheduledAt)}</p>
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/job-seeker/interviews`;
    const actionText = "View Updated Interview";

    const html = renderEmailLayout({
      title: "Interview Rescheduled",
      recipientName: candidateName,
      introText: `Your interview for <strong>${escapeHtml(jobTitle)}</strong> has been rescheduled to a new time.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nYour interview for "${jobTitle}" at ${companyName} has been rescheduled to ${scheduledAt}.\n\nView details: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 6. Interview Cancelled
   */
  interviewCancelled: (data) => {
    const candidateName = data.candidateName || "Candidate";
    const jobTitle = data.jobTitle || "the position";
    const companyName = data.companyName || "the company";
    const subject = `Interview Cancelled: ${jobTitle} at ${companyName}`;

    const actionUrl = `${CLIENT_BASE}/job-seeker/interviews`;
    const actionText = "View Interview Center";

    const html = renderEmailLayout({
      title: "Interview Cancelled",
      recipientName: candidateName,
      introText: `Your scheduled interview for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been cancelled. If this is unexpected, please contact the recruiter.`,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nYour scheduled interview for "${jobTitle}" at ${companyName} has been cancelled.\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 7. Candidate Hired / Employment Transition
   */
  candidateHired: (data) => {
    const candidateName = data.candidateName || "New Team Member";
    const companyName = data.companyName || "the company";
    const positionTitle = data.positionTitle || "the position";
    const departmentName = data.departmentName || null;
    const startDate = data.startDate || "To be confirmed";
    const subject = `Congratulations! You have been hired by ${companyName}`;

    const detailsHtml = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; color: #065f46;">
        <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${escapeHtml(positionTitle)}</p>
        ${departmentName ? `<p style="margin: 0 0 8px 0;"><strong>Department:</strong> ${escapeHtml(departmentName)}</p>` : ""}
        <p style="margin: 0;"><strong>Start Date:</strong> ${escapeHtml(startDate)}</p>
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/employee/dashboard`;
    const actionText = "Go to Employee Dashboard";

    const html = renderEmailLayout({
      title: "Welcome to the Team!",
      recipientName: candidateName,
      introText: `Congratulations! We are thrilled to confirm that you have officially been hired by <strong>${escapeHtml(companyName)}</strong>. Your employee account is now active.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${candidateName},\n\nCongratulations! You have officially been hired by ${companyName} as ${positionTitle}!\n\nAccess your employee portal: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 8. Leave Request Submitted
   */
  leaveSubmitted: (data) => {
    const employeeName = data.employeeName || "Employee";
    const leaveType = data.leaveType || "Leave";
    const startDate = data.startDate || "N/A";
    const endDate = data.endDate || "N/A";
    const days = data.days || 1;
    const subject = `Leave Request Submitted: ${leaveType}`;

    const detailsHtml = `
      <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px;">
        <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${escapeHtml(leaveType)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${days} day(s)</p>
        <p style="margin: 0;"><strong>Dates:</strong> ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</p>
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/employee/leave`;
    const actionText = "View Leave Status";

    const html = renderEmailLayout({
      title: "Leave Request Submitted",
      recipientName: employeeName,
      introText: `Your request for <strong>${escapeHtml(leaveType)}</strong> has been submitted and is currently pending review by your company manager or HR.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${employeeName},\n\nYour leave request for ${leaveType} (${days} days: ${startDate} to ${endDate}) has been submitted.\n\nView status: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 9. Leave Request Approved
   */
  leaveApproved: (data) => {
    const employeeName = data.employeeName || "Employee";
    const leaveType = data.leaveType || "Leave";
    const startDate = data.startDate || "N/A";
    const endDate = data.endDate || "N/A";
    const days = data.days || 1;
    const subject = `Leave Request Approved: ${leaveType}`;

    const detailsHtml = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; color: #065f46;">
        <p style="margin: 0 0 8px 0;"><strong>Status:</strong> Approved</p>
        <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${escapeHtml(leaveType)}</p>
        <p style="margin: 0;"><strong>Approved Dates:</strong> ${escapeHtml(startDate)} to ${escapeHtml(endDate)} (${days} days)</p>
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/employee/leave`;
    const actionText = "View Leave Balance";

    const html = renderEmailLayout({
      title: "Leave Request Approved",
      recipientName: employeeName,
      introText: `Good news! Your leave request for <strong>${escapeHtml(leaveType)}</strong> has been approved.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${employeeName},\n\nYour leave request for ${leaveType} (${startDate} to ${endDate}) has been approved.\n\nView details: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },

  /**
   * 10. Leave Request Rejected
   */
  leaveRejected: (data) => {
    const employeeName = data.employeeName || "Employee";
    const leaveType = data.leaveType || "Leave";
    const startDate = data.startDate || "N/A";
    const endDate = data.endDate || "N/A";
    const reviewNote = data.reviewNote || null;
    const subject = `Leave Request Update: ${leaveType}`;

    const detailsHtml = `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; color: #991b1b;">
        <p style="margin: 0 0 8px 0;"><strong>Status:</strong> Not Approved</p>
        <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${escapeHtml(leaveType)}</p>
        <p style="margin: 0 0 8px 0;"><strong>Dates:</strong> ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</p>
        ${reviewNote ? `<p style="margin: 0;"><strong>Reviewer Note:</strong> "${escapeHtml(reviewNote)}"</p>` : ""}
      </div>
    `;

    const actionUrl = `${CLIENT_BASE}/employee/leave`;
    const actionText = "View Leave Portal";

    const html = renderEmailLayout({
      title: "Leave Request Update",
      recipientName: employeeName,
      introText: `Your request for <strong>${escapeHtml(leaveType)}</strong> from ${escapeHtml(startDate)} to ${escapeHtml(endDate)} was not approved.`,
      detailsHtml,
      actionUrl,
      actionText,
    });

    const text = `Hello ${employeeName},\n\nYour leave request for ${leaveType} was not approved.${reviewNote ? ` Note: "${reviewNote}"` : ""}\n\nView details: ${actionUrl}\n\n— Nectar Hub`;

    return { subject, html, text };
  },
};

module.exports = templates;
