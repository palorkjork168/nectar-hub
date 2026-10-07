const {
  Application,
  Job,
  Company,
  User,
  UserProfile,
  UserSkill,
  Education,
  Experience,
  EmployeeProfile,
  EmploymentRecord,
  Role,
  Department,
  Position,
} = require("../models");
const sequelize = require("../config/database");
const authorizationService = require("./authorization.service");
const notificationService = require("./notification.service");
const employmentService = require("./employment.service");
const emailService = require("./email.service");
const NOTIFICATION_TYPES = require("../constants/notificationTypes");

const applyForJob = async (
  jobId,
  user,
  applicationData
) => {
  const job = await Job.findByPk(jobId, {
    include: [{ model: Company, attributes: ["id", "name"] }],
  });

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  if (job.status !== "PUBLISHED") {
    const error = new Error(
      "This job is not available for applications"
    );
    error.statusCode = 400;
    throw error;
  }

  const alreadyApplied = await Application.findOne({
    where: {
      job_id: jobId,
      user_id: user.id,
    },
  });

  if (alreadyApplied) {
    const error = new Error(
      "You have already applied for this job"
    );
    error.statusCode = 409;
    throw error;
  }

  const application = await Application.create({
    job_id: jobId,
    user_id: user.id,
    cover_letter: applicationData.cover_letter || null,
    cv_url: applicationData.cv_url || null,
  });

  // Notify company owner & recruiters
  try {
    const recipients = await notificationService.getCompanyRecipients(
      job.company_id,
      "applicants.view"
    );
    const candidateName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "A candidate";
    await notificationService.notifyUsers(recipients, {
      type: NOTIFICATION_TYPES.APPLICATION_RECEIVED,
      title: "New Job Application",
      message: `${candidateName} applied for ${job.title}.`,
      link: `/employer/jobs/${job.id}/applicants`,
      metadata: {
        job_id: job.id,
        application_id: application.id,
        candidate_id: user.id,
      },
      actorId: user.id,
    });
  } catch (err) {
    console.error("Failed to send application notification:", err);
  }

  // Asynchronous non-blocking candidate confirmation email
  emailService
    .sendTemplateEmail("applicationSubmitted", user.email, {
      candidateName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Candidate",
      jobTitle: job.title,
      companyName: job.Company?.name || "the employer",
    })
    .catch((err) => console.error("Application submitted email delivery failed:", err.message));

  return application;
};

const getMyApplications = async (userId) => {
  const applications = await Application.findAll({
    where: {
      user_id: userId,
    },

    include: [
      {
        model: Job,
        include: [
          {
            model: Company,
            attributes: [
              "id",
              "name",
              "logo_url",
              "city",
              "country",
            ],
          },
        ],
      },
    ],

    order: [["created_at", "DESC"]],
  });

  return applications;
};

const getJobApplications = async (
  jobId,
  user
) => {
  const job = await Job.findByPk(jobId, {
    include: [
      {
        model: Company,
        attributes: ["id", "owner_id"],
      },
    ],
  });

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    job.Company.id,
    "applicants.view"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to view these applications"
    );
    error.statusCode = 403;
    throw error;
  }


const applications = await Application.findAll({
  where: {
    job_id: jobId,
  },

  include: [
    {
      model: User,
      as: "applicant",

      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
      ],

      include: [
        {
          model: UserProfile,
        },

        {
          model: UserSkill,
        },

        {
          model: Education,
        },

        {
          model: Experience,
        },

        {
          model: EmployeeProfile,
          as: "employeeProfile",
          required: false,
        },
      ],
    },
  ],

  order: [
    ["created_at", "DESC"],
  ],
});

  return applications;
};

