const locationService = require("../services/location.service");
const authorizationService = require("../services/authorization.service");
const employmentService = require("../services/employment.service");
const { CompanyLocation } = require("../models");
const {
  createLocationSchema,
  updateLocationSchema,
} = require("../validators/location.validator");
const { z } = require("zod");

/**
 * Helper to check manage permission for company locations
 */
const canManageLocations = async (user, companyId) => {
  if (authorizationService.isAdmin(user)) return true;
  if (await authorizationService.isCompanyOwner(user, companyId)) return true;

  const hasShiftManage = await authorizationService.hasCompanyPermission(
    user,
    companyId,
    "shifts.manage"
  );
  if (hasShiftManage) return true;

  const hasCompanyManage = await authorizationService.hasCompanyPermission(
    user,
    companyId,
    "company.manage"
  );
  if (hasCompanyManage) return true;

  return false;
};

/**
 * List locations for a company
 */
const listLocations = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    // Check authorization: Can manage, or has active employment with company, or admin
    const canManage = await canManageLocations(req.user, companyId);
    const isMember = await employmentService.hasActiveEmployment(req.user.id, companyId);

    if (!canManage && !isMember && !authorizationService.isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view workplace locations for this company",
      });
    }

    const includeInactive = req.query.include_inactive === "true" && canManage;
    const locations = await locationService.listLocations(companyId, includeInactive);

    res.status(200).json({
      success: true,
      data: { locations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location by ID
 */
const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid location ID" });
    }

    const location = await CompanyLocation.findByPk(id);
    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    const canManage = await canManageLocations(req.user, location.company_id);
    const isMember = await employmentService.hasActiveEmployment(req.user.id, location.company_id);

    if (!canManage && !isMember && !authorizationService.isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this location",
      });
    }

    res.status(200).json({
      success: true,
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new workplace location with geofence
 */
const createLocation = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(companyId).success) {
      return res.status(400).json({ success: false, message: "Invalid company ID" });
    }

    const authorized = await canManageLocations(req.user, companyId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage workplace locations for this company",
      });
    }

    const validationResult = createLocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const location = await locationService.createLocation(
      companyId,
      validationResult.data,
      req.user.id,
      req
    );

    res.status(201).json({
      success: true,
      message: "Workplace location created successfully",
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workplace location or geofence settings
 */
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid location ID" });
    }

    const existing = await CompanyLocation.findByPk(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    const authorized = await canManageLocations(req.user, existing.company_id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage this location",
      });
    }

    const validationResult = updateLocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const location = await locationService.updateLocation(
      existing.company_id,
      id,
      validationResult.data,
      req.user.id,
      req
    );

    res.status(200).json({
      success: true,
      message: "Workplace location updated successfully",
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a workplace location
 */
const deactivateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return res.status(400).json({ success: false, message: "Invalid location ID" });
    }

    const existing = await CompanyLocation.findByPk(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    const authorized = await canManageLocations(req.user, existing.company_id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to deactivate this location",
      });
    }

    const location = await locationService.deactivateLocation(
      existing.company_id,
      id,
      req.user.id,
      req
    );

    res.status(200).json({
      success: true,
      message: "Workplace location deactivated successfully",
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deactivateLocation,
};
