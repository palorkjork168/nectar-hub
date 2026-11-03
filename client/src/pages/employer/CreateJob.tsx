import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Company, GetMyCompaniesResponse, EmploymentType, ExperienceLevel } from "../../types/job";
import {
  Building2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";

export default function CreateJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [companyId, setCompanyId] = useState("");
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
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  const [formError, setFormError] = useState("");

  const {
    data: companies,
    isLoading: loadingCompanies,
    isError: errorCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery<Company[]>({
    queryKey: ["myCompanies"],
    queryFn: async () => {
      const res = await api.get<GetMyCompaniesResponse>("/companies/my");
      return res.data.data.companies;
    },
  });

  // Auto-select company ONLY for non-admin employers with a single company.
  // Platform administrators must explicitly select the target company context.
  useEffect(() => {
    if (!isAdmin && companies && companies.length === 1 && !companyId) {
      setCompanyId(companies[0].id);
      if (companies[0].city) {
        setLocation(companies[0].city);
      }
    }
  }, [companies, companyId, isAdmin]);

  const handleCompanyChange = (selectedId: string) => {
    setCompanyId(selectedId);
    setFormError("");
    const selected = companies?.find((c) => c.id === selectedId);
    if (selected?.city && !location) {
      setLocation(selected.city);
    }
  };

  const selectedCompany = companies?.find((c) => c.id === companyId);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/jobs", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["adminPlatformOverview"] });
      const createdJobId = data.data?.job?.id;
      if (createdJobId) {
        navigate(`/employer/jobs/${createdJobId}/edit?created=true`);
      } else {
        navigate(isAdmin ? "/employer/jobs" : "/employer/jobs");
      }
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to create job posting");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!companyId) {
      setFormError(
        isAdmin
          ? "Administrator action required: Please explicitly select a target company to publish this job under."
          : "Please select an employer company for this job."
      );
      return;
    }

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
      company_id: companyId,
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

    createMutation.mutate(payload);
  };

  if (loadingCompanies) {
    return (
      <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary-text)", margin: "0 auto" }} />
        <div style={{ marginTop: "0.75rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          {isAdmin ? "Loading authorized platform companies..." : "Loading company details..."}
        </div>
      </div>
    );
  }

  if (errorCompanies) {
    return (
      <div className="dashboard-container">
        <BackButton label={isAdmin ? "Back to Admin Dashboard" : "Back to My Jobs"} fallback={isAdmin ? "/admin/dashboard" : "/employer/jobs"} />
        <div className="card" style={{ maxWidth: "560px", margin: "2rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <AlertCircle size={36} style={{ color: "var(--color-danger, #ef4444)", margin: "0 auto 1rem auto" }} />
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem" }}>Unable to Load Companies</h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            {(companiesError as any)?.response?.data?.message || "A network or server error occurred while retrieving companies."}
          </p>
          <button
            type="button"
            onClick={() => refetchCompanies()}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", margin: "0 auto" }}
          >
            <RefreshCw size={15} />
            <span>Retry Loading Companies</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <BackButton label={isAdmin ? "Back to Admin Dashboard" : "Back to My Jobs"} fallback={isAdmin ? "/admin/dashboard" : "/employer/jobs"} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
          <div>
            <h1 className="dashboard-title">Post a New Job</h1>
            <p className="dashboard-subtitle">
              {isAdmin
                ? "Platform Administrator Console • Publish verified vacancies across managed client companies"
                : "Define candidate criteria, compensation, and responsibilities for your opening"}
            </p>
          </div>
          {isAdmin && (
            <span className="floating-glass-pill" style={{ color: "var(--color-primary-text)" }}>
              <ShieldCheck size={14} /> Global Admin Access
            </span>
          )}
        </div>
      </div>

      {/* No Company Warning */}
      {!companies || companies.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <Building2 size={36} style={{ color: "var(--color-nectar-gold, #f59e0b)", marginBottom: "0.5rem" }} />
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem" }}>
            {isAdmin ? "No Enterprise Companies Registered" : "No Registered Company Found"}
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", color: "var(--color-text-secondary)", maxWidth: "440px", fontSize: "0.875rem", marginInline: "auto" }}>
            {isAdmin
              ? "There are currently no employer companies registered on the platform. Register a company first before creating vacancies."
              : "You must register your company profile before publishing jobs on the platform."}
          </p>
          <Link to="/employer/company" className="btn btn-primary">
            Register Company Profile
          </Link>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: "860px" }}>
          {/* Administrator Context Banner */}
          {isAdmin && (
            <div className="admin-context-banner">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(255, 225, 124, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-primary-text)",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary-text)" }}>
                    Platform Administrator Mode • Cross-Tenant Vacancy Creation
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    You have system-wide privileges to publish jobs on behalf of any enterprise employer. Explicit company selection is required below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 1rem",
                backgroundColor: "var(--color-danger-soft, rgba(239, 68, 68, 0.12))",
                color: "var(--color-danger-text, #f87171)",
                border: "1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3))",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Company Selection */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Hiring Company <span className="required">*</span>
                </label>
                {isAdmin && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-nectar-gold)", fontWeight: 600 }}>
                    Explicit Selection Required
                  </span>
                )}
              </div>
              <select
                value={companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="input-field"
                style={{
                  width: "100%",
                  borderColor: !companyId && formError ? "var(--color-danger)" : undefined,
                }}
                required
              >
                <option value="">-- {isAdmin ? "Choose target company for vacancy" : "Select Company"} --</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} {comp.city ? `• ${comp.city}` : ""} {comp.industry ? `(${comp.industry})` : ""}
                  </option>
                ))}
              </select>

              {/* Selected Company Preview Card */}
              {selectedCompany && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.875rem 1rem",
                    backgroundColor: "rgba(255, 225, 124, 0.08)",
                    border: "1px solid rgba(255, 225, 124, 0.25)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "rgba(255, 225, 124, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-primary-text)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                      }}
                    >
                      {selectedCompany.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                        {selectedCompany.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {selectedCompany.industry || "General Enterprise"} • {selectedCompany.city || "Headquarters"}
                        {selectedCompany.website ? ` • ${selectedCompany.website}` : ""}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-success" style={{ fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <CheckCircle2 size={12} /> Confirmed Tenant
                  </span>
                </div>
              )}
            </div>

            {/* Job Title */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">
                Job Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, Product Designer"
                className="input-field"
                style={{ width: "100%" }}
                required
              />
            </div>

            {/* Employment Type & Experience Level */}
            <div className="form-grid two-cols" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">
                  Employment Type <span className="required">*</span>
                </label>
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
                  <option value="">Any Experience Level</option>
                  <option value="ENTRY">Entry Level</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid Level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead / Manager</option>
                </select>
              </div>
            </div>

            {/* Location & Remote */}
            <div className="form-grid two-cols" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">
                  Location (City / Country) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Phnom Penh, Cambodia"
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
                  <span style={{ fontWeight: 500 }}>Remote-friendly position</span>
                </label>
              </div>
            </div>

            {/* Salary Range */}
            <div className="form-grid three-cols" style={{ marginBottom: "1.25rem", gridTemplateColumns: "1fr 1fr 120px" }}>
              <div className="form-group">
                <label className="form-label">Salary Minimum (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g. 800"
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salary Maximum (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g. 1500"
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

            {/* Application Deadline & Initial Status */}
            <div className="form-grid two-cols" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Application Deadline (Optional)</label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Publishing Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="input-field"
                  style={{ width: "100%" }}
                >
                  <option value="PUBLISHED">Published (Visible on Portal)</option>
                  <option value="DRAFT">Draft (Save privately)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">
                Job Overview / Description <span className="required">* (min 20 chars)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the opportunity, core mission, and team structure..."
                className="input-field"
                rows={5}
                style={{ width: "100%", resize: "vertical" }}
                required
              />
            </div>

            {/* Responsibilities */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Key Responsibilities (Optional)</label>
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="List day-to-day deliverables and key duties..."
                className="input-field"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Requirements */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Requirements & Qualifications (Optional)</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List required technical experience, educational background, or soft skills..."
                className="input-field"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => navigate("/employer/jobs")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
                style={{ minWidth: "140px" }}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={15} /> Creating...
                  </>
                ) : (
                  "Create Job"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
