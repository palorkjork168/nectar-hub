const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Interview,
  Application,
  Job,
  Company,
  User,
  UserProfile,
  CompanyUserRole,
} = require("../models");
const authorizationService = require("./authorization.service");
const notificationService = require("./notification.service");
const NOTIFICATION_TYPES = require("../constants/notificationTypes");
const emailService = require("./email.service");

const createInterview = async (user, interviewData) => {
  const application = await Application.findByPk(
    interviewData.application_id,
    {
      include: [
        {
          model: Job,
          include: [
            {
              model: Company,
              attributes: ["id", "owner_id", "name"],
            },
          ],
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
    application.Job?.Company?.id,
    "interviews.schedule"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to schedule an interview for this application"
    );
    error.statusCode = 403;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    const interview = await Interview.create(
      {
        ...interviewData,
        created_by: user.id,
        status: "SCHEDULED",
      },
      { transaction }
    );

    // Automatically advance application status to INTERVIEW if in PENDING or REVIEWING
    if (
      application.status === "PENDING" ||
      application.status === "REVIEWING"
    ) {
      await application.update(
        { status: "INTERVIEW" },
        { transaction }
      );
    }

    // Notify candidate about scheduled interview
    const jobTitle = application.Job?.title || "your application";
    await notificationService.notifyUser({
      userId: application.user_id,
      type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
      title: "Interview Scheduled",
      message: `Your interview for ${jobTitle} has been scheduled for ${new Date(interviewData.scheduled_at).toLocaleString()}.`,
      link: "/job-seeker/interviews",
      metadata: {
        interview_id: interview.id,
        application_id: application.id,
        job_id: application.Job?.id,
      },
      transaction,
      deduplicationKey: `interview_sched_${interview.id}`,
    });

    await transaction.commit();

    // Reload with associations
    const reloaded = await Interview.findByPk(interview.id, {
      include: [
        {
          model: Application,
          as: "application",
          include: [
            {
              model: Job,
              include: [{ model: Company }],
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
              include: [{ model: UserProfile }],
            },
          ],
        },
      ],
    });

    // Asynchronous candidate interview email
    if (reloaded?.application?.applicant?.email) {
      emailService
        .sendTemplateEmail("interviewScheduled", reloaded.application.applicant.email, {
          candidateName: `${reloaded.application.applicant.first_name || ""} ${reloaded.application.applicant.last_name || ""}`.trim() || "Candidate",
          jobTitle: reloaded.application.Job?.title || "Position",
          companyName: reloaded.application.Job?.Company?.name || "Company",
          scheduledAt: reloaded.scheduled_at,
          type: reloaded.interview_type,
          location: reloaded.meeting_link || reloaded.location || "Online",
        })
        .catch((err) => console.error("Interview scheduled email failed:", err.message));
    }

    return reloaded;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getInterviewById = async (interviewId, user) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            include: [{ model: Company }],
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
            include: [{ model: UserProfile }],
          },
        ],
      },
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
        ],
      },
    ],
  });

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const isCandidate =
    interview.application?.user_id === user.id;

  let hasCompanyPerm = false;
  if (!isCandidate) {
    hasCompanyPerm = await authorizationService.hasCompanyPermission(
      user,
      interview.application?.Job?.Company?.id,
      "interviews.view"
    );
  }

  if (!isCandidate && !hasCompanyPerm) {
    const error = new Error(
      "You do not have permission to view this interview"
    );
    error.statusCode = 403;
    throw error;
  }

  return interview;
};

const getApplicationInterviews = async (applicationId, user) => {
  const application = await Application.findByPk(applicationId, {
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
    ],
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const userRoles = (user?.Roles || []).map((r) => r.name);
  const isAdmin = userRoles.includes("ADMIN");
  const isOwner =
    application.Job?.Company?.owner_id === user.id;
  const isCandidate = application.user_id === user.id;

  if (!isAdmin && !isOwner && !isCandidate) {
    const error = new Error(
      "You do not have permission to view interviews for this application"
    );
    error.statusCode = 403;
    throw error;
  }

  const interviews = await Interview.findAll({
    where: {
      application_id: applicationId,
    },
    include: [
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
        ],
      },
    ],
    order: [["scheduled_at", "DESC"]],
  });

  return interviews;
};

const getEmployerInterviews = async (user, query = {}) => {
  const isAdmin = authorizationService.isAdmin(user);

  let companyWhere;
  if (isAdmin) {
    companyWhere = undefined;
  } else {
    const assignedCompanyRoles = await CompanyUserRole.findAll({
      where: { user_id: user.id },
      attributes: ["company_id"],
    });
    const companyIds = assignedCompanyRoles.map((cr) => cr.company_id);
    if (companyIds.length > 0) {
      companyWhere = {
        [Op.or]: [{ owner_id: user.id }, { id: companyIds }],
      };
    } else {
      companyWhere = { owner_id: user.id };
    }
  }

  const interviewWhere = {};

  if (query.status) {
    interviewWhere.status = query.status;
  }

  if (query.upcoming === "true") {
    interviewWhere.status = "SCHEDULED";
    interviewWhere.scheduled_at = {
      [Op.gte]: new Date(),
    };
  }

  const interviews = await Interview.findAll({
    where: interviewWhere,
    include: [
      {
        model: Application,
        as: "application",
        required: true,
        include: [
          {
            model: Job,
            required: true,
            include: [
              {
                model: Company,
                required: true,
                where: companyWhere,
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
            include: [{ model: UserProfile }],
          },
        ],
      },
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
        ],
      },
    ],
    order: [["scheduled_at", "ASC"]],
  });

  return interviews;
};

