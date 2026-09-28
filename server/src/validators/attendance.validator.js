const { z } = require("zod");

const checkInSchema = z.object({
  companyId: z.string().uuid(),
  latitude: z.number({ required_error: "Latitude is required" }).min(-90).max(90),
  longitude: z.number({ required_error: "Longitude is required" }).min(-180).max(180),
});

const checkOutSchema = z.object({
  latitude: z.number({ required_error: "Latitude is required" }).min(-90).max(90),
  longitude: z.number({ required_error: "Longitude is required" }).min(-180).max(180),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
};
