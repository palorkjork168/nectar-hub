import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Briefcase, Menu, X, LogIn, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";

import { NectarIcon } from "../brand/NectarLogo";

export default function PublicNavbar() {
  const { user, isAdmin, isEmployee, isJobSeeker, isEmployer, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="public-navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon">
            <NectarIcon size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Nectar Hub</span>
            <span className="brand-subtitle">Workforce Platform</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive("/") && location.pathname === "/" ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/jobs"
              className={`nav-link ${isActive("/jobs") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Jobs
            </Link>
          </li>
        </ul>

        {/* Actions */}
        <div className="nav-actions">
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <NotificationBell />
              {isEmployer && (
                <Link to="/employer/dashboard" className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
                  <Briefcase size={15} /> Employer Portal
                </Link>
              )}
              {isJobSeeker && (
                <Link to="/job-seeker/dashboard" className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
                  <LayoutDashboard size={15} /> Job Seeker Portal
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/employees" className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
                  <LayoutDashboard size={15} /> Admin Console
                </Link>
              )}
              {isEmployee && (
                <Link to="/employee/dashboard" className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
                  <LayoutDashboard size={15} /> Employee Portal
                </Link>
              )}
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span>Hi, <strong>{user.first_name}</strong></span>
              </span>
              <button onClick={logout} className="btn btn-ghost" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Link to="/login" className="btn btn-ghost" style={{ fontSize: "0.875rem" }}>
                <LogIn size={16} /> Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
                <UserPlus size={16} /> Register
              </Link>
            </div>
          )}

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
