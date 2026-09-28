const { z } = require("zod");

const createEmployeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(["EMPLOYEE", "ADMIN", "JOB_SEEKER", "EMPLOYER"], {
    required_error: "Role is required",
    invalid_type_error: "Invalid role",
  }),
});

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], {
    required_error: "Status is required",
    invalid_type_error: "Invalid status",
  }),
});

const updateEmployeeSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters").optional(),
    last_name: z.string().min(2, "Last name must be at least 2 characters").optional(),
    phone: z.string().max(20, "Phone number must not exceed 20 characters").optional().nullable(),
  })
  .strict();

module.exports = {
  createEmployeeSchema,
  updateRoleSchema,
  updateStatusSchema,
  updateEmployeeSchema,
};
