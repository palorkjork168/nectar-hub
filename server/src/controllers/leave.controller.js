const leaveService = require("../services/leave.service");
const authorizationService = require("../services/authorization.service");
const { Company, LeaveRequest } = require("../models");

// Employer Types
exports.getCompanyLeaveTypes = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    // Include inactive only if owner/admin/hr
    const isOwner = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.policy_manage");
    
    const types = await leaveService.getLeaveTypes(companyId, isOwner);

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
};

exports.createLeaveType = async (req, res, next) => {
  try {
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.policy_manage");
    if (!hasPerm) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const leaveType = await leaveService.createLeaveType(companyId, req.body);

    res.status(201).json({
      success: true,
      message: "Leave type created successfully",
      data: leaveType,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLeaveType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.policy_manage");
    if (!hasPerm) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const leaveType = await leaveService.updateLeaveType(id, companyId, req.body);

    res.json({
      success: true,
      message: "Leave type updated successfully",
      data: leaveType,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLeaveType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.policy_manage");
    if (!hasPerm) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const result = await leaveService.deleteLeaveType(id, companyId);

    res.json({
      success: true,
      message: result.deleted ? "Leave type deleted successfully" : "Leave type deactivated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Employee Requests
exports.getMyLeaveRequests = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    if (companyId && !await require("../services/employment.service").hasActiveEmployment(req.user.id, companyId)) return res.status(403).json({ success: false, message: "No active employment for this company" });
    const requests = await leaveService.getMyLeaveRequests(req.user.id, companyId);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

exports.getMyLeaveBalance = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ success: false, message: "companyId is required" });
    const balance = await leaveService.getMyLeaveBalance(req.user.id, companyId);
    res.json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
};

exports.createLeaveRequest = async (req, res, next) => {
  try {
    const request = await leaveService.createLeaveRequest(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await leaveService.cancelLeaveRequest(id, req.user.id);
    res.json({
      success: true,
      message: "Leave request cancelled successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// Employer Review
exports.getCompanyLeaveRequests = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.review");
    if (!hasPerm) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const requests = await leaveService.getCompanyLeaveRequests(companyId);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

exports.reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id, action } = req.params; // action = approve | reject
    const { review_note } = req.body;
    const storedRequest = await LeaveRequest.findByPk(id, { attributes: ["id", "company_id"] });
    if (!storedRequest) {
      const error = new Error("Leave request not found");
      error.statusCode = 404;
      throw error;
    }
    const companyId = storedRequest.company_id;

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "leave.review");
    if (!hasPerm) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED";
    const request = await leaveService.reviewLeaveRequest(id, companyId, req.user.id, status, review_note);

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
