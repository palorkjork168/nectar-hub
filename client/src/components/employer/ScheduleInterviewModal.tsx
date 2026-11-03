import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { InterviewType, CreateInterviewPayload } from "../../types/interview";
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ScheduleInterviewModalProps {
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
  onClose: () => void;
  onScheduled?: () => void;
}

export default function ScheduleInterviewModal({
  applicationId,
  candidateName,
  jobTitle,
  onClose,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const queryClient = useQueryClient();

  // Tomorrow morning default
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
  };

  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewType, setInterviewType] = useState<InterviewType>("VIDEO");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const scheduleMutation = useMutation({
    mutationFn: async (payload: CreateInterviewPayload) => {
      const res = await api.post("/interviews", payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMessage("Interview successfully scheduled!");
      queryClient.invalidateQueries({ queryKey: ["applicationInterviews", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applicantDetails", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      queryClient.invalidateQueries({ queryKey: ["employerInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });

      setTimeout(() => {
        if (onScheduled) onScheduled();
        onClose();
      }, 1200);
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Failed to schedule interview"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!scheduledAt) {
      setFormError("Please select a date and time for the interview.");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setFormError("Please select a valid date and time.");
      return;
    }

    if (interviewType === "VIDEO" && meetingLink.trim()) {
      try {
        new URL(meetingLink.trim());
      } catch {
        setFormError("Please provide a valid URL for the video meeting link.");
        return;
      }
    }

    const payload: CreateInterviewPayload = {
      application_id: applicationId,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: durationMinutes,
      interview_type: interviewType,
      location: location.trim() || undefined,
      meeting_link: meetingLink.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    scheduleMutation.mutate(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "560px" }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              Schedule Candidate Interview
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {candidateName ? <strong>{candidateName}</strong> : "Candidate"}
              {jobTitle && <span> • {jobTitle}</span>}
            </p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {successMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--color-success-soft)",
                  color: "var(--color-success-text)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  marginBottom: "1.25rem",
                  border: "1px solid rgba(255, 225, 124, 0.2)",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {formError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--color-danger-soft)",
                  color: "var(--color-danger-text)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  marginBottom: "1.25rem",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Date & Time and Duration Grid */}
            <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Calendar size={14} /> Date & Time <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Clock size={14} /> Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="form-select"
                  style={{ width: "100%" }}
                >
                  <option value={15}>15 minutes (Screening)</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes (In-depth)</option>
                  <option value={60}>60 minutes (1 Hour)</option>
                  <option value={90}>90 minutes (Technical / Panel)</option>
                </select>
              </div>
            </div>

            {/* Interview Type Selector */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Interview Format</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {[
                  { type: "VIDEO" as InterviewType, label: "Video Call", icon: Video },
                  { type: "IN_PERSON" as InterviewType, label: "In Person", icon: MapPin },
                  { type: "PHONE" as InterviewType, label: "Phone Call", icon: Phone },
                ].map(({ type, label, icon: Icon }) => {
                  const isSelected = interviewType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        padding: "0.75rem 0.5rem",
                        borderRadius: "var(--radius-md)",
                        border: isSelected
                          ? "2px solid var(--primary)"
                          : "1px solid var(--border-color)",
                        backgroundColor: isSelected
                          ? "rgba(37, 99, 235, 0.08)"
                          : "var(--bg-color)",
                        color: isSelected ? "var(--primary)" : "var(--text-main)",
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional fields based on type */}
            {interviewType === "VIDEO" && (
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <LinkIcon size={14} /> Video Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij or Zoom link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {interviewType === "IN_PERSON" && (
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <MapPin size={14} /> Office Location / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4th Floor, Conference Room B, Monivong Blvd"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {interviewType === "PHONE" && (
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Phone size={14} /> Phone Number / Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interviewer will dial candidate's registered phone number"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {/* Notes / Agenda */}
            <div className="form-group">
              <label className="form-label">Agenda / Candidate Notes</label>
              <textarea
                placeholder="Topics to cover, technical exercise instructions, or interviewer team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending || Boolean(successMessage)}
              className="btn btn-primary"
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={15} /> Scheduling...
                </>
              ) : (
                "Confirm & Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
