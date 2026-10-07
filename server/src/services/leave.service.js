const { LeaveType, LeaveRequest, EmploymentRecord, Company, User } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const notificationService = require("./notification.service");
const NOTIFICATION_TYPES = require("../constants/notificationTypes");
const emailService = require("./email.service");

class LeaveService {
  // Leave Types
  async getLeaveTypes(companyId, includeInactive = false) {
    const whereClause = { company_id: companyId };
    if (!includeInactive) {
      whereClause.is_active = true;
    }
    return await LeaveType.findAll({
      where: whereClause,
      order: [["name", "ASC"]],
    });
  }

  async createLeaveType(companyId, data) {
    return await LeaveType.create({
      ...data,
      company_id: companyId,
    });
  }

  async updateLeaveType(id, companyId, data) {
    const leaveType = await LeaveType.findOne({
      where: { id, company_id: companyId },
    });

    if (!leaveType) {
      const error = new Error("Leave type not found");
      error.statusCode = 404;
      throw error;
    }

    return await leaveType.update(data);
  }

  async deleteLeaveType(id, companyId) {
    const leaveType = await LeaveType.findOne({
      where: { id, company_id: companyId },
    });

    if (!leaveType) {
      const error = new Error("Leave type not found");
      error.statusCode = 404;
      throw error;
    }

    const requestCount = await LeaveRequest.count({
      where: { leave_type_id: id },
    });

    if (requestCount > 0) {
      return await leaveType.update({ is_active: false });
    }

    await leaveType.destroy();
    return { deleted: true };
  }

