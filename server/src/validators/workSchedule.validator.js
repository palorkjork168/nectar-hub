const { z } = require("zod");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const workScheduleSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
    name: z.string().min(1, "Schedule name is required").max(255),
    description: z.string().optional().or(z.literal("")),
    start_time: z
      .string()
      .regex(timeRegex, "Start time must be in 24-hour HH:mm format (e.g. 09:00)"),
    end_time: z
      .string()
      .regex(timeRegex, "End time must be in 24-hour HH:mm format (e.g. 17:00)"),
    grace_period_minutes: z
      .number()
      .int("Grace period must be an integer")
      .min(0, "Grace period cannot be negative")
      .max(1440, "Grace period cannot exceed 24 hours")
      .optional(),
    expected_hours: z
      .number()
      .min(0.1, "Expected hours must be greater than 0")
      .max(24, "Expected hours cannot exceed 24")
      .optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

const updateWorkScheduleSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().or(z.literal("")),
    start_time: z
      .string()
      .regex(timeRegex, "Start time must be in 24-hour HH:mm format")
      .optional(),
    end_time: z
      .string()
      .regex(timeRegex, "End time must be in 24-hour HH:mm format")
      .optional(),
    grace_period_minutes: z.number().int().min(0).max(1440).optional(),
    expected_hours: z.number().min(0.1).max(24).optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

const assignScheduleSchema = z
  .object({
    workScheduleId: z.string().uuid().nullable().optional(),
    work_schedule_id: z.string().uuid().nullable().optional(),
  })
  .passthrough();

module.exports = {
  workScheduleSchema,
  updateWorkScheduleSchema,
  assignScheduleSchema,
};
