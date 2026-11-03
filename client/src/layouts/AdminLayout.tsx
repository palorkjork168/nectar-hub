import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  BarChart3,
  Briefcase,
  PlusCircle,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import PageTransition from "../components/common/PageTransition";
import ThemeToggle from "../components/common/ThemeToggle";
import { NectarIcon } from "../components/brand/NectarLogo";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Jobs & Vacancies",
      items: [
        { label: "Manage All Jobs", path: "/employer/jobs", icon: Briefcase },
        { label: "Post a Job", path: "/employer/jobs/new", icon: PlusCircle },
      ],
    },
    {
      title: "Platform Governance",
      items: [
        { label: "Staff & Users", path: "/admin/employees", icon: Users },
        { label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck },
        { label: "Attendance Control", path: "/admin/attendance", icon: CalendarCheck },
      ],
    },
  ];


  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "AD";
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
            to="/admin/dashboard"
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
                Admin Console
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
              <div style={{ fontSize: "0.6875rem", color: "var(--color-primary-text)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                Administrator
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
              <span>Admin Console</span>
              <span style={{ color: "var(--color-text-muted)" }}>/</span>
              <span style={{ color: "var(--color-primary-text)", fontWeight: 700 }}>Governance</span>
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
