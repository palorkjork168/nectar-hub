import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { ApplicationStatus } from "../../types/profile";
import {
  X,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Award,
  Loader2,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Eye,
  AlertCircle,
  Calendar,
  Video,
  UserCheck,
} from "lucide-react";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import HireCandidateModal from "./HireCandidateModal";

interface ApplicantDetailsModalProps {
  applicationId: string | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function ApplicantDetailsModal({
  applicationId,
  onClose,
  onStatusUpdated,
}: ApplicantDetailsModalProps) {
  const queryClient = useQueryClient();
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [hireModalOpen, setHireModalOpen] = useState(false);

  const { data: application, isLoading, error } = useQuery<any>({
    queryKey: ["applicantDetails", applicationId],
    queryFn: async () => {
      const res = await api.get(`/applications/${applicationId}/applicant`);
      return res.data.data.application;
    },
    enabled: Boolean(applicationId),
  });

  const { data: interviews } = useQuery<any[]>({
    queryKey: ["applicationInterviews", applicationId],
    queryFn: async () => {
      const res = await api.get(`/interviews/application/${applicationId}`);
      return res.data.data.interviews;
    },
    enabled: Boolean(applicationId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: ApplicationStatus) => {
      const res = await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicantDetails", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      setStatusSuccess("Status updated successfully!");
      setStatusError("");
      setTimeout(() => setStatusSuccess(""), 3000);
      if (onStatusUpdated) onStatusUpdated();
    },
    onError: (err: any) => {
      setStatusError(err.response?.data?.message || "Failed to update application status");
      setStatusSuccess("");
    },
  });

  if (!applicationId) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            <Clock size={12} /> Pending Review
          </span>
        );
      case "REVIEWING":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(37, 99, 235, 0.12)", color: "#1d4ed8", border: "1px solid rgba(37, 99, 235, 0.3)" }}>
            <Eye size={12} /> In Review
          </span>
        );
      case "INTERVIEW":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(124, 58, 237, 0.12)", color: "#6d28d9", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
            <HelpCircle size={12} /> Interview
          </span>
        );
      case "ACCEPTED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const applicant = application?.applicant;
  const profile = applicant?.UserProfile;
  const resumeUrl = application?.cv_url || profile?.resume_url;
  const skillsList = applicant?.UserSkills || applicant?.UserSkill || [];
  const experienceList = applicant?.Experiences || applicant?.Experience || [];
  const educationList = applicant?.Education || applicant?.Educations || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "780px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
              Candidate Application Details
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Applying for <strong>{application?.Job?.title}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isLoading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <Loader2 className="animate-spin" size={24} style={{ color: "var(--primary)" }} />
              <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Loading applicant profile...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--danger-bg)",
                color: "var(--danger-text)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} />
              <span>Failed to load applicant details.</span>
            </div>
          )}

          {!isLoading && application && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Status & Change Actions */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--bg-color)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>Current Status:</span>
                  {getStatusBadge(application.status)}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(true)}
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Calendar size={13} />
                    <span>Schedule Interview</span>
                  </button>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>Change to:</span>
                  {(["PENDING", "REVIEWING", "INTERVIEW", "ACCEPTED", "REJECTED"] as ApplicationStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStatusMutation.mutate(st)}
                      disabled={updateStatusMutation.isPending || application.status === st}
                      className={`btn ${application.status === st ? "btn-primary" : "btn-secondary"}`}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.55rem",
                        opacity: application.status === st ? 0.6 : 1,
                      }}
                    >
                      {st}
                    </button>
                  ))}

                  {/* Hire Candidate Action */}
                  {application.status === "ACCEPTED" && (
                    applicant?.employeeProfile ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.28rem 0.65rem",
                          borderRadius: "9999px",
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#059669",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          marginLeft: "0.25rem",
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Hired as Employee {applicant.employeeProfile.department ? `(${applicant.employeeProfile.department})` : ""}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHireModalOpen(true)}
                        className="btn btn-primary"
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          backgroundColor: "var(--success)",
                          borderColor: "var(--success)",
                          color: "#ffffff",
                          fontWeight: 600,
                          marginLeft: "0.25rem",
                        }}
                      >
                        <UserCheck size={14} />
                        <span>Hire Candidate</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Scheduled Interviews Section */}
              {interviews && interviews.length > 0 && (
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    backgroundColor: "rgba(37, 99, 235, 0.04)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(37, 99, 235, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--primary)" }}>
                      <Calendar size={16} />
                      <span>Scheduled Interviews ({interviews.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleModalOpen(true)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    >
                      + Schedule Another
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {interviews.map((iv: any) => (
                      <div
                        key={iv.id}
                        style={{
                          padding: "0.6rem 0.75rem",
                          backgroundColor: "#ffffff",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--text-main)" }}>
                            {new Date(iv.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </strong>{" "}
                          ({iv.duration_minutes} mins) • <span style={{ color: "var(--primary)", fontWeight: 500 }}>{iv.interview_type}</span>
                          {iv.location && <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>• {iv.location}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {iv.meeting_link && (
                            <a
                              href={iv.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost"
                              style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem", color: "var(--primary)" }}
                            >
                              <Video size={13} /> Link
                            </a>
                          )}
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "9999px",
                              backgroundColor:
                                iv.status === "SCHEDULED"
                                  ? "rgba(37, 99, 235, 0.1)"
                                  : iv.status === "COMPLETED"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                              color:
                                iv.status === "SCHEDULED"
                                  ? "var(--primary)"
                                  : iv.status === "COMPLETED"
                                  ? "var(--success)"
                                  : "var(--danger)",
                            }}
                          >
                            {iv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {statusSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontSize: "0.8125rem" }}>
                  <CheckCircle2 size={15} />
                  <span>{statusSuccess}</span>
                </div>
              )}

              {statusError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)", fontSize: "0.8125rem" }}>
                  <AlertCircle size={15} />
                  <span>{statusError}</span>
                </div>
              )}

              {/* Candidate Info Card */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-bg)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    overflow: "hidden",
                    border: "2px solid var(--border-color)",
                    flexShrink: 0,
                  }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    `${applicant?.first_name?.charAt(0) || ""}${applicant?.last_name?.charAt(0) || ""}`.toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {applicant?.first_name} {applicant?.last_name}
                  </h4>
                  <div style={{ fontSize: "0.9375rem", color: "var(--primary)", fontWeight: 500, marginTop: "0.15rem" }}>
                    {profile?.professional_title || "Job Applicant"}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Mail size={13} />
                      <span>{applicant?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Phone size={13} />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {(profile?.city || profile?.country) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <MapPin size={13} />
                        <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: "0.8125rem", padding: "0.4rem 0.8rem", gap: "0.35rem" }}
                  >
                    <FileText size={15} />
                    <span>View Resume (PDF)</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <h5 style={{ margin: "0 0 0.4rem 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Professional Summary
                  </h5>
                  <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-line" }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Cover Letter */}
              {application.cover_letter && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <h5 style={{ margin: "0 0 0.4rem 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Cover Letter
                  </h5>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "var(--bg-color)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      color: "var(--text-main)",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {application.cover_letter}
                  </div>
                </div>
              )}

              {/* Candidate Skills */}
              {skillsList.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Award size={16} style={{ color: "var(--primary)" }} />
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)" }}>
                      Skills & Proficiency
                    </h5>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {skillsList.map((sk: any) => (
                      <span
                        key={sk.id}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          padding: "0.25rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-color)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-main)",
                        }}
                      >
                        {sk.skill_name} {sk.level && <strong style={{ color: "var(--primary)", marginLeft: "0.25rem" }}>({sk.level})</strong>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Experience */}
              {experienceList.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Briefcase size={16} style={{ color: "var(--primary)" }} />
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)" }}>
                      Work Experience
                    </h5>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {experienceList.map((exp: any) => (
                      <div key={exp.id} style={{ fontSize: "0.8125rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {exp.position} at <span style={{ color: "var(--primary)" }}>{exp.company_name}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                          {exp.employment_type} {exp.location && `• ${exp.location}`} • {exp.start_date} - {exp.is_current ? "Present" : exp.end_date || "N/A"}
                        </div>
                        {exp.description && (
                          <div style={{ color: "var(--text-muted)", marginTop: "0.25rem", whiteSpace: "pre-line" }}>
                            {exp.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Education */}
              {educationList.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <GraduationCap size={16} style={{ color: "var(--primary)" }} />
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)" }}>
                      Education Credentials
                    </h5>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {educationList.map((edu: any) => (
                      <div key={edu.id} style={{ fontSize: "0.8125rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {edu.institution} {edu.degree && `— ${edu.degree}`}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                          {edu.field_of_study && `Field: ${edu.field_of_study} • `}
                          {edu.start_date} - {edu.is_current ? "Present" : edu.end_date || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>

      {scheduleModalOpen && (
        <ScheduleInterviewModal
          applicationId={application.id}
          candidateName={`${applicant?.first_name || ""} ${applicant?.last_name || ""}`.trim()}
          jobTitle={application?.Job?.title}
          onClose={() => setScheduleModalOpen(false)}
          onScheduled={() => {
            queryClient.invalidateQueries({ queryKey: ["applicantDetails", applicationId] });
            queryClient.invalidateQueries({ queryKey: ["applicationInterviews", applicationId] });
            if (onStatusUpdated) onStatusUpdated();
          }}
        />
      )}

      {hireModalOpen && (
        <HireCandidateModal
          applicationId={application.id}
          candidateName={`${applicant?.first_name || ""} ${applicant?.last_name || ""}`.trim()}
          candidateEmail={applicant?.email || ""}
          jobTitle={application?.Job?.title}
          companyName={application?.Job?.Company?.name}
          companyId={application?.Job?.Company?.id}
          onClose={() => setHireModalOpen(false)}
          onHired={() => {
            queryClient.invalidateQueries({ queryKey: ["applicantDetails", applicationId] });
            queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
            if (onStatusUpdated) onStatusUpdated();
          }}
        />
      )}
    </div>
  );
}
