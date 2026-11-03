import { useState } from "react";
import Modal from "../common/Modal";
import { useBatchReviewCorrections } from "../../hooks/useAttendance";
import { useToast } from "../../contexts/ToastContext";
import {
  CheckCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import type { AttendanceCorrectionRequest, BatchReviewResult } from "../../types/attendance";

interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCorrections: AttendanceCorrectionRequest[];
  onSuccess?: () => void;
}

export default function BatchApprovalModal({
  isOpen,
  onClose,
  selectedCorrections,
  onSuccess,
}: BatchApprovalModalProps) {
  const toast = useToast();
  const batchMutation = useBatchReviewCorrections();

  const [reviewNote, setReviewNote] = useState("Bulk approved by reviewer.");
  const [result, setResult] = useState<BatchReviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleBatchApprove = async () => {
    setErrorMessage("");
    const ids = selectedCorrections.map((c) => c.id);

    try {
      const res = await batchMutation.mutateAsync({
        correctionIds: ids,
        decision: "APPROVED",
        reviewNote: reviewNote.trim() || undefined,
      });

      setResult(res);
      if (res.failed.length === 0) {
        toast.success(`Successfully approved all ${res.succeeded.length} correction requests!`);
      } else {
        toast.info(
          `Batch completed with partial results: ${res.succeeded.length} approved, ${res.failed.length} failed.`
        );
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to execute batch approval."
      );
    }
  };

  const handleFinish = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={result ? handleFinish : onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCheck size={20} style={{ color: "var(--color-primary-text)" }} />
          <span>Batch Approve Correction Requests</span>
        </div>
      }
      description={
        result
          ? "Batch processing summary report."
          : `You have selected ${selectedCorrections.length} pending correction request${
              selectedCorrections.length === 1 ? "" : "s"
            } for approval.`
      }
      maxWidth="580px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {errorMessage && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.875rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Before Execution: Confirmation & Affected Items */}
        {!result && (
          <>
            <div
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(255, 225, 124, 0.08)",
                border: "1px solid rgba(255, 225, 124, 0.25)",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
              }}
            >
              <AlertTriangle size={18} style={{ color: "var(--color-primary-text)", flexShrink: 0, marginTop: "0.1rem" }} />
              <div style={{ lineHeight: 1.5 }}>
                Approving these requests will recalculate shift metrics (worked hours, lateness, completion %), update
                attendance records with <code style={{ color: "var(--color-primary-text)" }}>MANUALLY_CORRECTED</code>, and
                resolve any open-shift check-in deadlocks.
              </div>
            </div>

            {/* List of Affected Employees */}
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.4rem" }}>
                Selected Requests ({selectedCorrections.length})
              </div>
              <div
                style={{
                  maxHeight: "160px",
                  overflowY: "auto",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-bg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  fontSize: "0.8125rem",
                }}
              >
                {selectedCorrections.map((corr) => {
                  const empName = corr.user ? `${corr.user.first_name} ${corr.user.last_name}` : "Employee";
                  return (
                    <div
                      key={corr.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.25rem 0",
                        borderBottom: "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.05))",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{empName}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>{corr.correction_type}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Bulk Review Note */}
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
                Bulk Approval Note
              </label>
              <input
                type="text"
                className="input-field"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Bulk approved by reviewer..."
                disabled={batchMutation.isPending}
                style={{ width: "100%", height: "40px" }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={batchMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchApprove}
                className="btn btn-primary"
                disabled={batchMutation.isPending || selectedCorrections.length === 0}
              >
                {batchMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing {selectedCorrections.length} Items...</span>
                  </>
                ) : (
                  `Confirm Approve (${selectedCorrections.length})`
                )}
              </button>
            </div>
          </>
        )}

        {/* After Execution: Itemized Breakdown */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  padding: "0.875rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(255, 225, 124, 0.1)",
                  border: "1px solid rgba(255, 225, 124, 0.3)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-text)" }}>
                  {result.succeeded.length}
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                  Succeeded
                </div>
              </div>

              <div
                style={{
                  padding: "0.875rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: result.failed.length > 0 ? "rgba(239, 68, 68, 0.1)" : "var(--color-bg)",
                  border: `1px solid ${result.failed.length > 0 ? "rgba(239, 68, 68, 0.3)" : "var(--color-border)"}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: result.failed.length > 0 ? "#ef4444" : "var(--color-text-muted)",
                  }}
                >
                  {result.failed.length}
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                  Failed
                </div>
              </div>
            </div>

            {/* If any failures occurred, show itemized errors */}
            {result.failed.length > 0 && (
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.4rem" }}>
                  Failed Items ({result.failed.length})
                </div>
                <div
                  style={{
                    maxHeight: "140px",
                    overflowY: "auto",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {result.failed.map((f) => (
                    <div key={f.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.25rem 0" }}>
                      <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem" }}>{f.id.slice(0, 8)}...</span>
                      <span style={{ color: "var(--color-text-secondary)" }}>— {f.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" onClick={handleFinish} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
