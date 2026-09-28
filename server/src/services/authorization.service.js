const { User, Role, Permission, CompanyUserRole, Company, Job, Application, Interview, EmploymentRecord } = require("../models");

class AuthorizationService {
  /**
   * Check if user has global ADMIN role
   */
  isAdmin(user) {
    if (!user) return false;
    const roles = user.Roles || user.roles || [];
    return roles.some((r) => (typeof r === "string" ? r === "ADMIN" : r.name === "ADMIN"));
  }

  /**
   * Get all permission names associated with a list of roles
   */
  async getPermissionsForRoles(roleIds) {
    if (!roleIds || roleIds.length === 0) return [];
    const roles = await Role.findAll({
      where: { id: roleIds },
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });

    const permissions = new Set();
    for (const role of roles) {
      if (role.permissions) {
        role.permissions.forEach((p) => permissions.add(p.name));
      }
    }
    return Array.from(permissions);
  }

  /**
   * Get user's global permissions (derived from their global UserRole assignments)
   */
  async getUserGlobalPermissions(user) {
    if (!user) return [];
    if (this.isAdmin(user)) {
      const allPerms = await Permission.findAll({ attributes: ["name"] });
      return allPerms.map((p) => p.name);
    }

    const roles = user.Roles || [];
    const roleIds = roles.map((r) => r.id).filter(Boolean);

    if (roleIds.length === 0) {
      // If user.Roles has names but not IDs, resolve role IDs
      const roleNames = roles.map((r) => (typeof r === "string" ? r : r.name));
      const dbRoles = await Role.findAll({ where: { name: roleNames }, attributes: ["id"] });
      dbRoles.forEach((r) => roleIds.push(r.id));
    }

    return await this.getPermissionsForRoles(roleIds);
  }

  /**
   * Check if user is the owner of a company
   */
  async isCompanyOwner(user, companyId) {
    if (!user || !companyId) return false;
    const company = await Company.findByPk(companyId, { attributes: ["id", "owner_id"] });
    return company ? company.owner_id === user.id : false;
  }

  /**
   * Get all permissions a user has in the context of a specific company
   */
  async getUserCompanyPermissions(user, companyId) {
    if (!user) return [];
    if (this.isAdmin(user)) {
      const allPerms = await Permission.findAll({ attributes: ["name"] });
      return allPerms.map((p) => p.name);
    }

    const permissionSet = new Set();

    // 1. Global permissions
    const globalPerms = await this.getUserGlobalPermissions(user);
    globalPerms.forEach((p) => permissionSet.add(p));

    if (!companyId) return Array.from(permissionSet);

    // 2. Check if user is owner of the company -> grants all EMPLOYER permissions
    const isOwner = await this.isCompanyOwner(user, companyId);
    if (isOwner) {
      const employerRole = await Role.findOne({
        where: { name: "EMPLOYER" },
        include: [{ model: Permission, as: "permissions", attributes: ["name"], through: { attributes: [] } }],
      });
      if (employerRole && employerRole.permissions) {
        employerRole.permissions.forEach((p) => permissionSet.add(p));
      }
    }

    // 3. Check CompanyUserRole assignments (HR, MANAGER, RECRUITER)
    const companyRoles = await CompanyUserRole.findAll({
      where: { user_id: user.id, company_id: companyId },
      include: [
        {
          model: Role,
          as: "role",
          include: [{ model: Permission, as: "permissions", attributes: ["name"], through: { attributes: [] } }],
        },
      ],
    });

    for (const cur of companyRoles) {
      if (cur.role && cur.role.permissions) {
        cur.role.permissions.forEach((p) => permissionSet.add(p));
      }
    }

    return Array.from(permissionSet);
  }

  /**
   * Check if user has permission within a specific company context
   */
  async hasCompanyPermission(user, companyId, permissionName) {
    if (!user) return false;
    if (this.isAdmin(user)) return true;

    if (!companyId) {
      const globalPerms = await this.getUserGlobalPermissions(user);
      return globalPerms.includes(permissionName);
    }

    // 1. Is user the owner of this specific company?
    const isOwner = await this.isCompanyOwner(user, companyId);
    if (isOwner) {
      const employerRole = await Role.findOne({
        where: { name: "EMPLOYER" },
        include: [{ model: Permission, as: "permissions", where: { name: permissionName }, through: { attributes: [] } }],
      });
      if (employerRole) return true;
    }

    // 2. Check company-scoped roles assigned to user for this specific company
    const companyRole = await CompanyUserRole.findOne({
      where: { user_id: user.id, company_id: companyId },
      include: [
        {
          model: Role,
          as: "role",
          required: true,
          include: [
            {
              model: Permission,
              as: "permissions",
              where: { name: permissionName },
              required: true,
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
    if (companyRole) return true;

    // 3. Personal employee actions (attendance.view_own, leave.request, leave.view_own)
    // require the user to have an active employment record in this company
    const personalPermissions = ["attendance.view_own", "leave.request", "leave.view_own"];
    if (personalPermissions.includes(permissionName)) {
      const isEmployed = await EmploymentRecord.findOne({
        where: { user_id: user.id, company_id: companyId, status: "ACTIVE" },
      });
      if (isEmployed) {
        const globalPerms = await this.getUserGlobalPermissions(user);
        if (globalPerms.includes(permissionName)) return true;
      }
    }

    return false;
  }


  /**
   * Check access to a job by ID and permission
   */
  async canAccessJob(user, jobId, permissionName = "jobs.view") {
    if (!user || !jobId) return false;
    if (this.isAdmin(user)) return true;

    const job = await Job.findByPk(jobId, { attributes: ["id", "company_id"] });
    if (!job) return false;

    return await this.hasCompanyPermission(user, job.company_id, permissionName);
  }

  /**
   * Check access to an application by ID and permission
   */
  async canAccessApplication(user, applicationId, permissionName = "applicants.view") {
    if (!user || !applicationId) return false;
    if (this.isAdmin(user)) return true;

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, attributes: ["id", "company_id"] }],
    });
    if (!application || !application.Job) return false;

    return await this.hasCompanyPermission(user, application.Job.company_id, permissionName);
  }

  /**
   * Check access to an interview by ID and permission
   */
  async canAccessInterview(user, interviewId, permissionName = "interviews.view") {
    if (!user || !interviewId) return false;
    if (this.isAdmin(user)) return true;

    const interview = await Interview.findByPk(interviewId, {
      include: [
        {
          model: Application,
          as: "application",
          include: [{ model: Job, attributes: ["id", "company_id"] }],
        },
      ],
    });
    if (!interview || !interview.application || !interview.application.Job) return false;

    return await this.hasCompanyPermission(user, interview.application.Job.company_id, permissionName);
  }
}

module.exports = new AuthorizationService();
