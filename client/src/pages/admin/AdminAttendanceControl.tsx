import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Building2,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import api from "../../services/api";
import { useAllCorrections, useAllAttendance } from "../../hooks/useAttendance";
import CorrectionDetailModal from "../../components/attendance/CorrectionDetailModal";
import BatchApprovalModal from "../../components/attendance/BatchApprovalModal";
import EmptyState from "../../components/common/EmptyState";
import type { AttendanceCorrectionRequest, CorrectionType, CorrectionStatus } from "../../types/attendance";

type Company = { id: string; name: string };

export default function AdminAttendanceControl() {
  const [activeTab, setActiveTab] = useState<"corrections" | "missing-punches">("corrections");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<CorrectionStatus | "ALL">("PENDING");
  const [typeFilter, setTypeFilter] = useState<CorrectionType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrectionRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // 1. Fetch all companies for platform filter
  const companiesQuery = useQuery({
    queryKey: ["admin", "companies", "all"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  // 2. Fetch all global corrections
  const {
    data: allCorrections = [],
    isLoading: isCorrectionsLoading,
    isError: isCorrectionsError,
    refetch: refetchCorrections,
  } = useAllCorrections(
    companyFilter !== "ALL" ? { companyId: companyFilter } : undefined
  );

  // 3. Fetch all global unclosed shifts
  const {
    data: unclosedAttendances = [],
    isLoading: isUnclosedLoading,
    refetch: refetchUnclosed,
  } = useAllAttendance({
    missingCheckout: true,
    companyId: companyFilter !== "ALL" ? companyFilter : undefined,
  });

  // Metrics across platform
  const metrics = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const c of allCorrections) {
      if (c.status === "PENDING") pending++;
      else if (c.status === "APPROVED") approved++;
      else if (c.status === "REJECTED") rejected++;
    }
    return {
      total: allCorrections.length,
      pending,
      approved,
      rejected,
      unclosedShifts: unclosedAttendances.length,
    };
  }, [allCorrections, unclosedAttendances]);

  // Filtered dataset
  const filteredCorrections = useMemo(() => {
    return allCorrections.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && c.correction_type !== typeFilter) return false;
      if (companyFilter !== "ALL" && c.company_id !== companyFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const userName = c.user ? `${c.user.first_name} ${c.user.last_name}`.toLowerCase() : "";
        const email = (c.user?.email || "").toLowerCase();
        const companyName = (c.company?.name || "").toLowerCase();
        const reason = (c.reason || "").toLowerCase();

        if (
          !userName.includes(query) &&
          !email.includes(query) &&
          !companyName.includes(query) &&
          !reason.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allCorrections, statusFilter, typeFilter, companyFilter, searchQuery]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredCorrections.length / pageSize) || 1;
  const paginatedCorrections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCorrections.slice(start, start + pageSize);
  }, [filteredCorrections, currentPage, pageSize]);

  // Batch Selection
  const eligiblePendingOnPage = useMemo(() => {
    return paginatedCorrections.filter((c) => c.status === "PENDING");
  }, [paginatedCorrections]);

  const allEligibleSelected =
    eligiblePendingOnPage.length > 0 &&
    eligiblePendingOnPage.every((c) => selectedIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (allEligibleSelected) {
      const pageIds = new Set(eligiblePendingOnPage.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...eligiblePendingOnPage.map((c) => c.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedCorrectionsObjects = useMemo(() => {
    return allCorrections.filter((c) => selectedIds.includes(c.id) && c.status === "PENDING");
  }, [allCorrections, selectedIds]);

  const handleOpenDetail = (corr: AttendanceCorrectionRequest) => {
    setSelectedCorrection(corr);
    setIsDetailModalOpen(true);
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Block */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              className="badge"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Platform Oversight
            </span>
          </div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldCheck size={28} style={{ color: "#a78bfa" }} />
            Global Attendance Control Center
          </h1>
          <p className="dashboard-subtitle">
            Cross-tenant attendance governance: inspect punch correction requests, monitor compliance metrics, and adjudicate requests across all companies.
          </p>
        </div>

        {/* Company Filter Dropdown */}
        <div style={{ minWidth: "220px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "0.35rem",
            }}
          >
            Company Context
          </label>
          <select
            className="form-select input-field"
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setSelectedIds([]);
              setCurrentPage(1);
            }}
            style={{ width: "100%", height: "40px" }}
          >
            <option value="ALL">All Companies (Platform Wide)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="nectar-stat-grid" style={{ marginBottom: "2rem" }}>
        <div
          className="nectar-stat-card"
          onClick={() => {
            setActiveTab("corrections");
            setStatusFilter("PENDING");
            setCurrentPage(1);
          }}
          style={{
            cursor: "pointer",
            border: statusFilter === "PENDING" && activeTab === "corrections" ? "2px solid #f59e0b" : undefined,
          }}
        >
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Pending Across Platform</span>
            <div
              className="nectar-stat-icon-wrap"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)" }}
            >
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="nectar-stat-val" style={{ color: metrics.pending > 0 ? "#f59e0b" : "var(--color-text)" }}>
            {metrics.pending}
          </div>
          <div className="nectar-stat-meta" style={{ color: "#f59e0b" }}>
            <span>Unreviewed employee punch requests</span>
          </div>
        </div>

        <div
          className="nectar-stat-card"
          onClick={() => {
            setActiveTab("corrections");
            setStatusFilter("APPROVED");
            setCurrentPage(1);
          }}
          style={{
            cursor: "pointer",
            border: statusFilter === "APPROVED" && activeTab === "corrections" ? "2px solid #ffe17c" : undefined,
          }}
        >
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Total Approved</span>
            <div
              className="nectar-stat-icon-wrap"
              style={{ backgroundColor: "rgba(255, 225, 124, 0.1)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.2)" }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">{metrics.approved}</div>
          <div className="nectar-stat-meta" style={{ color: "var(--color-primary-text)" }}>
            <span>Audited & safely updated</span>
          </div>
        </div>

        <div
          className="nectar-stat-card"
          onClick={() => {
            setActiveTab("corrections");
            setStatusFilter("REJECTED");
            setCurrentPage(1);
          }}
          style={{
            cursor: "pointer",
            border: statusFilter === "REJECTED" && activeTab === "corrections" ? "2px solid #ef4444" : undefined,
          }}
        >
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Total Rejected</span>
            <div
              className="nectar-stat-icon-wrap"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}
            >
              <XCircle size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">{metrics.rejected}</div>
          <div className="nectar-stat-meta" style={{ color: "#ef4444" }}>
            <span>Disallowed with review notes</span>
          </div>
        </div>

        <div
          className="nectar-stat-card"
          onClick={() => setActiveTab("missing-punches")}
          style={{
            cursor: "pointer",
            border: activeTab === "missing-punches" ? "2px solid #3b82f6" : undefined,
          }}
        >
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Platform Unclosed Shifts</span>
            <div
              className="nectar-stat-icon-wrap"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.2)" }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">{metrics.unclosedShifts}</div>
          <div className="nectar-stat-meta" style={{ color: "#3b82f6" }}>
            <span>Active check-ins with missing check-out</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("corrections")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "corrections" ? "2px solid #a78bfa" : "2px solid transparent",
            color: activeTab === "corrections" ? "#a78bfa" : "var(--color-text-muted)",
            fontWeight: activeTab === "corrections" ? 600 : 500,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Clock size={16} />
          <span>Global Correction Requests</span>
          <span
            style={{
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: activeTab === "corrections" ? "rgba(139, 92, 246, 0.15)" : "var(--color-surface)",
              fontSize: "0.75rem",
            }}
          >
            {allCorrections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("missing-punches")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "missing-punches" ? "2px solid #a78bfa" : "2px solid transparent",
            color: activeTab === "missing-punches" ? "#a78bfa" : "var(--color-text-muted)",
            fontWeight: activeTab === "missing-punches" ? 600 : 500,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <ShieldAlert size={16} />
          <span>Missing Punches & Open Shifts</span>
          {metrics.unclosedShifts > 0 && (
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                color: "#f59e0b",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {metrics.unclosedShifts}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: Corrections List */}
      {activeTab === "corrections" && (
        <>
          {/* Toolbar */}
          <div
            className="card"
            style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search company, employee, reason..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: "36px", width: "100%", height: "40px" }}
                />
              </div>

              <div>
                <select
                  className="form-select input-field"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", height: "40px" }}
                >
                  <option value="PENDING">Pending Review (Action Required)</option>
                  <option value="APPROVED">Approved Requests</option>
                  <option value="REJECTED">Rejected Requests</option>
                  <option value="ALL">All Statuses</option>
                </select>
              </div>

              <div>
                <select
                  className="form-select input-field"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", height: "40px" }}
                >
                  <option value="ALL">All Correction Types</option>
                  <option value="MISSING_CHECK_OUT">Missing Check-Out</option>
                  <option value="MISSING_CHECK_IN">Missing Check-In</option>
                  <option value="INCORRECT_TIMES">Incorrect Recorded Times</option>
                  <option value="MISSED_SHIFT">Missed Shift (Both)</option>
                </select>
              </div>

              {(statusFilter !== "PENDING" || typeFilter !== "ALL" || companyFilter !== "ALL" || searchQuery) && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("PENDING");
                      setTypeFilter("ALL");
                      setCompanyFilter("ALL");
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ height: "40px", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset Filters</span>
                  </button>
                </div>
              )}
            </div>

            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(139, 92, 246, 0.12)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCheck size={18} style={{ color: "#a78bfa" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                    {selectedIds.length} request{selectedIds.length === 1 ? "" : "s"} selected across companies
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="btn btn-sm btn-secondary"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(true)}
                    className="btn btn-sm btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#8b5cf6",
                      borderColor: "#8b5cf6",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve Selected ({selectedIds.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {isCorrectionsLoading ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }} />
                    <th>Company</th>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Shift Date</th>
                    <th>Adjustment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ height: "18px", width: "18px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "100px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "120px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "100px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "90px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "140px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px", borderRadius: "12px" }} /></td>
                      <td><div className="skeleton" style={{ height: "28px", width: "60px" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isCorrectionsError ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: "var(--color-danger)" }}>
                <AlertCircle size={32} />
              </div>
              <h3>Failed to load platform corrections</h3>
              <button onClick={() => refetchCorrections()} className="btn btn-secondary">
                Retry
              </button>
            </div>
          ) : filteredCorrections.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No correction requests match filters"
              description="Adjust company or status filters to view records across the platform."
            />
          ) : (
            <div className="table-container" style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={allEligibleSelected}
                        onChange={handleToggleSelectAll}
                        disabled={eligiblePendingOnPage.length === 0}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th>Company</th>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Shift Date</th>
                    <th>Requested vs Recorded</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCorrections.map((corr) => {
                    const isPending = corr.status === "PENDING";
                    const isSelected = selectedIds.includes(corr.id);
                    const empName = corr.user ? `${corr.user.first_name} ${corr.user.last_name}` : "Employee";

                    return (
                      <tr
                        key={corr.id}
                        style={{
                          backgroundColor: isSelected ? "rgba(139, 92, 246, 0.05)" : undefined,
                        }}
                      >
                        <td style={{ textAlign: "center" }}>
                          {isPending ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(corr.id)}
                              style={{ cursor: "pointer" }}
                            />
                          ) : (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>—</span>
                          )}
                        </td>

                        {/* Company */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
                            <Building2 size={13} style={{ color: "#a78bfa" }} />
                            <span>{corr.company?.name || "Company"}</span>
                          </div>
                        </td>

                        {/* Employee */}
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{empName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{corr.user?.email}</div>
                        </td>

                        {/* Type */}
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {corr.correction_type}
                          </span>
                        </td>

                        {/* Shift Date */}
                        <td>
                          <div style={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                            {formatDate(corr.attendance?.check_in_time || corr.created_at)}
                          </div>
                          {corr.workSchedule && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {corr.workSchedule.name}
                            </div>
                          )}
                        </td>

                        {/* Adjustment */}
                        <td>
                          <div style={{ fontSize: "0.8125rem" }}>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Orig: In {formatTime(corr.original_check_in_time || corr.attendance?.check_in_time)} • Out{" "}
                              {formatTime(corr.original_check_out_time || corr.attendance?.check_out_time)}
                            </div>
                            <div style={{ fontWeight: 600, color: "var(--color-text)", marginTop: "0.15rem" }}>
                              Req: In {formatTime(corr.requested_check_in_time) || "Keep"} • Out{" "}
                              {formatTime(corr.requested_check_out_time) || "Keep"}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          {isPending && <span className="badge badge-warning">Pending</span>}
                          {corr.status === "APPROVED" && (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} style={{ marginRight: "0.2rem" }} /> Approved
                            </span>
                          )}
                          {corr.status === "REJECTED" && (
                            <span className="badge badge-danger">
                              <XCircle size={12} style={{ marginRight: "0.2rem" }} /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(corr)}
                            className="btn btn-sm btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              padding: "0.3rem 0.65rem",
                            }}
                          >
                            <Eye size={13} />
                            <span>{isPending ? "Adjudicate" : "View"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredCorrections.length > pageSize && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.25rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredCorrections.length)} of {filteredCorrections.length} requests
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-secondary"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ padding: "0.3rem 0.75rem", fontWeight: 600, color: "var(--color-text)" }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm btn-secondary"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Global Unclosed Shifts */}
      {activeTab === "missing-punches" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {isUnclosedLoading ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Employee</th>
                    <th>Check In Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ height: "20px", width: "100px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "120px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px", borderRadius: "12px" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : unclosedAttendances.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Zero unclosed shifts platform-wide"
              description="No active unclosed shifts found across all monitored companies."
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Employee</th>
                    <th>Shift Date</th>
                    <th>Check In Time</th>
                    <th>Elapsed Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unclosedAttendances.map((att) => {
                    const inDate = new Date(att.check_in_time);
                    const now = new Date();
                    const elapsedHours = ((now.getTime() - inDate.getTime()) / (1000 * 60 * 60)).toFixed(1);
                    const isStale = Number(elapsedHours) > 12;

                    return (
                      <tr key={att.id} style={{ backgroundColor: isStale ? "rgba(245, 158, 11, 0.05)" : undefined }}>
                        <td style={{ fontWeight: 600 }}>{att.company?.name || "Company"}</td>
                        <td>
                          {att.user ? `${att.user.first_name} ${att.user.last_name}` : "Employee"}
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{att.user?.email}</div>
                        </td>
                        <td>{formatDate(att.check_in_time)}</td>
                        <td style={{ fontWeight: 600 }}>{formatTime(att.check_in_time)}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {elapsedHours} hrs {isStale && <span style={{ color: "#f59e0b" }}>(Stale)</span>}
                        </td>
                        <td>
                          <span className="badge badge-warning">IN_PROGRESS</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Detail Modal */}
      <CorrectionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCorrection(null);
        }}
        correction={selectedCorrection}
        onSuccess={() => {
          refetchCorrections();
          refetchUnclosed();
          setSelectedIds((prev) => prev.filter((id) => id !== selectedCorrection?.id));
        }}
      />

      {/* Batch Approval Modal */}
      <BatchApprovalModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        selectedCorrections={selectedCorrectionsObjects}
        onSuccess={() => {
          refetchCorrections();
          refetchUnclosed();
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
