const { Op } = require("sequelize");
const {
  Attendance,
  AttendanceCorrectionRequest,
  EmploymentRecord,
  WorkSchedule,
  Company,
  User,
  Department,
  Position,
} = require("../models");
const sequelize = require("../config/database");
const attendanceScheduleService = require("./attendanceSchedule.service");
const authorizationService = require("./authorization.service");
const auditService = require("./audit.service");
const notificationService = require("./notification.service");
const NOTIFICATION_TYPES = require("../constants/notificationTypes");

class AttendanceCorrectionService {
  /**
   * Submit an attendance correction request (Employee).
   */
  async submitCorrection(user, data) {
    const companyId = data.companyId || data.company_id;
    const attendanceId = data.attendanceId || data.attendance_id || null;
    const correctionType = data.correctionType || data.correction_type;
    const rawCheckIn = data.requestedCheckInTime || data.requested_check_in_time || null;
    const rawCheckOut = data.requestedCheckOutTime || data.requested_check_out_time || null;
    const reason = (data.reason || "").trim();

    if (!companyId) {
      const err = new Error("Company ID is required");
      err.statusCode = 400;
      throw err;
    }

    if (!reason || reason.length < 3) {
      const err = new Error("A valid reason of at least 3 characters is required");
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify active employment in company
    const employment = await EmploymentRecord.findOne({
      where: {
        user_id: user.id,
        company_id: companyId,
        status: "ACTIVE",
      },
    });

    if (!employment) {
      const err = new Error("No active employment found for this company");
      err.statusCode = 403;
      throw err;
    }

    let originalCheckInTime = null;
    let originalCheckOutTime = null;
    let workScheduleId = employment.work_schedule_id || null;
    let targetAttendance = null;

    // 2. Validate attendance record if supplied
    if (attendanceId) {
      targetAttendance = await Attendance.findByPk(attendanceId);
      if (!targetAttendance) {
        const err = new Error("Attendance record not found");
        err.statusCode = 404;
        throw err;
      }

      if (targetAttendance.user_id !== user.id) {
        const err = new Error("Unauthorized to request correction for another employee's attendance record");
        err.statusCode = 403;
        throw err;
      }

      if (targetAttendance.company_id && targetAttendance.company_id !== companyId) {
        const err = new Error("Attendance record does not belong to the specified company");
        err.statusCode = 400;
        throw err;
      }

      // Check for duplicate pending requests on the same record
      const existingPending = await AttendanceCorrectionRequest.findOne({
        where: {
          attendance_id: attendanceId,
          status: "PENDING",
        },
      });

      if (existingPending) {
        const err = new Error("A pending correction request already exists for this attendance record");
        err.statusCode = 400;
        throw err;
      }

      originalCheckInTime = targetAttendance.check_in_time;
      originalCheckOutTime = targetAttendance.check_out_time;
      if (targetAttendance.work_schedule_id) {
        workScheduleId = targetAttendance.work_schedule_id;
      }
    }

    // 3. Normalize requested timestamps
    const requestedCheckInTime = rawCheckIn ? new Date(rawCheckIn) : null;
    const requestedCheckOutTime = rawCheckOut ? new Date(rawCheckOut) : null;

    if (requestedCheckInTime && isNaN(requestedCheckInTime.getTime())) {
      const err = new Error("Invalid requested check-in timestamp");
      err.statusCode = 400;
      throw err;
    }

    if (requestedCheckOutTime && isNaN(requestedCheckOutTime.getTime())) {
      const err = new Error("Invalid requested check-out timestamp");
      err.statusCode = 400;
      throw err;
    }

    // Chronology validation
    const effectiveIn = requestedCheckInTime || (targetAttendance ? new Date(targetAttendance.check_in_time) : null);
    const effectiveOut = requestedCheckOutTime || (targetAttendance && targetAttendance.check_out_time ? new Date(targetAttendance.check_out_time) : null);

    if (effectiveIn && effectiveOut && effectiveOut.getTime() <= effectiveIn.getTime()) {
      const err = new Error("Check-out time must be after check-in time");
      err.statusCode = 400;
      throw err;
    }

    // Future timestamp guard
    const now = new Date();
    if (requestedCheckInTime && requestedCheckInTime.getTime() > now.getTime() + 60000) {
      const err = new Error("Requested check-in time cannot be in the future");
      err.statusCode = 400;
      throw err;
    }
    if (requestedCheckOutTime && requestedCheckOutTime.getTime() > now.getTime() + 60000) {
      const err = new Error("Requested check-out time cannot be in the future");
      err.statusCode = 400;
      throw err;
    }

    // Specific validation based on correction type
    if (correctionType === "MISSING_CHECK_OUT" && !requestedCheckOutTime) {
      const err = new Error("Requested check-out time is required for MISSING_CHECK_OUT correction");
      err.statusCode = 400;
      throw err;
    }

    if (correctionType === "MISSING_CHECK_IN" && !requestedCheckInTime) {
      const err = new Error("Requested check-in time is required for MISSING_CHECK_IN correction");
      err.statusCode = 400;
      throw err;
    }

    if (correctionType === "MISSED_SHIFT" && (!requestedCheckInTime || !requestedCheckOutTime)) {
      const err = new Error("Both check-in and check-out times are required for MISSED_SHIFT correction");
      err.statusCode = 400;
      throw err;
    }

    // 4. Create persistent record
    const correctionRequest = await AttendanceCorrectionRequest.create({
      attendance_id: attendanceId,
      user_id: user.id,
      company_id: companyId,
      employment_record_id: employment.id,
      work_schedule_id: workScheduleId,
      correction_type: correctionType,
      requested_check_in_time: requestedCheckInTime,
      requested_check_out_time: requestedCheckOutTime,
      original_check_in_time: originalCheckInTime,
      original_check_out_time: originalCheckOutTime,
      reason,
      status: "PENDING",
    });

    // 5. Immutable Audit Trail
    await auditService.recordAuditEvent({
      companyId,
      actorUserId: user.id,
      action: "ATTENDANCE_CORRECTION_SUBMITTED",
      entityType: "ATTENDANCE_CORRECTION_REQUEST",
      entityId: correctionRequest.id,
      description: `${user.first_name || "Employee"} submitted an attendance correction request (${correctionType})`,
      metadata: {
        attendance_id: attendanceId,
        correction_type: correctionType,
        requested_check_in_time: requestedCheckInTime,
        requested_check_out_time: requestedCheckOutTime,
        reason,
      },
    });

    // 6. Notify company HR reviewers
    try {
      const reviewers = await notificationService.getCompanyRecipients(companyId, [
        "attendance.manage",
        "shifts.manage",
      ]);
      await notificationService.notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_REQUESTED,
        title: "New Attendance Correction Request",
        message: `${user.first_name || "An employee"} submitted a punch correction request.`,
        link: "/employer/attendance/corrections",
        data: { correctionId: correctionRequest.id, companyId },
      });
    } catch (err) {
      console.warn("[AttendanceCorrection] Notification dispatch skipped:", err.message);
    }

