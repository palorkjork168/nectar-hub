const companyService = require("../services/company.service");

const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Company created successfully!",
      data: {
        company,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyCompanies = async (req, res, next) => {
  try {
    const companies = await companyService.getMyCompanies(
      req.user
    );

    res.status(200).json({
      success: true,
      data: {
        companies,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await companyService.updateCompany(
      req.params.id,
      req.user,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Company updated successfully!",
      data: {
        company,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getMyCompanies,
  updateCompany,
};