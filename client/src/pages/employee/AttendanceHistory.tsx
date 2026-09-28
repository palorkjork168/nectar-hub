import { useNavigate } from "react-router-dom";
import { useMyAttendance } from "../../hooks/useAttendance";
import { ChevronLeft, Calendar as CalendarIcon, AlertCircle, Calendar, Clock, AlertTriangle } from "lucide-react";
import AttendanceStatusBadge from "../../components/attendance/AttendanceStatusBadge";
import ShiftCompletionProgress from "../../components/attendance/ShiftCompletionProgress";

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const { data: attendances, isLoading, isError, refetch } = useMyAttendance();

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
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

  const sortedAttendances = attendances ? [...attendances].sort((a, b) => {
    const timeA = new Date(a.check_in_time || a.created_at || 0).getTime();
    const timeB = new Date(b.check_in_time || b.created_at || 0).getTime();
    return timeB - timeA;
  }) : [];

  return (
    <div className="dashboard-container">
      <div className="breadcrumb" style={{ cursor: "pointer" }} onClick={() => navigate("/employee/dashboard")}>
        <ChevronLeft size={16} style={{ marginLeft: "-4px" }} /> Back to Dashboard
      </div>

      <header className="dashboard-header" style={{ alignItems: "center" }}>
        <div>
          <h1 className="dashboard-title">Attendance History</h1>
          <p className="dashboard-subtitle">Review your past check-ins, scheduled hours, lateness, and shift completion.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => navigate("/employee/leave")} className="btn btn-secondary">
            <Calendar size={16} /> My Leave
          </button>
        </div>
      </header>

      {isLoading ? (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Unable to load history</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>We couldn't retrieve your attendance information.</p>
          <button onClick={() => refetch()} className="btn btn-secondary">Try Again</button>
        </div>
      ) : sortedAttendances.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CalendarIcon size={32} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>No attendance records yet</h3>
          <p style={{ color: "var(--text-muted)", margin: "0" }}>
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
                <th style={{ minWidth: "140px" }}>Completion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttendances.map((att) => {
                const schedule = att.schedule;
                const lateMins = att.late_minutes ?? 0;
                const earlyMins = att.early_departure_minutes ?? 0;

                return (
                  <tr key={att.id}>
                    {/* Date */}
                    <td style={{ fontWeight: 500 }}>
                      {formatDate(att.check_in_time || att.created_at)}
                    </td>

                    {/* Company */}
                    <td>{att.company?.name || "Standard Company"}</td>

                    {/* Schedule */}
                    <td>
                      {schedule ? (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, fontSize: "0.875rem" }}>
                            <Clock size={13} style={{ color: "var(--primary)" }} />
                            {schedule.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Open schedule</span>
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
                            color: "var(--danger)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontWeight: 500
                          }}
                        >
                          <AlertTriangle size={11} />
                          {lateMins}m late
                        </div>
                      ) : att.check_in_time && schedule ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--success)" }}>On time</div>
                      ) : null}
                    </td>

                    {/* Check Out */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {formatTime(att.check_out_time)}
                      </div>
                      {att.is_early_departure && earlyMins > 0 ? (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--warning)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontWeight: 500
                          }}
                        >
                          <AlertTriangle size={11} />
                          {earlyMins}m early
                        </div>
                      ) : null}
                    </td>

                    {/* Duration / Worked vs Expected */}
                    <td>
                      <div style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600 }}>
                        {getDuration(att.check_in_time, att.check_out_time, att.actual_hours)}
                      </div>
                      {schedule?.expected_hours && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Exp: {schedule.expected_hours}h
                        </div>
                      )}
                    </td>

                    {/* Completion Progress */}
                    <td>
                      <ShiftCompletionProgress
                        percentage={att.completion_percentage}
                        showLabel={true}
                        size="sm"
                      />
                    </td>

                    {/* Status Badge */}
                    <td>
                      <AttendanceStatusBadge status={att.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
