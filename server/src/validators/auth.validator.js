const { z } = require("zod");

const registerSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),

  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),

  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  current_password: z
    .string()
    .min(1, "Current password is required"),

  new_password: z
    .string()
    .min(6, "New password must be at least 6 characters"),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};