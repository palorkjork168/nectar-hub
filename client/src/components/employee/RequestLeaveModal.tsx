import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { X, Calendar as CalendarIcon, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface RequestLeaveModalProps {
  onClose: () => void;
  balance: any[];
  companyId: string;
}

export default function RequestLeaveModal({ onClose, balance, companyId }: RequestLeaveModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [error, setError] = useState("");

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedType = balance.find((b) => b.leave_type_id === formData.leave_type_id);

  let days = 0;
  if (formData.start_date && formData.end_date) {
    const s = new Date(formData.start_date);
    const e = new Date(formData.end_date);
    if (e >= s) {
      days = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    }
  }

  const submitMut = useMutation({
    mutationFn: async (data: any) => api.post("/leave/requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      toast.success("Time off request submitted successfully");
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to submit leave request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.leave_type_id) {
      setError("Please select a leave type.");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError("End date cannot be before start date.");
      return;
    }
    if (!formData.reason.trim()) {
      setError("Please provide a brief reason for your leave request.");
      return;
    }
    if (selectedType && selectedType.remaining_days !== null && days > selectedType.remaining_days) {
      setError(`You requested ${days} days, but only have ${selectedType.remaining_days} remaining.`);
      return;
    }

    submitMut.mutate({
      ...formData, companyId,
      reason: formData.reason.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <CalendarIcon size={20} style={{ color: "var(--color-primary)" }} />
              Request Time Off
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              Choose a leave policy and your requested dates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        {balance.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "var(--radius-xl)",
                backgroundColor: "var(--color-surface-muted)",
                color: "var(--color-warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                border: "1px solid var(--color-border)",
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              No leave policies available
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, margin: "0 0 2rem" }}>
              Your employer hasn't configured leave policies yet.
              Please contact your company administrator or HR department.
            </p>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ minWidth: "120px" }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--color-danger-soft)",
                    color: "var(--color-danger-text)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1.25rem",
                    fontSize: "0.875rem",
                    border: "1px solid var(--color-danger-border)",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Leave Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="leave_type_id">
                  Leave Type <span className="required">*</span>
                </label>
                <select
                  id="leave_type_id"
                  className="form-select"
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Leave Type --</option>
                  {balance.map((b) => (
                    <option key={b.leave_type_id} value={b.leave_type_id}>
                      {b.name} ({b.remaining_days !== null ? `${b.remaining_days} days left` : "Unlimited"})
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <span className="form-help">
                    Available balance: <strong>{selectedType.remaining_days !== null ? `${selectedType.remaining_days} days` : "Unlimited"}</strong>
                  </span>
                )}
              </div>

              {/* Date Pickers */}
              <div className="form-grid two-cols">
                <div className="form-group">
                  <label className="form-label" htmlFor="start_date">
                    Start Date <span className="required">*</span>
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="end_date">
                    End Date <span className="required">*</span>
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Duration Summary */}
              {days > 0 && (
                <div
                  style={{
                    backgroundColor: "var(--color-surface-muted)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                    Requested Duration
                  </span>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary)" }}>
                    {days} calendar {days === 1 ? "day" : "days"}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="leave_reason">
                  Reason <span className="required">*</span>
                </label>
                <textarea
                  id="leave_reason"
                  className="form-textarea"
                  placeholder="Provide a brief note explaining the purpose of this time off..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={submitMut.isPending}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMut.isPending}
                className="btn btn-primary"
              >
                {submitMut.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
