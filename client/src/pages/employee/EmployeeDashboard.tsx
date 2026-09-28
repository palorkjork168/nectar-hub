import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMyAttendance, useCheckIn, useCheckOut } from "../../hooks/useAttendance";
import { usePersonalAnalytics } from "../../hooks/useAnalytics";
import { LogOut, MapPin, Clock, Calendar, Briefcase, Loader2, AlertCircle, History, Timer, AlertTriangle } from "lucide-react";
import CheckOutDialog from "../../components/employee/CheckOutDialog";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import NotificationBell from "../../components/notifications/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { useMySchedule } from "../../hooks/useWorkSchedules";
import AttendanceStatusBadge from "../../components/attendance/AttendanceStatusBadge";
import ShiftCompletionProgress from "../../components/attendance/ShiftCompletionProgress";

export default function EmployeeDashboard() {
  const { user, logout, isEmployee } = useAuth();
  const toast = useToast();

  const { data: attendances, isLoading, isError, refetch } = useMyAttendance(isEmployee);
  const { data: personalAnalytics } = usePersonalAnalytics();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [locationStatus, setLocationStatus] = useState<string>("");
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [currentDuration, setCurrentDuration] = useState<string>("00h 00m");
  const [companyId, setCompanyId] = useState("");
  const { data: employments = [] } = useQuery<any[]>({ queryKey: ["myActiveEmployments"], queryFn: async () => (await api.get("/employment/me")).data.data });
  useEffect(() => { if (employments.length === 1) setCompanyId(employments[0].company_id); }, [employments]);

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

    return attendances.find((a) => {
      const timeStr = a.check_in_time || a.created_at || "";
      return typeof timeStr === "string" && (timeStr.startsWith(todayUtc) || timeStr.startsWith(todayLocal));
    }) || null;
  }, [attendances, activeAttendance]);

  // Determine State
  const attendanceState = useMemo(() => {
    if (activeAttendance) return "WORKING";
    if (todayAttendance?.check_out_time) return "COMPLETED";
    return "NOT_CHECKED_IN";
  }, [activeAttendance, todayAttendance]);

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
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error("Location permission is required to check in. Please allow location access in your browser and try again."));
          } else {
            reject(new Error("Unable to retrieve your location. Please check your connection or device settings."));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    setLocationStatus("Detecting location...");
    try {
      const coords = await handleGeolocation();
      setLocationStatus("Checking in...");
      if (!companyId) throw new Error("Select a work company before checking in.");
      await checkInMutation.mutateAsync({ ...coords, companyId });
      setLocationStatus("");
      toast.success("Checked in successfully!");
    } catch (error: any) {
      setLocationStatus("");
      toast.error(error.message || "Unable to check in. Please try again.");
    }
  };

  const handleCheckOut = async () => {
    setLocationStatus("Detecting location...");
    try {
      const coords = await handleGeolocation();
      setLocationStatus("Checking out...");
      await checkOutMutation.mutateAsync(coords);
      setLocationStatus("");
      setIsCheckOutOpen(false);
      toast.success("Checked out successfully!");
    } catch (error: any) {
      setLocationStatus("");
      toast.error(error.message || "Unable to check out. Please try again.");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-primary)", margin: "0 auto" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-container">
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
    <div className="page-container fade-in">
      {/* Header */}
      <header className="page-header" style={{ alignItems: "center" }}>
        <div>
          <h1 className="page-title">Good day, {user?.first_name}</h1>
          <p className="page-subtitle">Track your daily shift attendance and review your work hours.</p>
        </div>
        <div className="page-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationBell />
          <Link to="/employee/leave" className="btn btn-secondary">
            <Calendar size={16} /> Time Off
          </Link>
          <Link to="/employee/attendance" className="btn btn-secondary">
            <History size={16} /> History
          </Link>
          <button type="button" onClick={logout} className="btn btn-ghost" title="Sign Out">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr", maxWidth: "760px", margin: "0 auto" }}>
        {/* Today's Schedule Card */}
        <div
          className="card"
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={18} style={{ color: "var(--color-primary)" }} /> Today's Schedule
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
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                  {mySchedule.description}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.75rem",
                  marginTop: "0.75rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--color-surface-muted, #f8fafc)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>
                    Shift Hours
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    {mySchedule.start_time.slice(0, 5)} — {mySchedule.end_time.slice(0, 5)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>
                    Grace Period
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    {mySchedule.grace_period_minutes} min
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>
                    Expected Hours
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    {mySchedule.expected_hours} hours
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
              <p style={{ margin: "0.25rem 0", fontWeight: 500 }}>No work schedule assigned</p>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                You have open working hours for your employment.
              </span>
            </div>
          )}
        </div>

        {/* Dominant Attendance Card */}
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 2rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", margin: "0 0 1.25rem 0", color: "var(--color-text-secondary)" }}>
            Today's Attendance Session
          </h2>

          {attendanceState === "NOT_CHECKED_IN" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="badge badge-neutral" style={{ fontSize: "0.875rem", padding: "0.4rem 1rem", marginBottom: "1.5rem" }}>
                Not Checked In
              </span>
              <p style={{ color: "var(--color-text)", marginBottom: "2rem", fontSize: "1.125rem", fontWeight: 500 }}>
                You are currently not checked in for today's shift.
              </p>
              {employments.length === 0 ? <p>No active company employment found.</p> : <select className="form-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ maxWidth: "320px", marginBottom: "1rem" }}><option value="">Select work company</option>{employments.map((employment) => <option key={employment.id} value={employment.company_id}>{employment.company?.name || "Company"}</option>)}</select>}

              <button
                type="button"
                onClick={handleCheckIn}
                className="btn btn-primary btn-lg"
                style={{ padding: "0.875rem 2.5rem", fontSize: "1.125rem" }}
                disabled={!companyId || checkInMutation.isPending || !!locationStatus}
              >
                {checkInMutation.isPending || !!locationStatus ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> {locationStatus || "Checking in..."}
                  </>
                ) : (
                  "Check In"
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
                  gap: "0.35rem",
                }}
              >
                <MapPin size={14} /> GPS location verification enabled
              </div>
            </div>
          )}

          {attendanceState === "WORKING" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="badge badge-success" style={{ fontSize: "0.875rem", padding: "0.4rem 1rem", marginBottom: "1rem" }}>
                Shift in Progress
              </span>
              <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
                Elapsed Working Time
              </p>
              <p style={{ color: "var(--color-text-secondary)" }}>Currently checked in at <strong>{activeAttendance?.company?.name || "Legacy / Unknown Company"}</strong></p>
              <h1
                style={{
                  fontSize: "3.25rem",
                  margin: "0.75rem 0 2rem 0",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {currentDuration}
              </h1>

              <button
                type="button"
                onClick={() => setIsCheckOutOpen(true)}
                className="btn btn-secondary btn-lg"
                style={{ padding: "0.75rem 2.5rem", fontSize: "1.0625rem" }}
              >
                Check Out
              </button>
            </div>
          )}

          {attendanceState === "COMPLETED" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="badge badge-neutral" style={{ fontSize: "0.875rem", padding: "0.4rem 1rem", marginBottom: "1rem" }}>
                Completed
              </span>
              <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
                Total Shift Duration
              </p>
              <h1
                style={{
                  fontSize: "2.75rem",
                  margin: "0.75rem 0 1rem 0",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                {finalDuration}
              </h1>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                Great work today! Your shift summary has been recorded.
              </p>
            </div>
          )}
        </div>

        {/* Quick Shift Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
              <Clock size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Check-in Time</span>
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" }}>
              {todayAttendance?.check_in_time ? formatTime(todayAttendance.check_in_time) : "—"}
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
              <Clock size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Check-out Time</span>
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" }}>
              {todayAttendance?.check_out_time ? formatTime(todayAttendance.check_out_time) : "—"}
            </div>
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
              <Briefcase size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Department</span>
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" }}>
              {user?.department || "General"}
            </div>
          </div>
        </div>

        {/* Today's Shift Intelligence Panel */}
        {todayAttendance && (
          <div
            className="card"
            style={{
              padding: "1.25rem 1.5rem",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Timer size={16} style={{ color: "var(--color-primary)" }} /> Attendance Intelligence
              </div>
              <AttendanceStatusBadge status={todayAttendance.status} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Shift</div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {todayAttendance.schedule?.name || mySchedule?.name || "Open Shift"}
                </div>
                {Boolean(todayAttendance.schedule || mySchedule) && (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {(todayAttendance.schedule || mySchedule)?.start_time.slice(0, 5)} —{" "}
                    {(todayAttendance.schedule || mySchedule)?.end_time.slice(0, 5)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Punctuality</div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: todayAttendance.is_late ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {todayAttendance.is_late ? (
                    <>
                      <AlertTriangle size={13} /> {todayAttendance.late_minutes ?? 0}m late
                    </>
                  ) : todayAttendance.schedule || mySchedule ? (
                    "On time"
                  ) : (
                    "Flexible"
                  )}
                </div>
              </div>

              {todayAttendance.check_out_time && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Departure</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: todayAttendance.is_early_departure
                        ? "var(--color-warning, #f59e0b)"
                        : "var(--color-success, #10b981)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    {todayAttendance.is_early_departure ? (
                      <>
                        <AlertTriangle size={13} /> {todayAttendance.early_departure_minutes ?? 0}m early
                      </>
                    ) : (
                      "Full shift"
                    )}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Worked / Expected</div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {todayAttendance.actual_hours !== null && todayAttendance.actual_hours !== undefined
                    ? `${Number(todayAttendance.actual_hours).toFixed(1)}h`
                    : currentDuration}{" "}
                  /{" "}
                  {todayAttendance.schedule?.expected_hours
                    ? `${todayAttendance.schedule.expected_hours}h`
                    : mySchedule?.expected_hours
                    ? `${mySchedule.expected_hours}h`
                    : "8h"}
                </div>
              </div>
            </div>

            {todayAttendance.completion_percentage !== undefined && todayAttendance.completion_percentage !== null && (
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
                  Shift Completion
                </div>
                <ShiftCompletionProgress percentage={todayAttendance.completion_percentage} size="md" showLabel={true} />
              </div>
            )}
          </div>
        )}

        {/* Personal Monthly Analytics Summary */}
        <div
          className="card"
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            border: "1px solid var(--color-border, #e2e8f0)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #0f172a)" }}>
              Monthly Activity & Leave Summary
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
              Personal Overview
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>Sessions This Month</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary, #2563eb)", marginTop: "0.25rem" }}>
                {personalAnalytics?.attendance.thisMonthSessions || 0}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                {personalAnalytics?.attendance.completedSessionsThisMonth || 0} completed
              </div>
            </div>

            <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>Completed Hours</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981", marginTop: "0.25rem" }}>
                {personalAnalytics?.attendance.completedHoursThisMonth || 0}h
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                This calendar month
              </div>
            </div>

            <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>Approved Leave Taken</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#8b5cf6", marginTop: "0.25rem" }}>
                {personalAnalytics?.leave.approvedDaysThisYear || 0} <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>days</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                {personalAnalytics?.leave.approvedRequestsThisYear || 0} requests this year
              </div>
            </div>

            <div style={{ background: "var(--color-bg-subtle, #f8fafc)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>Pending Leave</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b", marginTop: "0.25rem" }}>
                {personalAnalytics?.leave.pendingRequests || 0}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                Awaiting approval
              </div>
            </div>
          </div>

          {personalAnalytics?.leave.upcomingApprovedLeave && personalAnalytics.leave.upcomingApprovedLeave.length > 0 && (
            <div style={{ borderTop: "1px dashed var(--color-border, #e2e8f0)", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text, #334155)", marginBottom: "0.5rem" }}>
                Upcoming Approved Leave
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {personalAnalytics.leave.upcomingApprovedLeave.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#059669",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {item.leaveType}: {item.startDate} to {item.endDate} ({item.days} days)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isCheckOutOpen && (
        <CheckOutDialog
          onClose={() => setIsCheckOutOpen(false)}
          onConfirm={handleCheckOut}
          isSubmitting={checkOutMutation.isPending || !!locationStatus}
        />
      )}
    </div>
  );
}
