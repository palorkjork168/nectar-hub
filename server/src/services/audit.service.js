const { Op } = require("sequelize");
const { AuditLog, User } = require("../models");

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordhash",
  "token",
  "refreshtoken",
  "refresh_token",
  "jwt",
  "secret",
  "authorization",
  "credit_card",
  "creditcard",
  "apikey",
  "api_key",
  "cloudinary_secret",
]);

/**
 * Recursively sanitize metadata to ensure no passwords, tokens, or credentials are saved.
 */
function sanitizeMetadata(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMetadata(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret") || lowerKey.includes("token")) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeMetadata(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Safely extracts client IP address.
 */
function extractIp(req) {
  if (!req) return null;
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || null;
}

/**
 * Record a security or business event into the audit trail.
 * Designed to be failure-safe and non-blocking for user actions.
 */
async function recordAuditEvent({
  req,
  companyId = null,
  actorUserId = null,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
}) {
  try {
    if (!action || !entityType || !description) {
      console.warn("[AuditService] Missing required audit log arguments:", { action, entityType, description });
      return null;
    }

    const resolvedActorId = actorUserId || (req && req.user && req.user.id) || null;
    const ipAddress = extractIp(req);
    const userAgent = (req && req.headers && req.headers["user-agent"]) || null;
    const cleanMetadata = sanitizeMetadata(metadata);

    const log = await AuditLog.create({
      company_id: companyId,
      actor_user_id: resolvedActorId,
      action: String(action).toUpperCase(),
      entity_type: String(entityType).toUpperCase(),
      entity_id: entityId ? String(entityId) : null,
      description,
      metadata: cleanMetadata,
      ip_address: ipAddress ? String(ipAddress).slice(0, 45) : null,
      user_agent: userAgent ? String(userAgent).slice(0, 500) : null,
    });

    return log;
  } catch (error) {
    // Log failure server-side without crashing calling business process
    console.error("[AuditService Failure] Failed to persist audit event:", error.message);
    return null;
  }
}

/**
 * Query company-scoped audit logs with filtering and pagination.
 */
async function getCompanyAuditLogs(companyId, options = {}) {
  const {
    action,
    entityType,
    actorUserId,
    from,
    to,
    search,
    page = 1,
    limit = 20,
  } = options;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  // Strict tenant boundary constraint
  const where = {
    company_id: companyId,
  };

  if (action && typeof action === "string") {
    where.action = action.toUpperCase();
  }

  if (entityType && typeof entityType === "string") {
    where.entity_type = entityType.toUpperCase();
  }

  if (actorUserId) {
    where.actor_user_id = actorUserId;
  }

  if (from || to) {
    where.created_at = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        where.created_at[Op.gte] = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        // Set to end of day if only date is passed
        toDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = toDate;
      }
    }
  }

  if (search && typeof search === "string" && search.trim()) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${search.trim()}%` } },
      { action: { [Op.iLike]: `%${search.trim()}%` } },
      { entity_type: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: parsedLimit,
    offset,
    include: [
      {
        model: User,
        as: "actor",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  return {
    auditLogs: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
  };
}

module.exports = {
  recordAuditEvent,
  getCompanyAuditLogs,
  sanitizeMetadata,
};
