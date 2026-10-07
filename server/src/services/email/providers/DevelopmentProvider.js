const EmailProvider = require("./EmailProvider");

class DevelopmentProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.from = config.from || process.env.EMAIL_FROM || "noreply@nectarhub.com";
    this.fromName = config.fromName || process.env.EMAIL_FROM_NAME || "Nectar Hub";
  }

  async send({ to, subject, text, html }) {
    console.log(`[Email Service - Dev Mode] Simulated delivery -> Recipient: "${to}" | Subject: "${subject}"`);
    return {
      messageId: `dev-simulated-${Date.now()}`,
      accepted: [to],
      rejected: [],
      simulated: true,
    };
  }
}

module.exports = DevelopmentProvider;
