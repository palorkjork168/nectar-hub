import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="public-container">
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3.5rem" }}>
        <div className="hero-career-pill" style={{ margin: "0 auto 1.25rem" }}>
          <Sparkles size={14} />
          <span>Get in Touch</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
          Contact Us
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Have questions or need assistance? We're here to help.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", maxWidth: "1050px", margin: "0 auto" }}>
        {/* Contact Information Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "1.75rem", borderRadius: "var(--radius-xl)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Mail size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Email</h4>
              <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>We reply within 1 business day.</p>
              <a href="mailto:support@nectarhub.asia" style={{ color: "var(--color-primary-text)", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                support@nectarhub.asia
              </a>
            </div>
          </div>

          <div className="card" style={{ padding: "1.75rem", borderRadius: "var(--radius-xl)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255, 225, 124, 0.12)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Phone size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Phone</h4>
              <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>Mon - Fri, 8:00 AM - 5:30 PM</p>
              <a href="tel:+85523999888" style={{ color: "var(--color-primary-text)", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                +855 (0) 23 999 888
              </a>
            </div>
          </div>

          <div className="card" style={{ padding: "1.75rem", borderRadius: "var(--radius-xl)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Office</h4>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                Level 18, Canadia Tower, Phnom Penh, Cambodia.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(255, 225, 124, 0.15)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Message Sent</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Thanks for reaching out. We will get back to you shortly.
              </p>
              <button type="button" onClick={() => setSubmitted(false)} className="btn btn-secondary">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.25rem" }}>Send a Message</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem" }}>Leave your message below and we'll reply soon.</p>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>Your Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Sereyvisoth Chou"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>Work Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>Subject</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Employer Solutions, Job Posting or Support"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>Message</label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Tell us about your inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem", justifyContent: "center", marginTop: "0.5rem" }}>
                <Send size={16} />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
