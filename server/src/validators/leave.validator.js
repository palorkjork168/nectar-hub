const { z } = require("zod");

const leaveTypeSchema = z
  .object({
    companyId: z.string().optional(),
    company_id: z.string().optional(),
    name: z.string().max(255).min(1, "Name is required"),
    description: z.string().optional().or(z.literal("")),
    default_days: z.number().int().min(0).optional(),
    is_paid: z.boolean().optional(),
    requires_document: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

const leaveRequestSchema = z
  .object({
    company_id: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    leave_type_id: z.string().uuid(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().max(1000).min(1, "Reason is required"),
  })
  .refine((data) => Boolean(data.company_id || data.companyId), {
    message: "Company selection is required",
    path: ["companyId"],
  })
  .passthrough();

module.exports = {
  leaveTypeSchema,
  leaveRequestSchema,
};
