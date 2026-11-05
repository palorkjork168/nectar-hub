import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Rocket,
  Layers,
  ShieldCheck,
  Zap,
    Compass,
  Check
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

export default function ComingSoon() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const featureName = searchParams.get("feature") || "Next-Generation Feature";
  const category = searchParams.get("category") || "Platform Evolution";
  const eta = searchParams.get("eta") || "Scheduled for v1.1 Release";

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(() => {
    try {
      const saved = localStorage.getItem(`notify_${featureName}`);
      return Boolean(saved);
    } catch {
      return false;
    }
  });

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      localStorage.setItem(`notify_${featureName}`, email);
    } catch {
      // Ignore localStorage exceptions
    }
    setIsSubscribed(true);
    toast.success(`You're on the early access list! We'll notify you when ${featureName} is ready.`);
  };

  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return "/jobs";
    const userRole = (user as any).role || (user as any).roles?.[0] || "";
    switch (userRole) {
      case "ADMIN":
        return "/admin";
      case "EMPLOYER":
        return "/employer";
      case "EMPLOYEE":
        return "/employee";
      case "JOB_SEEKER":
      default:
        return "/job-seeker";
    }
  };

  return (
    <div className="public-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Top Breadcrumb / Back button */}
      <div style={{ marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.85rem", fontSize: "0.875rem", borderRadius: "8px" }}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>

      {/* Main Hero Card with Glassmorphic gradient */}
      <div
        className="card"
        style={{
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.08)",
          marginBottom: "2.5rem",
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "350px",
            height: "240px",
            background: "radial-gradient(circle, rgba(255, 225, 124, 0.22) 0%, rgba(245, 158, 11, 0.12) 60%, transparent 100%)",
            pointerEvents: "none",
            filter: "blur(40px)",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header Badges */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div
              className="hero-career-pill"
              style={{
                margin: 0,
                background: "rgba(255, 225, 124, 0.1)",
                color: "var(--color-primary-text)",
                border: "1px solid rgba(255, 225, 124, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              <Sparkles size={14} />
              <span>{category.toUpperCase()}</span>
            </div>

            <div
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                color: "#d97706",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              <Clock size={14} />
              <span>{eta}</span>
            </div>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              margin: "0 0 1.25rem",
              letterSpacing: "-0.03em",
              color: "var(--color-text)",
            }}
          >
            {featureName} <span style={{ color: "var(--color-primary-text)" }}>is Coming Soon</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.65,
              maxWidth: "680px",
              margin: "0 auto 2.5rem",
            }}
          >
            We are actively building and testing this feature for the next release.
          </p>

          {/* Interactive Roadmap Stepper */}
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto 3rem",
              padding: "1.75rem",
              borderRadius: "16px",
              background: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Development Milestones
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ffe17c", color: "var(--color-text-inverse)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                  <Check size={16} strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>1. Architecture & UX</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-primary-text)", fontWeight: 600 }}>Completed & Approved</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                  <Zap size={15} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>2. Engine & APIs</div>
                  <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600 }}>In Active Development</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-border)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                  <Rocket size={15} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>3. Beta Rollout</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{eta}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Notification Subscription Form */}
          <div style={{ maxWidth: "520px", margin: "0 auto 2.5rem" }}>
            {isSubscribed ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.85rem 1.5rem",
                  borderRadius: "12px",
                  background: "rgba(255, 225, 124, 0.12)",
                  color: "var(--color-primary-text)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  border: "1px solid rgba(255, 225, 124, 0.25)",
                }}
              >
                <CheckCircle2 size={18} />
                <span>You're on the early access notification list!</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to get early access..."
                  className="input-field"
                  style={{
                    flex: "1 1 280px",
                    padding: "0.8rem 1.15rem",
                    borderRadius: "12px",
                    background: "var(--color-surface)",
                    fontSize: "0.9375rem",
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Bell size={16} />
                  <span>Notify Me</span>
                </button>
              </form>
            )}
            <div style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)", marginTop: "0.6rem" }}>
              No spam guaranteed. We'll only email you when {featureName} goes live.
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "2rem" }}>
            <Link
              to="/jobs"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.6rem",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              <Search size={16} />
              <span>Browse Active Jobs</span>
            </Link>

            <Link
              to={getDashboardUrl()}
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.6rem",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              <Compass size={16} />
              <span>Go to My Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Pillars Teaser Bento Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-text)" }}>
            High-Performance Architecture
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            Engineered for sub-second response times and immediate sync across both public job seekers and corporate employer portals.
          </p>
        </div>

        <div className="card" style={{ padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255, 225, 124, 0.12)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <ShieldCheck size={20} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-text)" }}>
            Verified Enterprise Diligence
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            Strict multi-tenant security guarantees that candidate and company data remains private, audited, and strictly isolated.
          </p>
        </div>

        <div className="card" style={{ padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <Layers size={20} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-text)" }}>
            Integrated Ecosystem
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            Connects seamlessly into applicant tracking, geofenced shift attendance, and multi-role HR governance out of the box.
          </p>
        </div>
      </div>
    </div>
  );
}
