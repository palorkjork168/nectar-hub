const auditService = require("../services/audit.service");

const getCompanyAuditLogs = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await auditService.getCompanyAuditLogs(companyId, req.query);

    res.status(200).json({
      success: true,
      message: "Company audit logs retrieved successfully",
      data: result.auditLogs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyAuditLogs,
};
