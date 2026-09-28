const employeeService = require("../services/employee.service");
const { z } = require("zod");
const { updateRoleSchema, updateStatusSchema, updateEmployeeSchema } = require("../validators/employee.validator");

const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.status(200).json({ success: true, data: { employees } });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const employee = await employeeService.getEmployeeById(id);
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    // Deliberately deprecated: company employment must be created through hiring/employment flows.
    await employeeService.createEmployee(req.body);
  } catch (error) {
    next(error);
  }
};

const assignGlobalRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const validationResult = updateRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, message: validationResult.error.issues[0].message });
    }

    const employee = await employeeService.assignGlobalRole(id, validationResult.data.role);
    res.status(200).json({ success: true, message: "Global role assigned", data: { employee } });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const validationResult = updateStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, message: validationResult.error.issues[0].message });
    }

    const employee = await employeeService.updateEmployeeStatus(id, validationResult.data.status);
    res.status(200).json({ success: true, message: "Employee status updated", data: { employee } });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const validationResult = updateEmployeeSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const employee = await employeeService.updateEmployee(id, validationResult.data);
    res.status(200).json({ success: true, message: "Employee updated successfully", data: { employee } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  assignGlobalRole,
  updateEmployeeStatus,
};
