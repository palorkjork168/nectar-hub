const User = require("./User");
const Role = require("./Role");
const UserRole = require("./UserRole");
const Permission = require("./Permission");
const RolePermission = require("./RolePermission");
const CompanyUserRole = require("./CompanyUserRole");
const Company = require("./Company");
const Job = require("./Job");
const Application = require("./Application");
const UserProfile = require("./UserProfile");
const UserSkill = require("./UserSkill");
const Education = require("./Education");
const Experience = require("./Experience");
const JobSkill = require("./JobSkill");
const SavedJob = require("./SavedJob");
const EmployeeProfile = require("./EmployeeProfile");
const Attendance = require("./Attendance");
const Interview = require("./Interview");
const Department = require("./Department");
const Position = require("./Position");
const EmploymentRecord = require("./EmploymentRecord");
const LeaveType = require("./LeaveType");
const LeaveRequest = require("./LeaveRequest");
const Notification = require("./Notification");
const WorkSchedule = require("./WorkSchedule");

// User Role Many-to-Many
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "user_id",
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "role_id",
});

// Role Permission Many-to-Many
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "role_id",
  as: "permissions",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permission_id",
  as: "roles",
});

// Company User Role (Company-Scoped Roles: HR, MANAGER, RECRUITER)
User.hasMany(CompanyUserRole, {
  foreignKey: "user_id",
  as: "companyRoles",
});

CompanyUserRole.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Company.hasMany(CompanyUserRole, {
  foreignKey: "company_id",
  as: "companyRoles",
});

CompanyUserRole.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Role.hasMany(CompanyUserRole, {
  foreignKey: "role_id",
  as: "companyAssignments",
});

CompanyUserRole.belongsTo(Role, {
  foreignKey: "role_id",
  as: "role",
});


User.hasMany(Company, {
  foreignKey: "owner_id",
  as: "ownedCompanies",
});

Company.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});

Company.hasMany(Job, {
  foreignKey: "company_id",
});

Job.belongsTo(Company, {
  foreignKey: "company_id",
});

User.hasMany(Application, {
  foreignKey: "user_id",
  as: "applications",
});

Application.belongsTo(User, {
  foreignKey: "user_id",
  as: "applicant",
});

Job.hasMany(Application, {
  foreignKey: "job_id",
});

Application.belongsTo(Job, {
  foreignKey: "job_id",
});

// User Profile
User.hasOne(UserProfile, {
  foreignKey: "user_id",
});

UserProfile.belongsTo(User, {
  foreignKey: "user_id",
});

// User Skills
User.hasMany(UserSkill, {
  foreignKey: "user_id",
});

UserSkill.belongsTo(User, {
  foreignKey: "user_id",
});

// Education
User.hasMany(Education, {
  foreignKey: "user_id",
});

Education.belongsTo(User, {
  foreignKey: "user_id",
});

// Experience
User.hasMany(Experience, {
  foreignKey: "user_id",
});

Experience.belongsTo(User, {
  foreignKey: "user_id",
});

Job.hasMany(JobSkill, {
  foreignKey: "job_id",
  as: "skills",
});

JobSkill.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
});

// Saved Jobs
User.hasMany(SavedJob, {
  foreignKey: "user_id",
  as: "savedJobs",
});

SavedJob.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Job.hasMany(SavedJob, {
  foreignKey: "job_id",
  as: "saves",
});

SavedJob.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
});

// Employee Profile
User.hasOne(EmployeeProfile, {
  foreignKey: "user_id",
  as: "employeeProfile",
});

EmployeeProfile.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Attendance
User.hasMany(Attendance, {
  foreignKey: "user_id",
  as: "attendances",
});

Attendance.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
Company.hasMany(Attendance, { foreignKey: "company_id", as: "attendances" });
Attendance.belongsTo(Company, { foreignKey: "company_id", as: "company" });
EmploymentRecord.hasMany(Attendance, { foreignKey: "employment_record_id", as: "attendances" });
Attendance.belongsTo(EmploymentRecord, { foreignKey: "employment_record_id", as: "employmentRecord" });
WorkSchedule.hasMany(Attendance, { foreignKey: "work_schedule_id", as: "attendances" });
Attendance.belongsTo(WorkSchedule, { foreignKey: "work_schedule_id", as: "schedule" });

// Interview
Application.hasMany(Interview, {
  foreignKey: "application_id",
  as: "interviews",
});

Interview.belongsTo(Application, {
  foreignKey: "application_id",
  as: "application",
});

Interview.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

User.hasMany(Interview, {
  foreignKey: "created_by",
  as: "createdInterviews",
});

// Department
Company.hasMany(Department, {
  foreignKey: "company_id",
  as: "departments",
});

Department.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

// Position
Company.hasMany(Position, {
  foreignKey: "company_id",
  as: "positions",
});

Position.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Department.hasMany(Position, {
  foreignKey: "department_id",
  as: "positions",
});

Position.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});

// EmploymentRecord
User.hasMany(EmploymentRecord, {
  foreignKey: "user_id",
  as: "employmentRecords",
});

EmploymentRecord.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Company.hasMany(EmploymentRecord, {
  foreignKey: "company_id",
  as: "employmentRecords",
});

EmploymentRecord.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Department.hasMany(EmploymentRecord, {
  foreignKey: "department_id",
  as: "employmentRecords",
});

EmploymentRecord.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});

Position.hasMany(EmploymentRecord, {
  foreignKey: "position_id",
  as: "employmentRecords",
});

EmploymentRecord.belongsTo(Position, {
  foreignKey: "position_id",
  as: "position",
});

// WorkSchedule
Company.hasMany(WorkSchedule, {
  foreignKey: "company_id",
  as: "workSchedules",
});

WorkSchedule.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

WorkSchedule.hasMany(EmploymentRecord, {
  foreignKey: "work_schedule_id",
  as: "employmentRecords",
});

EmploymentRecord.belongsTo(WorkSchedule, {
  foreignKey: "work_schedule_id",
  as: "workSchedule",
});

// LeaveType
Company.hasMany(LeaveType, {
  foreignKey: "company_id",
  as: "leaveTypes",
});

LeaveType.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

// LeaveRequest
User.hasMany(LeaveRequest, {
  foreignKey: "user_id",
  as: "leaveRequests",
});

LeaveRequest.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Company.hasMany(LeaveRequest, {
  foreignKey: "company_id",
  as: "leaveRequests",
});

LeaveRequest.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

LeaveType.hasMany(LeaveRequest, {
  foreignKey: "leave_type_id",
  as: "leaveRequests",
});

LeaveRequest.belongsTo(LeaveType, {
  foreignKey: "leave_type_id",
  as: "leaveType",
});

LeaveRequest.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "reviewer",
});

User.hasMany(LeaveRequest, {
  foreignKey: "reviewed_by",
  as: "reviewedLeaves",
});

// Notification
User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = {
  User,
  Role,
  UserRole,
  Permission,
  RolePermission,
  CompanyUserRole,
  Company,
  Job,
  Application,
  UserProfile,
  UserSkill,
  Education,
  Experience,
  JobSkill,
  SavedJob,
  EmployeeProfile,
  Attendance,
  Interview,
  Department,
  Position,
  EmploymentRecord,
  LeaveType,
  LeaveRequest,
  Notification,
  WorkSchedule,
};
