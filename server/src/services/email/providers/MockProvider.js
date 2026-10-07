const fs = require("fs");
const path = require("path");
const EmailProvider = require("./EmailProvider");

const BRIDGE_FILE = path.join(__dirname, "../../../../.mock_emails.json");
const FAIL_FLAG_FILE = path.join(__dirname, "../../../../.mock_fail.flag");

class MockProvider extends EmailProvider {
  constructor() {
    super();
    this.sentEmails = [];
    this.shouldFail = false;
    this.failureError = new Error("Simulated email delivery error");
  }

  _readBridge() {
    try {
      if (fs.existsSync(BRIDGE_FILE)) {
        return JSON.parse(fs.readFileSync(BRIDGE_FILE, "utf8"));
      }
    } catch {
      // ignore read errors
    }
    return [];
  }

  _writeBridge(emails) {
    try {
      fs.writeFileSync(BRIDGE_FILE, JSON.stringify(emails, null, 2), "utf8");
    } catch {
      // ignore write errors
    }
  }

  setSimulateFailure(shouldFail, customError = null) {
    this.shouldFail = Boolean(shouldFail);
    if (customError) {
      this.failureError = customError;
    }
    try {
      if (this.shouldFail) {
        fs.writeFileSync(FAIL_FLAG_FILE, this.failureError.message || "Simulated email delivery error", "utf8");
      } else if (fs.existsSync(FAIL_FLAG_FILE)) {
        fs.unlinkSync(FAIL_FLAG_FILE);
      }
    } catch {
      // ignore file error
    }
  }

  _checkCrossProcessFailure() {
    try {
      if (fs.existsSync(FAIL_FLAG_FILE)) {
        const msg = fs.readFileSync(FAIL_FLAG_FILE, "utf8");
        return new Error(msg || "Simulated email delivery error");
      }
    } catch {
      // ignore
    }
    return null;
  }

  async send(options) {
    const crossFail = this._checkCrossProcessFailure();
    if (this.shouldFail || crossFail) {
      throw crossFail || this.failureError;
    }

    const emailRecord = {
      ...options,
      timestamp: new Date(),
      messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };

    this.sentEmails.push(emailRecord);

    // Sync to cross-process bridge
    const current = this._readBridge();
    current.push(emailRecord);
    this._writeBridge(current);

    return {
      messageId: emailRecord.messageId,
      accepted: [options.to],
      rejected: [],
    };
  }

  getSentEmails() {
    const diskEmails = this._readBridge();
    if (diskEmails.length > 0) {
      return diskEmails;
    }
    return [...this.sentEmails];
  }

  getLastEmail() {
    const all = this.getSentEmails();
    return all[all.length - 1] || null;
  }

  findEmailsByRecipient(recipient) {
    return this.getSentEmails().filter((e) => e.to.toLowerCase() === recipient.toLowerCase());
  }

  clear() {
    this.sentEmails = [];
    this.shouldFail = false;
    try {
      if (fs.existsSync(BRIDGE_FILE)) fs.unlinkSync(BRIDGE_FILE);
      if (fs.existsSync(FAIL_FLAG_FILE)) fs.unlinkSync(FAIL_FLAG_FILE);
    } catch {
      // ignore
    }
  }
}

module.exports = MockProvider;
