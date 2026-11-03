import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { useReviewCorrection } from "../../hooks/useAttendance";
import { useToast } from "../../contexts/ToastContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { AttendanceCorrectionRequest } from "../../types/attendance";

interface CorrectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  correction: AttendanceCorrectionRequest | null;
  onSuccess?: () => void;
}

export default function CorrectionDetailModal({
  isOpen,
  onClose,
  correction,
  onSuccess,
}: CorrectionDetailModalProps) {
  const toast = useToast();
  const reviewMutation = useReviewCorrection();

  const [reviewNote, setReviewNote] = useState("");
  const [confirmDecision, setConfirmDecision] = useState<"approve" | "reject" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setReviewNote("");
    setConfirmDecision(null);
    setErrorMessage("");
  }, [correction, isOpen]);

  if (!correction) return null;

  const isPending = correction.status === "PENDING";
  const isApproved = correction.status === "APPROVED";
  const isRejected = correction.status === "REJECTED";

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "None recorded";
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getCorrectionTypeLabel = (type: string) => {
    switch (type) {
      case "MISSING_CHECK_OUT":
        return "Missing Check-Out (Forgotten Exit Punch)";
      case "MISSING_CHECK_IN":
        return "Missing Check-In (Forgotten Arrival Punch)";
      case "INCORRECT_TIMES":
        return "Incorrect Recorded Times (Punch Adjustment)";
      case "MISSED_SHIFT":
        return "Missed Shift (Both Punches Forgotten)";
      default:
        return type;
    }
  };

  const handleExecuteDecision = async () => {
    if (!confirmDecision) return;
    setErrorMessage("");

    if (confirmDecision === "reject" && (!reviewNote.trim() || reviewNote.trim().length < 3)) {
      setErrorMessage("Please enter an explanation of at least 3 characters before rejecting.");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: correction.id,
        decision: confirmDecision,
        reviewNote: reviewNote.trim() || undefined,
      });

      toast.success(
        confirmDecision === "approve"
          ? "Attendance correction request approved successfully!"
          : "Attendance correction request rejected."
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to commit reviewer decision."
      );
    }
  };

  const employeeName = correction.user
    ? `${correction.user.first_name} ${correction.user.last_name}`
    : "Employee";

  const departmentName = correction.employmentRecord?.department?.name || null;
  const positionTitle = correction.employmentRecord?.position?.title || null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} style={{ color: "var(--color-primary-text)" }} />
          <span>Attendance Correction Review</span>
        </div>
      }
      description={`Review punch request submitted by ${employeeName} for ${formatDate(
        correction.attendance?.check_in_time || correction.created_at
      )}.`}
      maxWidth="680px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Employee & Company Context Card */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-surface-subtle, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--color-border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
            fontSize: "0.8125rem",
          }}
        >
          <div>
            <span style={{ color: "var(--color-text-muted)", display: "block", marginBottom: "0.2rem" }}>
              Employee Details
            </span>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text)" }}>
              {employeeName}
            </div>
            <div style={{ color: "var(--color-text-secondary)" }}>{correction.user?.email}</div>
            {(departmentName || positionTitle) && (
              <div style={{ color: "var(--color-primary-text)", marginTop: "0.2rem", fontWeight: 500 }}>
                {[departmentName, positionTitle].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>

          <div>
            <span style={{ color: "var(--color-text-muted)", display: "block", marginBottom: "0.2rem" }}>
              Assigned Shift / Schedule
            </span>
            {correction.workSchedule ? (
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {correction.workSchedule.name}
                </div>
                <div style={{ color: "var(--color-text-secondary)" }}>
                  {correction.workSchedule.start_time.slice(0, 5)} — {correction.workSchedule.end_time.slice(0, 5)} (
                  {correction.workSchedule.expected_hours}h target)
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                  Grace period: {correction.workSchedule.grace_period_minutes || 0} mins
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--color-text-muted)" }}>Open Schedule (No fixed shift)</div>
            )}
          </div>
        </div>

        {/* Correction Type & Status Banner */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            padding: "0.875rem 1rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: isPending
              ? "rgba(245, 158, 11, 0.08)"
              : isApproved
              ? "rgba(255, 225, 124, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${
              isPending
                ? "rgba(245, 158, 11, 0.25)"
                : isApproved
                ? "rgba(255, 225, 124, 0.25)"
                : "rgba(239, 68, 68, 0.25)"
            }`,
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
              Request Type
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
              {getCorrectionTypeLabel(correction.correction_type)}
            </div>
          </div>

          <div>
            {isPending && (
              <span className="badge badge-warning" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                Pending Review
              </span>
            )}
            {isApproved && (
              <span className="badge badge-success" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                <CheckCircle2 size={13} style={{ marginRight: "0.25rem" }} />
                Approved
              </span>
            )}
            {isRejected && (
              <span className="badge badge-danger" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                <XCircle size={13} style={{ marginRight: "0.25rem" }} />
                Rejected
              </span>
            )}
          </div>
        </div>

        {/* Side-by-Side Punch Comparison */}
        <div>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
            Punch Comparison & Impact
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Left: Original Recorded Punch */}
            <div
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Original Recorded
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Check-in:</span>
                  <span style={{ fontWeight: 600 }}>{formatTime(correction.original_check_in_time || correction.attendance?.check_in_time)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Check-out:</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: !(correction.original_check_out_time || correction.attendance?.check_out_time)
                        ? "var(--color-warning, #f59e0b)"
                        : undefined,
                    }}
                  >
                    {formatTime(correction.original_check_out_time || correction.attendance?.check_out_time)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", paddingTop: "0.25rem", borderTop: "1px dashed var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Location:</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {correction.attendance?.location_status || "VERIFIED_GPS"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Requested Punch Adjustment */}
            <div
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(255, 225, 124, 0.05)",
                border: "1px solid rgba(255, 225, 124, 0.3)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary-text)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Proposed Correction
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Check-in:</span>
                  <span style={{ fontWeight: 600, color: correction.requested_check_in_time ? "var(--color-primary)" : undefined }}>
                    {correction.requested_check_in_time ? formatTime(correction.requested_check_in_time) : "Unchanged"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Check-out:</span>
                  <span style={{ fontWeight: 600, color: correction.requested_check_out_time ? "var(--color-primary)" : undefined }}>
                    {correction.requested_check_out_time ? formatTime(correction.requested_check_out_time) : "Unchanged"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", paddingTop: "0.25rem", borderTop: "1px dashed rgba(255, 225, 124, 0.3)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>New Status:</span>
                  <span style={{ color: "var(--color-primary-text)", fontWeight: 600 }}>MANUALLY_CORRECTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee's Stated Justification */}
        <div
          style={{
            padding: "0.875rem 1rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-surface-subtle, rgba(255, 255, 255, 0.02))",
            border: "1px solid var(--color-border)",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.35rem", textTransform: "uppercase" }}>
            Employee Reason & Notes
          </div>
          <div style={{ color: "var(--color-text)", fontStyle: "italic", lineHeight: 1.5 }}>
            "{correction.reason}"
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            Submitted on {formatDate(correction.created_at)} at {formatTime(correction.created_at)}
          </div>
        </div>

        {/* Decision & Reviewer History */}
        {!isPending && (
          <div
            style={{
              padding: "0.875rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: isApproved ? "rgba(255, 225, 124, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${isApproved ? "rgba(255, 225, 124, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              fontSize: "0.8125rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: "0.25rem" }}>
              Decision History
            </div>
            <div>
              <strong>Decided by: </strong>
              {correction.reviewer
                ? `${correction.reviewer.first_name} ${correction.reviewer.last_name} (${correction.reviewer.email})`
                : "Authorized HR Reviewer"}
            </div>
            {correction.reviewed_at && (
              <div style={{ color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                Decided on: {formatDate(correction.reviewed_at)} at {formatTime(correction.reviewed_at)}
              </div>
            )}
            <div style={{ marginTop: "0.4rem" }}>
              <strong>Reviewer Note: </strong>
              <span>{correction.review_note || "No additional comments provided."}</span>
            </div>
          </div>
        )}

        {/* Review Action Form (for PENDING requests) */}
        {isPending && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "var(--color-text)",
                }}
              >
                Reviewer Decision Note {confirmDecision === "reject" && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <textarea
                className="input-field"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  confirmDecision === "reject"
                    ? "Mandatory: specify why this punch correction is being rejected..."
                    : "Optional approval note or internal verification comment..."
                }
                rows={2}
                disabled={reviewMutation.isPending}
                style={{ width: "100%", padding: "0.65rem", fontSize: "0.875rem", resize: "vertical" }}
              />
            </div>

            {/* Confirmation Banner if Action Selected */}
            {confirmDecision && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: confirmDecision === "approve" ? "rgba(255, 225, 124, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: `1px solid ${confirmDecision === "approve" ? "rgba(255, 225, 124, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertTriangle size={18} style={{ color: confirmDecision === "approve" ? "var(--color-primary-text)" : "#ef4444", flexShrink: 0 }} />
                  <span>
                    Confirm <strong>{confirmDecision.toUpperCase()}</strong> for {employeeName}?
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setConfirmDecision(null)}
                    className="btn btn-sm btn-secondary"
                    disabled={reviewMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDecision}
                    className={`btn btn-sm ${confirmDecision === "approve" ? "btn-primary" : "btn-danger"}`}
                    disabled={reviewMutation.isPending}
                    style={{
                      backgroundColor: confirmDecision === "reject" ? "#ef4444" : undefined,
                      borderColor: confirmDecision === "reject" ? "#ef4444" : undefined,
                      color: "#fff",
                    }}
                  >
                    {reviewMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Committing...</span>
                      </>
                    ) : (
                      `Yes, ${confirmDecision === "approve" ? "Approve" : "Reject"}`
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Initial Action Buttons */}
            {!confirmDecision && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={reviewMutation.isPending}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDecision("reject")}
                  className="btn btn-secondary"
                  style={{ color: "var(--color-danger, #ef4444)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle size={16} />
                  <span>Reject Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDecision("approve")}
                  className="btn btn-primary"
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve Correction</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close Button for already decided requests */}
        {!isPending && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
