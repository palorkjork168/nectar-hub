import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyAttendance, useMyCorrections } from "../../hooks/useAttendance";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  AlertCircle,
  Calendar,
  Clock,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  XCircle,
  FileEdit,
  Building2,
  Sparkles,
} from "lucide-react";
import AttendanceStatusBadge from "../../components/attendance/AttendanceStatusBadge";
import ShiftCompletionProgress from "../../components/attendance/ShiftCompletionProgress";
import SubmitCorrectionModal from "../../components/attendance/SubmitCorrectionModal";
import EmptyState from "../../components/common/EmptyState";
import type { Attendance, AttendanceCorrectionRequest } from "../../types/attendance";

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"history" | "corrections">("history");
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  const { data: attendances, isLoading: isAttLoading, isError: isAttError, refetch: refetchAtt } = useMyAttendance();
  const { data: corrections = [], isLoading: isCorrLoading, refetch: refetchCorr } = useMyCorrections();

  // Primary company id derived from first attendance record or first correction
  const primaryCompanyId = useMemo(() => {
    if (attendances && attendances.length > 0 && attendances[0].company_id) {
      return attendances[0].company_id;
    }
    if (corrections && corrections.length > 0 && corrections[0].company_id) {
      return corrections[0].company_id;
    }
    return "";
  }, [attendances, corrections]);

  const pendingCorrectionsCount = useMemo(() => {
    return corrections.filter((c) => c.status === "PENDING").length;
  }, [corrections]);

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDuration = (startString: string | null, endString: string | null, actualHours?: number | string | null) => {
    if (actualHours !== undefined && actualHours !== null) {
      const h = Math.floor(Number(actualHours));
      const m = Math.round((Number(actualHours) - h) * 60);
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    }
    if (!startString || !endString) return "—";
    const start = new Date(startString).getTime();
    const end = new Date(endString).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const sortedAttendances = useMemo(() => {
    if (!attendances) return [];
    return [...attendances].sort((a, b) => {
      const timeA = new Date(a.check_in_time || a.created_at || 0).getTime();
      const timeB = new Date(b.check_in_time || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [attendances]);

  const handleOpenCorrection = (att?: Attendance | null) => {
    setSelectedAttendance(att || null);
    setIsCorrectionModalOpen(true);
  };

  const formatCorrectionType = (type: string) => {
    switch (type) {
      case "MISSING_CHECK_OUT":
        return "Missing Check-out";
      case "MISSING_CHECK_IN":
        return "Missing Check-in";
      case "INCORRECT_TIMES":
        return "Incorrect Times";
      case "MISSED_SHIFT":
        return "Missed Shift (Both)";
      default:
        return type;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="breadcrumb" style={{ cursor: "pointer" }} onClick={() => navigate("/employee/dashboard")}>
        <ChevronLeft size={16} style={{ marginLeft: "-4px" }} /> Back to Dashboard
      </div>

      <header className="dashboard-header" style={{ alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="dashboard-title">Attendance & Punch Management</h1>
          <p className="dashboard-subtitle">Review your past check-ins, scheduled hours, and track punch correction requests.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleOpenCorrection(null)}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
          >
            <PlusCircle size={16} />
            <span>Request Correction</span>
          </button>
          <button onClick={() => navigate("/employee/leave")} className="btn btn-secondary">
            <Calendar size={16} /> My Leave
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "history" ? "2px solid var(--color-primary)" : "2px solid transparent",
            color: activeTab === "history" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: activeTab === "history" ? 600 : 500,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Clock size={16} />
          <span>Attendance Logs</span>
          <span
            style={{
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: activeTab === "history" ? "var(--color-primary-soft)" : "var(--color-bg-secondary)",
              fontSize: "0.75rem",
            }}
          >
            {sortedAttendances.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("corrections")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "corrections" ? "2px solid var(--color-primary)" : "2px solid transparent",
            color: activeTab === "corrections" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: activeTab === "corrections" ? 600 : 500,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FileEdit size={16} />
          <span>Correction Requests</span>
          {pendingCorrectionsCount > 0 ? (
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                color: "var(--color-warning-text, #f59e0b)",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {pendingCorrectionsCount} pending
            </span>
          ) : (
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--color-bg-secondary)",
                fontSize: "0.75rem",
              }}
            >
              {corrections.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Attendance History */}
      {activeTab === "history" && (
        <>
          {isAttLoading ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Company</th>
                    <th>Work Schedule</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Worked / Expected</th>
                    <th>Completion</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ height: "20px", width: "90px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "100px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "70px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "70px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px" }} /></td>
                      <td><div className="skeleton" style={{ height: "20px", width: "80px" }} /></td>
                      <td><div className="skeleton" style={{ height: "24px", width: "80px", borderRadius: "12px" }} /></td>
                      <td><div className="skeleton" style={{ height: "24px", width: "60px" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isAttError ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Unable to load history</h3>
              <p style={{ color: "var(--color-text-muted)", margin: "0 0 1.5rem 0" }}>We couldn't retrieve your attendance information.</p>
              <button onClick={() => refetchAtt()} className="btn btn-secondary">Try Again</button>
            </div>
          ) : sortedAttendances.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CalendarIcon size={32} />
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>No attendance records yet</h3>
              <p style={{ color: "var(--color-text-muted)", margin: "0" }}>
                Your attendance history will appear here after you check in.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Company</th>
                    <th>Schedule</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Worked / Exp</th>
                    <th style={{ minWidth: "130px" }}>Completion</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttendances.map((att) => {
                    const schedule = att.schedule;
                    const lateMins = att.late_minutes ?? 0;
                    const earlyMins = att.early_departure_minutes ?? 0;
                    const isUnclosed = !att.check_out_time;

                    return (
                      <tr key={att.id} style={{ backgroundColor: isUnclosed ? "rgba(245, 158, 11, 0.04)" : undefined }}>
                        {/* Date */}
                        <td style={{ fontWeight: 500 }}>
                          <div>{formatDate(att.check_in_time || att.created_at)}</div>
                          {att.is_corrected && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                color: "var(--color-primary-text)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                            >
                              <Sparkles size={11} /> Corrected
                            </span>
                          )}
                        </td>

                        {/* Company */}
                        <td>{att.company?.name || "Company"}</td>

                        {/* Schedule */}
                        <td>
                          {schedule ? (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, fontSize: "0.875rem" }}>
                                <Clock size={13} style={{ color: "var(--color-primary-text)" }} />
                                {schedule.name}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Open schedule</span>
                          )}
                        </td>

                        {/* Check In */}
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {formatTime(att.check_in_time)}
                          </div>
                          {att.is_late && lateMins > 0 ? (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-danger, #ef4444)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                fontWeight: 500,
                              }}
                            >
                              <AlertTriangle size={11} />
                              {lateMins}m late
                            </div>
                          ) : att.check_in_time && schedule ? (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-success-text, var(--color-primary-text))" }}>On time</div>
                          ) : null}
                        </td>

                        {/* Check Out */}
                        <td>
                          {isUnclosed ? (
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-warning-text, #f59e0b)",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <AlertTriangle size={12} />
                              Missing Punch
                            </span>
                          ) : (
                            <>
                              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                {formatTime(att.check_out_time)}
                              </div>
                              {att.is_early_departure && earlyMins > 0 ? (
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-warning-text, #f59e0b)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.2rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  <AlertTriangle size={11} />
                                  {earlyMins}m early
                                </div>
                              ) : null}
                            </>
                          )}
                        </td>

                        {/* Duration */}
                        <td>
                          <div style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600 }}>
                            {getDuration(att.check_in_time, att.check_out_time, att.actual_hours)}
                          </div>
                          {schedule?.expected_hours && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              Exp: {schedule.expected_hours}h
                            </div>
                          )}
                        </td>

                        {/* Completion */}
                        <td>
                          <ShiftCompletionProgress
                            percentage={att.completion_percentage}
                            showLabel={true}
                            size="sm"
                          />
                        </td>

                        {/* Status */}
                        <td>
                          <AttendanceStatusBadge status={att.status} />
                        </td>

                        {/* Action */}
                        <td>
                          {isUnclosed ? (
                            <button
                              onClick={() => handleOpenCorrection(att)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                color: "var(--color-warning-text, #f59e0b)",
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.6rem",
                              }}
                            >
                              Fix Punch
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenCorrection(att)}
                              className="btn btn-sm btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              title="Request correction for this shift"
                            >
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Correction Requests */}
      {activeTab === "corrections" && (
        <>
          {isCorrLoading ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div className="skeleton" style={{ height: "120px", width: "100%", borderRadius: "var(--radius-lg)" }} />
            </div>
          ) : corrections.length === 0 ? (
            <EmptyState
              icon={FileEdit}
              title="No correction requests submitted"
              description="If you forgot to clock in or clock out for a shift, you can submit a correction request for manager approval."
              action={{ label: "Submit Request", onClick: () => handleOpenCorrection(null) }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {corrections.map((corr) => {
                const isPending = corr.status === "PENDING";
                const isApproved = corr.status === "APPROVED";
                const isRejected = corr.status === "REJECTED";

                return (
                  <div
                    key={corr.id}
                    className="card"
                    style={{
                      padding: "1.25rem 1.5rem",
                      borderLeft: isPending
                        ? "4px solid var(--color-warning, #f59e0b)"
                        : isApproved
                        ? "4px solid var(--color-success, #ffe17c)"
                        : "4px solid var(--color-danger, #ef4444)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)" }}>
                            {formatCorrectionType(corr.correction_type)}
                          </span>
                          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                            • Submitted {formatDate(corr.created_at)}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Building2 size={13} />
                          <span>{corr.company?.name || "Company"}</span>
                          {corr.workSchedule && <span>• {corr.workSchedule.name}</span>}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isPending && (
                          <span
                            className="badge badge-warning"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                            Under Review
                          </span>
                        )}
                        {isApproved && (
                          <span
                            className="badge badge-success"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <CheckCircle2 size={13} />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span
                            className="badge badge-danger"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <XCircle size={13} />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp Comparison */}
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.875rem 1rem",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-bg-secondary)",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Requested Punch Times</div>
                        <div style={{ fontWeight: 600 }}>
                          Check-in: {corr.requested_check_in_time ? formatTime(corr.requested_check_in_time) : "Unchanged"}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          Check-out: {corr.requested_check_out_time ? formatTime(corr.requested_check_out_time) : "Unchanged"}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Original Recorded Times</div>
                        <div>Check-in: {formatTime(corr.original_check_in_time)}</div>
                        <div>Check-out: {formatTime(corr.original_check_out_time)}</div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div style={{ marginTop: "0.875rem", fontSize: "0.875rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Reason: </span>
                      <span style={{ color: "var(--color-text-secondary)" }}>{corr.reason}</span>
                    </div>

                    {/* Reviewer Feedback Note */}
                    {corr.review_note && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          padding: "0.625rem 0.875rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isApproved ? "rgba(255, 225, 124, 0.08)" : "rgba(239, 68, 68, 0.08)",
                          border: `1px solid ${isApproved ? "rgba(255, 225, 124, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                          fontSize: "0.8125rem",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Reviewer Decision Note: </span>
                        <span>{corr.review_note}</span>
                        {corr.reviewed_at && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                            Decided on {formatDate(corr.reviewed_at)} by {corr.reviewer ? `${corr.reviewer.first_name} ${corr.reviewer.last_name}` : "HR Reviewer"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal for Submission */}
      <SubmitCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedAttendance(null);
        }}
        attendance={selectedAttendance}
        companyId={selectedAttendance?.company_id || primaryCompanyId}
      />
    </div>
  );
}
