const shiftService = require("../services/shift.service");
const authorizationService = require("../services/authorization.service");
const employmentService = require("../services/employment.service");
const auditService = require("../services/audit.service");
const { WorkSchedule, EmploymentRecord } = require("../models");

/**
 * List work schedules belonging to a company
 */
exports.listCompanySchedules = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Check authorization: shifts.view permission or active employee of that company
    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "shifts.view"
    );
    const isMember = await employmentService.hasActiveEmployment(
      req.user.id,
      companyId
    );

    if (!hasPerm && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view work schedules for this company",
      });
    }

    const schedules = await shiftService.listCompanySchedules(
      companyId,
      req.query
    );

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single work schedule by ID
 */
exports.getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await WorkSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      existing.company_id,
      "shifts.view"
    );
    const isMember = await employmentService.hasActiveEmployment(
      req.user.id,
      existing.company_id
    );

    if (!hasPerm && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this work schedule",
      });
    }

    const schedule = await shiftService.getScheduleById(id, existing.company_id);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new work schedule
 */
exports.createSchedule = async (req, res, next) => {
  try {
    const companyId = req.body.companyId || req.body.company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required to create a work schedule",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create work schedules for this company",
      });
    }

    const schedule = await shiftService.createSchedule(companyId, req.body);

    auditService.recordAuditEvent({
      companyId,
      actorUserId: req.user?.id,
      action: "SCHEDULE_CREATED",
      entityType: "WorkSchedule",
      entityId: schedule.id,
      description: `Work schedule "${schedule.name}" created`,
      metadata: { name: schedule.name, schedule_type: schedule.schedule_type },
      req,
    });

    res.status(201).json({
      success: true,
      message: "Work schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing work schedule
 */
exports.updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await WorkSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      existing.company_id,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update work schedules for this company",
      });
    }

    const updated = await shiftService.updateSchedule(
      id,
      existing.company_id,
      req.body
    );

    auditService.recordAuditEvent({
      companyId: existing.company_id,
      actorUserId: req.user?.id,
      action: "SCHEDULE_UPDATED",
      entityType: "WorkSchedule",
      entityId: id,
      description: `Work schedule "${updated.name}" updated`,
      metadata: { name: updated.name, schedule_type: updated.schedule_type },
      req,
    });

    res.json({
      success: true,
      message: "Work schedule updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate or deactivate a work schedule
 */
exports.setScheduleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, isActive } = req.body;
    const activeValue = is_active !== undefined ? is_active : isActive;

    if (activeValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "is_active boolean is required",
      });
    }

    const existing = await WorkSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      existing.company_id,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage work schedules for this company",
      });
    }

    const updated = await shiftService.setScheduleActive(
      id,
      existing.company_id,
      Boolean(activeValue)
    );

    auditService.recordAuditEvent({
      companyId: existing.company_id,
      actorUserId: req.user?.id,
      action: updated.is_active ? "SCHEDULE_ACTIVATED" : "SCHEDULE_DEACTIVATED",
      entityType: "WorkSchedule",
      entityId: id,
      description: `Work schedule "${updated.name}" ${updated.is_active ? "activated" : "deactivated"}`,
      metadata: { name: updated.name, is_active: updated.is_active },
      req,
    });

    res.json({
      success: true,
      message: `Work schedule ${updated.is_active ? "activated" : "deactivated"} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a work schedule (soft deactivates if assigned)
 */
exports.deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await WorkSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      existing.company_id,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete work schedules for this company",
      });
    }

    const result = await shiftService.deleteSchedule(id, existing.company_id);

    auditService.recordAuditEvent({
      companyId: existing.company_id,
      actorUserId: req.user?.id,
      action: "SCHEDULE_DELETED",
      entityType: "WorkSchedule",
      entityId: id,
      description: `Work schedule "${existing.name}" deleted or deactivated`,
      metadata: { name: existing.name },
      req,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign or update a schedule for an EmploymentRecord
 */
exports.assignScheduleToEmployment = async (req, res, next) => {
  try {
    const employmentRecordId =
      req.params.employmentRecordId || req.params.employmentId || req.params.id;
    const workScheduleId =
      req.body.workScheduleId !== undefined
        ? req.body.workScheduleId
        : req.body.work_schedule_id;

    const employment = await EmploymentRecord.findByPk(employmentRecordId);
    if (!employment) {
      return res.status(404).json({
        success: false,
        message: "Employment record not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      employment.company_id,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to assign work schedules for this company",
      });
    }

    const updatedEmployment = await shiftService.assignScheduleToEmployment(
      employmentRecordId,
      workScheduleId,
      employment.company_id
    );

    auditService.recordAuditEvent({
      companyId: employment.company_id,
      actorUserId: req.user?.id,
      action: workScheduleId ? "SCHEDULE_ASSIGNED" : "SCHEDULE_UNASSIGNED",
      entityType: "EmploymentRecord",
      entityId: employmentRecordId,
      description: workScheduleId
        ? `Work schedule assigned to employee record ${employmentRecordId}`
        : `Work schedule unassigned from employee record ${employmentRecordId}`,
      metadata: { workScheduleId },
      req,
    });

    res.json({
      success: true,
      message: workScheduleId
        ? "Work schedule assigned successfully"
        : "Work schedule unassigned successfully",
      data: updatedEmployment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign schedule from an EmploymentRecord
 */
exports.unassignScheduleFromEmployment = async (req, res, next) => {
  try {
    const employmentRecordId =
      req.params.employmentRecordId || req.params.employmentId || req.params.id;

    const employment = await EmploymentRecord.findByPk(employmentRecordId);
    if (!employment) {
      return res.status(404).json({
        success: false,
        message: "Employment record not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      employment.company_id,
      "shifts.manage"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify work schedules for this company",
      });
    }

    const updatedEmployment = await shiftService.assignScheduleToEmployment(
      employmentRecordId,
      null,
      employment.company_id
    );

    auditService.recordAuditEvent({
      companyId: employment.company_id,
      actorUserId: req.user?.id,
      action: "SCHEDULE_UNASSIGNED",
      entityType: "EmploymentRecord",
      entityId: employmentRecordId,
      description: `Work schedule unassigned from employee record ${employmentRecordId}`,
      req,
    });

    res.json({
      success: true,
      message: "Work schedule unassigned successfully",
      data: updatedEmployment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List employees assigned to a schedule
 */
exports.getScheduleEmployees = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await WorkSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    const hasPerm = await authorizationService.hasCompanyPermission(
      req.user,
      existing.company_id,
      "shifts.view"
    );

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view employees for this schedule",
      });
    }

    const employees = await shiftService.getScheduleEmployees(
      id,
      existing.company_id
    );

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current employee's assigned schedule
 */
exports.getMySchedule = async (req, res, next) => {
  try {
    const { companyId } = req.query;

    const schedule = await shiftService.getMySchedule(req.user.id, companyId);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};
