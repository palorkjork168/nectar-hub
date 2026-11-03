import { Link } from "react-router-dom";
import { Globe, Shield } from "lucide-react";
import { NectarIcon } from "../brand/NectarLogo";

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <div className="brand-icon" style={{ width: "32px", height: "32px" }}>
              <NectarIcon size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-text)", fontWeight: 800 }}>Nectar Hub</h3>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: "320px" }}>
            The unified workforce and talent platform connecting job seekers, employers, and teams across modern workplaces.
          </p>
        </div>

        <div className="footer-column">
          <h4>Job Seekers</h4>
          <ul>
            <li><Link to="/jobs">Browse All Jobs</Link></li>
            <li><Link to="/jobs?is_remote=true">Remote Jobs</Link></li>
            <li><Link to="/jobs?employment_type=FULL_TIME">Full-Time Careers</Link></li>
            <li><Link to="/jobs?employment_type=INTERNSHIP">Internships</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/jobs?industry=Technology">Technology & IT</Link></li>
            <li><Link to="/jobs?industry=Finance">Finance & Banking</Link></li>
            <li><Link to="/jobs?industry=Engineering">Engineering</Link></li>
            <li><Link to="/jobs?industry=Marketing">Marketing & Sales</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#64748b", fontSize: "0.875rem" }}>
              <Shield size={14} /> Verified System
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#64748b", fontSize: "0.875rem" }}>
              <Globe size={14} /> English (EN)
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>&copy; {new Date().getFullYear()} Nectar Hub. All rights reserved.</div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link to="/coming-soon?feature=Privacy%20Policy%20%26%20Data%20Protection&category=Legal%20%26%20Governance&eta=v1.1%20Release" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <Link to="/coming-soon?feature=Terms%20of%20Service%20%26%20User%20Agreement&category=Legal%20%26%20Governance&eta=v1.1%20Release" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
            Terms of Service
          </Link>
          <Link to="/contact" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
            Contact Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
