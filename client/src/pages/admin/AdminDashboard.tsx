import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useScrollRevealGroup } from "../../hooks/useScrollReveal";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  UserCheck,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
  PlusCircle,
  BarChart3,
  Server,
  Database,
  Lock,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function AdminDashboard() {
  const containerRef = useScrollRevealGroup();
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="dashboard-content-wrap" style={{ textAlign: "center", padding: "6rem 0" }}>
        <Loader2 className="animate-spin" size={36} style={{ color: "var(--color-primary-text)", margin: "0 auto" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dashboard-content-wrap">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load dashboard metrics"
          description="We couldn't retrieve the platform metrics. Please verify your connection or try again."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users ?? 0,
      icon: Users,
      color: "#2563eb",
      bg: "rgba(37, 99, 235, 0.1)",
      border: "rgba(37, 99, 235, 0.2)",
      link: "/admin/employees",
      linkText: "Staff list",
    },
    {
      label: "Companies",
      value: stats?.companies ?? 0,
      icon: Building2,
      color: "var(--color-primary-text)",
      bg: "rgba(255, 225, 124, 0.1)",
      border: "rgba(255, 225, 124, 0.2)",
      link: "/employer/company",
      linkText: "Directory",
    },
    {
      label: "Published Jobs",
      value: stats?.active_jobs ?? 0,
      icon: Briefcase,
      color: "#7c3aed",
      bg: "rgba(124, 58, 237, 0.1)",
      border: "rgba(124, 58, 237, 0.2)",
      link: "/employer/jobs",
      linkText: "Manage jobs",
    },
    {
      label: "Job Applications",
      value: stats?.applications ?? 0,
      icon: FileText,
      color: "#d97706",
      bg: "rgba(217, 119, 6, 0.1)",
      border: "rgba(217, 119, 6, 0.2)",
      link: "/admin/analytics",
      linkText: "Analytics",
    },
    {
      label: "Active Employees",
      value: stats?.employees ?? 0,
      icon: UserCheck,
      color: "#0284c7",
      bg: "rgba(2, 132, 199, 0.1)",
      border: "rgba(2, 132, 199, 0.2)",
      link: "/admin/employees",
      linkText: "Roster",
    },
    {
      label: "Pending Leaves",
      value: stats?.pending_leaves ?? 0,
      icon: Calendar,
      color: "#dc2626",
      bg: "rgba(220, 38, 38, 0.1)",
      border: "rgba(220, 38, 38, 0.2)",
      link: "/admin/roles",
      linkText: "Governance",
    },
  ];

  return (
    <div ref={containerRef} className="dashboard-content-wrap fade-in">
      {/* Page Header */}
      <div className="dashboard-header-block">
        <div>
          <div className="dashboard-pill-badge">
            <span className="dashboard-yellow-dot" />
            <span>OVERVIEW</span>
          </div>
          <h1 className="dashboard-title">Platform Admin Console</h1>
          <p className="dashboard-subtitle">
            Platform overview of workforce operations, jobs, and metrics.
          </p>
        </div>
        <div className="dashboard-actions-cluster">
          <Link to="/employer/jobs/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Post a Job</span>
          </Link>
          <Link to="/admin/analytics" className="btn btn-secondary">
            <BarChart3 size={16} />
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="nectar-stat-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={index} to={card.link} className="nectar-stat-card">
              <div className="nectar-stat-top">
                <span className="nectar-stat-label">{card.label}</span>
                <div
                  className="nectar-stat-icon-wrap"
                  style={{
                    backgroundColor: card.bg,
                    color: card.color,
                    border: `1px solid ${card.border}`,
                  }}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="nectar-stat-val">{card.value.toLocaleString()}</div>
              <div className="nectar-stat-meta" style={{ color: card.color }}>
                <span>{card.linkText}</span>
                <ArrowRight size={13} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational Overview & Quick Links */}
      <div className="nectar-dashboard-grid-2">
        {/* Quick Operations Card */}
        <div className="nectar-card">
          <div className="nectar-card-header">
            <h3 className="nectar-card-title">
              <ShieldCheck size={18} style={{ color: "var(--color-primary-text)" }} />
              Platform Management
            </h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
              Direct Access
            </span>
          </div>
          <div className="nectar-card-body">
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
              Access administrative features to inspect staff accounts, adjust roles, and monitor cross-tenant system activity.
            </p>

            <div className="nectar-list-group">
              <Link to="/employer/jobs/new" className="nectar-list-row" style={{ borderLeft: "3px solid var(--color-primary)" }}>
                <div>
                  <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-primary-text)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <PlusCircle size={15} />
                    <span>Post New Vacancy</span>
                  </h4>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Publish a role across the verified job catalog
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-primary-text)" }} />
              </Link>

              <Link to="/employer/jobs" className="nectar-list-row">
                <div>
                  <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Briefcase size={15} />
                    <span>Manage All Listings</span>
                  </h4>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    View draft, published, and closed company jobs
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </Link>

              <Link to="/admin/employees" className="nectar-list-row">
                <div>
                  <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Users size={15} />
                    <span>Employees & Users</span>
                  </h4>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Manage staff, user profiles, and organization assignments
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </Link>

              <Link to="/jobs" className="nectar-list-row">
                <div>
                  <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Building2 size={15} />
                    <span>Public Job Marketplace</span>
                  </h4>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Preview published job cards as seen by candidates
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </Link>
            </div>
          </div>
        </div>

        {/* System Summary */}
        <div className="nectar-card">
          <div className="nectar-card-header">
            <h3 className="nectar-card-title">
              <Activity size={18} style={{ color: "var(--color-success-text)" }} />
              Platform Infrastructure
            </h3>
            <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <span className="status-pulsing-dot" style={{ width: "6px", height: "6px" }} />
              Operational
            </span>
          </div>
          <div className="nectar-card-body">
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
              Cross-tenant services health, database connectivity, and security governance statuses.
            </p>

            <div className="nectar-list-group">
              <div className="nectar-list-row" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Server size={18} style={{ color: "var(--color-primary-text)" }} />
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>API Gateway</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>REST Endpoints Active</div>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Port 5000 Online</span>
              </div>

              <div className="nectar-list-row" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Database size={18} style={{ color: "#0284c7" }} />
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>PostgreSQL Database</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Sequelize ORM Synchronized</div>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Connected</span>
              </div>

              <div className="nectar-list-row" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Lock size={18} style={{ color: "#7c3aed" }} />
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Tenant Isolation & RBAC</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Company Boundary Guards</div>
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>Enforced</span>
              </div>

              <div className="nectar-list-row" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Calendar size={18} style={{ color: "#d97706" }} />
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Attendance & GPS Engine</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Geofence verification online</div>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
