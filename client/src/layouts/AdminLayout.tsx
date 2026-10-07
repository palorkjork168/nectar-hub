import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Users, LogOut, Menu, X, ShieldCheck, BarChart3 } from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import PageTransition from "../components/common/PageTransition";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "Users", path: "/admin/employees", icon: Users },
    { label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck },
  ];


  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "AD";
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <div className="public-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(13, 22, 17, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(16, 185, 129, 0.18)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-width-page)",
            margin: "0 auto",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <Link
            to="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-primary)",
                color: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text)", lineHeight: 1.1 }}>
                Sakol Universe
              </span>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-primary)" }}>
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav style={{ display: "none" }} className="desktop-nav">
            <style>{`
              @media (min-width: 768px) {
                .desktop-nav { display: flex !important; align-items: center; gap: 0.5rem; }
                .mobile-menu-toggle { display: none !important; }
              }
            `}</style>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 0.875rem",
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 500,
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    backgroundColor: active ? "var(--color-primary-soft)" : "transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Controls & Mobile Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <NotificationBell />
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <div style={{ display: "none" }} className="user-text-meta">
                <style>{`
                  @media (min-width: 640px) {
                    .user-text-meta { display: flex !important; flex-direction: column; }
                  }
                `}</style>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
                  {user?.first_name} {user?.last_name}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                  Administrator
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn btn-sm btn-secondary"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
              <span className="signout-label">Sign Out</span>
              <style>{`
                @media (max-width: 640px) {
                  .signout-label { display: none; }
                }
              `}</style>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle btn btn-sm btn-ghost btn-icon-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "0.75rem 1.5rem 1rem",
              borderTop: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 0.75rem",
                    fontSize: "0.9375rem",
                    fontWeight: active ? 600 : 500,
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    backgroundColor: active ? "var(--color-primary-soft)" : "transparent",
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, backgroundColor: "var(--color-bg)" }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