    return correctionRequest;
  }

  /**
   * Get employee's own submitted correction requests.
   */
  async getMyCorrections(userId, query = {}) {
    const where = { user_id: userId };
    if (query.status) {
      where.status = query.status.toUpperCase();
    }
    if (query.companyId) {
      where.company_id = query.companyId;
    }

    const requests = await AttendanceCorrectionRequest.findAll({
      where,
      include: [
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: WorkSchedule, as: "workSchedule", attributes: ["id", "name", "start_time", "end_time", "expected_hours"] },
        {
          model: Attendance,
          as: "attendance",
          attributes: [
            "id",
            "check_in_time",
            "check_out_time",
            "actual_hours",
            "is_late",
            "late_minutes",
            "is_early_departure",
            "early_departure_minutes",
            "status",
          ],
        },
        { model: User, as: "reviewer", attributes: ["id", "first_name", "last_name", "email"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return requests;
  }

  /**
   * Get company correction requests for review (HR / Employer / Manager).
   */
  async getCompanyCorrections(reviewerUser, companyId, query = {}) {
    const hasPerm = await this.canReviewCompany(reviewerUser, companyId);
    if (!hasPerm) {
      const err = new Error("Not authorized to review attendance corrections for this company");
      err.statusCode = 403;
      throw err;
    }

    const where = { company_id: companyId };
    if (query.status && query.status !== "ALL") {
      where.status = query.status.toUpperCase();
    }
    if (query.correctionType && query.correctionType !== "ALL") {
      where.correction_type = query.correctionType;
    }
    if (query.userId) {
      where.user_id = query.userId;
    }
    if (query.startDate && query.endDate) {
      where.created_at = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    } else if (query.startDate) {
      where.created_at = { [Op.gte]: new Date(query.startDate) };
    } else if (query.endDate) {
      where.created_at = { [Op.lte]: new Date(query.endDate) };
    }

    const requests = await AttendanceCorrectionRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "avatar_url"],
        },
        {
          model: WorkSchedule,
          as: "workSchedule",
          attributes: ["id", "name", "start_time", "end_time", "expected_hours", "grace_period_minutes"],
        },
        {
          model: EmploymentRecord,
          as: "employmentRecord",
          include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: Position, as: "position", attributes: ["id", "title"] },
          ],
        },
        {
          model: Attendance,
          as: "attendance",
          attributes: [
            "id",
            "check_in_time",
            "check_out_time",
            "actual_hours",
            "is_late",
            "late_minutes",
            "is_early_departure",
            "early_departure_minutes",
            "status",
            "is_corrected",
            "location_status",
          ],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return requests;
  }

  /**
   * Get all correction requests across all companies (Platform Admin).
   */
  async getAllCorrections(reviewerUser, query = {}) {
    if (!authorizationService.isAdmin(reviewerUser)) {
      const err = new Error("Administrative permission required");
      err.statusCode = 403;
      throw err;
    }

    const where = {};
    if (query.companyId && query.companyId !== "ALL") {
      where.company_id = query.companyId;
    }
    if (query.status && query.status !== "ALL") {
      where.status = query.status.toUpperCase();
    }
    if (query.correctionType && query.correctionType !== "ALL") {
      where.correction_type = query.correctionType;
    }
    if (query.userId) {
      where.user_id = query.userId;
    }
    if (query.startDate && query.endDate) {
      where.created_at = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    } else if (query.startDate) {
      where.created_at = { [Op.gte]: new Date(query.startDate) };
    } else if (query.endDate) {
      where.created_at = { [Op.lte]: new Date(query.endDate) };
    }

    const requests = await AttendanceCorrectionRequest.findAll({
      where,
      include: [
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: User, as: "user", attributes: ["id", "first_name", "last_name", "email", "avatar_url"] },
        { model: WorkSchedule, as: "workSchedule", attributes: ["id", "name", "start_time", "end_time", "expected_hours", "grace_period_minutes"] },
        {
          model: EmploymentRecord,
          as: "employmentRecord",
          include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: Position, as: "position", attributes: ["id", "title"] },
          ],
        },
        { model: Attendance, as: "attendance" },
        { model: User, as: "reviewer", attributes: ["id", "first_name", "last_name", "email"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return requests;
  }

  /**
   * Check if a reviewer has review permissions for a specific company.
   */
  async canReviewCompany(user, companyId) {
    if (!user) return false;
    if (authorizationService.isAdmin(user)) return true;

    // Check attendance.manage or shifts.manage or employees.manage
    const hasAttendanceManage = await authorizationService.hasCompanyPermission(user, companyId, "attendance.manage");
    if (hasAttendanceManage) return true;

    const hasShiftManage = await authorizationService.hasCompanyPermission(user, companyId, "shifts.manage");
    if (hasShiftManage) return true;

    const hasEmpManage = await authorizationService.hasCompanyPermission(user, companyId, "employees.manage");
    if (hasEmpManage) return true;

    const isOwner = await authorizationService.isCompanyOwner(user, companyId);
    if (isOwner) return true;

    return false;
  }

  /**
   * Review a correction request (APPROVE or REJECT).
   * Executes safely within a database transaction with concurrency lock.
   */
  async reviewCorrection(reviewerUser, correctionId, decision, { reviewNote = null, req = null } = {}) {
    const normalizedDecision = (decision || "").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(normalizedDecision)) {
      const err = new Error("Decision must be either APPROVED or REJECTED");
      err.statusCode = 400;
      throw err;
    }

    return await sequelize.transaction(async (t) => {
      // 1. Lock correction request row for update
      const correction = await AttendanceCorrectionRequest.findByPk(correctionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!correction) {
        const err = new Error("Attendance correction request not found");
        err.statusCode = 404;
        throw err;
      }

      if (correction.status !== "PENDING") {
        const err = new Error(`Correction request has already been ${correction.status.toLowerCase()}`);
        err.statusCode = 400;
        throw err;
      }

      // 2. Validate reviewer authorization
      const canReview = await this.canReviewCompany(reviewerUser, correction.company_id);
      if (!canReview) {
        const err = new Error("Not authorized to review attendance corrections for this company");
        err.statusCode = 403;
        throw err;
      }

      // 3. Self-approval guard (TC-05: employees cannot approve their own requests)
      if (correction.user_id === reviewerUser.id && !authorizationService.isAdmin(reviewerUser)) {
        const err = new Error("Self-approval is prohibited. Another authorized manager must review this request.");
        err.statusCode = 403;
        throw err;
      }

      // 4. Branch: REJECTED
      if (normalizedDecision === "REJECTED") {
        correction.status = "REJECTED";
        correction.reviewed_by = reviewerUser.id;
        correction.reviewed_at = new Date();
        correction.review_note = reviewNote || "Correction request rejected by reviewer.";
        await correction.save({ transaction: t });

        // Audit Trail
        await auditService.recordAuditEvent({
          req,
          companyId: correction.company_id,
          actorUserId: reviewerUser.id,
          action: "ATTENDANCE_CORRECTION_REJECTED",
          entityType: "ATTENDANCE_CORRECTION_REQUEST",
          entityId: correction.id,
          description: `Attendance correction request rejected by reviewer`,
          metadata: {
            user_id: correction.user_id,
            attendance_id: correction.attendance_id,
            review_note: correction.review_note,
          },
        });

        // Notify employee
        try {
          await notificationService.notifyUser({
            userId: correction.user_id,
            type: NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_REJECTED,
            title: "Attendance Correction Rejected",
            message: `Your punch correction request was rejected: ${correction.review_note}`,
            link: "/employee/attendance",
            data: { correctionId: correction.id },
          });
        } catch (err) {
          console.warn("[AttendanceCorrection] Rejection notification skipped:", err.message);
        }

        return { correction, attendance: null };
      }

      // 5. Branch: APPROVED -> Safe Attendance Update & Open-Shift Deadlock Resolution
      let effectiveAttendance = null;
      let schedule = null;
      if (correction.work_schedule_id) {
        schedule = await WorkSchedule.findByPk(correction.work_schedule_id, { transaction: t });
      }

      if (correction.attendance_id) {
        // Lock attendance row for update
        effectiveAttendance = await Attendance.findByPk(correction.attendance_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!effectiveAttendance) {
          const err = new Error("Underlying attendance record no longer exists");
          err.statusCode = 404;
          throw err;
        }

        // Preserve original values if not already preserved
        if (!effectiveAttendance.original_check_in_time) {
          effectiveAttendance.original_check_in_time = effectiveAttendance.check_in_time;
        }
        if (!effectiveAttendance.original_check_out_time && effectiveAttendance.check_out_time) {
          effectiveAttendance.original_check_out_time = effectiveAttendance.check_out_time;
        }

        // Apply corrected timestamps
        if (correction.requested_check_in_time) {
          effectiveAttendance.check_in_time = correction.requested_check_in_time;
        }
        if (correction.requested_check_out_time) {
          effectiveAttendance.check_out_time = correction.requested_check_out_time;
        }

        effectiveAttendance.is_corrected = true;
        effectiveAttendance.location_status = "MANUALLY_CORRECTED";

        // Recalculate derived intelligence metrics
        const checkIn = new Date(effectiveAttendance.check_in_time);
        const checkOut = effectiveAttendance.check_out_time ? new Date(effectiveAttendance.check_out_time) : null;

        let isLate = false;
        let lateMinutes = 0;
        if (schedule) {
          const lateCalc = attendanceScheduleService.calculateLateMinutes(
            checkIn,
            schedule.start_time,
            schedule.grace_period_minutes
          );
          isLate = lateCalc.isLate;
          lateMinutes = lateCalc.lateMinutes;
        }
        effectiveAttendance.is_late = isLate;
        effectiveAttendance.late_minutes = lateMinutes;

        if (checkOut) {
          // Closed shift: calculate worked hours, early departure, completion %, deterministic status
          const actualHours = attendanceScheduleService.calculateWorkedHours(checkIn, checkOut);
          effectiveAttendance.actual_hours = actualHours;

          let isEarlyDeparture = false;
          let earlyDepartureMinutes = 0;
          let completionPercentage = null;

          if (schedule) {
            const earlyCalc = attendanceScheduleService.calculateEarlyDeparture(
              checkOut,
              schedule.end_time,
              schedule.start_time
            );
            isEarlyDeparture = earlyCalc.isEarlyDeparture;
            earlyDepartureMinutes = earlyCalc.earlyDepartureMinutes;
            completionPercentage = attendanceScheduleService.calculateCompletionPercentage(
              actualHours,
              schedule.expected_hours
            );
          }

          effectiveAttendance.is_early_departure = isEarlyDeparture;
          effectiveAttendance.early_departure_minutes = earlyDepartureMinutes;
          effectiveAttendance.completion_percentage = completionPercentage;
          effectiveAttendance.status = attendanceScheduleService.determineAttendanceStatus({
            hasSchedule: !!schedule,
            isCompleted: true,
            isLate,
            isEarlyDeparture,
          });
        } else {
          // Shift still in progress (e.g., check-in time was corrected while working)
          effectiveAttendance.status = "IN_PROGRESS";
        }

        await effectiveAttendance.save({ transaction: t });
      } else {
        // Completely missed shift: create newly approved attendance record
        const checkIn = new Date(correction.requested_check_in_time);
        const checkOut = correction.requested_check_out_time ? new Date(correction.requested_check_out_time) : null;

        let isLate = false;
        let lateMinutes = 0;
        if (schedule) {
          const lateCalc = attendanceScheduleService.calculateLateMinutes(
            checkIn,
            schedule.start_time,
            schedule.grace_period_minutes
          );
          isLate = lateCalc.isLate;
          lateMinutes = lateCalc.lateMinutes;
        }

        let actualHours = null;
        let isEarlyDeparture = false;
        let earlyDepartureMinutes = 0;
        let completionPercentage = null;

        if (checkOut) {
          actualHours = attendanceScheduleService.calculateWorkedHours(checkIn, checkOut);
          if (schedule) {
            const earlyCalc = attendanceScheduleService.calculateEarlyDeparture(
              checkOut,
              schedule.end_time,
              schedule.start_time
            );
            isEarlyDeparture = earlyCalc.isEarlyDeparture;
            earlyDepartureMinutes = earlyCalc.earlyDepartureMinutes;
            completionPercentage = attendanceScheduleService.calculateCompletionPercentage(
              actualHours,
              schedule.expected_hours
            );
          }
        }

        const finalStatus = attendanceScheduleService.determineAttendanceStatus({
          hasSchedule: !!schedule,
          isCompleted: !!checkOut,
          isLate,
          isEarlyDeparture,
        });

        effectiveAttendance = await Attendance.create(
          {
            user_id: correction.user_id,
            company_id: correction.company_id,
            employment_record_id: correction.employment_record_id,
            work_schedule_id: correction.work_schedule_id,
            check_in_time: checkIn,
            check_out_time: checkOut,
            check_in_lat: null,
            check_in_long: null,
            check_out_lat: null,
            check_out_long: null,
            is_corrected: true,
            location_status: "MANUALLY_CORRECTED",
            is_late: isLate,
            late_minutes: lateMinutes,
            is_early_departure: isEarlyDeparture,
            early_departure_minutes: earlyDepartureMinutes,
            actual_hours: actualHours,
            completion_percentage: completionPercentage,
            status: finalStatus,
          },
          { transaction: t }
        );

        correction.attendance_id = effectiveAttendance.id;
      }

      // Mark correction as approved
      correction.status = "APPROVED";
      correction.reviewed_by = reviewerUser.id;
      correction.reviewed_at = new Date();
      correction.review_note = reviewNote || "Approved by reviewer.";
      await correction.save({ transaction: t });

      // Audit Trail
      await auditService.recordAuditEvent({
        req,
        companyId: correction.company_id,
        actorUserId: reviewerUser.id,
        action: "ATTENDANCE_CORRECTION_APPROVED",
        entityType: "ATTENDANCE_CORRECTION_REQUEST",
        entityId: correction.id,
        description: `Attendance correction request approved by reviewer`,
        metadata: {
          attendance_id: effectiveAttendance.id,
          user_id: correction.user_id,
          requested_check_in_time: correction.requested_check_in_time,
          requested_check_out_time: correction.requested_check_out_time,
          original_check_in_time: correction.original_check_in_time,
          original_check_out_time: correction.original_check_out_time,
          review_note: correction.review_note,
        },
      });

      // Notify employee
      try {
        await notificationService.notifyUser({
          userId: correction.user_id,
          type: NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_APPROVED,
          title: "Attendance Correction Approved",
          message: "Your attendance correction request has been approved.",
          link: "/employee/attendance",
          data: {
            correctionId: correction.id,
            attendanceId: effectiveAttendance.id,
          },
        });
      } catch (err) {
        console.warn("[AttendanceCorrection] Approval notification skipped:", err.message);
      }

      return { correction, attendance: effectiveAttendance };
    });
  }

  /**
   * Batch review multiple correction requests (APPROVE or REJECT).
   * Processes each request safely with isolated transaction & row lock,
   * returning itemized status for every ID.
   */
  async batchReviewCorrections(reviewerUser, correctionIds, decision, { reviewNote = null, req = null } = {}) {
    if (!Array.isArray(correctionIds) || correctionIds.length === 0) {
      const err = new Error("Array of correction IDs is required");
      err.statusCode = 400;
      throw err;
    }

    const succeeded = [];
    const failed = [];

    for (const id of correctionIds) {
      try {
        const result = await this.reviewCorrection(reviewerUser, id, decision, { reviewNote, req });
        succeeded.push({ id, status: decision.toUpperCase(), data: result });
      } catch (err) {
        failed.push({ id, error: err.message || "Failed to process correction" });
      }
    }

    return {
      total: correctionIds.length,
      succeeded,
      failed,
      allSucceeded: failed.length === 0,
    };
  }
}

module.exports = new AttendanceCorrectionService();
