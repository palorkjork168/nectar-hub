const applicationService = require(
  "../services/application.service"
);
const auditService = require("../services/audit.service");

const applyForJob = async (req, res, next) => {
  try {
    const application =
      await applicationService.applyForJob(
        req.params.jobId,
        req.user,
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (
  req,
  res,
  next
) => {
  try {
    const applications =
      await applicationService.getMyApplications(
        req.user.id
      );

    res.status(200).json({
      success: true,
      data: {
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getJobApplications = async (
  req,
  res,
  next
) => {
  try {
    const applications =
      await applicationService.getJobApplications(
        req.params.jobId,
        req.user
      );

    res.status(200).json({
      success: true,
      data: {
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await applicationService.updateApplicationStatus(
        req.params.id,
        req.user,
        req.body.status
      );

    auditService.recordAuditEvent({
      companyId: application.Job?.company_id || application.job?.company_id,
      actorUserId: req.user?.id,
      action: "APPLICATION_STATUS_CHANGED",
      entityType: "Application",
      entityId: application.id,
      description: `Application status updated to ${req.body.status}`,
      metadata: { status: req.body.status, job_id: application.job_id },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Application status updated successfully!",
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getApplicantDetails = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await applicationService.getApplicantDetails(
        req.params.id,
        req.user
      );

    res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

const hireApplicant = async (req, res, next) => {
  try {
    const result = await applicationService.hireApplicant(
      req.params.id,
      req.user,
      req.body
    );

    auditService.recordAuditEvent({
      companyId: result.employmentRecord?.company_id,
      actorUserId: req.user?.id,
      action: "HIRING_ACTION",
      entityType: "Application",
      entityId: req.params.id,
      description: `Candidate hired for position`,
      metadata: {
        employment_record_id: result.employmentRecord?.id,
        candidate_user_id: result.employee?.id,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: result.is_already_hired
        ? "Candidate has already been hired"
        : "Candidate hired successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicantDetails,
  hireApplicant,
};