const { CompanyLocation, EmploymentRecord, Company } = require("../models");
const auditService = require("./audit.service");

/**
 * Geographic distance calculation using standard Haversine formula on spherical Earth.
 * Returns distance between two (lat, lon) points in meters.
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const Δφ = toRad(Number(lat2) - Number(lat1));
  const Δλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

class LocationService {
  /**
   * Calculate distance between two coordinates in meters.
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    return calculateDistanceMeters(lat1, lon1, lat2, lon2);
  }

  /**
   * Verify GPS punch against active company geofence locations.
   * Server-side authoritative validation.
   */
  async verifyGeofence(companyId, employmentRecordId, latitude, longitude) {
    // 1. Strict coordinate format validation
    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude))
    ) {
      const err = new Error("GPS coordinates are required for live attendance punches.");
      err.statusCode = 400;
      throw err;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const err = new Error("Submitted GPS coordinates are out of valid geographic range.");
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch all active workplaces for this company
    const activeLocations = await CompanyLocation.findAll({
      where: {
        company_id: companyId,
        is_active: true,
      },
    });

    // Backward compatibility: If no geofence locations are configured for the company,
    // preserve existing behavior and do not block punches.
    if (!activeLocations || activeLocations.length === 0) {
      return {
        verified: true,
        locationId: null,
        locationName: null,
        distanceMeters: null,
        message: "No active geofence configured for company.",
      };
    }

    // 3. Resolve employment record to check if employee is assigned to a specific branch
    let assignedLocationId = null;
    if (employmentRecordId) {
      const employment = await EmploymentRecord.findByPk(employmentRecordId);
      if (employment && employment.location_id) {
        assignedLocationId = employment.location_id;
      }
    }

    // Case A: Employee has a specific workplace assigned
    if (assignedLocationId) {
      const assignedLoc = activeLocations.find((loc) => loc.id === assignedLocationId);
      if (!assignedLoc) {
        // Location was deactivated or does not exist
        const err = new Error(
          "Your assigned workplace location is inactive or no longer configured. Please contact HR."
        );
        err.statusCode = 400;
        throw err;
      }

      const distance = calculateDistanceMeters(
        lat,
        lng,
        assignedLoc.latitude,
        assignedLoc.longitude
      );

      if (distance > assignedLoc.radius_meters) {
        const err = new Error(
          `Out of permitted workplace radius (${distance}m away from "${assignedLoc.name}", maximum allowed: ${assignedLoc.radius_meters}m).`
        );
        err.statusCode = 400;
        err.details = {
          workplace: assignedLoc.name,
          distanceMeters: distance,
          allowedRadiusMeters: assignedLoc.radius_meters,
        };
        throw err;
      }

      return {
        verified: true,
        locationId: assignedLoc.id,
        locationName: assignedLoc.name,
        distanceMeters: distance,
      };
    }

    // Case B: General employee / roaming — allowed within ANY active company workplace location
    let matchingLocation = null;
    let closestLocation = null;
    let closestDistance = Infinity;

    for (const loc of activeLocations) {
      const dist = calculateDistanceMeters(lat, lng, loc.latitude, loc.longitude);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestLocation = loc;
      }
      if (dist <= loc.radius_meters) {
        matchingLocation = loc;
        closestDistance = dist;
        break;
      }
    }

    if (matchingLocation) {
      return {
        verified: true,
        locationId: matchingLocation.id,
        locationName: matchingLocation.name,
        distanceMeters: closestDistance,
      };
    }

    // If none matched, reject with clear actionable details showing distance to closest workplace
    const err = new Error(
      `Out of permitted workplace radius. Closest workplace "${closestLocation.name}" is ${closestDistance}m away (maximum allowed: ${closestLocation.radius_meters}m).`
    );
    err.statusCode = 400;
    err.details = {
      closestWorkplace: closestLocation.name,
      distanceMeters: closestDistance,
      allowedRadiusMeters: closestLocation.radius_meters,
    };
    throw err;
  }

  /**
   * List workplace locations for a company.
   */
  async listLocations(companyId, includeInactive = false) {
    const where = { company_id: companyId };
    if (!includeInactive) {
      where.is_active = true;
    }

    const locations = await CompanyLocation.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return locations;
  }

  /**
   * Get a single workplace location by ID with company scoping.
   */
  async getLocationById(companyId, locationId) {
    const location = await CompanyLocation.findOne({
      where: {
        id: locationId,
        company_id: companyId,
      },
    });

    if (!location) {
      const err = new Error("Workplace location not found");
      err.statusCode = 404;
      throw err;
    }

    return location;
  }

  /**
   * Create a new workplace location and geofence.
   */
  async createLocation(companyId, data, actorUserId, req) {
    const { name, address, latitude, longitude, radius_meters, is_active } = data;

    const location = await CompanyLocation.create({
      company_id: companyId,
      name: name.trim(),
      address: address ? address.trim() : null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius_meters: radius_meters ? Number(radius_meters) : 100,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: "LOCATION_CREATED",
      entityType: "COMPANY_LOCATION",
      entityId: location.id,
      description: `Created workplace location "${location.name}" (radius: ${location.radius_meters}m)`,
      metadata: {
        locationId: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: location.radius_meters,
        is_active: location.is_active,
      },
    });

    return location;
  }

  /**
   * Update workplace location details or geofence settings.
   */
  async updateLocation(companyId, locationId, data, actorUserId, req) {
    const location = await this.getLocationById(companyId, locationId);

    const updates = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.address !== undefined) updates.address = data.address ? data.address.trim() : null;
    if (data.latitude !== undefined) updates.latitude = Number(data.latitude);
    if (data.longitude !== undefined) updates.longitude = Number(data.longitude);
    if (data.radius_meters !== undefined) updates.radius_meters = Number(data.radius_meters);
    if (data.is_active !== undefined) updates.is_active = Boolean(data.is_active);

    const previousState = {
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      radius_meters: location.radius_meters,
      is_active: location.is_active,
    };

    await location.update(updates);

    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: "LOCATION_UPDATED",
      entityType: "COMPANY_LOCATION",
      entityId: location.id,
      description: `Updated workplace location "${location.name}"`,
      metadata: {
        locationId: location.id,
        previousState,
        newState: updates,
      },
    });

    return location;
  }

  /**
   * Deactivate a workplace location (soft toggle).
   */
  async deactivateLocation(companyId, locationId, actorUserId, req) {
    const location = await this.getLocationById(companyId, locationId);

    await location.update({ is_active: false });

    await auditService.logAuditEvent({
      companyId,
      actorUserId,
      req,
      action: "LOCATION_DEACTIVATED",
      entityType: "COMPANY_LOCATION",
      entityId: location.id,
      description: `Deactivated workplace location "${location.name}"`,
      metadata: {
        locationId: location.id,
        name: location.name,
      },
    });

    return location;
  }
}

module.exports = new LocationService();
