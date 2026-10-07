const SmtpProvider = require("./email/providers/SmtpProvider");
const MockProvider = require("./email/providers/MockProvider");
const DevelopmentProvider = require("./email/providers/DevelopmentProvider");
const templates = require("./email/templates/templates");

class EmailService {
  constructor() {
    this.provider = this._resolveProvider();
  }

  /**
   * Determine default email provider from environment
   */
  _resolveProvider() {
    const providerType = (process.env.EMAIL_PROVIDER || "").toLowerCase();

    if (process.env.NODE_ENV === "test" || providerType === "mock") {
      return new MockProvider();
    }

    if (providerType === "smtp" && process.env.SMTP_HOST) {
      return new SmtpProvider();
    }

    return new DevelopmentProvider();
  }

  /**
   * Explicitly set the provider (used in tests or dynamic config)
   */
  setProvider(provider) {
    this.provider = provider;
  }

  /**
   * Get currently active provider
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Check if a valid email recipient was supplied
   */
  _isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * Send an email with failure isolation (never throws to caller)
   */
  async sendEmail({
    to,
    from,
    subject,
    html,
    text,
    templateName = "custom",
    metadata = {},
    companyId = null,
    actorUserId = null,
  }) {
    if (!this._isValidEmail(to)) {
      console.warn(`[EmailService] Invalid recipient email rejected: "${to}"`);
      return { success: false, error: "Invalid recipient email address" };
    }

    try {
      const result = await this.provider.send({
        to: to.trim().toLowerCase(),
        from,
        subject,
        html,
        text,
      });

      return {
        success: true,
        messageId: result?.messageId || "delivered",
      };
    } catch (error) {
      // Safe logging without leaking credentials or secrets
      const safeErrorMsg = error?.message || "Unknown email transport error";
      console.error(`[EmailService Error] Delivery failed for "${to}" (Template: ${templateName}): ${safeErrorMsg}`);

      // Record operational audit event if auditService is available
      try {
        const auditService = require("./audit.service");
        if (auditService && typeof auditService.recordAuditEvent === "function") {
          auditService.recordAuditEvent({
            companyId,
            actorUserId,
            action: "EMAIL_DELIVERY_FAILED",
            entityType: "EmailNotification",
            entityId: null,
            description: `Email delivery failed for recipient ${to} (${templateName})`,
            metadata: {
              to,
              subject,
              template: templateName,
              error: safeErrorMsg,
            },
          });
        }
      } catch (auditErr) {
        // Safe fallback: never let audit failure escalate
      }

      // Failure isolation: return failure object without throwing
      return {
        success: false,
        error: safeErrorMsg,
      };
    }
  }

  /**
   * Render template and send email
   */
  async sendTemplateEmail(templateName, recipientEmail, templateData = {}, options = {}) {
    if (!templates[templateName]) {
      console.warn(`[EmailService] Unknown email template: "${templateName}"`);
      return { success: false, error: `Template "${templateName}" not found` };
    }

    try {
      const { subject, html, text } = templates[templateName](templateData);

      // Perform delivery asynchronously (fire-and-forget safe for business performance)
      return await this.sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
        templateName,
        metadata: options.metadata || {},
        companyId: options.companyId || null,
        actorUserId: options.actorUserId || null,
      });
    } catch (err) {
      console.error(`[EmailService] Error preparing template "${templateName}":`, err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();
