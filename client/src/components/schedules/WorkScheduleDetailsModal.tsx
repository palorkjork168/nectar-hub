import { useState } from "react";
import { X, Clock, Users, Building, Briefcase, AlertCircle, Loader2 } from "lucide-react";
import type { WorkSchedule, ScheduleEmployee } from "../../types/attendance";
import { useSchedule, useScheduleEmployees, useUnassignScheduleFromEmployment } from "../../hooks/useWorkSchedules";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import StatusBadge from "../common/StatusBadge";
import ScheduleAssignmentModal from "./ScheduleAssignmentModal";

interface WorkScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: WorkSchedule | null;
  scheduleId?: string;
  companyId: string;
  canManage?: boolean;
  onScheduleUpdated?: () => void;
}

export default function WorkScheduleDetailsModal({
  isOpen,
  onClose,
  schedule: initialSchedule,
  scheduleId,
  companyId,
  canManage: canManageProp,
  onScheduleUpdated,
}: WorkScheduleDetailsModalProps) {
  const { hasPermission, isAdmin } = useAuth();
  const toast = useToast();
  const canManage = canManageProp ?? (isAdmin || hasPermission("shifts.manage"));

  const targetId = scheduleId || initialSchedule?.id || "";
  const { data: fetchedSchedule } = useSchedule(targetId);
  const schedule = initialSchedule || fetchedSchedule || null;

  const [assignmentTarget, setAssignmentTarget] = useState<{
    employmentRecordId: string;
    employeeName: string;
    currentScheduleId?: string | null;
  } | null>(null);

  const { data: employees = [], isLoading, isError, refetch: refetchEmployees } = useScheduleEmployees(targetId);
  const unassignMutation = useUnassignScheduleFromEmployment();

  if (!isOpen || !schedule) return null;

  const handleUnassign = async (emp: ScheduleEmployee) => {
    const fullName = emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : "this employee";
    if (!confirm(`Are you sure you want to remove the schedule from ${fullName}?`)) {
      return;
    }

    try {
      await unassignMutation.mutateAsync({
        employmentRecordId: emp.id,
        companyId,
      });
      toast.success(`Schedule removed from ${fullName}`);
      refetchEmployees();
      onScheduleUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unassign schedule");
    }
  };

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 1000 }}>
        <div className="modal-content" style={{ maxWidth: "700px" }}>
          <div className="modal-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={20} style={{ color: "var(--color-primary)" }} />
                <h2 className="modal-title">{schedule.name}</h2>
                <StatusBadge status={schedule.is_active ? "ACTIVE" : "INACTIVE"} />
              </div>
              {schedule.description && (
                <p style={{ margin: "0.25rem 0 0 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  {schedule.description}
                </p>
              )}
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Schedule Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "0.75rem",
              margin: "1rem 0 1.5rem 0",
              padding: "1rem",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Working Hours</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                {schedule.start_time} — {schedule.end_time}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Expected Hours</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                {schedule.expected_hours} hours
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Grace Period</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                {schedule.grace_period_minutes} min
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Assigned Workforce</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                {employees.length} {employees.length === 1 ? "employee" : "employees"}
              </div>
            </div>
          </div>

          {/* Assigned Employees Section */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Users size={18} style={{ color: "var(--color-text-secondary)" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Assigned Employees</h3>
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Loader2 className="spinner" size={24} />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                  Loading assigned employees...
                </p>
              </div>
            ) : isError ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  backgroundColor: "var(--color-danger-soft)",
                  color: "var(--color-danger-text)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <AlertCircle size={18} />
                <span>Unable to load assigned employees</span>
              </div>
            ) : employees.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                }}
              >
                No employees are assigned to this schedule.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Status</th>
                      {canManage && <th style={{ textAlign: "right" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const fullName = emp.user
                        ? `${emp.user.first_name} ${emp.user.last_name}`
                        : "Unknown";
                      return (
                        <tr key={emp.id}>
                          <td>
                            <strong>{fullName}</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {emp.user?.email}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                              <Building size={14} style={{ color: "var(--color-text-muted)" }} />
                              <span>{emp.department?.name || "—"}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                              <Briefcase size={14} style={{ color: "var(--color-text-muted)" }} />
                              <span>{emp.position?.title || "—"}</span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={emp.status} />
                          </td>
                          {canManage && (
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}
                                  onClick={() =>
                                    setAssignmentTarget({
                                      employmentRecordId: emp.id,
                                      employeeName: fullName,
                                      currentScheduleId: schedule.id,
                                    })
                                  }
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}
                                  onClick={() => handleUnassign(emp)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1.5rem",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "1rem",
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {assignmentTarget && (
        <ScheduleAssignmentModal
          isOpen={Boolean(assignmentTarget)}
          onClose={() => setAssignmentTarget(null)}
          companyId={companyId}
          employmentRecordId={assignmentTarget.employmentRecordId}
          employeeName={assignmentTarget.employeeName}
          currentScheduleId={assignmentTarget.currentScheduleId}
          onSuccess={() => {
            refetchEmployees();
            onScheduleUpdated?.();
          }}
        />
      )}
    </>
  );
}
