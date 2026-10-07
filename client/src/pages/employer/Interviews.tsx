import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { Interview, InterviewStatus, InterviewType } from "../../types/interview";
import ApplicantDetailsModal from "../../components/employer/ApplicantDetailsModal";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  ExternalLink,
  Edit2,
  X,
  PlusCircle,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { SkeletonTableRow } from "../../components/common/Skeleton";
import { useToast } from "../../contexts/ToastContext";

export default function Interviews() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("UPCOMING");
  const [activeApplicantId, setActiveApplicantId] = useState<string | null>(null);

  // Modals
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [editType, setEditType] = useState<InterviewType>("VIDEO");
  const [editLocation, setEditLocation] = useState("");
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");

  const [completingInterviewId, setCompletingInterviewId] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const [cancellingInterviewId, setCancellingInterviewId] = useState<string | null>(null);

  const { data: interviews, isLoading, error } = useQuery<Interview[]>({
    queryKey: ["employerInterviews"],
    queryFn: async () => {
      const res = await api.get("/interviews/employer/my");
      return res.data.data.interviews;
    },
    staleTime: 60 * 1000,
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/interviews/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["applicationInterviews"] });
      setEditingInterview(null);
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.message || "Failed to update interview");
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await api.patch(`/interviews/${id}/complete`, { notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["applicationInterviews"] });
      setCompletingInterviewId(null);
      setCompleteNotes("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to complete interview");
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/interviews/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["applicationInterviews"] });
      setCancellingInterviewId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to cancel interview");
    },
  });

  const openEditModal = (iv: Interview) => {
    setEditingInterview(iv);
    // Format date for datetime-local
    const d = new Date(iv.scheduled_at);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setEditScheduledAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setEditDuration(iv.duration_minutes || 30);
    setEditType(iv.interview_type);
    setEditLocation(iv.location || "");
    setEditMeetingLink(iv.meeting_link || "");
    setEditNotes(iv.notes || "");
    setEditError("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInterview) return;

    if (!editScheduledAt) {
      setEditError("Please select an interview date and time.");
      return;
    }

    editMutation.mutate({
      id: editingInterview.id,
      payload: {
        scheduled_at: new Date(editScheduledAt).toISOString(),
        duration_minutes: editDuration,
        interview_type: editType,
        location: editLocation.trim() || undefined,
        meeting_link: editMeetingLink.trim() || undefined,
        notes: editNotes.trim() || undefined,
      },
    });
  };

  const now = new Date();

  const filteredInterviews = (interviews || []).filter((iv) => {
    if (filter === "UPCOMING") {
      return iv.status === "SCHEDULED" && new Date(iv.scheduled_at) >= now;
    }
    if (filter === "ALL") return true;
    return iv.status === filter;
  });

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              color: "#1d4ed8",
              border: "1px solid rgba(37, 99, 235, 0.25)",
            }}
          >
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            Cancelled
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Back Navigation */}
      <BackButton label="Back to Dashboard" fallback="/employer/dashboard" />

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">Interview Management</h1>
          <p className="dashboard-subtitle">
            Coordinate video screenings, on-site interviews, and candidate evaluations
          </p>
        </div>
        <Link to="/employer/applicants" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
          <Users size={16} /> Select Candidate to Schedule
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Upcoming Interviews", value: "UPCOMING" },
          { label: "All Interviews", value: "ALL" },
          { label: "Scheduled", value: "SCHEDULED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`btn ${filter === tab.value ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.8125rem", padding: "0.4rem 0.8rem" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate & Job</th>
                <th>Scheduled Date & Time</th>
                <th>Format</th>
                <th>Meeting Details</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <AlertCircle size={18} />
          <span>Failed to load interviews. Please try again.</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredInterviews.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", alignItems: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-bg)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <Calendar size={30} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            {filter === "UPCOMING"
              ? "No upcoming interviews scheduled"
              : `No ${filter.toLowerCase()} interviews found`}
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            Screen your inbound candidates and schedule online or in-person interviews to advance your hiring pipeline.
          </p>
          <Link to="/employer/applicants" className="btn btn-primary">
            <PlusCircle size={16} /> Review Applicants to Schedule
          </Link>
        </div>
      )}

      {/* Interviews Table */}
      {!isLoading && filteredInterviews.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate & Job</th>
                <th>Scheduled Date & Time</th>
                <th>Format</th>
                <th>Meeting Details</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((iv) => {
                const applicant = iv.application?.applicant;
                const profile = applicant?.UserProfile;
                const job = iv.application?.Job;
                const scheduledDate = new Date(iv.scheduled_at);

                return (
                  <tr key={iv.id}>
                    {/* Candidate */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary-bg)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            `${applicant?.first_name?.charAt(0) || ""}${applicant?.last_name?.charAt(0) || ""}`.toUpperCase()
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => iv.application_id && setActiveApplicantId(iv.application_id)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontWeight: 600,
                              color: "var(--text-main)",
                              fontSize: "0.9375rem",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                          >
                            {applicant?.first_name} {applicant?.last_name}
                          </button>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                            Applying for: <strong>{job?.title}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-main)" }}>
                          {scheduledDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          <Clock size={12} />
                          <span>
                            {scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>•</span>
                          <span>{iv.duration_minutes} mins</span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", fontWeight: 500 }}>
                        {iv.interview_type === "VIDEO" && <Video size={14} style={{ color: "var(--primary)" }} />}
                        {iv.interview_type === "IN_PERSON" && <MapPin size={14} style={{ color: "#059669" }} />}
                        {iv.interview_type === "PHONE" && <Phone size={14} style={{ color: "#7c3aed" }} />}
                        <span>
                          {iv.interview_type === "VIDEO"
                            ? "Video Call"
                            : iv.interview_type === "IN_PERSON"
                            ? "In Person"
                            : "Phone Call"}
                        </span>
                      </div>
                    </td>

                    {/* Meeting Link / Location */}
                    <td>
                      {iv.interview_type === "VIDEO" && iv.meeting_link ? (
                        <a
                          href={iv.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem", display: "inline-flex", gap: "0.3rem" }}
                        >
                          <Video size={12} />
                          <span>Join Meeting</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : iv.location ? (
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-main)" }}>{iv.location}</span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>No link provided</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>{getStatusBadge(iv.status)}</td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        {iv.status === "SCHEDULED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCompletingInterviewId(iv.id)}
                              className="btn btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              title="Mark as Completed"
                            >
                              <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
                              <span>Complete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(iv)}
                              className="btn btn-ghost"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.45rem" }}
                              title="Reschedule / Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingInterviewId(iv.id)}
                              className="btn btn-ghost"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.45rem", color: "var(--danger)" }}
                              title="Cancel Interview"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => iv.application_id && setActiveApplicantId(iv.application_id)}
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        >
                          Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Interview Modal */}
      {editingInterview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                Reschedule / Edit Interview
              </h3>
              <button onClick={() => setEditingInterview(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && (
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "var(--danger-bg)",
                      color: "var(--danger-text)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8125rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {editError}
                  </div>
                )}

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editScheduledAt}
                      onChange={(e) => setEditScheduledAt(e.target.value)}
                      className="input-field"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={editDuration}
                      onChange={(e) => setEditDuration(parseInt(e.target.value, 10))}
                      className="input-field"
                      style={{ width: "100%" }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Format</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as InterviewType)}
                    className="input-field"
                    style={{ width: "100%" }}
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="IN_PERSON">In Person</option>
                    <option value="PHONE">Phone Call</option>
                  </select>
                </div>

                {editType === "VIDEO" ? (
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Meeting Link</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={editMeetingLink}
                      onChange={(e) => setEditMeetingLink(e.target.value)}
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Location / Phone Instructions</label>
                    <input
                      type="text"
                      placeholder="Office address or phone instructions"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingInterview(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editMutation.isPending} className="btn btn-primary">
                  {editMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Interview Modal */}
      {completingInterviewId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                Mark Interview as Completed
              </h3>
              <button onClick={() => setCompletingInterviewId(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "var(--text-main)" }}>
                Confirm that this interview has been conducted. You may record optional debrief notes below.
              </p>
              <div className="form-group">
                <label className="form-label">Interview Debrief / Feedback (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Candidate strengths, evaluation score, or next step recommendation..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setCompletingInterviewId(null)} className="btn btn-secondary">
                Back
              </button>
              <button
                type="button"
                disabled={completeMutation.isPending}
                onClick={() =>
                  completeMutation.mutate({
                    id: completingInterviewId,
                    notes: completeNotes.trim() || undefined,
                  })
                }
                className="btn btn-primary"
              >
                {completeMutation.isPending ? "Marking..." : "Confirm Completed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingInterviewId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--danger)" }}>
                Cancel Interview?
              </h3>
              <button onClick={() => setCancellingInterviewId(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                Are you sure you want to cancel this interview? The status will be marked as <strong>CANCELLED</strong> for candidate visibility and records.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setCancellingInterviewId(null)} className="btn btn-secondary">
                Keep Interview
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancellingInterviewId)}
                className="btn btn-danger"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Details Modal */}
      {activeApplicantId && (
        <ApplicantDetailsModal
          applicationId={activeApplicantId}
          onClose={() => setActiveApplicantId(null)}
          onStatusUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["employerInterviews"] });
          }}
        />
      )}
    </div>
  );
}
