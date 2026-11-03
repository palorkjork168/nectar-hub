const { z } = require("zod");

// ==========================================
// PROFILE
// ==========================================

const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name cannot be empty")
    .max(100)
    .optional(),

  last_name: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(100)
    .optional(),

  professional_title: z
    .string()
    .max(150)
    .optional()
    .or(z.literal("")),

  bio: z
    .string()
    .max(5000)
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
});

// ==========================================
// SKILL
// ==========================================

const createSkillSchema = z.object({
  skill_name: z
    .string()
    .min(1, "Skill name is required")
    .max(100),

  level: z
    .enum([
      "BEGINNER",
      "INTERMEDIATE",
      "ADVANCED",
      "EXPERT",
    ])
    .optional(),
});

const updateSkillSchema = createSkillSchema.partial();

// ==========================================
// EDUCATION
// ==========================================

const createEducationSchema = z.object({
  institution: z
    .string()
    .min(1, "Institution is required")
    .max(255),

  degree: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),

  field_of_study: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),

  start_date: z
    .string()
    .optional()
    .or(z.literal("")),

  end_date: z
    .string()
    .optional()
    .or(z.literal("")),

  is_current: z
    .boolean()
    .optional(),

  description: z
    .string()
    .max(5000)
    .optional()
    .or(z.literal("")),
});

const updateEducationSchema =
  createEducationSchema.partial();

// ==========================================
// EXPERIENCE
// ==========================================

const createExperienceSchema = z.object({
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(255),

  position: z
    .string()
    .min(1, "Position is required")
    .max(255),

  employment_type: z
    .enum([
      "FULL_TIME",
      "PART_TIME",
      "INTERNSHIP",
      "CONTRACT",
      "FREELANCE",
    ])
    .optional(),

  location: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),

  start_date: z
    .string()
    .optional()
    .or(z.literal("")),

  end_date: z
    .string()
    .optional()
    .or(z.literal("")),

  is_current: z
    .boolean()
    .optional(),

  description: z
    .string()
    .max(5000)
    .optional()
    .or(z.literal("")),
});

const updateExperienceSchema =
  createExperienceSchema.partial();

module.exports = {
  updateProfileSchema,

  createSkillSchema,
  updateSkillSchema,

  createEducationSchema,
  updateEducationSchema,

  createExperienceSchema,
  updateExperienceSchema,
};