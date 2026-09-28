const { Role, Permission, RolePermission } = require("../models");

const defaultPermissions = [
  // Company
  { name: "company.view", description: "View company profile and details", category: "company" },
  { name: "company.update", description: "Update company profile and settings", category: "company" },

  // Jobs
  { name: "jobs.view", description: "View company job listings", category: "jobs" },
  { name: "jobs.create", description: "Create and publish new job postings", category: "jobs" },
  { name: "jobs.update", description: "Edit existing job postings and skills", category: "jobs" },
  { name: "jobs.close", description: "Close or unpublish job postings", category: "jobs" },

  // Applicants
  { name: "applicants.view", description: "View candidate profiles and job applications", category: "applicants" },
  { name: "applicants.update_status", description: "Progress candidate application status", category: "applicants" },

  // Interviews
  { name: "interviews.view", description: "View scheduled interviews and feedback", category: "interviews" },
  { name: "interviews.schedule", description: "Schedule new interviews with candidates", category: "interviews" },
  { name: "interviews.update", description: "Reschedule or modify interview details", category: "interviews" },
  { name: "interviews.cancel", description: "Cancel scheduled interviews", category: "interviews" },

  // Employees & Team
  { name: "employees.view", description: "View employee profiles and workforce records", category: "employees" },
  { name: "employees.manage", description: "Manage employee profiles, roles, and status", category: "employees" },

  // Attendance
  { name: "attendance.view_own", description: "View personal clock-in and attendance history", category: "attendance" },
  { name: "attendance.manage", description: "View and manage company-wide attendance logs", category: "attendance" },

  // Leave
  { name: "leave.request", description: "Submit personal leave requests", category: "leave" },
  { name: "leave.view_own", description: "View personal leave balance and history", category: "leave" },
  { name: "leave.review", description: "Approve or reject employee leave requests", category: "leave" },
  { name: "leave.policy_manage", description: "Configure company leave types and allowances", category: "leave" },

  // Departments & Positions
  { name: "departments.manage", description: "Create and manage organizational departments", category: "departments" },
  { name: "positions.manage", description: "Create and manage job titles and positions", category: "positions" },

  // Shifts & Schedules
  { name: "shifts.view", description: "View company work schedules and shifts", category: "shifts" },
  { name: "shifts.manage", description: "Create, update, and manage company work schedules", category: "shifts" },

  // Analytics
  { name: "analytics.platform.view", description: "View platform-wide operational analytics and trends", category: "analytics" },
  { name: "analytics.company.view", description: "View company recruitment, workforce, leave, and attendance analytics", category: "analytics" },
  { name: "analytics.personal.view", description: "View personal attendance and leave analytics", category: "analytics" },

  // System Administration
  { name: "users.manage", description: "Global user management and account controls", category: "admin" },
  { name: "roles.manage", description: "Manage system and company roles and permissions", category: "admin" },
];

const rolePermissionsMap = {
  ADMIN: [
    "company.view", "company.update",
    "jobs.view", "jobs.create", "jobs.update", "jobs.close",
    "applicants.view", "applicants.update_status",
    "interviews.view", "interviews.schedule", "interviews.update", "interviews.cancel",
    "employees.view", "employees.manage",
    "attendance.view_own", "attendance.manage",
    "leave.request", "leave.view_own", "leave.review", "leave.policy_manage",
    "departments.manage", "positions.manage",
    "shifts.view", "shifts.manage",
    "analytics.platform.view", "analytics.company.view", "analytics.personal.view",
    "users.manage", "roles.manage"
  ],
  EMPLOYER: [
    "company.view", "company.update",
    "jobs.view", "jobs.create", "jobs.update", "jobs.close",
    "applicants.view", "applicants.update_status",
    "interviews.view", "interviews.schedule", "interviews.update", "interviews.cancel",
    "employees.view", "employees.manage",
    "attendance.view_own", "attendance.manage",
    "leave.request", "leave.view_own", "leave.review", "leave.policy_manage",
    "departments.manage", "positions.manage",
    "shifts.view", "shifts.manage",
    "analytics.company.view", "analytics.personal.view"
  ],
  HR: [
    "employees.view", "employees.manage",
    "departments.manage", "positions.manage",
    "shifts.view", "shifts.manage",
    "leave.review", "leave.policy_manage",
    "leave.request", "leave.view_own",
    "attendance.manage", "attendance.view_own",
    "analytics.company.view", "analytics.personal.view"
  ],
  RECRUITER: [
    "jobs.view", "jobs.create", "jobs.update", "jobs.close",
    "applicants.view", "applicants.update_status",
    "interviews.view", "interviews.schedule", "interviews.update", "interviews.cancel",
    "attendance.view_own", "leave.request", "leave.view_own",
    "analytics.company.view", "analytics.personal.view"
  ],
  MANAGER: [
    "employees.view",
    "shifts.view",
    "leave.review",
    "attendance.view_own", "leave.request", "leave.view_own",
    "analytics.company.view", "analytics.personal.view"
  ],
  EMPLOYEE: [
    "attendance.view_own",
    "leave.request", "leave.view_own",
    "analytics.personal.view"
  ],
  JOB_SEEKER: [
    // Job seeker uses candidate endpoints governed by ownership / candidate role
  ],
};

const seedPermissions = async () => {
  // 1. Seed all permissions idempotently
  const permissionRecords = {};
  for (const perm of defaultPermissions) {
    const [record] = await Permission.findOrCreate({
      where: { name: perm.name },
      defaults: perm,
    });
    permissionRecords[perm.name] = record;
  }

  // 2. Map permissions to roles idempotently
  for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) continue;

    for (const permName of permNames) {
      const permission = permissionRecords[permName];
      if (permission) {
        await RolePermission.findOrCreate({
          where: {
            role_id: role.id,
            permission_id: permission.id,
          },
          defaults: {
            role_id: role.id,
            permission_id: permission.id,
          },
        });
      }
    }
  }

  console.log("Permissions and role-permission mappings seeded successfully!");
};

module.exports = {
  defaultPermissions,
  rolePermissionsMap,
  seedPermissions,
};