const getMyInterviews = async (user) => {
  const interviews = await Interview.findAll({
    include: [
      {
        model: Application,
        as: "application",
        required: true,
        where: {
          user_id: user.id,
        },
        include: [
          {
            model: Job,
            required: true,
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
      },
      {
        model: User,
        as: "creator",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
        ],
      },
    ],
    order: [["scheduled_at", "ASC"]],
  });

  return interviews;
};

const updateInterview = async (
  interviewId,
  user,
  updateData
) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            include: [{ model: Company }],
          },
          {
            model: User,
            as: "applicant",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      },
    ],
  });

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    interview.application?.Job?.Company?.id,
    "interviews.update"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to update this interview"
    );
    error.statusCode = 403;
    throw error;
  }

  if (interview.status === "COMPLETED") {
    const error = new Error(
      "Cannot modify an interview that is already completed"
    );
    error.statusCode = 400;
    throw error;
  }

  if (interview.status === "CANCELLED") {
    const error = new Error(
      "Cannot modify a cancelled interview"
    );
    error.statusCode = 400;
    throw error;
  }

  const oldScheduledAt = interview.scheduled_at ? new Date(interview.scheduled_at).getTime() : null;
  const newScheduledAt = updateData.scheduled_at ? new Date(updateData.scheduled_at).getTime() : null;
  const isRescheduled = Boolean(newScheduledAt && oldScheduledAt !== newScheduledAt);

  await interview.update(updateData);

  if (isRescheduled) {
    try {
      const jobTitle = interview.application?.Job?.title || "your application";
      await notificationService.notifyUser({
        userId: interview.application?.user_id,
        type: NOTIFICATION_TYPES.INTERVIEW_RESCHEDULED,
        title: "Interview Rescheduled",
        message: `Your interview for ${jobTitle} has been rescheduled to ${new Date(updateData.scheduled_at).toLocaleString()}.`,
        link: "/job-seeker/interviews",
        metadata: {
          interview_id: interview.id,
          application_id: interview.application_id,
          scheduled_at: updateData.scheduled_at,
        },
        deduplicationKey: `interview_resched_${interview.id}_${updateData.scheduled_at}`,
      });
    } catch (err) {
      console.error("Failed to send reschedule notification:", err);
    }

    if (interview.application?.applicant?.email) {
      emailService
        .sendTemplateEmail("interviewRescheduled", interview.application.applicant.email, {
          candidateName: `${interview.application.applicant.first_name || ""} ${interview.application.applicant.last_name || ""}`.trim() || "Candidate",
          jobTitle: interview.application.Job?.title || "Position",
          companyName: interview.application.Job?.Company?.name || "Company",
          scheduledAt: updateData.scheduled_at,
        })
        .catch((err) => console.error("Interview rescheduled email failed:", err.message));
    }
  }

  return interview;
};

const cancelInterview = async (interviewId, user) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            include: [{ model: Company }],
          },
          {
            model: User,
            as: "applicant",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      },
    ],
  });

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    interview.application?.Job?.Company?.id,
    "interviews.cancel"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to cancel this interview"
    );
    error.statusCode = 403;
    throw error;
  }

  if (interview.status === "COMPLETED") {
    const error = new Error(
      "Cannot cancel an interview that has already been completed"
    );
    error.statusCode = 400;
    throw error;
  }

  if (interview.status === "CANCELLED") {
    return interview; // Idempotent
  }

  await interview.update({ status: "CANCELLED" });

  try {
    const jobTitle = interview.application?.Job?.title || "your application";
    await notificationService.notifyUser({
      userId: interview.application?.user_id,
      type: NOTIFICATION_TYPES.INTERVIEW_CANCELLED,
      title: "Interview Cancelled",
      message: `Your interview for ${jobTitle} has been cancelled.`,
      link: "/job-seeker/interviews",
      metadata: {
        interview_id: interview.id,
        application_id: interview.application_id,
      },
      deduplicationKey: `interview_cancelled_${interview.id}`,
    });
  } catch (err) {
    console.error("Failed to send interview cancellation notification:", err);
  }

  if (interview.application?.applicant?.email) {
    emailService
      .sendTemplateEmail("interviewCancelled", interview.application.applicant.email, {
        candidateName: `${interview.application.applicant.first_name || ""} ${interview.application.applicant.last_name || ""}`.trim() || "Candidate",
        jobTitle: interview.application.Job?.title || "Position",
        companyName: interview.application.Job?.Company?.name || "Company",
      })
      .catch((err) => console.error("Interview cancelled email failed:", err.message));
  }

  return interview;
};

const completeInterview = async (
  interviewId,
  user,
  notes
) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            include: [{ model: Company }],
          },
        ],
      },
    ],
  });

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const hasPerm = await authorizationService.hasCompanyPermission(
    user,
    interview.application?.Job?.Company?.id,
    "interviews.update"
  );

  if (!hasPerm) {
    const error = new Error(
      "You do not have permission to complete this interview"
    );
    error.statusCode = 403;
    throw error;
  }

  if (interview.status === "CANCELLED") {
    const error = new Error(
      "Cannot complete an interview that was cancelled"
    );
    error.statusCode = 400;
    throw error;
  }

  const updatedNotes = notes
    ? interview.notes
      ? `${interview.notes}\n\n[Completion Notes]: ${notes}`
      : notes
    : interview.notes;

  await interview.update({
    status: "COMPLETED",
    notes: updatedNotes,
  });

  return interview;
};

module.exports = {
  createInterview,
  getInterviewById,
  getApplicationInterviews,
  getEmployerInterviews,
  getMyInterviews,
  updateInterview,
  cancelInterview,
  completeInterview,
};
