const express = require("express");
const auditController = require("../controllers/audit.controller");
const authenticate = require("../middleware/auth.middleware");
const { requireCompanyPermission } = require("../middleware/permission.middleware");

const router = express.Router();

// Company-scoped audit logs with strict tenant isolation and permission check
router.get(
  "/company/:companyId",
  authenticate,
  requireCompanyPermission("audit.view"),
  auditController.getCompanyAuditLogs
);

module.exports = router;
