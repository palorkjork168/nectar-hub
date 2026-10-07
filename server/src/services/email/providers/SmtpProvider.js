const nodemailer = require("nodemailer");
const EmailProvider = require("./EmailProvider");

class SmtpProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.host = config.host || process.env.SMTP_HOST;
    this.port = parseInt(config.port || process.env.SMTP_PORT || "587", 10);
    this.secure = config.secure !== undefined ? config.secure : this.port === 465;
    this.user = config.user || process.env.SMTP_USER;
    this.password = config.password || process.env.SMTP_PASSWORD;
    this.from = config.from || process.env.EMAIL_FROM || "noreply@nectarhub.com";
    this.fromName = config.fromName || process.env.EMAIL_FROM_NAME || "Nectar Hub";

    if (this.host && this.user && this.password) {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.host,
          port: this.port,
          secure: this.secure,
          auth: {
            user: this.user,
            pass: this.password,
          },
        });
      } catch (err) {
        console.error("Failed to initialize SMTP transporter:", err.message);
        this.transporter = null;
      }
    }
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  async send({ to, from, subject, html, text }) {
    if (!this.transporter) {
      throw new Error("SMTP transporter is not configured or missing credentials");
    }

    const sender = from || `"${this.fromName}" <${this.from}>`;
    return await this.transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
      text,
    });
  }
}

module.exports = SmtpProvider;
