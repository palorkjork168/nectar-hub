const { z } = require("zod");

const createLocationSchema = z.object({
  name: z.string({ required_error: "Location name is required" }).trim().min(1, "Location name cannot be empty").max(255),
  address: z.string().trim().max(1000).optional().nullable(),
  latitude: z
    .number({ required_error: "Latitude is required" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ required_error: "Longitude is required" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  radius_meters: z
    .number()
    .int("Radius must be a whole number of meters")
    .min(10, "Radius must be at least 10 meters")
    .max(10000, "Radius cannot exceed 10,000 meters")
    .optional()
    .default(100),
  is_active: z.boolean().optional().default(true),
});

const updateLocationSchema = z.object({
  name: z.string().trim().min(1, "Location name cannot be empty").max(255).optional(),
  address: z.string().trim().max(1000).optional().nullable(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  radius_meters: z
    .number()
    .int("Radius must be a whole number of meters")
    .min(10, "Radius must be at least 10 meters")
    .max(10000, "Radius cannot exceed 10,000 meters")
    .optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
};
