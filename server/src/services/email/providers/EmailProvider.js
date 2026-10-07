/**
 * Base EmailProvider interface
 */
class EmailProvider {
  /**
   * Send an email
   * @param {Object} options
   * @param {string} options.to
   * @param {string} [options.from]
   * @param {string} options.subject
   * @param {string} options.html
   * @param {string} [options.text]
   * @returns {Promise<Object>}
   */
  async send(options) {
    throw new Error("send() must be implemented by EmailProvider subclass");
  }

  isConfigured() {
    return true;
  }
}

module.exports = EmailProvider;
