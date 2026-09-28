const {
  User,
  Company,
  Department,
  Position,
  EmploymentRecord,
  WorkSchedule,
} = require("../models");

class EmploymentService {
  async getActiveEmployment(userId, companyId, options = {}) {
    return EmploymentRecord.findOne({
      where: { user_id: userId, company_id: companyId, status: "ACTIVE" },
      transaction: options.transaction,
    });
  }

  async hasActiveEmployment(userId, companyId) {
    return Boolean(await this.getActiveEmployment(userId, companyId));
  }

  async getActiveEmployments(userId) {
    return EmploymentRecord.findAll({
      where: { user_id: userId, status: "ACTIVE" },
      include: [
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "name"] },
        { model: Position, as: "position", attributes: ["id", "title"] },
      ],
      order: [["created_at", "ASC"]],
    });
  }

  async getActiveCompanyEmployees(companyId) {
    return EmploymentRecord.findAll({
      where: { company_id: companyId, status: "ACTIVE" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "status"],
        },
        { model: Department, as: "department", attributes: ["id", "name"] },
        { model: Position, as: "position", attributes: ["id", "title"] },
        { model: WorkSchedule, as: "workSchedule" },
      ],
      order: [["start_date", "DESC"], ["created_at", "DESC"]],
    });
  }

  async validateOrganizationAssignments(companyId, departmentId, positionId, transaction) {
    let department = null;
    let position = null;

    if (departmentId) {
      department = await Department.findOne({
        where: { id: departmentId, company_id: companyId, is_active: true },
        transaction,
      });
      if (!department) {
        const error = new Error("Department must be active and belong to the employment company");
        error.statusCode = 400;
        throw error;
      }
    }

    if (positionId) {
      position = await Position.findOne({
        where: { id: positionId, company_id: companyId, is_active: true },
        transaction,
      });
      if (!position) {
        const error = new Error("Position must be active and belong to the employment company");
        error.statusCode = 400;
        throw error;
      }
      if (departmentId && position.department_id && position.department_id !== departmentId) {
        const error = new Error("Position does not belong to the selected department");
        error.statusCode = 400;
        throw error;
      }
      if (!departmentId && position.department_id) {
        department = await Department.findOne({
          where: { id: position.department_id, company_id: companyId, is_active: true },
          transaction,
        });
        if (!department) {
          const error = new Error("Position department must be active and belong to the employment company");
          error.statusCode = 400;
          throw error;
        }
      }
    }

    return { department, position };
  }

  async createEmployment(data, options = {}) {
    const { user_id, company_id, department_id, position_id, status = "ACTIVE" } = data;
    const transaction = options.transaction;

    const [user, company] = await Promise.all([
      User.findByPk(user_id, { transaction }),
      Company.findByPk(company_id, { transaction }),
    ]);
    if (!user || !company) {
      const error = new Error("User or company not found");
      error.statusCode = 404;
      throw error;
    }

    if (status === "ACTIVE" && await this.getActiveEmployment(user_id, company_id, { transaction })) {
      const error = new Error("User already has an active employment record for this company");
      error.statusCode = 409;
      throw error;
    }

    await this.validateOrganizationAssignments(company_id, department_id, position_id, transaction);
    return EmploymentRecord.create(data, { transaction });
  }
}

module.exports = new EmploymentService();
