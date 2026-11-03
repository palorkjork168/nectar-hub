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
  CheckSquare,
  Shield,
  PlusCircle,
  ChevronRight,
  MapPin,
  Radio,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import PageTransition from "../components/common/PageTransition";
import ThemeToggle from "../components/common/ThemeToggle";
import { NectarIcon } from "../components/brand/NectarLogo";

export default function EmployerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", path: "/employer/dashboard", icon: LayoutDashboard },
        { label: "Analytics", path: "/employer/analytics", icon: BarChart3 },
        { label: "Company Profile", path: "/employer/company", icon: Building2 },
      ],
    },
    {
      title: "Workforce",
      items: [
        { label: "Employees", path: "/employer/employees", icon: Users },
        { label: "Schedules", path: "/employer/schedules", icon: Clock },
        { label: "Weekly Roster", path: "/employer/attendance/roster", icon: Calendar },
        { label: "Attendance", path: "/employer/attendance", icon: CalendarCheck },
        { label: "Punch Corrections", path: "/employer/attendance/corrections", icon: CheckSquare },
        { label: "Workplaces & Geo-Fences", path: "/employer/attendance/locations", icon: Radio },
        { label: "Team & Roles", path: "/employer/team", icon: Users },
      ],
    },

    {
      title: "Recruitment",
      items: [
        { label: "My Jobs", path: "/employer/jobs", icon: Briefcase },
        { label: "Applicants", path: "/employer/applicants", icon: Users },
        { label: "Interviews", path: "/employer/interviews", icon: Calendar },
      ],
    },
    {
      title: "HR & Compliance",
      items: [
        { label: "HR Hub", path: "/employer/hr", icon: Building2 },
        { label: "Leave Requests", path: "/employer/leave-requests", icon: Calendar },
        { label: "Audit Trail", path: "/employer/audit", icon: Shield },
      ],
    },
    {
      title: "Explore",
      items: [
        { label: "Browse Jobs", path: "/jobs", icon: Search },
      ],
    },
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
    <div className="dashboard-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Left Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link
            to="/employer/dashboard"
            onClick={() => setSidebarOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
          >
            <div className="brand-icon" style={{ width: "36px", height: "36px" }}>
              <NectarIcon size={20} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                Nectar Hub
              </span>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-primary-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Employer Console
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="btn-icon mobile-menu-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
            style={{ display: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="sidebar-nav">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              <h4 className="sidebar-group-title">{group.title}</h4>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${active ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)", flexShrink: 0 }} />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                    {active && <ChevronRight size={14} style={{ color: "var(--color-primary-text)", opacity: 0.8 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with User Profile */}
        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-primary-soft)",
                color: "var(--color-primary-text)",
                border: "1px solid var(--color-primary-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8125rem",
                flexShrink: 0,
              }}
            >
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Employer
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-icon"
            title="Sign Out"
            aria-label="Sign Out"
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="dashboard-main">
        {/* Sticky Topbar Header */}
        <header className="dashboard-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar Navigation"
              style={{ padding: "0.4rem" }}
            >
              <Menu size={22} />
            </button>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>Employer Portal</span>
              <span style={{ color: "var(--color-text-muted)" }}>/</span>
              <span style={{ color: "var(--color-primary-text)", fontWeight: 700 }}>Management</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link to="/employer/jobs/new" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              <PlusCircle size={15} />
              <span>Post a Job</span>
            </Link>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, padding: "0" }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
