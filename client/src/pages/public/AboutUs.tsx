import { Link } from "react-router-dom";
import { Target, ShieldCheck, Award, ArrowUpRight, Sparkles } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="public-container">
      {/* Hero Intro */}
      <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem" }}>
        <div className="hero-career-pill" style={{ margin: "0 auto 1.25rem" }}>
          <Sparkles size={14} />
          <span>About Nectar Hub</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 1.25rem", letterSpacing: "-0.03em" }}>
          Connecting Talent & Teams
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 auto" }}>
          A modern workforce platform empowering professionals to grow and companies to hire, manage, and succeed.
        </p>
      </div>

      {/* Mission & Vision Bento */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "4rem" }}>
        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Target size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Our Mission</h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            Bridge the gap between talent and opportunity through verified hiring, skills training, and modern tools.
          </p>
        </div>

        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Our Standards</h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            Every job, company, and candidate profile is authenticated to ensure data integrity, trust, and safety.
          </p>
        </div>

        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Award size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Training & Growth</h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            Practical workshops and skill programs designed to meet current market demands.
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="card" style={{ padding: "3rem 2rem", borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, #ffe17c 0%, #ffe17c 60%, #ffe17c 100%)", color: "#ffffff", textAlign: "center", marginBottom: "4rem", boxShadow: "0 16px 36px rgba(255, 225, 124, 0.25)" }}>
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 2rem", color: "#ffffff" }}>Platform Impact</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>12,500+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Placements</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>650+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Partners</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>98%</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Retention Rate</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>25+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Programs</div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ textAlign: "center" }}>
        <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 1rem" }}>Ready to get started?</h3>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/jobs" className="btn btn-primary" style={{ padding: "0.85rem 2rem" }}>
            Browse Jobs <ArrowUpRight size={16} />
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: "0.85rem 2rem" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
