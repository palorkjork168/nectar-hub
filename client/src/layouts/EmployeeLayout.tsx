import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Clock,
  Calendar,
  History,
  Search,
  LogOut,
  Menu,
  X,
  UserCheck,
  LayoutDashboard,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import ThemeToggle from "../components/common/ThemeToggle";
import PageTransition from "../components/common/PageTransition";
import { NectarIcon } from "../components/brand/NectarLogo";

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      title: "My Workplace",
      items: [
        { label: "Daily Workspace", path: "/employee/dashboard", icon: LayoutDashboard },
        { label: "Attendance History", path: "/employee/attendance", icon: History },
        { label: "Time Off & Leave", path: "/employee/leave", icon: Calendar },
      ],
    },
    {
      title: "Internal Mobility",
      items: [
        { label: "Explore Openings", path: "/jobs", icon: Search },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/employee/dashboard" && location.pathname === "/employee/dashboard") return true;
    if (path !== "/employee/dashboard" && location.pathname.startsWith(path)) return true;
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
            to="/employee/dashboard"
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
                Workplace Portal
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
        <div className="sidebar-nav">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              <span className="sidebar-group-title">{group.title}</span>
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
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div className="user-avatar-placeholder" style={{ width: "36px", height: "36px", fontSize: "0.875rem" }}>
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.first_name || "Staff"} {user?.last_name || "Member"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Active Employee
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-icon text-muted"
            title="Sign Out"
            style={{ padding: "0.4rem", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="dashboard-main">
        {/* Sticky Topbar */}
        <header className="dashboard-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-icon mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Navigation Menu"
              style={{ padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer" }}
            >
              <Menu size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Workplace Portal
              </span>
              <span style={{ color: "var(--color-border)" }}>/</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                {location.pathname === "/employee/dashboard" && "Overview"}
                {location.pathname === "/employee/attendance" && "Attendance History"}
                {location.pathname === "/employee/leave" && "Time Off"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <ThemeToggle />
            <NotificationBell />
            <div style={{ width: "1px", height: "20px", backgroundColor: "var(--color-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div className="user-avatar-placeholder" style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", display: "none" }} className="show-md">
                {user?.first_name || "Staff"}
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet with smooth page transition */}
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
