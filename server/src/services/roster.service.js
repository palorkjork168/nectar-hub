const { Op } = require("sequelize");
const {
  ShiftAssignment,
  EmploymentRecord,
  WorkSchedule,
  User,
  Department,
  Position,
  CompanyLocation,
} = require("../models");
const sequelize = require("../config/database");
const auditService = require("./audit.service");

class RosterService {
  /**
   * Fetch weekly roster for a company within date range.
   * Joins active employees with their baseline schedule, department, position, location,
   * and any date-specific shift assignments in the range.
   */
  async getWeeklyRoster(companyId, startDate, endDate, filters = {}) {
    if (!startDate || !endDate) {
      const err = new Error("Start date and end date are required");
      err.statusCode = 400;
      throw err;
    }

    const empWhere = {
      company_id: companyId,
      status: "ACTIVE",
    };

    if (filters.departmentId) {
      empWhere.department_id = filters.departmentId;
    }

    // 1. Fetch eligible employees
    const employees = await EmploymentRecord.findAll({
      where: empWhere,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "avatar_url"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "title"],
        },
        {
          model: WorkSchedule,
          as: "workSchedule",
          attributes: ["id", "name", "start_time", "end_time", "expected_hours"],
        },
        {
          model: CompanyLocation,
          as: "location",
          attributes: ["id", "name", "address", "radius_meters"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const employmentIds = employees.map((e) => e.id);

    // 2. Fetch shift assignments within the date range
    const shiftAssignments = await ShiftAssignment.findAll({
      where: {
        company_id: companyId,
        employment_record_id: { [Op.in]: employmentIds },
        shift_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: WorkSchedule,
          as: "workSchedule",
          attributes: ["id", "name", "start_time", "end_time", "expected_hours"],
        },
      ],
      order: [["shift_date", "ASC"]],
    });

    // Group shift assignments by employment_record_id
    const assignmentsByEmployment = {};
    for (const a of shiftAssignments) {
      if (!assignmentsByEmployment[a.employment_record_id]) {
        assignmentsByEmployment[a.employment_record_id] = [];
      }
      assignmentsByEmployment[a.employment_record_id].push(a);
    }

    const roster = employees.map((emp) => {
      const assigned = assignmentsByEmployment[emp.id] || [];
      return {
        employmentRecord: emp,
        assignments: assigned,
      };
    });

    return roster;
  }

  /**
   * Assign or update a single date shift assignment for an employee.
   */
  async assignShift(companyId, data, actorUserId, req) {
    const {
      employment_record_id,
      shift_date,
      work_schedule_id,
      is_rest_day = false,
      notes = null,
    } = data;

    // 1. Verify employment record belongs to this company and is active
    const employment = await EmploymentRecord.findOne({
      where: {
        id: employment_record_id,
        company_id: companyId,
        status: "ACTIVE",
      },
    });

    if (!employment) {
      const err = new Error("Eligible active employee not found in this company");
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify schedule if not a rest day
    let resolvedScheduleId = null;
    if (!is_rest_day) {
      if (!work_schedule_id) {
        const err = new Error("Work schedule is required unless marked as rest day");
        err.statusCode = 400;
        throw err;
      }
      const schedule = await WorkSchedule.findOne({
        where: {
          id: work_schedule_id,
          company_id: companyId,
          is_active: true,
        },
      });
      if (!schedule) {
        const err = new Error("Valid active work schedule not found for this company");
        err.statusCode = 404;
        throw err;
      }
      resolvedScheduleId = schedule.id;
    }

    // 3. Upsert shift assignment
    const [assignment, created] = await ShiftAssignment.upsert(
      {
        company_id: companyId,
        employment_record_id: employment.id,
        user_id: employment.user_id,
        shift_date,
        work_schedule_id: resolvedScheduleId,
        is_rest_day: Boolean(is_rest_day),
        notes: notes ? notes.trim() : null,
        status: "SCHEDULED",
      },
      { returning: true }
    );

    // Audit log
    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: created ? "SHIFT_ASSIGNED" : "SHIFT_UPDATED",
      entityType: "SHIFT_ASSIGNMENT",
      entityId: assignment.id,
      description: `${created ? "Assigned" : "Updated"} shift on ${shift_date} for employee ${employment.user_id}${
        is_rest_day ? " (Rest Day)" : ""
      }`,
      metadata: {
        shift_assignment_id: assignment.id,
        employment_record_id: employment.id,
        shift_date,
        work_schedule_id: resolvedScheduleId,
        is_rest_day,
      },
    });

    // Reload with associations
    return await ShiftAssignment.findByPk(assignment.id, {
      include: [
        {
          model: WorkSchedule,
          as: "workSchedule",
          attributes: ["id", "name", "start_time", "end_time", "expected_hours"],
        },
      ],
    });
  }

  /**
   * Bulk assign shifts across multiple dates and/or employees.
   * Returns a detailed execution report of successful and failed items.
   */
  async bulkAssignShifts(companyId, assignments, actorUserId, req) {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      const err = new Error("Assignments array cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    const report = {
      total: assignments.length,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    // Process each assignment safely inside managed transactions or atomic blocks
    for (let i = 0; i < assignments.length; i++) {
      const item = assignments[i];
      try {
        const assigned = await this.assignShift(companyId, item, actorUserId, req);
        report.succeeded += 1;
        report.results.push({
          index: i,
          success: true,
          assignment: assigned,
        });
      } catch (err) {
        report.failed += 1;
        report.results.push({
          index: i,
          success: false,
          error: err.message,
          item,
        });
      }
    }

    report.allSucceeded = report.failed === 0;

    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: "ROSTER_BULK_ASSIGNED",
      entityType: "SHIFT_ASSIGNMENT",
      entityId: null,
      description: `Bulk assigned ${report.succeeded} shifts in roster (${report.failed} failed)`,
      metadata: {
        total: report.total,
        succeeded: report.succeeded,
        failed: report.failed,
      },
    });

    return report;
  }

  /**
   * Delete / clear a specific shift assignment (reverting employee to baseline schedule).
   */
  async deleteShiftAssignment(companyId, assignmentId, actorUserId, req) {
    const assignment = await ShiftAssignment.findOne({
      where: {
        id: assignmentId,
        company_id: companyId,
      },
    });

    if (!assignment) {
      const err = new Error("Shift assignment not found");
      err.statusCode = 404;
      throw err;
    }

    const date = assignment.shift_date;
    const empId = assignment.employment_record_id;

    await assignment.destroy();

    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: "SHIFT_ASSIGNMENT_DELETED",
      entityType: "SHIFT_ASSIGNMENT",
      entityId: assignmentId,
      description: `Removed custom shift assignment on ${date}`,
      metadata: {
        shift_date: date,
        employment_record_id: empId,
      },
    });

    return { success: true, message: "Shift assignment removed successfully" };
  }
}

module.exports = new RosterService();
