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

const submitCorrectionSchema = z
  .object({
    attendanceId: z.string().uuid().optional().nullable(),
    attendance_id: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
    correctionType: z
      .enum(["MISSING_CHECK_OUT", "MISSING_CHECK_IN", "INCORRECT_TIMES", "MISSED_SHIFT"])
      .optional(),
    correction_type: z
      .enum(["MISSING_CHECK_OUT", "MISSING_CHECK_IN", "INCORRECT_TIMES", "MISSED_SHIFT"])
      .optional(),
    requestedCheckInTime: z.string().optional().nullable(),
    requested_check_in_time: z.string().optional().nullable(),
    requestedCheckOutTime: z.string().optional().nullable(),
    requested_check_out_time: z.string().optional().nullable(),
    reason: z.string().min(3, "Reason must be at least 3 characters").max(1000),
  })
  .refine((data) => Boolean(data.companyId || data.company_id), {
    message: "Company ID is required",
    path: ["companyId"],
  })
  .refine((data) => Boolean(data.correctionType || data.correction_type), {
    message: "Correction type is required",
    path: ["correctionType"],
  });

const reviewCorrectionSchema = z.object({
  reviewNote: z.string().max(1000).optional().nullable(),
  review_note: z.string().max(1000).optional().nullable(),
});

const batchReviewCorrectionSchema = z.object({
  correctionIds: z
    .array(z.string().uuid("Invalid correction ID format"))
    .min(1, "At least one correction request ID is required"),
  decision: z.enum(["APPROVED", "REJECTED"]).optional().default("APPROVED"),
  reviewNote: z.string().max(1000).optional().nullable(),
  review_note: z.string().max(1000).optional().nullable(),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  submitCorrectionSchema,
  reviewCorrectionSchema,
  batchReviewCorrectionSchema,
};

