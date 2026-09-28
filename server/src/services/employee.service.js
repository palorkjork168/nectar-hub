const { User, EmployeeProfile, Role, UserRole } = require("../models");
const sequelize = require("../config/database");

const getAllEmployees = async () => {
  const employees = await User.findAll({
    include: [
      {
        model: EmployeeProfile,
        as: "employeeProfile",
        required: false,
      },
      {
        model: Role,
        through: { attributes: [] },
      },
    ],
    attributes: { exclude: ["password_hash"] },
  });

  return employees;
};

const getEmployeeById = async (employeeId) => {
  const employee = await User.findOne({
    where: { id: employeeId },
    include: [
      {
        model: EmployeeProfile,
        as: "employeeProfile",
        required: false,
      },
      {
        model: Role,
        through: { attributes: [] },
      },
    ],
    attributes: { exclude: ["password_hash"] },
  });

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

const createEmployee = async (employeeData) => {
  const error = new Error(
    "Legacy employee creation is unavailable. Create employment through a company hiring or employment workflow."
  );
  error.statusCode = 410;
  throw error;
};

const GLOBAL_ROLE_NAMES = ["ADMIN", "JOB_SEEKER", "EMPLOYER", "EMPLOYEE"];

const assignGlobalRole = async (employeeId, roleName) => {
  const user = await User.findByPk(employeeId);
  
  if (!user) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  if (!GLOBAL_ROLE_NAMES.includes(roleName)) {
    const error = new Error("Only global roles can be assigned through this endpoint");
    error.statusCode = 400;
    throw error;
  }

  const role = await Role.findOne({ where: { name: roleName } });

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  await UserRole.findOrCreate({
    where: {
      user_id: user.id,
      role_id: role.id,
    },
  });

  return getEmployeeById(employeeId);
};

const updateEmployeeStatus = async (employeeId, status) => {
  const user = await User.findByPk(employeeId);
  
  if (!user) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  user.status = status;
  await user.save();

  return user;
};

const updateEmployee = async (employeeId, updateData) => {
  const { first_name, last_name, phone } = updateData;

  const existingUser = await User.findByPk(employeeId, {
    include: [{ model: EmployeeProfile, as: "employeeProfile" }],
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await sequelize.transaction(async (t) => {
    const userUpdates = {};
    if (first_name !== undefined) userUpdates.first_name = first_name;
    if (last_name !== undefined) userUpdates.last_name = last_name;
    if (phone !== undefined) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      await existingUser.update(userUpdates, { transaction: t });
    }

  });

  return getEmployeeById(employeeId);
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  assignGlobalRole,
  updateEmployeeStatus,
};
