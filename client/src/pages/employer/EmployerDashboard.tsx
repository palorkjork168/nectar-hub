import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Company, Job, GetMyCompaniesResponse, GetMyJobsResponse } from "../../types/job";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  Building2,
  ArrowRight,
  AlertTriangle,
  Eye,
  FileText,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Skeleton, SkeletonStatCard } from "../../components/common/Skeleton";

export default function EmployerDashboard() {
  const { user } = useAuth();

  const companiesQuery = useQuery<Company[]>({
    queryKey: ["myCompanies"],
    queryFn: async () => {
      const res = await api.get<GetMyCompaniesResponse>("/companies/my");
      return res.data.data.companies;
    },
    staleTime: 60 * 1000,
  });

  const jobsQuery = useQuery<Job[]>({
    queryKey: ["myJobs"],
    queryFn: async () => {
      const res = await api.get<GetMyJobsResponse>("/jobs/my");
      return res.data.data.jobs;
    },
    staleTime: 60 * 1000,
  });

  const interviewsQuery = useQuery<any[]>({
    queryKey: ["employerInterviews", "upcoming"],
    queryFn: async () => {
      const res = await api.get("/interviews/employer/my?upcoming=true");
      return res.data.data.interviews;
    },
    staleTime: 60 * 1000,
  });

  const upcomingInterviews = interviewsQuery.data || [];
  const companies = companiesQuery.data || [];
  const jobs = jobsQuery.data || [];

  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED").length;

  const totalApplicants = jobs.reduce((acc, job) => acc + (job.Applications?.length || 0), 0);
  const pendingApplicants = jobs.reduce(
    (acc, job) => acc + (job.Applications?.filter((a) => a.status === "PENDING").length || 0),
    0
  );

  const isInitialLoading = companiesQuery.isLoading && jobsQuery.isLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(255, 225, 124, 0.12)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.3)" }}>
            Published
          </span>
        );
      case "DRAFT":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            Draft
          </span>
        );
      case "CLOSED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(107, 114, 128, 0.12)", color: "#4b5563", border: "1px solid rgba(107, 114, 128, 0.3)" }}>
            Closed
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="dashboard-content-wrap fade-in">
      {/* Header Block */}
      <div className="dashboard-header-block">
        <div>
          <div className="dashboard-pill-badge">
            <span className="dashboard-yellow-dot" />
            <span>EMPLOYER PIPELINE</span>
          </div>
          <h1 className="dashboard-title">
            Welcome back, {user?.first_name || "Employer"}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Manage your company job listings, review inbound candidates, and track recruitment progress.
          </p>
        </div>
        <div className="dashboard-actions-cluster">
          <Link to="/employer/jobs/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Post a Job</span>
          </Link>
          <Link to="/employer/company" className="btn btn-secondary">
            <Building2 size={16} />
            <span>Manage Company</span>
          </Link>
        </div>
      </div>

      {/* Warning if no company profile exists */}
      {companies.length === 0 && (
        <div
          style={{
            padding: "1.25rem 1.75rem",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "14px",
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <AlertTriangle size={24} style={{ color: "#d97706", flexShrink: 0 }} />
            <div>
              <strong style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
                Company Profile Setup Required
              </strong>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                You must register your company profile before publishing jobs so candidates know who is hiring.
              </div>
            </div>
          </div>
          <Link to="/employer/company" className="btn btn-primary">
            <span>Complete Setup</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Summary Stat Cards */}
      {isInitialLoading ? (
        <div className="nectar-stat-grid">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="nectar-stat-grid">
          {/* Total Jobs */}
          <Link to="/employer/jobs" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Total Postings</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}
              >
                <Briefcase size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{totalJobs}</div>
            <div className="nectar-stat-meta" style={{ color: "#2563eb" }}>
              <span>Manage all listings</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Published Jobs */}
          <Link to="/employer/jobs" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Live Openings</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(255, 225, 124, 0.1)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.2)" }}
              >
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{publishedJobs}</div>
            <div className="nectar-stat-meta" style={{ color: "var(--color-primary-text)" }}>
              <span>Active in marketplace</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Total Applicants */}
          <Link to="/employer/applicants" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Total Applicants</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)" }}
              >
                <Users size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{totalApplicants}</div>
            <div className="nectar-stat-meta" style={{ color: "#7c3aed" }}>
              <span>Inbound talent funnel</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Needing Review */}
          <Link to="/employer/applicants" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Pending Review</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.2)" }}
              >
                <Clock size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{pendingApplicants}</div>
            <div className="nectar-stat-meta" style={{ color: "#d97706" }}>
              <span>Awaiting screening</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      )}

      {/* Upcoming Interviews Card */}
      {upcomingInterviews.length > 0 && (
        <div className="nectar-card" style={{ marginBottom: "2rem", borderLeft: "4px solid var(--color-primary)" }}>
          <div className="nectar-card-header">
            <h3 className="nectar-card-title">
              <Calendar size={18} style={{ color: "var(--color-primary-text)" }} />
              Upcoming Candidate Interviews ({upcomingInterviews.length})
            </h3>
            <Link to="/employer/interviews" className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem" }}>
              <span>View Full Schedule</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {upcomingInterviews.slice(0, 3).map((iv: any) => {
              const app = iv.application;
              const applicant = app?.applicant;
              const job = app?.Job;
              const date = new Date(iv.scheduled_at);

              return (
                <div
                  key={iv.id}
                  style={{
                    padding: "1rem 1.15rem",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
                      {applicant?.first_name} {applicant?.last_name}
                    </strong>
                    <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                      {iv.interview_type}
                    </span>
                  </div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                    {job?.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.65rem", color: "var(--color-text)", fontWeight: 600 }}>
                    <Clock size={13} style={{ color: "var(--color-primary-text)" }} />
                    <span>
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })},{" "}
                      {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({iv.duration_minutes}m)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Recent Jobs & Inbound Applicants */}
      <div className="nectar-dashboard-grid-2">
        {/* Recent Jobs */}
        <div className="nectar-card">
          <div className="nectar-card-header">
            <h3 className="nectar-card-title">
              <Briefcase size={18} style={{ color: "var(--color-primary-text)" }} />
              Recent Job Postings
            </h3>
            <Link to="/employer/jobs" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
              <span>View All ({jobs.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="nectar-card-body">
            {jobsQuery.isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Skeleton height="60px" borderRadius="10px" />
                <Skeleton height="60px" borderRadius="10px" />
                <Skeleton height="60px" borderRadius="10px" />
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px" }}>
                <Briefcase size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 0.75rem" }} />
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)" }}>
                  No job postings created yet.
                </p>
                <Link to="/employer/jobs/new" className="btn btn-primary">
                  <PlusCircle size={15} />
                  <span>Post Your First Job</span>
                </Link>
              </div>
            ) : (
              <div className="nectar-list-group">
                {jobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="nectar-list-row">
                    <div>
                      <Link
                        to={`/employer/jobs/${job.id}/edit`}
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "var(--color-text)",
                          textDecoration: "none",
                        }}
                      >
                        {job.title}
                      </Link>
                      <div style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                        {job.Company?.name} • {job.location || "Phnom Penh"} • {job.Applications?.length || 0} applicants
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {getStatusBadge(job.status)}
                      <Link
                        to={`/employer/jobs/${job.id}/edit`}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Center / Applicant Review */}
        <div className="nectar-card">
          <div className="nectar-card-header">
            <h3 className="nectar-card-title">
              <Users size={18} style={{ color: "#7c3aed" }} />
              Applicant Funnel
            </h3>
            <Link to="/employer/applicants" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
              <span>All Candidates</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="nectar-card-body">
            {jobsQuery.isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Skeleton height="60px" borderRadius="10px" />
                <Skeleton height="60px" borderRadius="10px" />
                <Skeleton height="60px" borderRadius="10px" />
              </div>
            ) : jobs.filter((j) => (j.Applications?.length || 0) > 0).length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px" }}>
                <FileText size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 0.75rem" }} />
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)" }}>
                  No candidates have applied to your active postings yet.
                </p>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Publish listings to the public career marketplace to receive applicants.
                </div>
              </div>
            ) : (
              <div className="nectar-list-group">
                {jobs
                  .filter((j) => (j.Applications?.length || 0) > 0)
                  .slice(0, 4)
                  .map((job) => {
                    const pending = job.Applications?.filter((a) => a.status === "PENDING").length || 0;
                    return (
                      <div key={job.id} className="nectar-list-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                            Total: <strong>{job.Applications?.length}</strong> applicants
                            {pending > 0 && (
                              <span style={{ color: "#d97706", marginLeft: "0.5rem", fontWeight: 700 }}>
                                • {pending} pending review
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/employer/applicants?jobId=${job.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </Link>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
