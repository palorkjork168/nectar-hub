import { useState, useEffect } from "react";
import { X, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useCompanySchedules, useAssignScheduleToEmployment } from "../../hooks/useWorkSchedules";
import { useToast } from "../../contexts/ToastContext";

interface ScheduleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  employmentRecordId?: string;
  employmentId?: string;
  employeeName: string;
  currentScheduleId?: string | null;
  onSuccess?: () => void;
}

export default function ScheduleAssignmentModal({
  isOpen,
  onClose,
  companyId,
  employmentRecordId,
  employmentId,
  employeeName,
  currentScheduleId,
  onSuccess,
}: ScheduleAssignmentModalProps) {
  const toast = useToast();
  const targetEmploymentId = employmentRecordId || employmentId || "";
  const { data: schedules = [], isLoading } = useCompanySchedules(companyId, { isActive: true });
  const assignMutation = useAssignScheduleToEmployment();

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setSelectedScheduleId(currentScheduleId || "");
    setErrorMsg("");
  }, [currentScheduleId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const scheduleIdToSave = selectedScheduleId === "" ? null : selectedScheduleId;
      await assignMutation.mutateAsync({
        employmentRecordId: targetEmploymentId,
        workScheduleId: scheduleIdToSave,
        companyId,
      });

      if (scheduleIdToSave) {
        const found = schedules.find((s) => s.id === scheduleIdToSave);
        toast.success(`Assigned ${found?.name || "schedule"} to ${employeeName}`);
      } else {
        toast.success(`Schedule unassigned from ${employeeName}`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to update schedule assignment";
      setErrorMsg(message);
    }
  };

  const isSaving = assignMutation.isPending;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="modal-title">Assign Work Schedule</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={isSaving} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.25rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              Assign or update the working schedule for <strong>{employeeName}</strong>.
            </p>

            {errorMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "var(--color-danger-soft)",
                  color: "var(--color-danger-text)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="schedule-select">
                Active Work Schedule
              </label>
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)" }}>
                  <Loader2 className="spinner" size={16} />
                  <span>Loading company schedules...</span>
                </div>
              ) : (
                <select
                  id="schedule-select"
                  className="input-field"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                >
                  <option value="">(No schedule / Unassigned)</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time} — {s.end_time}, {s.expected_hours}h)
                    </option>
                  ))}
                </select>
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Only active schedules can be newly assigned.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1.5rem",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "1rem",
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || isLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Updating...</span>
                </>
              ) : (
                "Save Assignment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
