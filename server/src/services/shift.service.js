const {
  WorkSchedule,
  EmploymentRecord,
  Company,
  User,
  Department,
  Position,
} = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

class ShiftService {
  /**
   * List company work schedules with optional filters and employee counts
   */
  async listCompanySchedules(companyId, filters = {}) {
    const where = { company_id: companyId };

    if (filters.is_active !== undefined) {
      where.is_active =
        filters.is_active === true || filters.is_active === "true";
    }

    if (filters.search) {
      where.name = { [Op.iLike]: `%${filters.search}%` };
    }

    const schedules = await WorkSchedule.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    if (schedules.length === 0) {
      return [];
    }

    const scheduleIds = schedules.map((s) => s.id);
    const counts = await EmploymentRecord.findAll({
      where: {
        work_schedule_id: { [Op.in]: scheduleIds },
        company_id: companyId,
        status: "ACTIVE",
      },
      attributes: [
        "work_schedule_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["work_schedule_id"],
      raw: true,
    });

    const countMap = {};
    counts.forEach((c) => {
      countMap[c.work_schedule_id] = parseInt(c.count, 10);
    });

    return schedules.map((s) => {
      const data = s.toJSON();
      data.assignedCount = countMap[s.id] || 0;
      data.assigned_employees_count = countMap[s.id] || 0;
      return data;
    });
  }

  /**
   * Get single schedule with assigned employee count
   */
  async getScheduleById(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.company_id = companyId;
    }

    const schedule = await WorkSchedule.findOne({ where });
    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    const assignedCount = await EmploymentRecord.count({
      where: {
        work_schedule_id: schedule.id,
        company_id: schedule.company_id,
        status: "ACTIVE",
      },
    });

    const data = schedule.toJSON();
    data.assignedCount = assignedCount;
    data.assigned_employees_count = assignedCount;
    return data;
  }

  /**
   * Create a new work schedule template for a company
   */
  async createSchedule(companyId, data) {
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    return await WorkSchedule.create({
      company_id: companyId,
      name: data.name,
      description: data.description || null,
      start_time: data.start_time,
      end_time: data.end_time,
      grace_period_minutes:
        data.grace_period_minutes !== undefined
          ? data.grace_period_minutes
          : 15,
      expected_hours:
        data.expected_hours !== undefined ? data.expected_hours : 8.0,
      is_active: data.is_active !== undefined ? data.is_active : true,
    });
  }

  /**
   * Update schedule properties
   */
  async updateSchedule(id, companyId, data) {
    const schedule = await WorkSchedule.findOne({
      where: { id, company_id: companyId },
    });

    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    // Never allow updating company_id through update
    const { company_id, companyId: cid, id: sid, ...updates } = data;
    return await schedule.update(updates);
  }

  /**
   * Activate or deactivate schedule
   */
  async setScheduleActive(id, companyId, isActive) {
    const schedule = await WorkSchedule.findOne({
      where: { id, company_id: companyId },
    });

    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    return await schedule.update({ is_active: isActive });
  }

  /**
   * Delete schedule (soft-deactivates if in use)
   */
  async deleteSchedule(id, companyId) {
    const schedule = await WorkSchedule.findOne({
      where: { id, company_id: companyId },
    });

    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    const assignedCount = await EmploymentRecord.count({
      where: { work_schedule_id: id },
    });

    if (assignedCount > 0) {
      await schedule.update({ is_active: false });
      return {
        deleted: false,
        deactivated: true,
        message: "Schedule is currently assigned to employees; deactivated instead of deleted",
      };
    }

    await schedule.destroy();
    return {
      deleted: true,
      message: "Work schedule deleted successfully",
    };
  }

  /**
   * Assign or unassign schedule to an EmploymentRecord
   */
  async assignScheduleToEmployment(employmentRecordId, workScheduleId, operatorCompanyId) {
    const employment = await EmploymentRecord.findByPk(employmentRecordId);
    if (!employment) {
      const error = new Error("Employment record not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify company boundary if operator is scoped to a company
    if (operatorCompanyId && employment.company_id !== operatorCompanyId) {
      const error = new Error("Employment record does not belong to the specified company");
      error.statusCode = 403;
      throw error;
    }

    // If unassigning
    if (!workScheduleId) {
      await employment.update({ work_schedule_id: null });
      return await EmploymentRecord.findByPk(employmentRecordId, {
        include: [
          { model: WorkSchedule, as: "workSchedule" },
          { model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"] },
        ],
      });
    }

    // If assigning
    const schedule = await WorkSchedule.findByPk(workScheduleId);
    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    // Multi-tenant check: Schedule must belong to same company as EmploymentRecord
    if (schedule.company_id !== employment.company_id) {
      const error = new Error("Work schedule does not belong to the employment company");
      error.statusCode = 400;
      throw error;
    }

    // Inactive schedule guard: cannot assign inactive schedules
    if (!schedule.is_active) {
      const error = new Error("Cannot assign an inactive work schedule");
      error.statusCode = 400;
      throw error;
    }

    await employment.update({ work_schedule_id: workScheduleId });

    return await EmploymentRecord.findByPk(employmentRecordId, {
      include: [
        { model: WorkSchedule, as: "workSchedule" },
        { model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"] },
      ],
    });
  }

  /**
   * List active employees assigned to a specific schedule
   */
  async getScheduleEmployees(scheduleId, companyId) {
    const schedule = await WorkSchedule.findOne({
      where: { id: scheduleId, company_id: companyId },
    });

    if (!schedule) {
      const error = new Error("Work schedule not found");
      error.statusCode = 404;
      throw error;
    }

    return await EmploymentRecord.findAll({
      where: {
        work_schedule_id: scheduleId,
        company_id: companyId,
        status: "ACTIVE",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "status"],
        },
        { model: Department, as: "department", attributes: ["id", "name"] },
        { model: Position, as: "position", attributes: ["id", "title"] },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Get employee's currently assigned active schedule
   */
  async getMySchedule(userId, companyId) {
    const where = { user_id: userId, status: "ACTIVE" };
    if (companyId) {
      where.company_id = companyId;
    }

    const employment = await EmploymentRecord.findOne({
      where,
      include: [{ model: WorkSchedule, as: "workSchedule" }],
      order: [["created_at", "DESC"]],
    });

    if (!employment || !employment.workSchedule) {
      return null;
    }

    return employment.workSchedule;
  }
}

module.exports = new ShiftService();
