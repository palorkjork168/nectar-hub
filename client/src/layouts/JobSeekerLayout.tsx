import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  FileText,
  Bookmark,
  Sparkles,
  Search,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import { NectarIcon } from "../components/brand/NectarLogo";
import PageTransition from "../components/common/PageTransition";

export default function JobSeekerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/job-seeker/dashboard", icon: LayoutDashboard },
    { label: "My Profile", path: "/job-seeker/profile", icon: User },
    { label: "My Applications", path: "/job-seeker/applications", icon: FileText },
    { label: "Interviews", path: "/job-seeker/interviews", icon: Calendar },
    { label: "Saved Jobs", path: "/job-seeker/saved", icon: Bookmark },
    { label: "Recommended", path: "/job-seeker/recommended", icon: Sparkles },
    { label: "Browse Jobs", path: "/jobs", icon: Search },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "JS";
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <div className="public-layout">
      {/* Top Navigation */}
      <header className="public-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/job-seeker/dashboard" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">
              <NectarIcon size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">Nectar Hub</span>
              <span className="brand-subtitle">Job Seeker Portal</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User Section */}
          <div className="nav-actions">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <NotificationBell />
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-bg)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                }}
              >
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-main)", display: "none" }} className="desktop-user-name">
                {user?.first_name}
              </span>
              <button onClick={logout} className="btn btn-ghost" title="Logout" aria-label="Log out of account" style={{ padding: "0.5rem" }}>
                <LogOut size={16} />
              </button>
            </div>

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="public-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
