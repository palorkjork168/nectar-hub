const {
  Attendance,
  User,
  Company,
  EmploymentRecord,
  WorkSchedule,
} = require("../models");
const attendanceScheduleService = require("./attendanceSchedule.service");

/**
 * Check in an active employee for a company.
 * Evaluates assigned work schedule and calculates initial lateness snapshot.
 */
const checkIn = async (userId, locationData) => {
  const employment = await EmploymentRecord.findOne({
    where: {
      user_id: userId,
      company_id: locationData.companyId,
      status: "ACTIVE",
    },
  });
  if (!employment) {
    const error = new Error("No active employment for this company");
    error.statusCode = 403;
    throw error;
  }

  // Active check-in concurrency guard (check_out_time is null)
  const activeAttendance = await Attendance.findOne({
    where: {
      user_id: userId,
      check_out_time: null,
    },
  });

  if (activeAttendance) {
    const error = new Error("You are already checked in. Please check out first.");
    error.statusCode = 400;
    throw error;
  }

  // Work Schedule & Lateness Evaluation
  let workScheduleId = null;
  let isLate = false;
  let lateMinutes = 0;
  const now = new Date();

  if (employment.work_schedule_id) {
    const schedule = await WorkSchedule.findByPk(employment.work_schedule_id);
    if (schedule) {
      workScheduleId = schedule.id;
      const lateCalc = attendanceScheduleService.calculateLateMinutes(
        now,
        schedule.start_time,
        schedule.grace_period_minutes
      );
      isLate = lateCalc.isLate;
      lateMinutes = lateCalc.lateMinutes;
    }
  }

  try {
    const attendance = await Attendance.create({
      user_id: userId,
      company_id: employment.company_id,
      employment_record_id: employment.id,
      work_schedule_id: workScheduleId,
      is_late: isLate,
      late_minutes: lateMinutes,
      is_early_departure: false,
      early_departure_minutes: 0,
      status: "IN_PROGRESS",
      check_in_time: now,
      check_in_lat: locationData.latitude,
      check_in_long: locationData.longitude,
    });

    return attendance;
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const error = new Error("You are already checked in. Please check out first.");
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

/**
 * Check out an active employee.
 * Calculates worked hours, early departure, shift completion percentage, and deterministic status.
 */
const checkOut = async (userId, locationData) => {
  const activeAttendance = await Attendance.findOne({
    where: {
      user_id: userId,
      check_out_time: null,
    },
  });

  if (!activeAttendance) {
    const error = new Error("No active check-in found. Please check in first.");
    error.statusCode = 400;
    throw error;
  }

  const checkOutTime = new Date();
  activeAttendance.check_out_time = checkOutTime;
  activeAttendance.check_out_lat = locationData.latitude;
  activeAttendance.check_out_long = locationData.longitude;

  // Calculate actual hours worked
  const checkInTime = new Date(activeAttendance.check_in_time);
  const actualHours = attendanceScheduleService.calculateWorkedHours(checkInTime, checkOutTime);
  activeAttendance.actual_hours = actualHours;

  let isEarlyDeparture = false;
  let earlyDepartureMinutes = 0;
  let completionPercentage = null;

  if (activeAttendance.work_schedule_id) {
    const schedule = await WorkSchedule.findByPk(activeAttendance.work_schedule_id);
    if (schedule) {
      const earlyCalc = attendanceScheduleService.calculateEarlyDeparture(
        checkOutTime,
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

  activeAttendance.is_early_departure = isEarlyDeparture;
  activeAttendance.early_departure_minutes = earlyDepartureMinutes;
  activeAttendance.completion_percentage = completionPercentage;

  activeAttendance.status = attendanceScheduleService.determineAttendanceStatus({
    hasSchedule: !!activeAttendance.work_schedule_id,
    isCompleted: true,
    isLate: activeAttendance.is_late,
    isEarlyDeparture,
  });

  await activeAttendance.save();

  return activeAttendance;
};

/**
 * Get attendance records for the requesting employee.
 */
const getMyAttendance = async (userId, companyId) => {
  const attendances = await Attendance.findAll({
    where: {
      user_id: userId,
      ...(companyId ? { company_id: companyId } : {}),
    },
    include: [
      { model: Company, as: "company", attributes: ["id", "name"] },
      { model: WorkSchedule, as: "schedule" },
    ],
    order: [["created_at", "DESC"]],
  });

  return attendances;
};

/**
 * Get all attendance records (platform admin).
 */
const getAllAttendance = async () => {
  const attendances = await Attendance.findAll({
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      { model: WorkSchedule, as: "schedule" },
    ],
    order: [["created_at", "DESC"]],
  });

  return attendances;
};

/**
 * Get attendance records for a specific employee (admin).
 */
const getEmployeeAttendance = async (employeeId) => {
  const attendances = await Attendance.findAll({
    where: {
      user_id: employeeId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      { model: WorkSchedule, as: "schedule" },
    ],
    order: [["created_at", "DESC"]],
  });

  return attendances;
};

/**
 * Get company attendance records (company-scoped for Employer/HR/Manager).
 */
const getCompanyAttendance = async (companyId, query = {}) => {
  const where = { company_id: companyId };
  if (query.status) {
    where.status = query.status;
  }
  if (query.userId) {
    where.user_id = query.userId;
  }
  if (query.isLate !== undefined) {
    where.is_late = query.isLate === "true" || query.isLate === true;
  }

  const attendances = await Attendance.findAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      {
        model: WorkSchedule,
        as: "schedule",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return attendances;
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getEmployeeAttendance,
  getCompanyAttendance,
};
