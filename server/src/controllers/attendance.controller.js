const attendanceService = require("../services/attendance.service");
const attendanceCorrectionService = require("../services/attendanceCorrection.service");
const { z } = require("zod");
const {
  checkInSchema,
  checkOutSchema,
  submitCorrectionSchema,
  reviewCorrectionSchema,
  batchReviewCorrectionSchema,
} = require("../validators/attendance.validator");

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
    const attendances = await attendanceService.getAllAttendance(req.query);
    
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
    const hasAttManage = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "attendance.manage"
    );

    if (!hasShiftPerm && !hasEmpPerm && !hasAttManage) {
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

const submitCorrection = async (req, res, next) => {
  try {
    const validationResult = submitCorrectionSchema.safeParse(req.body);
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

    const correction = await attendanceCorrectionService.submitCorrection(
      req.user,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      message: "Attendance correction request submitted successfully",
      data: { correction },
    });
  } catch (error) {
    next(error);
  }
};

const getMyCorrections = async (req, res, next) => {
  try {
    const corrections = await attendanceCorrectionService.getMyCorrections(
      req.user.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: { corrections },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyCorrections = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const corrections = await attendanceCorrectionService.getCompanyCorrections(
      req.user,
      companyId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: { corrections },
    });
  } catch (error) {
    next(error);
  }
};

const getAllCorrections = async (req, res, next) => {
  try {
    const corrections = await attendanceCorrectionService.getAllCorrections(
      req.user,
      req.query
    );
    res.status(200).json({
      success: true,
      data: { corrections },
    });
  } catch (error) {
    next(error);
  }
};

const approveCorrection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid correction request ID" });
    }

    const validationResult = reviewCorrectionSchema.safeParse(req.body || {});
    const reviewNote = validationResult.success
      ? validationResult.data.reviewNote || validationResult.data.review_note
      : null;

    const result = await attendanceCorrectionService.reviewCorrection(
      req.user,
      id,
      "APPROVED",
      { reviewNote, req }
    );

    res.status(200).json({
      success: true,
      message: "Attendance correction request approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCorrection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid correction request ID" });
    }

    const validationResult = reviewCorrectionSchema.safeParse(req.body || {});
    const reviewNote = validationResult.success
      ? validationResult.data.reviewNote || validationResult.data.review_note
      : null;

    const result = await attendanceCorrectionService.reviewCorrection(
      req.user,
      id,
      "REJECTED",
      { reviewNote, req }
    );

    res.status(200).json({
      success: true,
      message: "Attendance correction request rejected",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const batchReviewCorrections = async (req, res, next) => {
  try {
    const validationResult = batchReviewCorrectionSchema.safeParse(req.body);
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

    const { correctionIds, decision, reviewNote, review_note } = validationResult.data;
    const note = reviewNote || review_note || null;

    const result = await attendanceCorrectionService.batchReviewCorrections(
      req.user,
      correctionIds,
      decision,
      { reviewNote: note, req }
    );

    res.status(200).json({
      success: true,
      message: `Batch review completed: ${result.succeeded.length} succeeded, ${result.failed.length} failed`,
      data: result,
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
  submitCorrection,
  getMyCorrections,
  getCompanyCorrections,
  getAllCorrections,
  approveCorrection,
  rejectCorrection,
  batchReviewCorrections,
};
