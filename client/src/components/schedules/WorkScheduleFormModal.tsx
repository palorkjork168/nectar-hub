import { useState, useEffect } from "react";
import { X, Clock, Loader2, AlertCircle } from "lucide-react";
import type { WorkSchedule } from "../../types/attendance";
import { useCreateSchedule, useUpdateSchedule } from "../../hooks/useWorkSchedules";
import { useToast } from "../../contexts/ToastContext";

interface WorkScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  scheduleToEdit?: WorkSchedule | null;
  schedule?: WorkSchedule | null;
  onSuccess?: () => void;
}

export default function WorkScheduleFormModal({
  isOpen,
  onClose,
  companyId,
  scheduleToEdit,
  schedule,
  onSuccess,
}: WorkScheduleFormModalProps) {
  const toast = useToast();
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();

  const activeSchedule = scheduleToEdit ?? schedule ?? null;
  const isEditing = Boolean(activeSchedule);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "09:00",
    end_time: "17:00",
    grace_period_minutes: 15,
    expected_hours: 8.0,
    is_active: true,
  });

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (activeSchedule) {
      setFormData({
        name: activeSchedule.name || "",
        description: activeSchedule.description || "",
        start_time: activeSchedule.start_time || "09:00",
        end_time: activeSchedule.end_time || "17:00",
        grace_period_minutes: activeSchedule.grace_period_minutes ?? 15,
        expected_hours: Number(activeSchedule.expected_hours) || 8.0,
        is_active: activeSchedule.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        start_time: "09:00",
        end_time: "17:00",
        grace_period_minutes: 15,
        expected_hours: 8.0,
        is_active: true,
      });
    }
    setErrorMsg("");
  }, [activeSchedule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Schedule name is required");
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      setErrorMsg("Start time and end time are required");
      return;
    }
    if (formData.grace_period_minutes < 0) {
      setErrorMsg("Grace period cannot be negative");
      return;
    }
    if (formData.expected_hours <= 0) {
      setErrorMsg("Expected hours must be greater than zero");
      return;
    }

    try {
      if (isEditing && activeSchedule) {
        await updateMutation.mutateAsync({
          scheduleId: activeSchedule.id,
          companyId,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            start_time: formData.start_time,
            end_time: formData.end_time,
            grace_period_minutes: Number(formData.grace_period_minutes),
            expected_hours: Number(formData.expected_hours),
          },
        });
        toast.success("Work schedule updated successfully");
      } else {
        await createMutation.mutateAsync({
          companyId,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            start_time: formData.start_time,
            end_time: formData.end_time,
            grace_period_minutes: Number(formData.grace_period_minutes),
            expected_hours: Number(formData.expected_hours),
            is_active: formData.is_active,
          },
        });
        toast.success("Work schedule created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message || err.message || "Failed to save work schedule";
      setErrorMsg(serverMessage);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="modal-title">
              {isEditing ? "Edit Work Schedule" : "Create Work Schedule"}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem 0" }}>
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
              <label className="form-label" htmlFor="schedule-name">
                Schedule Name <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                id="schedule-name"
                type="text"
                className="input-field"
                placeholder="e.g. Standard Office Shift"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="schedule-description">
                Description (Optional)
              </label>
              <textarea
                id="schedule-description"
                className="input-field"
                rows={2}
                placeholder="Brief notes about who follows this schedule"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="schedule-start">
                  Start Time <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="schedule-start"
                  type="time"
                  className="input-field"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="schedule-end">
                  End Time <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="schedule-end"
                  type="time"
                  className="input-field"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="schedule-grace">
                  Grace Period (Minutes)
                </label>
                <input
                  id="schedule-grace"
                  type="number"
                  min="0"
                  max="120"
                  className="input-field"
                  value={formData.grace_period_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value, 10) || 0 })
                  }
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Late minutes are counted after this window
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="schedule-expected">
                  Expected Working Hours
                </label>
                <input
                  id="schedule-expected"
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="24"
                  className="input-field"
                  value={formData.expected_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_hours: parseFloat(e.target.value) || 0 })
                  }
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Deducts lunch/breaks (e.g. 8.00)
                </span>
              </div>
            </div>

            {!isEditing && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="schedule-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label
                  htmlFor="schedule-active"
                  style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
                >
                  Active immediately (can be assigned to employees)
                </label>
              </div>
            )}
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
