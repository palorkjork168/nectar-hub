const { z } = require("zod");

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const assignShiftSchema = z
  .object({
    employment_record_id: z.string().uuid("Invalid employment record ID"),
    shift_date: z
      .string()
      .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
    work_schedule_id: z.string().uuid("Invalid work schedule ID").optional().nullable(),
    is_rest_day: z.boolean().optional().default(false),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => data.is_rest_day || Boolean(data.work_schedule_id),
    {
      message: "A valid work schedule is required unless marked as a rest day",
      path: ["work_schedule_id"],
    }
  );

const bulkAssignShiftSchema = z.object({
  assignments: z
    .array(assignShiftSchema)
    .min(1, "At least one shift assignment is required"),
});

const rosterQuerySchema = z.object({
  start_date: z
    .string({ required_error: "Start date is required" })
    .regex(dateRegex, "Start date must be in YYYY-MM-DD format"),
  end_date: z
    .string({ required_error: "End date is required" })
    .regex(dateRegex, "End date must be in YYYY-MM-DD format"),
  department_id: z.string().uuid().optional(),
});

module.exports = {
  assignShiftSchema,
  bulkAssignShiftSchema,
  rosterQuerySchema,
};
