const rosterService = require("../services/roster.service");
const authorizationService = require("../services/authorization.service");
const employmentService = require("../services/employment.service");
const {
  assignShiftSchema,
  bulkAssignShiftSchema,
  rosterQuerySchema,
} = require("../validators/roster.validator");
const { z } = require("zod");

/**
 * Check if user can manage roster/shifts in the given company
 */
const canManageRoster = async (user, companyId) => {
  if (authorizationService.isAdmin(user)) return true;
  if (await authorizationService.isCompanyOwner(user, companyId)) return true;

  const hasShiftManage = await authorizationService.hasCompanyPermission(
    user,
    companyId,
    "shifts.manage"
  );
  if (hasShiftManage) return true;

  const hasAttendanceManage = await authorizationService.hasCompanyPermission(
    user,
    companyId,
    "attendance.manage"
  );
  if (hasAttendanceManage) return true;

  return false;
};

/**
 * Check if user can view roster in the given company
 */
const canViewRoster = async (user, companyId) => {
  if (authorizationService.isAdmin(user)) return true;
  if (await canManageRoster(user, companyId)) return true;

  const hasShiftView = await authorizationService.hasCompanyPermission(
    user,
    companyId,
    "shifts.view"
  );
  if (hasShiftView) return true;

  const isMember = await employmentService.hasActiveEmployment(user.id, companyId);
  return isMember;
};

/**
 * Get weekly roster for a company
 */
const getWeeklyRoster = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const authorized = await canViewRoster(req.user, companyId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view roster for this company",
      });
    }

    const validationResult = rosterQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const { start_date, end_date, department_id } = validationResult.data;
    const roster = await rosterService.getWeeklyRoster(companyId, start_date, end_date, {
      departmentId: department_id,
    });

    res.status(200).json({
      success: true,
      data: { roster },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a single shift or rest day
 */
const assignShift = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const authorized = await canManageRoster(req.user, companyId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage shift roster for this company",
      });
    }

    const validationResult = assignShiftSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const assignment = await rosterService.assignShift(
      companyId,
      validationResult.data,
      req.user.id,
      req
    );

    res.status(200).json({
      success: true,
      message: "Shift assigned successfully",
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk assign shifts
 */
const bulkAssignShifts = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const authorized = await canManageRoster(req.user, companyId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage shift roster for this company",
      });
    }

    const validationResult = bulkAssignShiftSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const report = await rosterService.bulkAssignShifts(
      companyId,
      validationResult.data.assignments,
      req.user.id,
      req
    );

    res.status(200).json({
      success: true,
      message: `Bulk assignment processed: ${report.succeeded} succeeded, ${report.failed} failed`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific shift assignment (reverts back to baseline)
 */
const deleteShiftAssignment = async (req, res, next) => {
  try {
    const { companyId, assignmentId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success || !uuidSchema.safeParse(assignmentId).success) {
      return res.status(400).json({ success: false, message: "Invalid UUID parameter" });
    }

    const authorized = await canManageRoster(req.user, companyId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage shift roster for this company",
      });
    }

    const result = await rosterService.deleteShiftAssignment(
      companyId,
      assignmentId,
      req.user.id,
      req
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyRoster,
  assignShift,
  bulkAssignShifts,
  deleteShiftAssignment,
};
