import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import {
  useCompanyAnalytics,
  useCompanyAttendanceAnalytics,
  exportCompanyAttendanceCsv,
} from "../../hooks/useAnalytics";
import { useCompanySchedules } from "../../hooks/useWorkSchedules";
import { useToast } from "../../contexts/ToastContext";
import { getErrorMessage } from "../../utils/errors";
import { DateRangeFilter } from "../../components/analytics/DateRangeFilter";
import { FunnelDiagram } from "../../components/analytics/FunnelDiagram";
import { TrendChart } from "../../components/analytics/TrendChart";
import { BarChart } from "../../components/analytics/BarChart";
import { AttendanceTrendChart } from "../../components/analytics/AttendanceTrendChart";
import { AttendanceReportPrintModal } from "../../components/analytics/AttendanceReportPrintModal";
import { SkeletonCard } from "../../components/common/Skeleton";
import type { Company, GetMyCompaniesResponse } from "../../types/job";
import {
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
  Info,
  Download,
  Printer,
  CheckCircle2,
  ArrowRight,
  Percent,
  Timer,
  CalendarClock,
  Layers,
} from "lucide-react";

export default function EmployerAnalytics() {
  const toast = useToast();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"recruitment" | "attendance">("recruitment");
  const [from, setFrom] = useState<string>(thirtyDaysAgo);
  const [to, setTo] = useState<string>(todayStr);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Attendance-specific filters
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // 1. Fetch user's accessible companies
  const companiesQuery = useQuery<Company[]>({
    queryKey: ["myCompanies"],
    queryFn: async () => {
      const res = await api.get<GetMyCompaniesResponse>("/companies/my");
      return res.data.data.companies;
    },
    staleTime: 60 * 1000,
  });

  const companies = companiesQuery.data || [];
  const activeCompanyId = selectedCompanyId || companies[0]?.id;
  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  // 2. Fetch company-scoped overview analytics
  const analyticsQuery = useCompanyAnalytics(activeCompanyId, from, to);
  const { data, isLoading, isError, error, refetch } = analyticsQuery;

  // 3. Fetch departments for filtering
  const departmentsQuery = useQuery({
    queryKey: ["departments", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const res = await api.get(`/departments/company/${activeCompanyId}`);
      return res.data.data as { id: string; name: string }[];
    },
    enabled: Boolean(activeCompanyId) && activeTab === "attendance",
  });
  const departments = departmentsQuery.data || [];

  // 4. Fetch schedules for filtering
  const schedulesQuery = useCompanySchedules(
    activeCompanyId || "",
    undefined,
    Boolean(activeCompanyId) && activeTab === "attendance"
  );
  const schedules = schedulesQuery.data || [];

  // 5. Fetch Attendance Analytics
  const attendanceAnalyticsQuery = useCompanyAttendanceAnalytics(
    activeCompanyId,
    from,
    to,
    selectedDepartmentId || undefined,
    selectedScheduleId || undefined,
    selectedStatus || undefined,
    Boolean(activeCompanyId) && activeTab === "attendance"
  );
  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = attendanceAnalyticsQuery;

  const handleRangeChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  const handleExportCsv = async () => {
    if (!activeCompanyId) return;
    try {
      setIsExportingCsv(true);
      await exportCompanyAttendanceCsv(activeCompanyId, {
        from,
        to,
        departmentId: selectedDepartmentId || undefined,
        scheduleId: selectedScheduleId || undefined,
        status: selectedStatus || undefined,
      });
      toast.success("Attendance report CSV downloaded successfully.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to download attendance report CSV."));
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div style={{ maxWidth: "var(--max-width-page, 1200px)", margin: "0 auto", padding: "1.5rem" }}>
      {/* Top Header & Controls */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-text-main, #0f172a)",
                margin: 0,
              }}
            >
              Company Analytics
            </h1>
            {companies.length > 1 && (
              <select
                value={activeCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "var(--radius-md, 8px)",
                  border: "1px solid var(--color-border, rgba(16, 185, 129, 0.3))",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--color-text-main, #f8fafc)",
                  background: "#09120e",
                }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              color: "var(--color-text-muted, #64748b)",
              fontSize: "0.95rem",
            }}
          >
            Track recruitment funnel, workforce distributions, attendance compliance, and work schedule adherence.
          </p>
        </div>

        <DateRangeFilter from={from} to={to} onRangeChange={handleRangeChange} />
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--color-border, #e2e8f0)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("recruitment")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "recruitment" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "recruitment" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Layers size={18} /> Recruitment & Workforce Overview
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "attendance" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "attendance" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <CalendarClock size={18} /> Work Schedule & Attendance Intelligence
        </button>
      </div>

      {/* No Company Warning */}
      {!companiesQuery.isLoading && companies.length === 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#b45309",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg, 12px)",
            textAlign: "center",
          }}
        >
          <Building2 size={32} style={{ margin: "0 auto 0.5rem auto", display: "block" }} />
          <h3 style={{ margin: "0 0 0.5rem 0" }}>No Company Profile Found</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Please register or join a company to view recruitment and workforce analytics.
          </p>
        </div>
      )}

      {/* TAB 1: RECRUITMENT & WORKFORCE OVERVIEW */}
      {activeTab === "recruitment" && (
        <>
          {/* Error Banner */}
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
                <span>{(error as any)?.message || "Failed to load company analytics."}</span>
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

          {/* Headline Overview Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                {/* Active Headcount */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Active Headcount
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                      <Users size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.overview.headcount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    {data?.overview.departments || 0} depts • {data?.overview.positions || 0} positions
                  </div>
                </div>

                {/* Published Jobs */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Active Jobs
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                      <Briefcase size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.overview.jobsPublished || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    {data?.overview.jobsTotal || 0} total listings
                  </div>
                </div>

                {/* Applications in Period */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Applications
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                      <Briefcase size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.overview.applicationsTotal || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    {data?.overview.interviewsTotal || 0} interviews scheduled
                  </div>
                </div>

                {/* Confirmed Hires */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Confirmed Hires
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
                      <UserCheck size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.overview.hiresTotal || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    +{data?.overview.newHiresInPeriod || 0} in selected range
                  </div>
                </div>

                {/* Overall Conversion */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Conversion Rate
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                      <Percent size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.funnel.conversionRates.overallConversionRate !== null
                      ? `${data?.funnel.conversionRates.overallConversionRate}%`
                      : "0%"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    Applied to Hire ratio
                  </div>
                </div>

                {/* Pending Leave */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Pending Leave
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                      <Calendar size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {data?.overview.pendingLeaveRequests || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    Awaiting manager review
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recruitment Funnel Section */}
          <div style={{ marginBottom: "1.75rem" }}>
            {data?.funnel && <FunnelDiagram funnel={data.funnel} />}
          </div>

          {/* Middle Grid: Top Jobs & Workforce Breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Top Performing Jobs */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
                Top Active Job Postings
              </h3>
              {data?.topJobs && data.topJobs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {data.topJobs.map((job) => (
                    <div
                      key={job.id}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        background: "var(--color-bg-subtle, #f8fafc)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-main, #0f172a)" }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)", marginTop: "2px" }}>
                          {job.status} • {job.interviewCount} interviews
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2563eb" }}>
                          {job.applicationCount}
                        </span>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #64748b)" }}>applications</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "var(--color-text-muted, #94a3b8)", fontSize: "0.85rem", padding: "1rem 0" }}>
                  No jobs found in this period.
                </div>
              )}
            </div>

            {/* Workforce by Department */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <BarChart
                title="Workforce Distribution by Department"
                items={data?.workforce.byDepartment.map((d) => ({ label: d.name, count: d.count })) || []}
                emptyMessage="No departmental data recorded."
              />
            </div>
          </div>

          {/* Operations Row: Attendance Activity & Leave Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Attendance Activity Card */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
                  Attendance Activity
                </h3>
                <button
                  onClick={() => setActiveTab("attendance")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.8rem",
                    color: "#2563eb",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  View Full Schedule Intelligence <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)" }}>Completed Sessions</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main, #1e293b)" }}>
                    {data?.attendance.completedSessions || 0}
                  </div>
                </div>
                <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)" }}>Total Hours Completed</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#2563eb" }}>
                    {data?.attendance.totalHoursCompleted || 0}h
                  </div>
                </div>
                <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)" }}>Average Session Duration</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main, #1e293b)" }}>
                    {data?.attendance.avgSessionDurationHours !== null ? `${data?.attendance.avgSessionDurationHours}h` : "N/A"}
                  </div>
                </div>
                <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)" }}>Active Sessions Now</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#059669" }}>
                    {data?.attendance.activeSessionsNow || 0}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#64748b" }} />
                <span>
                  For schedule adherence, on-time rates, lateness analysis, and CSV/PDF reporting, switch to the{" "}
                  <strong style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => setActiveTab("attendance")}>
                    Work Schedule & Attendance Intelligence
                  </strong>{" "}
                  tab.
                </span>
              </div>
            </div>

            {/* Leave Summary */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
                  Leave Requests & Utilization
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                  Approved: <strong style={{ color: "#059669" }}>{data?.leave.approvedLeaveDays || 0} days</strong>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Pending</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b" }}>
                    {data?.leave.summary.pending || 0}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Approved</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981" }}>
                    {data?.leave.summary.approved || 0}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Rejected</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ef4444" }}>
                    {data?.leave.summary.rejected || 0}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Cancelled</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#64748b" }}>
                    {data?.leave.summary.cancelled || 0}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                  Leave by Type
                </div>
                {data?.leave.byType && data.leave.byType.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {data.leave.byType.map((t) => (
                      <div
                        key={t.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          color: "#334155",
                          borderBottom: "1px dashed #f1f5f9",
                          paddingBottom: "0.25rem",
                        }}
                      >
                        <span>{t.name}</span>
                        <span style={{ color: "#64748b" }}>
                          {t.count} requests ({t.approvedDays} approved days)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No leave requests recorded for this period.</div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Attendance Trend */}
          {data?.attendance.sessionsOverTime && (
            <TrendChart
              title="Daily Attendance Check-ins"
              data={data.attendance.sessionsOverTime}
              color="#06b6d4"
              emptyMessage="No attendance sessions recorded in selected date range."
            />
          )}
        </>
      )}

      {/* TAB 2: WORK SCHEDULE & ATTENDANCE INTELLIGENCE */}
      {activeTab === "attendance" && (
        <div>
          {/* Attendance Action & Filters Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              background: "var(--color-bg-card, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "var(--radius-lg, 12px)",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Filter controls */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              {/* Department Filter */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.25rem" }}>
                  Department
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border, rgba(16, 185, 129, 0.25))",
                    fontSize: "0.85rem",
                    background: "#09120e",
                    color: "var(--color-text-main, #f8fafc)",
                    minWidth: "150px",
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Schedule Filter */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.25rem" }}>
                  Work Schedule
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border, rgba(16, 185, 129, 0.25))",
                    fontSize: "0.85rem",
                    background: "#09120e",
                    color: "var(--color-text-main, #f8fafc)",
                    minWidth: "160px",
                  }}
                >
                  <option value="">All Work Schedules</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.25rem" }}>
                  Shift Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border, rgba(16, 185, 129, 0.25))",
                    fontSize: "0.85rem",
                    background: "#09120e",
                    color: "var(--color-text-main, #f8fafc)",
                    minWidth: "140px",
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed Shifts</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_TIME">On-Time Only</option>
                  <option value="LATE">Late Arrivals</option>
                  <option value="EARLY_DEPARTURE">Early Departures</option>
                </select>
              </div>
            </div>

            {/* Export & Print Report Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={handleExportCsv}
                disabled={isExportingCsv || !attendanceData}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  background: "rgba(16, 28, 20, 0.8)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isExportingCsv ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {isExportingCsv ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                Export CSV
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                disabled={!attendanceData}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: !attendanceData ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 3px rgba(37,99,235,0.2)",
                }}
              >
                <Printer size={15} />
                Print / PDF Report
              </button>
            </div>
          </div>

          {/* Attendance Error Banner */}
          {isAttendanceError && (
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
                <span>{(attendanceError as any)?.message || "Failed to load attendance analytics."}</span>
              </div>
              <button
                onClick={() => refetchAttendance()}
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

          {/* Attendance KPIs Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginBottom: "1.75rem",
            }}
          >
            {isAttendanceLoading ? (
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
                {/* Total Attendance Logs */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Total Attendance Logs
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                      <CalendarClock size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                    {attendanceData?.kpis.totalAttendance || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    {attendanceData?.kpis.completedShifts || 0} completed • {attendanceData?.kpis.inProgressShifts || 0} in progress
                  </div>
                </div>

                {/* On-Time Check-Ins */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      On-Time Check-Ins
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#15803d" }}>
                    {attendanceData?.kpis.onTimeCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 600 }}>
                    {attendanceData?.compliance.onTimeRate || 0}% punctuality rate
                  </div>
                </div>

                {/* Late Arrivals */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Late Arrivals
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                      <Timer size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#b45309" }}>
                    {attendanceData?.kpis.lateCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#b45309" }}>
                    {attendanceData?.compliance.lateRate || 0}% rate • Avg {attendanceData?.compliance.avgLateMinutes || 0} min late
                  </div>
                </div>

                {/* Early Departures */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Early Departures
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(244, 63, 94, 0.1)", color: "#e11d48" }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#be123c" }}>
                    {attendanceData?.kpis.earlyDepartureCount || 0}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#be123c" }}>
                    {attendanceData?.compliance.earlyDepartureRate || 0}% rate • Avg {attendanceData?.compliance.avgEarlyDepartureMinutes || 0} min early
                  </div>
                </div>

                {/* Average Worked Hours */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Avg Worked Hours
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4338ca" }}>
                    {attendanceData?.kpis.avgWorkedHours || 0}h
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                    Expected: {attendanceData?.kpis.avgExpectedHours || 0}h per shift
                  </div>
                </div>

                {/* Shift Completion Rate */}
                <div
                  style={{
                    background: "var(--color-bg-card, #ffffff)",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 12px)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
                      Avg Shift Completion
                    </span>
                    <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                      <Percent size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#047857" }}>
                    {attendanceData?.compliance.avgShiftCompletionPercentage || 0}%
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#065f46" }}>
                    Of total expected shift hours
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Attendance Trend Line/Area Chart */}
          <div style={{ marginBottom: "1.75rem" }}>
            <AttendanceTrendChart data={attendanceData?.trends || []} />
          </div>

          {/* Compliance Rate Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Punctuality Card */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Punctuality Compliance</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#15803d" }}>
                  {attendanceData?.compliance.onTimeRate || 0}%
                </span>
              </div>
              <div style={{ background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    background: "#10b981",
                    height: "100%",
                    width: `${Math.min(attendanceData?.compliance.onTimeRate || 0, 100)}%`,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {attendanceData?.kpis.onTimeCount || 0} on-time arrivals out of {attendanceData?.kpis.totalAttendance || 0} total records.
              </div>
            </div>

            {/* Lateness Breakdown Card */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Lateness Severity</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706" }}>
                  {attendanceData?.compliance.avgLateMinutes || 0} min
                </span>
              </div>
              <div style={{ background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    background: "#f59e0b",
                    height: "100%",
                    width: `${Math.min(attendanceData?.compliance.lateRate || 0, 100)}%`,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Late arrival rate: <strong>{attendanceData?.compliance.lateRate || 0}%</strong> ({attendanceData?.kpis.lateCount || 0} instances).
              </div>
            </div>

            {/* Early Departure Breakdown Card */}
            <div
              style={{
                background: "var(--color-bg-card, #ffffff)",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--color-border, #e2e8f0)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Early Departures</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e11d48" }}>
                  {attendanceData?.compliance.avgEarlyDepartureMinutes || 0} min
                </span>
              </div>
              <div style={{ background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    background: "#f43f5e",
                    height: "100%",
                    width: `${Math.min(attendanceData?.compliance.earlyDepartureRate || 0, 100)}%`,
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Early departure rate: <strong>{attendanceData?.compliance.earlyDepartureRate || 0}%</strong> ({attendanceData?.kpis.earlyDepartureCount || 0} instances).
              </div>
            </div>
          </div>

          {/* Department Schedule Adherence Table */}
          <div
            style={{
              background: "var(--color-bg-card, #ffffff)",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid var(--color-border, #e2e8f0)",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              marginBottom: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                Department Schedule Adherence
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {attendanceData?.departments.length || 0} active departments
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left", minWidth: "600px" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-subtle, #f8fafc)", borderBottom: "1px solid var(--color-border, #e2e8f0)" }}>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Department</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Attendance</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>On-Time Rate</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Late Arrivals</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Early Departures</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Avg Worked Hours</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Avg Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {!attendanceData?.departments || attendanceData.departments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                        No departmental attendance records found for this period.
                      </td>
                    </tr>
                  ) : (
                    attendanceData.departments.map((dept) => (
                      <tr key={dept.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{dept.name}</td>
                        <td style={{ padding: "10px 12px" }}>{dept.attendanceCount}</td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 600,
                            color: dept.onTimeRate >= 80 ? "#15803d" : dept.onTimeRate >= 60 ? "#d97706" : "#b91c1c",
                          }}
                        >
                          {dept.onTimeRate}%
                        </td>
                        <td style={{ padding: "10px 12px", color: dept.lateCount > 0 ? "#d97706" : "#64748b" }}>
                          {dept.lateCount}
                        </td>
                        <td style={{ padding: "10px 12px", color: dept.earlyDepartureCount > 0 ? "#e11d48" : "#64748b" }}>
                          {dept.earlyDepartureCount}
                        </td>
                        <td style={{ padding: "10px 12px" }}>{dept.avgWorkedHours}h</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>
                          {dept.avgCompletionPercentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Work Schedule-Level Analytics Table */}
          <div
            style={{
              background: "var(--color-bg-card, #ffffff)",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid var(--color-border, #e2e8f0)",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main, #0f172a)" }}>
                Work Schedule Adherence & Punctuality
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {attendanceData?.schedules.length || 0} active schedules
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left", minWidth: "650px" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-subtle, #f8fafc)", borderBottom: "1px solid var(--color-border, #e2e8f0)" }}>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Schedule</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Type</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Assigned Staff</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Logs</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>On-Time Rate</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Avg Late (min)</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>Avg Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {!attendanceData?.schedules || attendanceData.schedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                        No work schedule attendance records found for this period.
                      </td>
                    </tr>
                  ) : (
                    attendanceData.schedules.map((sch) => (
                      <tr key={sch.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{sch.name}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{sch.shiftType}</td>
                        <td style={{ padding: "10px 12px" }}>{sch.assignedEmployees}</td>
                        <td style={{ padding: "10px 12px" }}>{sch.attendanceCount}</td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 600,
                            color: sch.onTimeRate >= 80 ? "#15803d" : sch.onTimeRate >= 60 ? "#d97706" : "#b91c1c",
                          }}
                        >
                          {sch.onTimeRate}%
                        </td>
                        <td style={{ padding: "10px 12px", color: sch.avgLateMinutes > 0 ? "#d97706" : "#64748b" }}>
                          {sch.avgLateMinutes} min
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>
                          {sch.avgCompletionPercentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Report Modal */}
          {attendanceData && (
            <AttendanceReportPrintModal
              isOpen={isPrintModalOpen}
              onClose={() => setIsPrintModalOpen(false)}
              data={attendanceData}
              companyName={activeCompany?.name || attendanceData.company.name}
            />
          )}
        </div>
      )}
    </div>
  );
}
