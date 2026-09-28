const positionService = require("../services/position.service");
const authorizationService = require("../services/authorization.service");
const { Company } = require("../models");

exports.getCompanyPositions = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const hasPermission = await authorizationService.hasCompanyPermission(req.user, companyId, "positions.view");
    if (!hasPermission) return res.status(403).json({ success: false, message: "Not authorized to view this company's positions" });
    const positions = await positionService.getCompanyPositions(companyId);

    res.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentPositions = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const department = await require("../models").Department.findByPk(departmentId, { attributes: ["company_id"] });
    if (!department) return res.status(404).json({ success: false, message: "Department not found" });
    const hasPermission = await authorizationService.hasCompanyPermission(req.user, department.company_id, "positions.view");
    if (!hasPermission) return res.status(403).json({ success: false, message: "Not authorized to view positions for this department" });
    const positions = await positionService.getDepartmentPositions(departmentId);

    res.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPosition = async (req, res, next) => {
  try {
    const { companyId } = req.body;
    
    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "positions.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's positions");
      error.statusCode = 403;
      throw error;
    }

    const position = await positionService.createPosition(companyId, req.body);

    res.status(201).json({
      success: true,
      message: "Position created successfully",
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "positions.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's positions");
      error.statusCode = 403;
      throw error;
    }

    const position = await positionService.updatePosition(id, companyId, req.body);

    res.json({
      success: true,
      message: "Position updated successfully",
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body; 

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "positions.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's positions");
      error.statusCode = 403;
      throw error;
    }

    const result = await positionService.deletePosition(id, companyId);

    res.json({
      success: true,
      message: result.deleted ? "Position deleted successfully" : "Position deactivated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