const updateApplicationStatus = async (
  applicationId,
  user,
  status
) => {
  const application = await Application.findByPk(
    applicationId,
    {
      include: [
        {
          model: Job,
          include: [
            {
              model: Company,
              attributes: ["id", "name", "owner_id"],
            },
          ],
        },
        {
          model: User,
          as: "applicant",
          attributes: ["id", "email", "first_name", "last_name", "email_notifications_enabled"],
        },
      ],
    }
  );

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    application.Job.Company.id,
    "applicants.update_status"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to update this application"
    );
    error.statusCode = 403;
    throw error;
  }

  const oldStatus = application.status;
  if (oldStatus !== status) {
    await application.update({
      status,
    });

    // Notify candidate about status update
    try {
      const jobTitle = application.Job?.title || "your application";
      let statusTitle = "Application Update";
      let statusMsg = `Your application status for ${jobTitle} is now ${status}.`;

      if (status === "REVIEWING") {
        statusTitle = "Application Under Review";
        statusMsg = `Your application for ${jobTitle} is currently under review.`;
      } else if (status === "INTERVIEW") {
        statusTitle = "Interview Stage";
        statusMsg = `You have progressed to the interview stage for ${jobTitle}.`;
      } else if (status === "ACCEPTED") {
        statusTitle = "Application Accepted";
        statusMsg = `Congratulations! Your application for ${jobTitle} has been accepted.`;
      } else if (status === "REJECTED") {
        statusTitle = "Application Update";
        statusMsg = `Thank you for your interest. Your application for ${jobTitle} was not selected.`;
      }

      await notificationService.notifyUser({
        userId: application.user_id,
        type: NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED,
        title: statusTitle,
        message: statusMsg,
        link: "/job-seeker/applications",
        metadata: {
          application_id: application.id,
          job_id: application.Job?.id,
          status,
        },
        deduplicationKey: `app_status_${application.id}_${status}`,
      });
    } catch (err) {
      console.error("Failed to send status notification:", err);
    }

    // Asynchronous non-blocking candidate email notification
    if (application.applicant?.email) {
      emailService
        .sendTemplateEmail("applicationStatusChanged", application.applicant.email, {
          candidateName: `${application.applicant.first_name || ""} ${application.applicant.last_name || ""}`.trim() || "Candidate",
          jobTitle: application.Job?.title || "Position",
          companyName: application.Job?.Company?.name || "the company",
          status,
        })
        .catch((err) => console.error("Application status email delivery failed:", err.message));
    }
  }

  return application;
};

const getApplicantDetails = async (applicationId, user) => {
  const application = await Application.findOne({
    where: {
      id: applicationId,
    },
    include: [
      {
        model: Job,
        include: [
          {
            model: Company,
            attributes: ["id", "owner_id"],
          },
        ],
      },
      {
        model: User,
        as: "applicant",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
        ],
        include: [
          {
            model: UserProfile,
          },
          {
            model: UserSkill,
          },
          {
            model: Education,
          },
          {
            model: Experience,
          },
          {
            model: EmployeeProfile,
            as: "employeeProfile",
            required: false,
          },
        ],
      },
    ],
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    application.Job?.Company?.id,
    "applicants.view"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to view this applicant's details"
    );
    error.statusCode = 403;
    throw error;
  }

  return application;
};