  // Leave Requests - Employee
  async getMyLeaveRequests(userId, companyId) {
    return await LeaveRequest.findAll({
      where: { user_id: userId, ...(companyId ? { company_id: companyId } : {}) },
      include: [
        {
          model: LeaveType,
          as: "leaveType",
          attributes: ["name", "is_paid"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async getMyLeaveBalance(userId, companyId) {
    const employment = await EmploymentRecord.findOne({ where: { user_id: userId, company_id: companyId, status: "ACTIVE" } });
    if (!employment) { const error = new Error("You do not have active employment with this company"); error.statusCode = 403; throw error; }

    const leaveTypes = await LeaveType.findAll({
      where: { company_id: companyId, is_active: true },
    });

    const approvedRequests = await LeaveRequest.findAll({
      where: {
        user_id: userId,
        company_id: companyId,
        status: "APPROVED",
      },
    });

    const balances = leaveTypes.map((type) => {
      const typeRequests = approvedRequests.filter(
        (r) => r.leave_type_id === type.id
      );
      
      let usedDays = 0;
      typeRequests.forEach(req => {
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        usedDays += diffDays;
      });

      return {
        leave_type_id: type.id,
        name: type.name,
        default_days: type.default_days,
        used_days: usedDays,
        remaining_days: type.default_days !== null ? type.default_days - usedDays : null,
      };
    });

    return balances;
  }

  async createLeaveRequest(userId, data) {
    const companyId = data.companyId || data.company_id;
    const employment = await EmploymentRecord.findOne({ where: { user_id: userId, company_id: companyId, status: "ACTIVE" } });

    if (!employment) {
      const error = new Error("You do not have an active employment record");
      error.statusCode = 403;
      throw error;
    }


    const leaveType = await LeaveType.findOne({
      where: { id: data.leave_type_id, company_id: companyId, is_active: true },
    });

    if (!leaveType) {
      const error = new Error("Invalid leave type for your company");
      error.statusCode = 400;
      throw error;
    }

    // Check overlaps
    const overlaps = await LeaveRequest.count({
      where: {
        user_id: userId,
        company_id: companyId,
        status: { [Op.in]: ["PENDING", "APPROVED"] },
        start_date: { [Op.lte]: data.end_date },
        end_date: { [Op.gte]: data.start_date },
      },
    });

    if (overlaps > 0) {
      const error = new Error("Leave request overlaps with an existing pending or approved request");
      error.statusCode = 409;
      throw error;
    }

    const leaveRequest = await LeaveRequest.create({
      ...data,
      user_id: userId,
      company_id: companyId,
    });

    try {
      const user = await User.findByPk(userId, { attributes: ["first_name", "last_name", "email"] });
      const employeeName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "An employee";
      const reviewers = await notificationService.getCompanyRecipients(
        employment.company_id,
        "leave.review"
      );

      await notificationService.notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.LEAVE_REQUESTED,
        title: "New Leave Request",
        message: `${employeeName} requested ${leaveType.name} from ${data.start_date} to ${data.end_date}.`,
        link: "/employer/leave-requests",
        metadata: {
          leave_request_id: leaveRequest.id,
          company_id: employment.company_id,
          employee_id: userId,
        },
        actorId: userId,
      });

      if (user?.email) {
        emailService
          .sendTemplateEmail("leaveSubmitted", user.email, {
            employeeName,
            leaveType: leaveType.name,
            startDate: data.start_date,
            endDate: data.end_date,
            days: leaveRequest.days || 1,
          })
          .catch((err) => console.error("Leave submitted email failed:", err.message));
      }
    } catch (err) {
      console.error("Failed to send leave request notification:", err);
    }

    return leaveRequest;
  }

  async cancelLeaveRequest(requestId, userId) {
    const request = await LeaveRequest.findOne({
      where: { id: requestId, user_id: userId },
    });

    if (!request) {
      const error = new Error("Leave request not found");
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== "PENDING") {
      const error = new Error("Only pending requests can be cancelled");
      error.statusCode = 400;
      throw error;
    }

    await request.update({ status: "CANCELLED" });

    try {
      const user = await User.findByPk(userId, { attributes: ["first_name", "last_name"] });
      const employeeName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "An employee";
      const reviewers = await notificationService.getCompanyRecipients(
        request.company_id,
        "leave.review"
      );

      await notificationService.notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.LEAVE_CANCELLED,
        title: "Leave Request Cancelled",
        message: `${employeeName} cancelled their leave request.`,
        link: "/employer/leave-requests",
        metadata: {
          leave_request_id: request.id,
          company_id: request.company_id,
          employee_id: userId,
        },
        actorId: userId,
      });
    } catch (err) {
      console.error("Failed to send leave cancellation notification:", err);
    }

    return request;
  }

  // Leave Requests - Employer
  async getCompanyLeaveRequests(companyId) {
    return await LeaveRequest.findAll({
      where: { company_id: companyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "avatar_url"],
        },
        {
          model: LeaveType,
          as: "leaveType",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async reviewLeaveRequest(requestId, companyId, reviewerId, status, reviewNote) {
    const transaction = await sequelize.transaction();

    try {
      const request = await LeaveRequest.findOne({
        where: { id: requestId, company_id: companyId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!request) {
        const error = new Error("Leave request not found");
      error.statusCode = 404;
      throw error;
      }

      if (request.status !== "PENDING") {
        const error = new Error(`Request is already ${request.status}`);
      error.statusCode = 400;
      throw error;
      }

      if (status !== "APPROVED" && status !== "REJECTED") {
        const error = new Error("Invalid review status");
      error.statusCode = 400;
      throw error;
      }

      await request.update(
        {
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_note: reviewNote,
        },
        { transaction }
      );

      const leaveType = await LeaveType.findByPk(request.leave_type_id, { transaction });
      const typeName = leaveType?.name || "leave";

      if (status === "APPROVED") {
        await notificationService.notifyUser({
          userId: request.user_id,
          type: NOTIFICATION_TYPES.LEAVE_APPROVED,
          title: "Leave Request Approved",
          message: `Your ${typeName} request from ${request.start_date} to ${request.end_date} has been approved.`,
          link: "/employee/leave",
          metadata: {
            leave_request_id: request.id,
            company_id: companyId,
            status,
          },
          transaction,
          deduplicationKey: `leave_review_${request.id}_${status}`,
        });
      } else if (status === "REJECTED") {
        await notificationService.notifyUser({
          userId: request.user_id,
          type: NOTIFICATION_TYPES.LEAVE_REJECTED,
          title: "Leave Request Update",
          message: `Your ${typeName} request from ${request.start_date} to ${request.end_date} was not approved.`,
          link: "/employee/leave",
          metadata: {
            leave_request_id: request.id,
            company_id: companyId,
            status,
          },
          transaction,
          deduplicationKey: `leave_review_${request.id}_${status}`,
        });
      }

      await transaction.commit();

      // Asynchronous review outcome email
      try {
        const emp = await User.findByPk(request.user_id, { attributes: ["first_name", "last_name", "email"] });
        if (emp?.email) {
          const empName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Employee";
          if (status === "APPROVED") {
            emailService
              .sendTemplateEmail("leaveApproved", emp.email, {
                employeeName: empName,
                leaveType: typeName,
                startDate: request.start_date,
                endDate: request.end_date,
                days: request.days || 1,
              })
              .catch((err) => console.error("Leave approved email failed:", err.message));
          } else if (status === "REJECTED") {
            emailService
              .sendTemplateEmail("leaveRejected", emp.email, {
                employeeName: empName,
                leaveType: typeName,
                startDate: request.start_date,
                endDate: request.end_date,
                reviewNote,
              })
              .catch((err) => console.error("Leave rejected email failed:", err.message));
          }
        }
      } catch (err) {
        console.error("Leave review email dispatch failed:", err.message);
      }

      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new LeaveService();
