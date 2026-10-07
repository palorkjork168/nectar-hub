const { Role, Permission, RolePermission, User, UserRole, CompanyUserRole } = require("../models");
const auditService = require("../services/audit.service");

/**
 * Get all roles with counts
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      order: [["created_at", "ASC"]],
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["id", "name", "category"],
          through: { attributes: [] },
        },
      ],
    });

    // Count users for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await UserRole.count({ where: { role_id: role.id } });
        const companyAssignmentCount = await CompanyUserRole.count({ where: { role_id: role.id } });
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          is_system_core: ["ADMIN", "EMPLOYER", "EMPLOYEE", "JOB_SEEKER"].includes(role.name),
          is_company_role: ["HR", "MANAGER", "RECRUITER"].includes(role.name),
          permission_count: role.permissions ? role.permissions.length : 0,
          user_count: userCount,
          company_assignment_count: companyAssignmentCount,
          created_at: role.created_at,
          permissions: role.permissions || [],
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { roles: rolesWithCounts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all permissions grouped by category
 */
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll({
      order: [["category", "ASC"], ["name", "ASC"]],
    });

    const grouped = permissions.reduce((acc, perm) => {
      const cat = perm.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        permissions,
        grouped,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get permissions for a specific role
 */
const getRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permissions for a role (Protected)
 */
const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permission_names } = req.body;

    if (!Array.isArray(permission_names)) {
      return res.status(400).json({
        success: false,
        message: "permission_names must be an array of permission names",
      });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Safety: ADMIN role cannot have roles.manage or users.manage removed
    if (role.name === "ADMIN") {
      const criticalPermissions = ["roles.manage", "users.manage"];
      const missingCritical = criticalPermissions.filter((p) => !permission_names.includes(p));
      if (missingCritical.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove critical administrator permissions: ${missingCritical.join(", ")}`,
        });
      }
    }

    // Resolve permissions from DB
    const permissions = await Permission.findAll({
      where: { name: permission_names },
    });

    // Replace role permissions
    await RolePermission.destroy({ where: { role_id: role.id } });
    for (const perm of permissions) {
      await RolePermission.create({
        role_id: role.id,
        permission_id: perm.id,
      });
    }

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    auditService.recordAuditEvent({
      actorUserId: req.user?.id,
      action: "PERMISSION_CHANGED",
      entityType: "Role",
      entityId: role.id,
      description: `Permissions updated for role ${role.name}`,
      metadata: { role_name: role.name, permission_names },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Permissions updated successfully for role ${role.name}`,
      data: {
        role: updatedRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
};