const hireApplicant = async (applicationId, user, hiringData = {}) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      {
        model: Job,
        include: [
          {
            model: Company,
            attributes: ["id", "name", "owner_id"],
          },
        ],
      },
      {
        model: User,
        as: "applicant",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
          "phone",
          "status",
        ],
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ["id", "name"],
          },
          {
            model: EmployeeProfile,
            as: "employeeProfile",
            required: false,
          },
        ],
      },
    ],
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership / authorization
  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    application.Job?.Company?.id,
    "employees.manage"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to hire this applicant"
    );
    error.statusCode = 403;
    throw error;
  }


  // Precondition: Only ACCEPTED applications can be converted to employees
  if (application.status !== "ACCEPTED") {
    const error = new Error("Only accepted applicants can be hired.");
    error.statusCode = 400;
    throw error;
  }

  const applicantUser = application.applicant;
  if (!applicantUser) {
    const error = new Error("Applicant user not found");
    error.statusCode = 404;
    throw error;
  }

  // Execute conversion inside a managed transaction
  const conversionResult = await sequelize.transaction(async (t) => {
    const companyId = application.Job.Company.id;
    const existingEmployment = await employmentService.getActiveEmployment(
      applicantUser.id,
      companyId,
      { transaction: t }
    );

    // Repeated hire requests are intentionally read-only: employment changes belong
    // to a dedicated transfer/update workflow, not to hiring idempotency.
    if (existingEmployment) {
      return { profile: applicantUser.employeeProfile, employmentRecord: existingEmployment, isAlreadyHired: true };
    }

    const { department, position } = await employmentService.validateOrganizationAssignments(
      companyId,
      hiringData.departmentId,
      hiringData.positionId,
      t
    );
    const departmentId = hiringData.departmentId || position?.department_id || null;
    const legacyDepartment = department?.name || hiringData.department || null;

    // 1. Ensure EMPLOYEE role exists
    let employeeRole = await Role.findOne({
      where: { name: "EMPLOYEE" },
      transaction: t,
    });

    if (!employeeRole) {
      employeeRole = await Role.create(
        {
          name: "EMPLOYEE",
          description: "Internal Employee",
        },
        { transaction: t }
      );
    }

    // 2. Add EMPLOYEE role safely to existing user (preserves JOB_SEEKER and all existing roles)
    await applicantUser.addRole(employeeRole, { transaction: t });

    // 3. Find or create EmployeeProfile
    let profile = await EmployeeProfile.findOne({
      where: { user_id: applicantUser.id },
      transaction: t,
    });

    if (!profile) {
      profile = await EmployeeProfile.create(
        {
          user_id: applicantUser.id,
          department: legacyDepartment,
          joined_date: new Date(),
        },
        { transaction: t }
      );
    } else if (legacyDepartment && !profile.department) {
        await profile.update(
          { department: legacyDepartment },
          { transaction: t }
        );
    }

    // 4. Create the authoritative company employment record.
    const employmentRecord = await employmentService.createEmployment(
      {
        user_id: applicantUser.id,
        company_id: companyId,
        department_id: departmentId,
        position_id: hiringData.positionId || null,
        employment_type: hiringData.employmentType || application.Job.employment_type,
        start_date: hiringData.startDate || undefined,
        status: "ACTIVE",
      },
      { transaction: t }
    );

    await notificationService.notifyUser({
        userId: applicantUser.id,
        type: NOTIFICATION_TYPES.CANDIDATE_HIRED,
        title: "Employment Confirmed",
        message: `You have been hired by ${application.Job?.Company?.name || "the company"} for ${application.Job?.title || "the position"}!`,
        link: "/employee/dashboard",
        metadata: {
          application_id: application.id,
          company_id: application.Job?.Company?.id,
          job_id: application.Job?.id,
        },
        transaction: t,
        deduplicationKey: `hired_${application.id}`,
    });

    return { profile, employmentRecord, isAlreadyHired: false };
  });

  // Asynchronous non-blocking candidate hiring confirmation email
  emailService
    .sendTemplateEmail("candidateHired", applicantUser.email, {
      candidateName: `${applicantUser.first_name || ""} ${applicantUser.last_name || ""}`.trim() || "New Team Member",
      companyName: application.Job?.Company?.name || "the company",
      positionTitle: application.Job?.title || "Employee",
      departmentName: hiringData.department || null,
      startDate: hiringData.startDate || null,
    })
    .catch((err) => console.error("Hiring email delivery failed:", err.message));

  // Fetch complete employee representation with refreshed roles & profile
  const refreshedUser = await User.findByPk(applicantUser.id, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
      {
        model: EmployeeProfile,
        as: "employeeProfile",
      },
    ],
    attributes: { exclude: ["password_hash"] },
  });

  const employmentRecord = await EmploymentRecord.findByPk(conversionResult.employmentRecord.id, {
    include: [
      { model: Company, as: "company", attributes: ["id", "name"] },
      { model: Department, as: "department", attributes: ["id", "name"] },
      { model: Position, as: "position", attributes: ["id", "title", "department_id"] },
    ],
  });

  return {
    is_already_hired: conversionResult.isAlreadyHired,
    employee: refreshedUser,
    employmentRecord,
    application: {
      id: application.id,
      job_id: application.job_id,
      user_id: application.user_id,
      status: application.status,
      is_hired: true,
    },
  };
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicantDetails,
  hireApplicant,
};
