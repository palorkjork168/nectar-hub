import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMyAttendance, useCheckIn, useCheckOut } from "../../hooks/useAttendance";
import { usePersonalAnalytics } from "../../hooks/useAnalytics";
import {
  LogOut,
  MapPin,
  Clock,
  Calendar,
  Briefcase,
  Loader2,
  AlertCircle,
  History,
  Timer,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import CheckOutDialog from "../../components/employee/CheckOutDialog";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import NotificationBell from "../../components/notifications/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { useMySchedule } from "../../hooks/useWorkSchedules";
import AttendanceStatusBadge from "../../components/attendance/AttendanceStatusBadge";
import ShiftCompletionProgress from "../../components/attendance/ShiftCompletionProgress";
import SubmitCorrectionModal from "../../components/attendance/SubmitCorrectionModal";

export default function EmployeeDashboard() {
  const { user, logout, isEmployee } = useAuth();
  const toast = useToast();

  const { data: attendances, isLoading, isError, refetch } = useMyAttendance(isEmployee);
  const { data: personalAnalytics } = usePersonalAnalytics();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [locationStatus, setLocationStatus] = useState<string>("");
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTargetAttendance, setCorrectionTargetAttendance] = useState<any>(null);
  const [currentDuration, setCurrentDuration] = useState<string>("00h 00m");
  const [companyId, setCompanyId] = useState("");
  const { data: employments = [] } = useQuery<any[]>({
    queryKey: ["myActiveEmployments"],
    queryFn: async () => (await api.get("/employment/me")).data.data,
  });
  useEffect(() => {
    if (employments.length === 1) setCompanyId(employments[0].company_id);
  }, [employments]);

  const { data: mySchedule = null } = useMySchedule(companyId || undefined);

  // Check if there is an active (not checked out) attendance record
  const activeAttendance = useMemo(() => {
    if (!attendances) return null;
    return attendances.find((a) => !a.check_out_time) || null;
  }, [attendances]);

  // Get today's attendance record (active record or latest today record)
  const todayAttendance = useMemo(() => {
    if (!attendances) return null;
    if (activeAttendance) return activeAttendance;

    const now = new Date();
    const todayUtc = now.toISOString().split("T")[0];
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return (
      attendances.find((a) => {
        const timeStr = a.check_in_time || a.created_at || "";
        return typeof timeStr === "string" && (timeStr.startsWith(todayUtc) || timeStr.startsWith(todayLocal));
      }) || null
    );
  }, [attendances, activeAttendance]);

  // Determine State
  const attendanceState = useMemo(() => {
    if (activeAttendance) return "WORKING";
    if (todayAttendance?.check_out_time) return "COMPLETED";
    return "NOT_CHECKED_IN";
  }, [activeAttendance, todayAttendance]);

  // Detect unclosed past shifts from previous days or > 14h ago
  const isStaleOpenShift = useMemo(() => {
    if (!activeAttendance || !activeAttendance.check_in_time) return false;
    const inDate = new Date(activeAttendance.check_in_time);
    const now = new Date();
    const diffHours = (now.getTime() - inDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 14 || inDate.toDateString() !== now.toDateString();
  }, [activeAttendance]);

  // Update live duration if Working
  useEffect(() => {
    if (attendanceState === "WORKING" && todayAttendance?.check_in_time) {
      const interval = setInterval(() => {
        const start = new Date(todayAttendance.check_in_time).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        setCurrentDuration(`${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [attendanceState, todayAttendance]);

  // Calculate final duration if Completed
  const finalDuration = useMemo(() => {
    if (attendanceState === "COMPLETED" && todayAttendance?.check_in_time && todayAttendance?.check_out_time) {
      const start = new Date(todayAttendance.check_in_time).getTime();
      const end = new Date(todayAttendance.check_out_time).getTime();
      const diffMs = end - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
    }
    return "00h 00m";
  }, [attendanceState, todayAttendance]);

  const handleGeolocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      setLocationStatus("Fetching GPS coordinates...");
      const coords = await handleGeolocation();
      setLocationStatus("Verifying shift geofence...");
      await checkInMutation.mutateAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
        companyId: companyId || undefined,
      } as any);
      setLocationStatus("");
      toast.success("Successfully checked in for your shift!");
    } catch (err: any) {
      setLocationStatus("");
      toast.error(err.message || "Failed to check in. Please ensure location is enabled.");
    }
  };

  const handleCheckOut = async (notes?: string) => {
    try {
      setLocationStatus("Fetching GPS coordinates...");
      const coords = await handleGeolocation();
      setLocationStatus("Recording departure...");
      await checkOutMutation.mutateAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes,
      } as any);
      setLocationStatus("");
      setIsCheckOutOpen(false);
      toast.success("Successfully checked out!");
    } catch (err: any) {
      setLocationStatus("");
      toast.error(err.message || "Failed to check out.");
    }
  };

  const formatTime = (timeStr?: string | Date | null) => {
    if (!timeStr) return "—";
    return new Date(timeStr).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          title="Unable to load attendance"
          description="We couldn't retrieve your attendance information. Please check your connection."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-content-wrap fade-in">
      {/* Header Block */}
      <div className="dashboard-header-block">
        <div>
          <div className="dashboard-pill-badge">
            <span className="dashboard-yellow-dot" />
            <span>OVERVIEW</span>
          </div>
          <h1 className="dashboard-title">Good day, {user?.first_name || "Employee"}</h1>
          <p className="dashboard-subtitle">Track shift attendance and work hours.</p>
        </div>
        <div className="dashboard-actions-cluster">
          <button
            type="button"
            onClick={() => {
              setCorrectionTargetAttendance(null);
              setIsCorrectionModalOpen(true);
            }}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
          >
            <Clock size={16} />
            <span>Request Correction</span>
          </button>
          <Link to="/employee/leave" className="btn btn-primary">
            <Calendar size={16} />
            <span>Request Leave</span>
          </Link>
          <Link to="/employee/attendance" className="btn btn-secondary">
            <History size={16} />
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* Monthly Activity Stat Cards */}
      <div className="nectar-stat-grid">
        <div className="nectar-stat-card">
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Sessions This Month</span>
            <div className="nectar-stat-icon-wrap" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
              <Timer size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">{personalAnalytics?.attendance.thisMonthSessions || 0}</div>
          <div className="nectar-stat-meta" style={{ color: "#2563eb" }}>
            <span>{personalAnalytics?.attendance.completedSessionsThisMonth || 0} completed</span>
          </div>
        </div>

        <div className="nectar-stat-card">
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Completed Hours</span>
            <div className="nectar-stat-icon-wrap" style={{ backgroundColor: "rgba(255, 225, 124, 0.1)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.2)" }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">
            {personalAnalytics?.attendance.completedHoursThisMonth || 0}
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-muted)", marginLeft: "4px" }}>hrs</span>
          </div>
          <div className="nectar-stat-meta" style={{ color: "var(--color-primary-text)" }}>
            <span>This calendar month</span>
          </div>
        </div>

        <div className="nectar-stat-card">
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Approved Leave</span>
            <div className="nectar-stat-icon-wrap" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">
            {personalAnalytics?.leave.approvedDaysThisYear || 0}
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-muted)", marginLeft: "4px" }}>days</span>
          </div>
          <div className="nectar-stat-meta" style={{ color: "#8b5cf6" }}>
            <span>{personalAnalytics?.leave.approvedRequestsThisYear || 0} requests this year</span>
          </div>
        </div>

        <div className="nectar-stat-card">
          <div className="nectar-stat-top">
            <span className="nectar-stat-label">Pending Requests</span>
            <div className="nectar-stat-icon-wrap" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="nectar-stat-val">{personalAnalytics?.leave.pendingRequests || 0}</div>
          <div className="nectar-stat-meta" style={{ color: "#d97706" }}>
            <span>Awaiting HR review</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="nectar-dashboard-grid-2">
        {/* Left Column: Attendance Punch & Shift Intelligence */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Dominant Attendance Punch Card */}
          <div className="nectar-card" style={{ textAlign: "center", padding: "2.75rem 2rem" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <span className="nectar-stat-label" style={{ fontSize: "0.8125rem" }}>Today's Shift Session</span>
            </div>

            {attendanceState === "NOT_CHECKED_IN" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span className="badge badge-neutral" style={{ fontSize: "0.875rem", padding: "0.4rem 1rem", marginBottom: "1.25rem" }}>
                  Not Checked In
                </span>
                <p style={{ color: "var(--color-text)", marginBottom: "1.5rem", fontSize: "1.0625rem", fontWeight: 600 }}>
                  Ready to start your work session today?
                </p>

                {employments.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No active company employment found.</p>
                ) : (
                  <select
                    className="form-select"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    style={{ maxWidth: "340px", marginBottom: "1.5rem", padding: "0.65rem 1rem" }}
                  >
                    <option value="">Select work company</option>
                    {employments.map((employment) => (
                      <option key={employment.id} value={employment.company_id}>
                        {employment.company?.name || "Company"}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="btn btn-primary"
                  style={{ padding: "0.875rem 2.75rem", fontSize: "1.1rem" }}
                  disabled={!companyId || checkInMutation.isPending || !!locationStatus}
                >
                  {checkInMutation.isPending || !!locationStatus ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{locationStatus || "Checking in..."}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      <span>Check In Now</span>
                    </>
                  )}
                </button>
                <div
                  style={{
                    marginTop: "1.25rem",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <MapPin size={14} style={{ color: "var(--color-primary-text)" }} />
                  <span>Tamper-proof GPS location verification enabled</span>
                </div>
              </div>
            )}

            {attendanceState === "WORKING" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  className="badge badge-success"
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.4rem 1.15rem",
                    marginBottom: "1rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                  }}
                >
                  <span className="status-pulsing-dot" />
                  Shift in Progress
                </span>
                <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
                  Elapsed Working Time
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                  Currently checked in at <strong>{activeAttendance?.company?.name || "Assigned Company"}</strong>
                </p>

                {isStaleOpenShift && (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "460px",
                      margin: "1.25rem auto",
                      padding: "1rem 1.25rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "var(--color-warning-text, #f59e0b)", marginBottom: "0.35rem" }}>
                      <AlertTriangle size={18} />
                      <span>Unclosed Shift Detected</span>
                    </div>
                    <p style={{ margin: "0 0 0.85rem", color: "var(--color-text-secondary)", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                      You checked in on <strong>{activeAttendance?.check_in_time ? new Date(activeAttendance.check_in_time).toLocaleDateString() : "an earlier shift"}</strong> without checking out. Submit a punch correction to record your check-out time and clear the lock for future check-ins.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeAttendance) {
                          setCorrectionTargetAttendance(activeAttendance);
                          setIsCorrectionModalOpen(true);
                        }
                      }}
                      className="btn btn-sm"
                      style={{
                        backgroundColor: "var(--color-warning, #f59e0b)",
                        color: "#000",
                        fontWeight: 600,
                        padding: "0.35rem 0.85rem",
                        border: "none",
                      }}
                    >
                      Fix Missing Check-Out
                    </button>
                  </div>
                )}

                <h1
                  style={{
                    fontSize: "3.5rem",
                    margin: "1rem 0 2rem",
                    color: "var(--color-primary-text)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                  }}
                >
                  {currentDuration}
                </h1>

                <button
                  type="button"
                  onClick={() => setIsCheckOutOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: "0.85rem 2.5rem", fontSize: "1.0625rem" }}
                >
                  <Clock size={18} />
                  <span>Check Out</span>
                </button>
              </div>
            )}

            {attendanceState === "COMPLETED" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span className="badge badge-neutral" style={{ fontSize: "0.875rem", padding: "0.4rem 1.15rem", marginBottom: "1rem" }}>
                  Shift Completed
                </span>
                <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
                  Total Recorded Duration
                </p>
                <h1
                  style={{
                    fontSize: "3.25rem",
                    margin: "1rem 0",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                  }}
                >
                  {finalDuration}
                </h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  Great work today! Your shift summary has been recorded.
                </p>
              </div>
            )}
          </div>

          {/* Today's Shift Intelligence Panel */}
          {todayAttendance && (
            <div className="nectar-card">
              <div className="nectar-card-header">
                <h3 className="nectar-card-title">
                  <Timer size={18} style={{ color: "var(--color-primary-text)" }} />
                  Shift Attendance Intelligence
                </h3>
                <AttendanceStatusBadge status={todayAttendance.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Schedule</div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", marginTop: "0.15rem" }}>
                    {todayAttendance.schedule?.name || mySchedule?.name || "Open Shift"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Arrival Punctuality</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: todayAttendance.is_late ? "var(--color-danger, #ef4444)" : "var(--color-success, var(--color-primary-text))",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      marginTop: "0.15rem",
                    }}
                  >
                    {todayAttendance.is_late ? (
                      <>
                        <AlertTriangle size={13} /> {todayAttendance.late_minutes ?? 0}m late
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> On time
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Worked Hours</div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", marginTop: "0.15rem" }}>
                    {todayAttendance.actual_hours !== null && todayAttendance.actual_hours !== undefined
                      ? `${Number(todayAttendance.actual_hours).toFixed(1)}h`
                      : currentDuration}
                  </div>
                </div>
              </div>

              {todayAttendance.completion_percentage !== undefined && todayAttendance.completion_percentage !== null && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.45rem" }}>
                    Shift Target Completion
                  </div>
                  <ShiftCompletionProgress percentage={todayAttendance.completion_percentage} size="md" showLabel={true} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Schedule & Quick Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Today's Schedule Card */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <Clock size={18} style={{ color: "var(--color-primary-text)" }} />
                Today's Work Schedule
              </h3>
              {mySchedule ? (
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                  Assigned Shift
                </span>
              ) : (
                <span className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>
                  Flexible Hours
                </span>
              )}
            </div>

            {mySchedule ? (
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                  {mySchedule.name}
                </div>
                {mySchedule.description && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                    {mySchedule.description}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "0.85rem",
                    padding: "1rem 1.25rem",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      Shift Hours
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                      {mySchedule.start_time.slice(0, 5)} — {mySchedule.end_time.slice(0, 5)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      Grace Period
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                      {mySchedule.grace_period_minutes} min
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      Expected Daily
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                      {mySchedule.expected_hours} hours
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontWeight: 600 }}>No rigid schedule assigned</p>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  You have flexible open working hours for your role.
                </span>
              </div>
            )}
          </div>

          {/* Quick Shift Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            <div className="nectar-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                <Clock size={16} />
                <span style={{ fontSize: "0.78125rem", fontWeight: 700, textTransform: "uppercase" }}>Check-in</span>
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text)" }}>
                {todayAttendance?.check_in_time ? formatTime(todayAttendance.check_in_time) : "—"}
              </div>
            </div>

            <div className="nectar-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                <Clock size={16} />
                <span style={{ fontSize: "0.78125rem", fontWeight: 700, textTransform: "uppercase" }}>Check-out</span>
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text)" }}>
                {todayAttendance?.check_out_time ? formatTime(todayAttendance.check_out_time) : "—"}
              </div>
            </div>

            <div className="nectar-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                <Briefcase size={16} />
                <span style={{ fontSize: "0.78125rem", fontWeight: 700, textTransform: "uppercase" }}>Department</span>
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text)" }}>
                {user?.department || "General"}
              </div>
            </div>
          </div>

          {/* Upcoming Approved Leave */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <Calendar size={18} style={{ color: "#8b5cf6" }} />
                Upcoming Approved Leave
              </h3>
              <Link to="/employee/leave" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.3rem 0.65rem" }}>
                <span>Manage</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {personalAnalytics?.leave.upcomingApprovedLeave && personalAnalytics.leave.upcomingApprovedLeave.length > 0 ? (
              <div className="nectar-list-group">
                {personalAnalytics.leave.upcomingApprovedLeave.map((item) => (
                  <div key={item.id} className="nectar-list-row">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text)" }}>
                        {item.leaveType}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                        {item.startDate} to {item.endDate}
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                      {item.days} {item.days === 1 ? "day" : "days"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1.75rem 1rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                No upcoming scheduled leave requests.
              </div>
            )}
          </div>
        </div>
      </div>

      {isCheckOutOpen && (
        <CheckOutDialog
          onClose={() => setIsCheckOutOpen(false)}
          onConfirm={handleCheckOut}
          isSubmitting={checkOutMutation.isPending || !!locationStatus}
        />
      )}

      <SubmitCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setCorrectionTargetAttendance(null);
        }}
        attendance={correctionTargetAttendance}
        companyId={companyId || undefined}
      />
    </div>
  );
}
