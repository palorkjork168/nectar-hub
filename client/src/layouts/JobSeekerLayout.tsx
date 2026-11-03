import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  User,
  Award,
  Calendar,
  FileText,
  Bookmark,
  Search,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import ThemeToggle from "../components/common/ThemeToggle";
import PageTransition from "../components/common/PageTransition";
import { NectarIcon } from "../components/brand/NectarLogo";

export default function JobSeekerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      title: "Career Hub",
      items: [
        { label: "Dashboard", path: "/job-seeker/dashboard", icon: LayoutDashboard },
        { label: "My Profile", path: "/job-seeker/profile", icon: User },
        { label: "Applications", path: "/job-seeker/applications", icon: FileText },
        { label: "Interviews", path: "/job-seeker/interviews", icon: Calendar },
        { label: "Saved Jobs", path: "/job-seeker/saved", icon: Bookmark },
        { label: "Recommended", path: "/job-seeker/recommended", icon: Award },
      ],
    },
    {
      title: "Marketplace",
      items: [
        { label: "Browse All Jobs", path: "/jobs", icon: Search },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/job-seeker/dashboard" && location.pathname === "/job-seeker/dashboard") return true;
    if (path !== "/job-seeker/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "JS";
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
            to="/job-seeker/dashboard"
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
                Talent Portal
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
                {user?.first_name || "Job"} {user?.last_name || "Seeker"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Verified Candidate
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-icon"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              className="btn-icon mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb" style={{ margin: 0 }}>
              <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "var(--color-text)", fontWeight: 600 }}>Talent Portal</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <Link to="/jobs" className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.85rem" }}>
              <Search size={14} />
              <span>Explore Roles</span>
            </Link>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div style={{ flex: 1 }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>
    </div>
  );
}
