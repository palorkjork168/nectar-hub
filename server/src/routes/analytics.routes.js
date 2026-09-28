const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const authenticate = require("../middleware/auth.middleware");
const {
  requirePermission,
  requireCompanyPermission,
} = require("../middleware/permission.middleware");

const router = express.Router();

router.use(authenticate);

// 1. Admin Platform-wide Analytics Overview
router.get(
  "/admin/overview",
  requirePermission("analytics.platform.view"),
  analyticsController.getAdminOverview
);

// 2. Employer / HR Company-scoped Analytics Overview
router.get(
  "/company/:companyId/overview",
  requireCompanyPermission("analytics.company.view"),
  analyticsController.getCompanyAnalytics
);

// 3. Employee Personal Analytics Summary
router.get(
  "/me/overview",
  requirePermission("analytics.personal.view"),
  analyticsController.getMyAnalytics
);

// 4. Company Attendance & Work Schedule Analytics
router.get(
  "/company/:companyId/attendance",
  requireCompanyPermission("analytics.company.view"),
  analyticsController.getCompanyAttendanceAnalytics
);

// 5. Export Company Attendance Report (CSV)
router.get(
  "/company/:companyId/attendance/export",
  requireCompanyPermission("analytics.company.view"),
  analyticsController.exportCompanyAttendance
);

module.exports = router;
