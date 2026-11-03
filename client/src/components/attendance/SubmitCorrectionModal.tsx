import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { useSubmitCorrection } from "../../hooks/useAttendance";
import { useToast } from "../../contexts/ToastContext";
import { AlertCircle, Clock, CheckCircle2, Loader2, Calendar } from "lucide-react";
import type { Attendance, CorrectionType } from "../../types/attendance";

interface SubmitCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance?: Attendance | null;
  companyId?: string;
}

export default function SubmitCorrectionModal({
  isOpen,
  onClose,
  attendance,
  companyId,
}: SubmitCorrectionModalProps) {
  const toast = useToast();
  const submitMutation = useSubmitCorrection();

  const [correctionType, setCorrectionType] = useState<CorrectionType>("MISSING_CHECK_OUT");
  const [date, setDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Initialize form based on target attendance
  useEffect(() => {
    if (attendance) {
      const recDate = new Date(attendance.check_in_time || attendance.created_at);
      const yyyy = recDate.getFullYear();
      const mm = String(recDate.getMonth() + 1).padStart(2, "0");
      const dd = String(recDate.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      if (attendance.check_in_time) {
        const inDate = new Date(attendance.check_in_time);
        setCheckInTime(`${String(inDate.getHours()).padStart(2, "0")}:${String(inDate.getMinutes()).padStart(2, "0")}`);
      }

      if (attendance.check_out_time) {
        const outDate = new Date(attendance.check_out_time);
        setCheckOutTime(`${String(outDate.getHours()).padStart(2, "0")}:${String(outDate.getMinutes()).padStart(2, "0")}`);
        setCorrectionType("INCORRECT_TIMES");
      } else {
        setCheckOutTime("");
        setCorrectionType("MISSING_CHECK_OUT");
      }
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
      setCheckInTime("09:00");
      setCheckOutTime("17:00");
      setCorrectionType("MISSED_SHIFT");
    }
    setReason("");
    setError("");
  }, [attendance, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!companyId) {
      setError("Company context is missing. Please refresh and try again.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError("Please provide an explanatory reason of at least 3 characters.");
      return;
    }

    let reqIn: string | null = null;
    let reqOut: string | null = null;

    if (correctionType === "MISSING_CHECK_IN" || correctionType === "INCORRECT_TIMES" || correctionType === "MISSED_SHIFT") {
      if (!checkInTime) {
        setError("Please enter a valid check-in time.");
        return;
      }
      reqIn = new Date(`${date}T${checkInTime}:00`).toISOString();
    }

    if (correctionType === "MISSING_CHECK_OUT" || correctionType === "INCORRECT_TIMES" || correctionType === "MISSED_SHIFT") {
      if (!checkOutTime) {
        setError("Please enter a valid check-out time.");
        return;
      }
      reqOut = new Date(`${date}T${checkOutTime}:00`).toISOString();
    }

    // Chronology check
    if (reqIn && reqOut && new Date(reqOut) <= new Date(reqIn)) {
      setError("Check-out time must be chronologically after check-in time.");
      return;
    }

    const effectiveCompanyId = companyId || attendance?.company_id;
    if (!effectiveCompanyId) {
      setError("Company scope is required to submit a correction.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        companyId: effectiveCompanyId,
        attendanceId: attendance?.id || null,
        correctionType,
        requestedCheckInTime: reqIn,
        requestedCheckOutTime: reqOut,
        reason: reason.trim(),
      });
      toast.success("Attendance correction request submitted for review!");
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to submit correction request.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} style={{ color: "var(--color-primary-text)" }} />
          <span>Attendance Correction Request</span>
        </div>
      }
      description="Submit a formal adjustment for a missed punch or recorded time discrepancy."
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Correction Type Selector */}
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text)" }}>
            Correction Type
          </label>
          <select
            className="input-field"
            value={correctionType}
            onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
            style={{ width: "100%", height: "42px" }}
          >
            <option value="MISSING_CHECK_OUT">Missing Check-out (Forgot to punch out)</option>
            <option value="MISSING_CHECK_IN">Missing Check-in (Forgot to punch in)</option>
            <option value="INCORRECT_TIMES">Incorrect Recorded Times</option>
            <option value="MISSED_SHIFT">Missed Shift (Both punches forgotten)</option>
          </select>
        </div>

        {/* Shift Date */}
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text)" }}>
            Shift Date
          </label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            max={new Date().toISOString().split("T")[0]}
            style={{ width: "100%", height: "42px" }}
          />
        </div>

        {/* Time Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {(correctionType === "MISSING_CHECK_IN" || correctionType === "INCORRECT_TIMES" || correctionType === "MISSED_SHIFT") && (
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text)" }}>
                Requested Check-in Time
              </label>
              <input
                type="time"
                className="input-field"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                required
                style={{ width: "100%", height: "42px" }}
              />
            </div>
          )}

          {(correctionType === "MISSING_CHECK_OUT" || correctionType === "INCORRECT_TIMES" || correctionType === "MISSED_SHIFT") && (
            <div style={{ gridColumn: correctionType === "MISSING_CHECK_OUT" ? "1 / span 2" : undefined }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text)" }}>
                Requested Check-out Time
              </label>
              <input
                type="time"
                className="input-field"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                required
                style={{ width: "100%", height: "42px" }}
              />
            </div>
          )}
        </div>

        {/* Reason / Explanation */}
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text)" }}>
            Reason & Supporting Explanation
          </label>
          <textarea
            className="input-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why the punch was missed or needs adjustment (e.g., worked on client site, terminal offline, power outage)..."
            rows={3}
            required
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitMutation.isPending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
