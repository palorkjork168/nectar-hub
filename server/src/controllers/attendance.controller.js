const attendanceService = require("../services/attendance.service");
const { z } = require("zod");
const { checkInSchema, checkOutSchema } = require("../validators/attendance.validator");

const checkIn = async (req, res, next) => {
  try {
    const validationResult = checkInSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const attendance = await attendanceService.checkIn(req.user.id, validationResult.data);

    res.status(201).json({
      success: true,
      message: "Checked in successfully",
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const validationResult = checkOutSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const attendance = await attendanceService.checkOut(req.user.id, validationResult.data);

    res.status(200).json({
      success: true,
      message: "Checked out successfully",
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const attendances = await attendanceService.getMyAttendance(req.user.id, req.query.companyId);
    
    res.status(200).json({
      success: true,
      data: { attendances },
    });
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const attendances = await attendanceService.getAllAttendance();
    
    res.status(200).json({
      success: true,
      data: { attendances },
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(employeeId).success) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const attendances = await attendanceService.getEmployeeAttendance(employeeId);
    
    res.status(200).json({
      success: true,
      data: { attendances },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyAttendance = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const authorizationService = require("../services/authorization.service");
    const hasShiftPerm = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "shifts.view"
    );
    const hasEmpPerm = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "employees.view"
    );

    if (!hasShiftPerm && !hasEmpPerm) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attendance for this company",
      });
    }

    const attendances = await attendanceService.getCompanyAttendance(companyId, req.query);
    res.status(200).json({
      success: true,
      data: { attendances },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getEmployeeAttendance,
  getCompanyAttendance,
};
