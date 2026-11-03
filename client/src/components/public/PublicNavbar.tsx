import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  LogIn,
  ArrowUpRight,
  ShieldAlert,
  Briefcase,
  Users,
  LayoutDashboard,
  ChevronDown,
  Calculator,
  FileText,
  Compass,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
import ThemeToggle from "../common/ThemeToggle";
import { NectarIcon } from "../brand/NectarLogo";
import UserNavMenu from "./UserNavMenu";

export default function PublicNavbar() {
  const { user, isAdmin, isEmployer, isEmployee, isJobSeeker } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const toolsRef = useRef<HTMLLIElement>(null);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Close tools dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary portal link for quick one-click desktop badge
  const primaryPortal = (() => {
    if (isAdmin) return { label: "Admin Portal", path: "/admin/dashboard", icon: ShieldAlert, className: "portal-pill-admin" };
    if (isEmployer) return { label: "Employer Portal", path: "/employer/dashboard", icon: Briefcase, className: "portal-pill-employer" };
    if (isEmployee) return { label: "Employee Portal", path: "/employee/dashboard", icon: Users, className: "portal-pill-employee" };
    if (isJobSeeker) return { label: "Job Seeker Portal", path: "/job-seeker/dashboard", icon: LayoutDashboard, className: "portal-pill-jobseeker" };
    return null;
  })();

  return (
    <nav className="public-navbar">
      <div className="navbar-container">
        {/* Brand in Anton 3xl with Yellow Period */}
        <Link to="/" className="brand-logo flux-brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <span className="flux-logo-anton">NECTAR<span className="flux-logo-period">.</span></span>
        </Link>

        {/* Center Nav Links Matching Reference: Home, About Us, Jobs, Events, Blogs, Contact, Tools */}
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
              to="/about"
              className={`nav-link ${isActive("/about") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
          </li>
          <li>
            <Link
              to="/jobs"
              className={`nav-link ${isActive("/jobs") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Jobs
            </Link>
          </li>
          <li>
            <Link
              to="/events"
              className={`nav-link ${isActive("/events") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
          </li>
          <li>
            <Link
              to="/blogs"
              className={`nav-link ${isActive("/blogs") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blogs
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={`nav-link ${isActive("/contact") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </li>

          {/* Tools Dropdown */}
          <li className="nav-dropdown-wrapper" ref={toolsRef}>
            <button
              type="button"
              className={`nav-link nav-dropdown-trigger ${toolsDropdownOpen || location.pathname.startsWith("/tools") ? "active" : ""}`}
              onClick={() => setToolsDropdownOpen((prev) => !prev)}
              aria-expanded={toolsDropdownOpen}
            >
              <span>Tools</span>
              <ChevronDown size={14} className={`dropdown-chevron ${toolsDropdownOpen ? "open" : ""}`} />
            </button>

            {toolsDropdownOpen && (
              <div className="tools-dropdown-menu fade-in">
                <Link
                  to="/coming-soon?feature=AI%20Resume%20Builder&category=Career%20Toolkit&eta=v1.1%20Release"
                  className="tools-dropdown-item"
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="tools-item-icon">
                    <FileText size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="tools-item-title">Resume Builder</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>SOON</span>
                    </div>
                    <div className="tools-item-sub">Craft ATS-friendly professional resumes</div>
                  </div>
                </Link>

                <Link
                  to="/tools"
                  className="tools-dropdown-item"
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="tools-item-icon">
                    <Calculator size={16} />
                  </div>
                  <div>
                    <div className="tools-item-title">Salary Calculator</div>
                    <div className="tools-item-sub">Market benchmarks & compensation rates</div>
                  </div>
                </Link>

                <Link
                  to="/coming-soon?feature=AI%20Career%20Assessment&category=Skills%20Intelligence&eta=v1.1%20Release"
                  className="tools-dropdown-item"
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="tools-item-icon">
                    <Compass size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="tools-item-title">Career Assessment</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>SOON</span>
                    </div>
                    <div className="tools-item-sub">Discover high-fit roles for your skills</div>
                  </div>
                </Link>

                <Link
                  to="/coming-soon?feature=Interactive%20Interview%20Prep&category=Interview%20Coaching&eta=v1.1%20Release"
                  className="tools-dropdown-item"
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="tools-item-icon">
                    <GraduationCap size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="tools-item-title">Interview Prep</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>SOON</span>
                    </div>
                    <div className="tools-item-sub">Question bank & interview training</div>
                  </div>
                </Link>
              </div>
            )}
          </li>
        </ul>

        {/* Actions & User Nav */}
        <div className="nav-actions">
          <ThemeToggle />

          {user ? (
            <div className="nav-user-actions-cluster">
              {/* Quick desktop portal shortcut button */}
              {primaryPortal && (
                <Link
                  to={primaryPortal.path}
                  className={`quick-portal-btn ${primaryPortal.className}`}
                  title={`Open ${primaryPortal.label}`}
                >
                  <primaryPortal.icon size={14} />
                  <span>{primaryPortal.label}</span>
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Avatar Menu Dropdown with Profile, Portals, Applications, Saved Jobs, Logout */}
              <UserNavMenu />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <Link to="/login" className="flux-nav-login">
                <LogIn size={15} />
                <span>LOGIN</span>
              </Link>
              <Link to="/register" className="flux-nav-waitlist-btn">
                <UserPlus size={15} />
                <span>GET STARTED</span>
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
