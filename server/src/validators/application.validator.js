const { z } = require("zod");

const createApplicationSchema = z.object({
  cover_letter: z
    .string()
    .max(5000)
    .optional()
    .or(z.literal("")),

  cv_url: z
    .string()
    .url("Please provide a valid CV URL")
    .optional()
    .or(z.literal("")),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "REVIEWING",
    "INTERVIEW",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
  ]),
});

const hireApplicantSchema = z.object({
  departmentId: z.string().uuid().nullable().optional(),
  positionId: z.string().uuid().nullable().optional(),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "INTERNSHIP",
    "CONTRACT",
    "FREELANCE",
  ]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must use YYYY-MM-DD").refine(
    (value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    },
    "Start date must be valid"
  ).optional(),
  // Temporary compatibility only. Structured departmentId is authoritative.
  department: z.string().max(100).optional().nullable(),
});

module.exports = {
  createApplicationSchema,
  updateApplicationStatusSchema,
  hireApplicantSchema,
};
