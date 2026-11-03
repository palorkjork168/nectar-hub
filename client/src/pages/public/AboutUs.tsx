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
          Connecting Talent with Enterprise Opportunity
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 auto" }}>
          Inspired by leading global workforce ecosystems, Nectar Hub is Cambodia and Southeast Asia's modern workforce platform.
          We empower professionals to accelerate their careers and enable forward-thinking companies to discover, manage, and nurture verified talent.
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
            To bridge the gap between education and real-world employment by providing transparent, skill-verified recruitment pathways, training solutions, and modern workforce intelligence.
          </p>
        </div>

        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Our Standards</h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            Every job opening, employer, and candidate on Nectar Hub is authenticated with enterprise diligence to protect data integrity, prevent fraud, and establish trusted career growth.
          </p>
        </div>

        <div className="card" style={{ padding: "2.5rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Award size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Training & Development</h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            In addition to recruitment, we partner with industry leaders to provide vocational skill workshops, HR solutions, and career readiness training tailored for regional market demand.
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="card" style={{ padding: "3rem 2rem", borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, #ffe17c 0%, #ffe17c 60%, #ffe17c 100%)", color: "#ffffff", textAlign: "center", marginBottom: "4rem", boxShadow: "0 16px 36px rgba(255, 225, 124, 0.25)" }}>
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 2rem", color: "#ffffff" }}>Proven Impact in Numbers</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>12,500+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Successful Placements</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>650+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Partner Organizations</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>98.4%</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Employer Retention Rate</div>
          </div>
          <div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900 }}>25+</div>
            <div style={{ opacity: 0.9, fontSize: "0.9375rem" }}>Training Programs</div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ textAlign: "center" }}>
        <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 1rem" }}>Ready to find your next opportunity?</h3>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/jobs" className="btn btn-primary" style={{ padding: "0.85rem 2rem" }}>
            Browse Open Roles <ArrowUpRight size={16} />
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: "0.85rem 2rem" }}>
            Register as Candidate
          </Link>
        </div>
      </div>
    </div>
  );
}
