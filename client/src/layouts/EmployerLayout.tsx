import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Briefcase,
  Building2,
  Users,
  Search,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Clock,
  CalendarCheck,
  Shield,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import PageTransition from "../components/common/PageTransition";
import { NectarIcon } from "../components/brand/NectarLogo";

export default function EmployerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/employer/dashboard", icon: LayoutDashboard },
    { label: "Analytics", path: "/employer/analytics", icon: BarChart3 },
    { label: "Company", path: "/employer/company", icon: Building2 },
    { label: "Employees", path: "/employer/employees", icon: Users },
    { label: "Schedules", path: "/employer/schedules", icon: Clock },
    { label: "Attendance", path: "/employer/attendance", icon: CalendarCheck },
    { label: "Team & Roles", path: "/employer/team", icon: Users },
    { label: "My Jobs", path: "/employer/jobs", icon: Briefcase },
    { label: "Applicants", path: "/employer/applicants", icon: Users },
    { label: "Interviews", path: "/employer/interviews", icon: Calendar },
    { label: "HR Hub", path: "/employer/hr", icon: Building2 },
    { label: "Leave Requests", path: "/employer/leave-requests", icon: Calendar },
    { label: "Audit Trail", path: "/employer/audit", icon: Shield },
    { label: "Browse Jobs", path: "/jobs", icon: Search },
  ];


  const isActive = (path: string) => {
    if (path === "/employer/dashboard" && location.pathname === "/employer/dashboard") return true;
    if (path !== "/employer/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "EM";
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <div className="public-layout">
      {/* Top Navigation */}
      <header className="public-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/employer/dashboard" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">
              <NectarIcon size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">Nectar Hub</span>
              <span className="brand-subtitle">Employer Portal</span>
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
