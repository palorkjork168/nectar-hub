import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Job, GetJobResponse, EmploymentType, ExperienceLevel } from "../../types/job";
import JobSkillsManager from "../../components/employer/JobSkillsManager";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const isJustCreated = searchParams.get("created") === "true";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("MID");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "CLOSED">("PUBLISHED");

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    isJustCreated ? "Job created successfully! Now add skills below to enhance candidate discovery." : ""
  );

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await api.get<GetJobResponse>(`/jobs/${id}`);
      return res.data.data.job;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setDescription(job.description || "");
      setRequirements(job.requirements || "");
      setResponsibilities(job.responsibilities || "");
      setEmploymentType(job.employment_type || "FULL_TIME");
      setExperienceLevel(job.experience_level || "");
      setSalaryMin(job.salary_min !== null && job.salary_min !== undefined ? String(job.salary_min) : "");
      setSalaryMax(job.salary_max !== null && job.salary_max !== undefined ? String(job.salary_max) : "");
      setSalaryCurrency(job.salary_currency || "USD");
      setLocation(job.location || "");
      setIsRemote(Boolean(job.is_remote));
      setApplicationDeadline(job.application_deadline ? job.application_deadline.substring(0, 10) : "");
      setStatus(job.status || "DRAFT");
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/jobs/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      setSuccessMessage("Job details updated successfully!");
      setFormError("");
      setTimeout(() => setSuccessMessage(""), 3500);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update job posting");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (title.trim().length < 3) {
      setFormError("Job title must be at least 3 characters.");
      return;
    }

    if (description.trim().length < 20) {
      setFormError("Description must be at least 20 characters.");
      return;
    }

    if (location.trim().length < 2) {
      setFormError("Location is required.");
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      requirements: requirements.trim() || undefined,
      responsibilities: responsibilities.trim() || undefined,
      employment_type: employmentType,
      experience_level: experienceLevel || undefined,
      salary_min: salaryMin ? parseFloat(salaryMin) : undefined,
      salary_max: salaryMax ? parseFloat(salaryMax) : undefined,
      salary_currency: salaryCurrency,
      location: location.trim(),
      is_remote: isRemote,
      application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,
      status: status,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--primary)" }} />
        <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading job details...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="dashboard-container">
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={20} />
          <span>Job not found or you do not have permission to edit this job.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Back Link & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <BackButton
            label={isAdmin ? "Back to Job Oversight" : "Back to My Jobs"}
            fallback={isAdmin ? "/employer/jobs" : "/employer/jobs"}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <h1 className="dashboard-title">Edit Job Posting</h1>
            {isAdmin && (
              <span className="floating-glass-pill" style={{ color: "var(--color-primary-text)" }}>
                <ShieldCheck size={14} /> Admin Mode
              </span>
            )}
          </div>
          <p className="dashboard-subtitle">
            Hiring for <strong>{job.Company?.name}</strong> • Job ID: {job.id.substring(0, 8)}...
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            to={`/employer/applicants?jobId=${job.id}`}
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem" }}
          >
            <Users size={15} />
            <span>View Applicants</span>
          </Link>
          <Link
            to={`/jobs/${job.id}`}
            target="_blank"
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem" }}
          >
            <ExternalLink size={14} />
            <span>Public Preview</span>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 1rem",
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
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
            padding: "0.875rem 1rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: "880px" }}>
        {/* Job Details Card */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Job Title */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">
                Job Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
                required
              />
            </div>

            {/* Employment Type, Experience Level & Status */}
            <div className="form-grid three-cols" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="input-field"
                  style={{ width: "100%" }}
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="input-field"
                  style={{ width: "100%" }}
                >
                  <option value="">Any Level</option>
                  <option value="ENTRY">Entry Level</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid Level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead / Manager</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "CLOSED")}
                  className="input-field"
                  style={{ width: "100%" }}
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* Location & Remote */}
            <div className="form-grid two-cols" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", paddingTop: "1.8rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isRemote}
                    onChange={(e) => setIsRemote(e.target.checked)}
                  />
                  <span style={{ fontWeight: 500 }}>Remote position</span>
                </label>
              </div>
            </div>

            {/* Salary Range */}
            <div className="form-grid three-cols" style={{ marginBottom: "1.25rem", gridTemplateColumns: "1fr 1fr 120px" }}>
              <div className="form-group">
                <label className="form-label">Salary Min</label>
                <input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salary Max</label>
                <input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <input
                  type="text"
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Application Deadline */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Application Deadline</label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Description (min 20 chars)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={5}
                style={{ width: "100%", resize: "vertical" }}
                required
              />
            </div>

            {/* Responsibilities */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Responsibilities</label>
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="input-field"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Requirements */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Requirements</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="input-field"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? "Saving Changes..." : "Save Job Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Embedded Skills Management */}
        <JobSkillsManager jobId={job.id} />
      </div>
    </div>
  );
}
