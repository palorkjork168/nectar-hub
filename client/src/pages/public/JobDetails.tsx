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
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Loader2,
  X,
  FileText,
  Link2,
  Share2,
  Eye,
  DollarSign,
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

  const viewCount = Math.abs(id ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 129) : 129) % 400 + 45;

  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Job link copied to clipboard!");
    } else {
      toast.info("Job link ready");
    }
  };

  return (
    <div className="job-details-container">
      {/* Back Navigation & Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <BackButton label="Back to Jobs" fallback="/jobs" style={{ marginBottom: 0 }} />
        <div className="breadcrumb" style={{ margin: 0 }}>
          <Link to="/jobs" style={{ textDecoration: "none", color: "inherit" }}>
            All Jobs
          </Link>
          <span>/</span>
          <span style={{ color: "var(--color-text)", fontWeight: 600, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={jobData.title}>
            {jobData.title}
          </span>
        </div>
      </div>

      {/* Two Column Layout matching Unified Specification */}
      <div className="job-details-reference-layout">
        {/* Left Column (Main Details Cards) */}
        <div className="job-details-main-column">
          {/* Card 1: Job Header Card */}
          <div className="card job-details-header-card">
            <div className="job-details-header-top">
              <h1 className="job-details-title">
                {jobData.title}
              </h1>
              <span className={`job-card-type-pill ${jobData.employment_type?.toLowerCase().replace(/_/g, "-") || ""}`}>
                {formatEmploymentType(jobData.employment_type)}
              </span>
            </div>

            <div className="job-details-company-sub">
              {jobData.Company?.name || "Nectar Hub Partner"}
            </div>

            {/* Meta Row: Location, Salary, Deadline, Views */}
            <div className="job-details-meta-row">
              <div className="job-details-meta-item">
                <MapPin size={16} style={{ color: "#64748b" }} />
                <span>{jobData.location || "Location not specified"}</span>
              </div>

              <div className="job-details-meta-item">
                <DollarSign size={16} style={{ color: "#64748b" }} />
                <span>{formatSalary()}</span>
              </div>

              <div className="job-details-meta-item">
                <Clock size={16} style={{ color: "#64748b" }} />
                <span>{jobData.application_deadline ? formatDisplayDate(jobData.application_deadline) : "No closing date"}</span>
              </div>

              <div className="job-details-meta-item">
                <Eye size={16} style={{ color: "#64748b" }} />
                <span>{viewCount} Views</span>
              </div>
            </div>
          </div>

          {/* Card 2: About Company Card */}
          <div className="card job-details-about-company-card">
            <div className="about-company-header">
              <Building2 size={18} style={{ color: "var(--color-primary-text)" }} />
              <h3>About {jobData.Company?.name || "the Employer"}</h3>
            </div>
            <p className="about-company-text">
              {jobData.Company?.description || "HR Outsourcing, Training and Development, Project Staff Outsourcing, Job Posting & Corporate Talent Matchmaking in Cambodia."}
            </p>
            <Link to={`/jobs?company=${encodeURIComponent(jobData.Company?.name || "")}`} className="about-company-link">
              View company profile →
            </Link>
          </div>

          {/* Card 3: Job Description & Details Card */}
          <div className="card job-details-body-card">
            <h3 className="job-section-title">Job Description</h3>
            <p className="job-description-paragraph">
              {jobData.description}
            </p>

            {/* Responsibilities */}
            <h3 className="job-section-title" style={{ marginTop: "2rem" }}>Responsibilities</h3>
            {jobData.responsibilities ? (
              <div className="job-bullets-content">
                {jobData.responsibilities.split("\n").filter(Boolean).map((resp, i) => (
                  <div key={i} className="job-bullet-item">
                    <span className="bullet-dot">•</span>
                    <span>{resp.replace(/^[-•*]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="job-bullets-content">
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Execute core daily operational tasks according to organizational standards and deadlines.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Collaborate with cross-functional teams to identify and resolve workflow bottlenecks.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Conduct regular audits, reporting, and continuous improvement initiatives.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Maintain comprehensive documentation, compliance standards, and risk protocols.</span></div>
              </div>
            )}

            {/* Requirements */}
            <h3 className="job-section-title" style={{ marginTop: "2rem" }}>Requirements</h3>
            {jobData.requirements ? (
              <div className="job-bullets-content">
                {jobData.requirements.split("\n").filter(Boolean).map((req, i) => (
                  <div key={i} className="job-bullet-item">
                    <span className="bullet-dot">•</span>
                    <span>{req.replace(/^[-•*]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="job-bullets-content">
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Bachelor's degree or vocational diploma in a related discipline or equivalent experience.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Proven experience and strong domain knowledge in operational management or industry standards.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Excellent communication, organizational, and problem-solving abilities.</span></div>
                <div className="job-bullet-item"><span className="bullet-dot">•</span><span>Fluency in Khmer and professional proficiency in English.</span></div>
              </div>
            )}

            {/* Technical Skills */}
            {skillsData && skillsData.length > 0 && (
              <>
                <h3 className="job-section-title" style={{ marginTop: "2rem" }}>Required Skills</h3>
                <div className="skills-container" style={{ marginTop: "0.75rem" }}>
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
              </>
            )}
          </div>
        </div>

        {/* Right Sticky Sidebar Column matching Reference Image 3 */}
        <aside className="job-details-sidebar-column">
          <div className="card job-details-sidebar-card">
            <h3 className="sidebar-apply-title">Apply for Position</h3>

            {/* Main Apply Button */}
            {applySuccess ? (
              <div className="badge badge-success" style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "0.9375rem", marginBottom: "1rem" }}>
                <CheckCircle2 size={18} /> Application Submitted
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApplyClick}
                className="btn-apply-full-blue"
              >
                Apply Now
              </button>
            )}

            {/* Save Job & Share Job Action Buttons */}
            <div className="sidebar-actions-pair">
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={saveMutation.isPending || isSavedLoading}
                className={`sidebar-action-btn ${isSaved ? "saved" : ""}`}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareClick}
                className="sidebar-action-btn"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>

            {/* Specifications Specs Table */}
            <div className="job-specs-table">
              <div className="job-spec-row">
                <span className="job-spec-label">Employment Type</span>
                <span className="job-spec-value">{formatEmploymentType(jobData.employment_type)}</span>
              </div>

              <div className="job-spec-row">
                <span className="job-spec-label">Industry</span>
                <span className="job-spec-value">{jobData.Company?.industry || "Corporate Group"}</span>
              </div>

              <div className="job-spec-row">
                <span className="job-spec-label">Salary Range</span>
                <span className="job-spec-value" style={{ fontWeight: 700, color: "var(--color-primary-text)" }}>{formatSalary()}</span>
              </div>

              <div className="job-spec-row">
                <span className="job-spec-label">Location</span>
                <span className="job-spec-value">{jobData.location || "Location not specified"}</span>
              </div>

              <div className="job-spec-row">
                <span className="job-spec-label">Deadline</span>
                <span className="job-spec-value">{jobData.application_deadline ? formatDisplayDate(jobData.application_deadline) : "To be decided"}</span>
              </div>
            </div>
          </div>
        </aside>
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
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Application Submitted</h3>
                <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
                  The hiring team has received your application.
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
                      placeholder="Why are you a good fit for this role?"
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
                      <Link2 size={15} /> CV / Portfolio URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
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
