const departmentService = require("../services/department.service");
const authorizationService = require("../services/authorization.service");
const { Company } = require("../models");

exports.getCompanyDepartments = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const hasPermission = await authorizationService.hasCompanyPermission(req.user, companyId, "departments.view");
    if (!hasPermission) return res.status(403).json({ success: false, message: "Not authorized to view this company's departments" });

    const departments = await departmentService.getCompanyDepartments(
      companyId,
      req.user.id
    );

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "departments.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's departments");
      error.statusCode = 403;
      throw error;
    }

    const department = await departmentService.createDepartment(companyId, req.body);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "departments.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's departments");
      error.statusCode = 403;
      throw error;
    }

    const department = await departmentService.updateDepartment(id, companyId, req.body);

    res.json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasPerm = await authorizationService.hasCompanyPermission(req.user, companyId, "departments.manage");
    if (!hasPerm) {
      const error = new Error("Not authorized to manage this company's departments");
      error.statusCode = 403;
      throw error;
    }

    const result = await departmentService.deleteDepartment(id, companyId);

    res.json({
      success: true,
      message: result.deleted ? "Department deleted successfully" : "Department deactivated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
