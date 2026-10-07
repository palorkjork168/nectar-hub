import { useState } from "react";
import { useAdminAnalytics } from "../../hooks/useAnalytics";
import { DateRangeFilter } from "../../components/analytics/DateRangeFilter";
import { TrendChart } from "../../components/analytics/TrendChart";
import { BarChart } from "../../components/analytics/BarChart";
import { SkeletonCard } from "../../components/common/Skeleton";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function AdminAnalytics() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];

  const [from, setFrom] = useState<string>(thirtyDaysAgo);
  const [to, setTo] = useState<string>(todayStr);

  const { data, isLoading, isError, error, refetch } = useAdminAnalytics(from, to);

  const handleRangeChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  return (
    <div style={{ maxWidth: "var(--max-width-page, 1200px)", margin: "0 auto", padding: "1.5rem" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--color-text-main, #f8fafc)",
              margin: 0,
            }}
          >
            Platform Analytics
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              color: "var(--color-text-muted, #94a3b8)",
              fontSize: "0.95rem",
            }}
          >
            Platform-wide operational insights, growth trends, and activity metrics.
          </p>
        </div>

        <DateRangeFilter from={from} to={to} onRangeChange={handleRangeChange} />
      </div>

      {/* Error State */}
      {isError && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-lg, 12px)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertCircle size={20} />
            <span>{(error as any)?.message || "Failed to load platform analytics."}</span>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.8rem",
              background: "#991b1b",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Headline Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Users Card */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Total Users
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.totalUsers || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                <strong style={{ color: "#34d399" }}>+{data?.overview.newUsersInPeriod || 0}</strong> in selected period
              </div>
            </div>

            {/* Companies Card */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Companies
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <Building2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.totalCompanies || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                <strong style={{ color: "#10b981" }}>+{data?.overview.newCompaniesInPeriod || 0}</strong> in selected period
              </div>
            </div>

            {/* Jobs Card */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Published Jobs
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
                  <Briefcase size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.publishedJobs || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                {data?.overview.totalJobs || 0} total listings ({data?.overview.newJobsInPeriod || 0} new)
              </div>
            </div>

            {/* Applications Card */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Applications
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                  <FileText size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.totalApplications || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                <strong style={{ color: "#fbbf24" }}>+{data?.overview.applicationsInPeriod || 0}</strong> in selected period
              </div>
            </div>

            {/* Active Workforce */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Active Employees
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee" }}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.activeEmployees || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                Across all registered companies
              </div>
            </div>

            {/* Leave Requests Card */}
            <div
              style={{
                background: "var(--color-bg-card, #0e1712)",
                border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #94a3b8)" }}>
                  Leave Requests
                </span>
                <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #f8fafc)" }}>
                {data?.overview.totalLeaveRequests || 0}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94a3b8)" }}>
                <strong style={{ color: "#f472b6" }}>{data?.overview.pendingLeaveRequests || 0}</strong> awaiting approval
              </div>
            </div>
          </>
        )}
      </div>

      {/* Time-Series Growth Trends */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--color-text-main, #f8fafc)", marginBottom: "1rem" }}>
        Activity Trends Over Time
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <TrendChart
          title="Job Applications Submitted"
          data={data?.trends.applicationsSubmitted || []}
          color="#f59e0b"
        />
        <TrendChart
          title="User Registrations"
          data={data?.trends.userRegistrations || []}
          color="#10b981"
        />
        <TrendChart
          title="Jobs Posted"
          data={data?.trends.jobsCreated || []}
          color="#34d399"
        />
      </div>

      {/* System Distributions */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--color-text-main, #f8fafc)", marginBottom: "1rem" }}>
        System Distributions
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <BarChart
          title="Users by Role"
          items={
            data?.distributions.usersByRole.map((u) => ({
              label: u.role,
              count: u.count,
            })) || []
          }
        />
        <BarChart
          title="Jobs by Status"
          items={
            data?.distributions.jobsByStatus.map((j) => ({
              label: j.status,
              count: j.count,
            })) || []
          }
        />
        <BarChart
          title="Applications by Status"
          items={
            data?.distributions.applicationsByStatus.map((a) => ({
              label: a.status,
              count: a.count,
            })) || []
          }
        />
        <BarChart
          title="Leave Requests by Status"
          items={
            data?.distributions.leaveByStatus.map((l) => ({
              label: l.status,
              count: l.count,
            })) || []
          }
        />
      </div>
    </div>
  );
}
