import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Search,
  Filter,
  Users,
  AlertCircle,
  Loader2,
  Building2,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import api from "../../services/api";
import { useCompanyAttendance } from "../../hooks/useAttendance";
import AttendanceStatusBadge from "../../components/attendance/AttendanceStatusBadge";
import ShiftCompletionProgress from "../../components/attendance/ShiftCompletionProgress";

type Company = { id: string; name: string };

export default function CompanyAttendance() {
  const [companyId, setCompanyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [lateOnly, setLateOnly] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length === 1 && !companyId) {
      setCompanyId(companies[0].id);
    } else if (companies.length > 0 && !companyId) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  const queryParams = useMemo(() => {
    return {
      status: statusFilter === "ALL" ? undefined : statusFilter,
      isLate: lateOnly ? true : undefined,
    };
  }, [statusFilter, lateOnly]);

  const {
    data: attendanceRecords = [],
    isLoading,
    isError,
  } = useCompanyAttendance(companyId, queryParams);

  // Filter by employee name locally on current dataset
  const filteredRecords = useMemo(() => {
    if (!searchEmployee.trim()) return attendanceRecords;
    const term = searchEmployee.toLowerCase();
    return attendanceRecords.filter((rec) => {
      const user = rec.user;
      if (!user) return false;
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [attendanceRecords, searchEmployee]);

  // Aggregate statistics for header cards
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    if (total === 0) return { total: 0, onTime: 0, late: 0, avgCompletion: 0 };

    let onTimeCount = 0;
    let lateCount = 0;
    let totalCompletion = 0;
    let completionCount = 0;

    for (const rec of attendanceRecords) {
      if (rec.is_late) {
        lateCount++;
      } else if (rec.status === "ON_TIME" || (rec.check_in_time && !rec.is_late)) {
        onTimeCount++;
      }

      if (rec.completion_percentage !== undefined && rec.completion_percentage !== null) {
        totalCompletion += rec.completion_percentage;
        completionCount++;
      }
    }

    return {
      total,
      onTime: onTimeCount,
      late: lateCount,
      avgCompletion: completionCount > 0 ? Math.round(totalCompletion / completionCount) : 0
    };
  }, [attendanceRecords]);

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

  if (companiesQuery.isLoading) {
    return (
      <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem" }}>
        <Loader2 className="spinner" size={28} />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading attendance records...</p>
      </div>
    );
  }

  if (!companies.length) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Company Attendance</h1>
        <p className="dashboard-subtitle">Create or join a company before viewing workforce attendance.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}
      >
        <div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarClock size={28} style={{ color: "var(--primary)" }} />
            Attendance Intelligence
          </h1>
          <p className="dashboard-subtitle">
            Monitor real-time employee check-ins, schedule compliance, late minutes, and shift completion.
          </p>
        </div>

        {companies.length > 1 && (
          <select
            className="input-field"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            style={{ minWidth: "220px", height: "42px" }}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Metrics Banner */}
      {companyId && !isLoading && !isError && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius)",
                backgroundColor: "var(--primary-bg)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Logs</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{stats.total}</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius)",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>On-Time Checks</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success)" }}>
                {stats.onTime}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius)",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Late Arrivals</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--danger)" }}>
                {stats.late}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius)",
                backgroundColor: "var(--primary-bg)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Avg Completion</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{stats.avgCompletion}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)"
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search employee by name or email..."
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            style={{ paddingLeft: "2.5rem", width: "100%", height: "40px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: "40px", minWidth: "170px" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_TIME">On Time</option>
              <option value="LATE">Late</option>
              <option value="EARLY_DEPARTURE">Early Departure</option>
              <option value="LATE_AND_EARLY_DEPARTURE">Late + Early</option>
            </select>
          </div>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <input
              type="checkbox"
              checked={lateOnly}
              onChange={(e) => setLateOnly(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--danger)" }}
            />
            Late arrivals only
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      {!companyId ? (
        <div className="empty-state">
          <Building2 size={36} />
          <h3>Select a company</h3>
          <p>Choose a company to view workforce attendance logs.</p>
        </div>
      ) : isLoading ? (
        <div className="empty-state">
          <Loader2 className="spinner" size={32} />
          <p>Loading attendance records...</p>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <AlertCircle size={36} style={{ color: "var(--danger)" }} />
          <h3>Unable to load attendance</h3>
          <p>You may not have permission to view attendance records for this company.</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <Clock size={44} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
          <h3>No attendance records found</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto" }}>
            {searchEmployee || statusFilter !== "ALL" || lateOnly
              ? "No records match your selected filter criteria. Try adjusting your search."
              : "Attendance entries will appear here once employees check in."}
          </p>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Work Schedule</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours (Worked / Exp)</th>
                <th style={{ minWidth: "150px" }}>Completion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const user = record.user;
                const schedule = record.schedule;
                const lateMins = record.late_minutes ?? 0;
                const earlyMins = record.early_departure_minutes ?? 0;

                return (
                  <tr key={record.id}>
                    {/* Employee */}
                    <td>
                      <strong>
                        {user ? `${user.first_name} ${user.last_name}` : "Unknown Employee"}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {user?.email || "—"}
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                        {formatDate(record.check_in_time || record.created_at)}
                      </span>
                    </td>

                    {/* Work Schedule */}
                    <td>
                      {schedule ? (
                        <div>
                          <strong style={{ fontSize: "0.875rem" }}>{schedule.name}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                          No schedule
                        </span>
                      )}
                    </td>

                    {/* Check-in */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {formatTime(record.check_in_time)}
                      </div>
                      {record.is_late && lateMins > 0 ? (
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
                          <AlertTriangle size={12} />
                          {lateMins}m late
                        </div>
                      ) : record.check_in_time && schedule ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--success)" }}>On time</div>
                      ) : null}
                    </td>

                    {/* Check-out */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {formatTime(record.check_out_time)}
                      </div>
                      {record.is_early_departure && earlyMins > 0 ? (
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
                          <AlertTriangle size={12} />
                          {earlyMins}m early
                        </div>
                      ) : null}
                    </td>

                    {/* Hours */}
                    <td>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {record.actual_hours !== null && record.actual_hours !== undefined
                          ? `${Number(record.actual_hours).toFixed(1)}h`
                          : "—"}
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
                          {" "}
                          / {schedule?.expected_hours ? `${schedule.expected_hours}h` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Completion */}
                    <td>
                      <ShiftCompletionProgress
                        percentage={record.completion_percentage}
                        showLabel={true}
                        size="md"
                      />
                    </td>

                    {/* Status Badge */}
                    <td>
                      <AttendanceStatusBadge status={record.status} />
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
