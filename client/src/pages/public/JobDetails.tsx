import { useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import type { GetJobResponse, GetJobSkillsResponse, JobSkill } from "../../types/job";
import {
  Building2,
  MapPin,
  Clock,
  Globe2,
  Bookmark,
  BookmarkCheck,
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  Loader2,
  X,
  FileText,
  Link2,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

function formatDisplayDate(dateStr?: string | Date | null, fallback = "Recently"): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? fallback : d.toLocaleDateString();
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isJobSeeker } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Lock body scroll when apply modal is open
  useBodyScrollLock(isApplyModalOpen);

  // 1. Fetch Job Details
  const {
    data: jobData,
    isLoading: isJobLoading,
    isError: isJobError,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const response = await api.get<GetJobResponse>(`/jobs/${id}`);
      return response.data.data.job;
    },
    enabled: !!id,
  });

  useDocumentTitle(jobData ? `Nectar Hub | ${jobData.title}` : "Nectar Hub | Job Details");

  // 2. Fetch Job Skills
  const { data: skillsData } = useQuery({
    queryKey: ["job-skills", id],
    queryFn: async () => {
      const response = await api.get<GetJobSkillsResponse>(`/jobs/${id}/skills`);
      return response.data.data.skills;
    },
    enabled: !!id,
  });

  // 3. Fetch Saved Status (Only if logged in)
  const { data: savedData, isLoading: isSavedLoading } = useQuery({
    queryKey: ["job-saved", id],
    queryFn: async () => {
      const response = await api.get(`/jobs/${id}/saved`);
      return response.data.data.saved as boolean;
    },
    enabled: !!id && !!user,
  });

  const isSaved = !!savedData;

  // 4. Save / Unsave Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/jobs/${id}/save`);
      } else {
        await api.post(`/jobs/${id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-saved", id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update saved job.");
    },
  });

  // 5. Apply Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: { cover_letter?: string; cv_url?: string }) => {
      const response = await api.post(`/applications/jobs/${id}/apply`, data);
      return response.data;
    },
    onSuccess: () => {
      setApplySuccess(true);
      setApplyError("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to submit application";
      setApplyError(msg);
      if (msg.toLowerCase().includes("already applied")) {
        setApplySuccess(true);
      }
    },
  });

  const handleSaveClick = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    saveMutation.mutate();
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!isJobSeeker) {
      toast.info("Only Job Seeker accounts can apply for jobs. Please log in with a Job Seeker account.");
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");
    applyMutation.mutate({
      cover_letter: coverLetter.trim() || undefined,
      cv_url: cvUrl.trim() || undefined,
    });
  };

  const formatEmploymentType = (type?: string) => {
    switch (type) {
      case "FULL_TIME": return "Full-Time";
      case "PART_TIME": return "Part-Time";
      case "CONTRACT": return "Contract";
      case "INTERNSHIP": return "Internship";
      case "FREELANCE": return "Freelance";
      default: return type || "";
    }
  };

  const formatExperienceLevel = (level?: string | null) => {
    if (!level) return null;
    switch (level) {
      case "ENTRY": return "Entry Level";
      case "JUNIOR": return "Junior";
      case "MID": return "Mid Level";
      case "SENIOR": return "Senior";
      case "LEAD": return "Lead / Manager";
      default: return level;
    }
  };

  const formatSalary = () => {
    if (!jobData) return null;
    const currency = jobData.salary_currency || "$";
    if (jobData.salary_min && jobData.salary_max) {
      return `${currency}${jobData.salary_min.toLocaleString()} - ${currency}${jobData.salary_max.toLocaleString()} / month`;
    }
    if (jobData.salary_min) {
      return `From ${currency}${jobData.salary_min.toLocaleString()} / month`;
    }
    if (jobData.salary_max) {
      return `Up to ${currency}${jobData.salary_max.toLocaleString()} / month`;
    }
    return "Competitive Salary";
  };

  const getInitials = (name?: string) => {
    if (!name) return "SO";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isJobLoading) {
    return (
      <div className="job-details-container">
        <div className="skeleton" style={{ height: "24px", width: "120px", marginBottom: "1.5rem" }} />
        <div className="card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="skeleton" style={{ width: "64px", height: "64px", borderRadius: "var(--radius-md)" }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: "28px", width: "60%", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "30%" }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: "40px", width: "100%" }} />
        </div>
        <div className="skeleton" style={{ height: "300px", width: "100%", borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  if (isJobError || !jobData) {
    return (
      <div className="job-details-container">
        <div className="card empty-state" style={{ padding: "4rem 2rem" }}>
          <div className="empty-state-icon" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <AlertCircle size={32} />
          </div>
          <h2>Job Opening Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            This job listing may have been closed or removed by the employer.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            <ChevronLeft size={16} /> Return to Job Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-container">
      {/* Back Navigation & Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "1rem" }}>
        <BackButton label="Back to Jobs" fallback="/jobs" style={{ marginBottom: 0 }} />
        <div className="breadcrumb" style={{ margin: 0 }}>
          <Link to="/jobs" style={{ textDecoration: "none", color: "inherit" }}>
            All Jobs
          </Link>
          <span>/</span>
          <span style={{ color: "var(--text-main)", fontWeight: 500, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={jobData.title}>
            {jobData.title}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="job-header-card">
        <div className="job-header-top">
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div className="company-avatar" style={{ width: "64px", height: "64px", fontSize: "1.25rem" }}>
              {jobData.Company?.logo_url ? (
                <img src={jobData.Company.logo_url} alt={jobData.Company.name} />
              ) : (
                getInitials(jobData.Company?.name)
              )}
            </div>
            <div>
              <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0 0 0.5rem 0", lineHeight: 1.25 }}>
                {jobData.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>
                <Building2 size={16} />
                <strong style={{ color: "var(--text-main)" }}>{jobData.Company?.name || "Company"}</strong>
                {jobData.Company?.industry && <span>• {jobData.Company.industry}</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={handleSaveClick}
              disabled={saveMutation.isPending || isSavedLoading}
              className={`btn ${isSaved ? "btn-secondary" : "btn-ghost"}`}
              style={{
                borderColor: isSaved ? "var(--primary)" : undefined,
                color: isSaved ? "var(--primary)" : undefined,
                padding: "0.75rem 1rem",
              }}
              title={isSaved ? "Saved Job" : "Save Job"}
            >
              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            {applySuccess ? (
              <div className="badge badge-success" style={{ padding: "0.75rem 1.25rem", fontSize: "0.9375rem" }}>
                <CheckCircle2 size={16} /> Applied
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}
              >
                <Send size={16} /> Apply Now
              </button>
            )}
          </div>
        </div>

        {/* Metadata Badges Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)" }}>
          <div className="meta-item">
            <MapPin size={16} style={{ color: "var(--primary)" }} />
            <span>{jobData.location}</span>
          </div>

          {jobData.is_remote && (
            <div className="meta-item" style={{ color: "var(--primary)" }}>
              <Globe2 size={16} />
              <span>Remote Available</span>
            </div>
          )}

          <div className="meta-item">
            <span className="badge-pill badge-pill-primary">
              {formatEmploymentType(jobData.employment_type)}
            </span>
          </div>

          {jobData.experience_level && (
            <div className="meta-item">
              <span className="badge-pill badge-pill-gray">
                {formatExperienceLevel(jobData.experience_level)}
              </span>
            </div>
          )}

          <div className="meta-item" style={{ marginLeft: "auto", fontWeight: 600, color: "#059669" }}>
            {formatSalary()}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Main Details + Sidebar Info */}
      <div className="job-details-grid">
        {/* Left Main Content */}
        <div>
          {/* Description */}
          <div className="job-content-card">
            <h3 className="job-content-title">About the Role</h3>
            <div className="job-prose">
              {jobData.description}
            </div>
          </div>

          {/* Responsibilities */}
          {jobData.responsibilities && (
            <div className="job-content-card">
              <h3 className="job-content-title">Key Responsibilities</h3>
              <div className="job-prose">
                {jobData.responsibilities}
              </div>
            </div>
          )}

          {/* Requirements */}
          {jobData.requirements && (
            <div className="job-content-card">
              <h3 className="job-content-title">Qualifications & Requirements</h3>
              <div className="job-prose">
                {jobData.requirements}
              </div>
            </div>
          )}

          {/* Skills Required / Preferred */}
          {skillsData && skillsData.length > 0 && (
            <div className="job-content-card">
              <h3 className="job-content-title">Technical Skills & Technologies</h3>
              <div className="skills-container">
                {skillsData.map((s: JobSkill) => (
                  <span
                    key={s.id}
                    className={`skill-tag ${s.is_required ? "" : "preferred"}`}
                  >
                    {s.skill_name}
                    {s.is_required && <span style={{ fontSize: "0.6875rem", opacity: 0.8 }}>(Required)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Info */}
        <div>
          {/* Job Overview Card */}
          <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.125rem", margin: "0 0 1.25rem 0" }}>Job Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Posted On</div>
                  <div style={{ fontWeight: 500 }}>{formatDisplayDate(jobData.created_at || (jobData as any).createdAt)}</div>
                </div>
              </div>

              {jobData.application_deadline && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Deadline</div>
                    <div style={{ fontWeight: 500 }}>{formatDisplayDate(jobData.application_deadline)}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <MapPin size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Job Location</div>
                  <div style={{ fontWeight: 500 }}>{jobData.location}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Globe2 size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Workplace Type</div>
                  <div style={{ fontWeight: 500 }}>{jobData.is_remote ? "Remote (Anywhere)" : "On-site"}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)" }}>
              {applySuccess ? (
                <div className="badge badge-success" style={{ width: "100%", justifyContent: "center", padding: "0.625rem" }}>
                  <CheckCircle2 size={16} /> Application Sent
                </div>
              ) : (
                <button
                  onClick={handleApplyClick}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.75rem" }}
                >
                  <Send size={16} /> Apply for this position
                </button>
              )}
            </div>
          </div>

          {/* About Company Card */}
          {jobData.Company && (
            <div className="card" style={{ padding: "1.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", margin: "0 0 1rem 0" }}>About the Company</h3>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)" }}>{jobData.Company.name}</h4>
              {jobData.Company.description ? (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  {jobData.Company.description}
                </p>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  A verified employer on Nectar Hub.
                </p>
              )}

              {jobData.Company.website && (
                <a
                  href={jobData.Company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ width: "100%", fontSize: "0.8125rem" }}
                >
                  Visit Website <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setIsApplyModalOpen(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setIsApplyModalOpen(false); }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Apply for {jobData.title}</h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  {jobData.Company?.name}
                </p>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            {applySuccess ? (
              <div className="modal-body" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "var(--success-bg)",
                    color: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Application Submitted!</h3>
                <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
                  Your application and profile have been delivered to the hiring team at {jobData.Company?.name}.
                </p>
                <button onClick={() => setIsApplyModalOpen(false)} className="btn btn-primary">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div className="modal-body">
                  {applyError && (
                    <div
                      style={{
                        padding: "0.75rem",
                        marginBottom: "1rem",
                        backgroundColor: "var(--danger-bg)",
                        color: "var(--danger)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {applyError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <FileText size={15} /> Cover Letter <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows={5}
                      placeholder="Share why you're a great fit for this position and company..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      maxLength={5000}
                    />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textAlign: "right", marginTop: "0.25rem" }}>
                      {coverLetter.length} / 5000 characters
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Link2 size={15} /> Online CV / Portfolio URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://example.com/my-resume.pdf"
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyMutation.isPending}
                    className="btn btn-primary"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spinner" /> Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
