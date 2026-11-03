import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Calculator, FileText, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function Tools() {
  const { toolId } = useParams();

  if (toolId === "resume-builder") {
    return <Navigate to="/coming-soon?feature=AI%20Resume%20Builder&category=Career%20Toolkit&eta=v1.1%20Release" replace />;
  }
  if (toolId === "career-matcher") {
    return <Navigate to="/coming-soon?feature=AI%20Career%20Assessment&category=Skills%20Intelligence&eta=v1.1%20Release" replace />;
  }
  if (toolId === "interview-prep") {
    return <Navigate to="/coming-soon?feature=Interactive%20Interview%20Prep&category=Interview%20Coaching&eta=v1.1%20Release" replace />;
  }

  const [salary, setSalary] = useState("800");
  const [experience, setExperience] = useState("2");
  const estimatedTax = Math.round(Number(salary) * 0.05);
  const netTakeHome = Number(salary) - estimatedTax;

  return (
    <div className="public-container">
      <div style={{ textAlign: "center", maxWidth: "750px", margin: "0 auto 3.5rem" }}>
        <div className="hero-career-pill" style={{ margin: "0 auto 1.25rem" }}>
          <Sparkles size={14} />
          <span>Workforce Utilities</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
          Career & Compensation Tools
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Practical calculators and career planning tools to evaluate your market rate, estimate net income, and craft competitive candidate profiles.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
        {/* Interactive Salary & Net Pay Calculator */}
        <div className="card" style={{ padding: "2.25rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--color-primary-soft)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Net Pay Estimator</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Cambodia standard payroll benchmark</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Gross Monthly Base Salary (USD)
              </label>
              <input
                type="number"
                className="input-field"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="800"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Years of Relevant Experience
              </label>
              <input
                type="number"
                className="input-field"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="2"
              />
            </div>

            <div style={{ background: "var(--color-surface-muted)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Gross Salary:</span>
                <strong>${Number(salary).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Est. Withholding Tax:</span>
                <span style={{ color: "#ef4444" }}>-${estimatedTax.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", fontSize: "1.05rem" }}>
                <span>Estimated Net Take-Home:</span>
                <strong style={{ color: "var(--color-primary-text)" }}>${netTakeHome.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Resume ATS Checker Tool Card */}
        <div className="card" style={{ padding: "2.25rem", borderRadius: "var(--radius-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255, 225, 124, 0.12)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>ATS Resume Scorecard</h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Automated candidate screening readiness</span>
            </div>
          </div>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            Test your resume formatting against the algorithms modern enterprises use before applying to competitive positions.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-text)" }} /> Keyword Density & Title Matching
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-text)" }} /> Standard Single-Column Typography
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <CheckCircle2 size={16} style={{ color: "var(--color-primary-text)" }} /> Quantifiable Metrics & Bullet Points
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link
              to="/coming-soon?feature=ATS%20Resume%20Scorecard%20%26%20Analyzer&category=AI%20Career%20Utilities&eta=v1.1%20Release"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Sparkles size={16} />
              <span>Scan & Score My Resume</span>
            </Link>

            <Link to="/jobs" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              <span>Explore Jobs by Skill</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
