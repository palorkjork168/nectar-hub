/**
 * attendanceSchedule.service.js
 * Pure, deterministic calculation utilities for attendance work schedule intelligence.
 */

/**
 * Parse an "HH:mm" time string and return a Date instance on the reference Date's calendar day.
 * @param {Date} referenceDate
 * @param {string} timeStr "HH:mm"
 * @returns {Date}
 */
function parseScheduleTime(referenceDate, timeStr) {
  if (!timeStr || typeof timeStr !== "string") {
    return null;
  }
  const [hourStr, minStr] = timeStr.split(":");
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);
  if (isNaN(hours) || isNaN(minutes)) {
    return null;
  }

  const d = new Date(referenceDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Calculate lateness based on scheduled start and grace period.
 * Business Rule:
 * - If check-in <= scheduledStart + grace_period_minutes: late_minutes = 0, isLate = false.
 * - If check-in > scheduledStart + grace_period_minutes:
 *     late_minutes = check-in - graceDeadline (grace period is not counted as lateness).
 *
 * @param {Date} checkInTime
 * @param {string} startTimeStr "HH:mm"
 * @param {number} gracePeriodMinutes
 * @returns {{ isLate: boolean, lateMinutes: number }}
 */
function calculateLateMinutes(checkInTime, startTimeStr, gracePeriodMinutes = 15) {
  if (!startTimeStr) {
    return { isLate: false, lateMinutes: 0 };
  }

  const checkIn = new Date(checkInTime);
  const scheduledStart = parseScheduleTime(checkIn, startTimeStr);
  if (!scheduledStart) {
    return { isLate: false, lateMinutes: 0 };
  }

  const graceMs = (gracePeriodMinutes ?? 0) * 60 * 1000;
  const graceDeadline = new Date(scheduledStart.getTime() + graceMs);

  if (checkIn.getTime() <= graceDeadline.getTime()) {
    return { isLate: false, lateMinutes: 0 };
  }

  // Grace period time is not counted as lateness: check-in - graceDeadline
  const lateMs = checkIn.getTime() - graceDeadline.getTime();
  const lateMinutes = Math.max(0, Math.round(lateMs / (60 * 1000)));

  return {
    isLate: true,
    lateMinutes,
  };
}

/**
 * Calculate early departure based on scheduled end time.
 * Business Rule:
 * - When an employee checks out before scheduled end time, calculate early departure.
 * - If check-out >= scheduledEnd: earlyDepartureMinutes = 0, isEarlyDeparture = false.
 * - If check-out < scheduledEnd:
 *     earlyDepartureMinutes = scheduledEnd - check-out.
 *
 * @param {Date} checkOutTime
 * @param {string} endTimeStr "HH:mm"
 * @param {string} startTimeStr "HH:mm" (optional, to detect overnight boundary)
 * @returns {{ isEarlyDeparture: boolean, earlyDepartureMinutes: number }}
 */
function calculateEarlyDeparture(checkOutTime, endTimeStr, startTimeStr = null) {
  if (!endTimeStr) {
    return { isEarlyDeparture: false, earlyDepartureMinutes: 0 };
  }

  const checkOut = new Date(checkOutTime);
  const scheduledEnd = parseScheduleTime(checkOut, endTimeStr);
  if (!scheduledEnd) {
    return { isEarlyDeparture: false, earlyDepartureMinutes: 0 };
  }

  // Overnight shift detection (e.g. 22:00 -> 06:00)
  if (startTimeStr) {
    const scheduledStart = parseScheduleTime(checkOut, startTimeStr);
    if (scheduledStart && scheduledEnd.getTime() < scheduledStart.getTime()) {
      // Overnight shift: end time belongs to next calendar day if check-in was yesterday,
      // or if checkout is on the next morning.
      // Standard v1: if checkout is after scheduled start on day 1, end is tomorrow.
      if (checkOut.getHours() >= scheduledStart.getHours()) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }
    }
  }

  if (checkOut.getTime() >= scheduledEnd.getTime()) {
    return { isEarlyDeparture: false, earlyDepartureMinutes: 0 };
  }

  const earlyMs = scheduledEnd.getTime() - checkOut.getTime();
  const earlyDepartureMinutes = Math.max(0, Math.round(earlyMs / (60 * 1000)));

  return {
    isEarlyDeparture: true,
    earlyDepartureMinutes,
  };
}

/**
 * Calculate worked duration in hours (rounded to 2 decimal places).
 * @param {Date} checkInTime
 * @param {Date} checkOutTime
 * @returns {number}
 */
function calculateWorkedHours(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) {
    return 0;
  }
  const diffMs = Math.max(0, new Date(checkOutTime).getTime() - new Date(checkInTime).getTime());
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
}

/**
 * Calculate shift completion percentage based on expected hours.
 * Business Rule:
 * - Cap at 100% (overtime is conceptually separate).
 * @param {number} actualHours
 * @param {number|string} expectedHours
 * @returns {number|null}
 */
function calculateCompletionPercentage(actualHours, expectedHours) {
  if (expectedHours === null || expectedHours === undefined) {
    return null;
  }
  const expected = parseFloat(expectedHours);
  if (isNaN(expected) || expected <= 0) {
    return null;
  }

  const rawPercentage = (actualHours / expected) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPercentage)));
}

/**
 * Determine deterministic attendance status.
 * States:
 * - IN_PROGRESS: Shift is currently open (no check-out yet)
 * - COMPLETED: Shift completed with no schedule assigned
 * - ON_TIME: Completed on time without lateness or early departure
 * - LATE: Checked in late, but stayed through scheduled end
 * - EARLY_DEPARTURE: Checked in on time, but left before scheduled end
 * - LATE_AND_EARLY_DEPARTURE: Both late check-in and early departure
 *
 * @param {Object} params
 * @param {boolean} params.hasSchedule
 * @param {boolean} params.isCompleted
 * @param {boolean} params.isLate
 * @param {boolean} params.isEarlyDeparture
 * @returns {string}
 */
function determineAttendanceStatus({
  hasSchedule = false,
  isCompleted = false,
  isLate = false,
  isEarlyDeparture = false,
}) {
  if (!isCompleted) {
    return "IN_PROGRESS";
  }

  if (!hasSchedule) {
    return "COMPLETED";
  }

  if (isLate && isEarlyDeparture) {
    return "LATE_AND_EARLY_DEPARTURE";
  }
  if (isLate) {
    return "LATE";
  }
  if (isEarlyDeparture) {
    return "EARLY_DEPARTURE";
  }
  return "ON_TIME";
}

module.exports = {
  parseScheduleTime,
  calculateLateMinutes,
  calculateEarlyDeparture,
  calculateWorkedHours,
  calculateCompletionPercentage,
  determineAttendanceStatus,
};
