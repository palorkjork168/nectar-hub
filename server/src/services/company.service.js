const { Op } = require("sequelize");
const { Company, CompanyUserRole } = require("../models");
const authorizationService = require("./authorization.service");

const createCompany = async (userId, companyData) => {
  const company = await Company.create({
    ...companyData,
    owner_id: userId,
    status: "PENDING",
  });

  return company;
};

const getMyCompanies = async (userOrId) => {
  const isUserObj = typeof userOrId === "object" && userOrId !== null;
  const userId = isUserObj ? userOrId.id : userOrId;
  const isAdmin = isUserObj ? authorizationService.isAdmin(userOrId) : false;

  let whereClause;
  if (isAdmin) {
    whereClause = undefined;
  } else {
    const assignedRoles = userId
      ? await CompanyUserRole.findAll({
          where: { user_id: userId },
          attributes: ["company_id"],
        })
      : [];
    const companyIds = assignedRoles.map((r) => r.company_id).filter(Boolean);

    if (companyIds.length > 0) {
      whereClause = {
        [Op.or]: [{ owner_id: userId }, { id: companyIds }],
      };
    } else {
      whereClause = { owner_id: userId };
    }
  }

  const companies = await Company.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });

  return companies;
};

const updateCompany = async (companyId, user, companyData) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const userRoles = (user?.Roles || []).map((r) => r.name);
  const isAdmin = userRoles.includes("ADMIN");
  const isOwner = company.owner_id === user.id;

  if (!isAdmin && !isOwner) {
    const error = new Error("You do not have permission to update this company");
    error.statusCode = 403;
    throw error;
  }

  await company.update(companyData);

  return company;
};

module.exports = {
  createCompany,
  getMyCompanies,
  updateCompany,
};