const analyticsService = require("../services/analytics.service");
const authorizationService = require("../services/authorization.service");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/analytics/admin/overview
 * Platform-wide operational analytics
 */
exports.getAdminOverview = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getAdminPlatformOverview(from, to);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/company/:companyId/overview
 * Company-scoped recruitment and workforce analytics
 */
exports.getCompanyAnalytics = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { from, to } = req.query;

    if (!UUID_REGEX.test(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    // Permission enforcement: verify company context server-side
    const hasPermission = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "analytics.company.view"
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view analytics for this company",
      });
    }

    const data = await analyticsService.getCompanyOverview(companyId, from, to);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/me/overview
 * Authenticated employee personal analytics summary
 */
exports.getMyAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getEmployeePersonalAnalytics(req.user.id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/company/:companyId/attendance
 * Detailed company-scoped attendance & work schedule intelligence analytics
 */
exports.getCompanyAttendanceAnalytics = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!UUID_REGEX.test(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const hasPermission = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "analytics.company.view"
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view attendance analytics for this company",
      });
    }

    const data = await analyticsService.getCompanyAttendanceAnalytics(companyId, req.query);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/company/:companyId/attendance/export
 * Download attendance report as CSV
 */
exports.exportCompanyAttendance = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!UUID_REGEX.test(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const hasPermission = await authorizationService.hasCompanyPermission(
      req.user,
      companyId,
      "analytics.company.view"
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to export attendance for this company",
      });
    }

    const { filename, csvContent } = await analyticsService.exportCompanyAttendance(
      companyId,
      req.query
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

