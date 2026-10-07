import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { Job, GetMyJobsResponse } from "../../types/job";
import type { ApplicationStatus } from "../../types/profile";
import ApplicantDetailsModal from "../../components/employer/ApplicantDetailsModal";
import {
  Users,
  FileText,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { useToast } from "../../contexts/ToastContext";

export default function Applicants() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedJobId = searchParams.get("jobId") || "";
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeApplicantId, setActiveApplicantId] = useState<string | null>(null);

  // Fetch employer's jobs for the job selector
  const { data: myJobs, isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ["myJobs"],
    queryFn: async () => {
      const res = await api.get<GetMyJobsResponse>("/jobs/my");
      return res.data.data.jobs;
    },
  });

  // Effective job ID to query applicants for:
  // If `selectedJobId` is set, use it; otherwise default to first job if available
  const effectiveJobId = selectedJobId || (myJobs && myJobs.length > 0 ? myJobs[0].id : "");

  // Fetch applicants for the effective job
  const {
    data: applications,
    isLoading: loadingApplicants,
    error: applicantError,
  } = useQuery<any[]>({
    queryKey: ["jobApplications", effectiveJobId],
    queryFn: async () => {
      const res = await api.get(`/applications/job/${effectiveJobId}`);
      return res.data.data.applications;
    },
    enabled: Boolean(effectiveJobId),
  });

  // Quick Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ appId, newStatus }: { appId: string; newStatus: ApplicationStatus }) => {
      const res = await api.patch(`/applications/${appId}/status`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobApplications", effectiveJobId] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const handleJobSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJobId = e.target.value;
    if (newJobId) {
      setSearchParams({ jobId: newJobId });
    } else {
      setSearchParams({});
    }
  };

  const filteredApplications = (applications || []).filter((app) => {
    if (statusFilter === "ALL") return true;
    return app.status === statusFilter;
  });

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
            <XCircle size={12} /> Declined
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const selectedJob = (myJobs || []).find((j) => j.id === effectiveJobId);

  return (
    <div className="dashboard-container">
      {/* Back Navigation */}
      <BackButton label="Back to My Jobs" fallback="/employer/jobs" />

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">Applicant Management</h1>
          <p className="dashboard-subtitle">
            Screen candidates, inspect resumes, and advance applicants through the hiring pipeline
          </p>
        </div>
      </div>

      {/* Filter and Job Selection Bar */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Job Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: "1 1 300px" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap" }}>
            Select Position:
          </label>
          <select
            value={effectiveJobId}
            onChange={handleJobSelectChange}
            className="input-field"
            style={{ maxWidth: "360px", flex: 1 }}
            disabled={loadingJobs || !myJobs || myJobs.length === 0}
          >
            {!myJobs || myJobs.length === 0 ? (
              <option value="">No jobs created yet</option>
            ) : (
              myJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.Applications?.length || 0} applicants) [{job.status}]
                </option>
              ))
            )}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {[
            { label: "All", value: "ALL" },
            { label: "Pending", value: "PENDING" },
            { label: "Reviewing", value: "REVIEWING" },
            { label: "Interview", value: "INTERVIEW" },
            { label: "Accepted", value: "ACCEPTED" },
            { label: "Declined", value: "REJECTED" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`btn ${statusFilter === tab.value ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading States */}
      {(loadingJobs || loadingApplicants) && (
        <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
          <Loader2 className="animate-spin" size={24} style={{ color: "var(--primary)" }} />
          <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading candidate applications...
          </div>
        </div>
      )}

      {applicantError && (
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
          <span>Failed to load applicants. Please confirm you own this job posting.</span>
        </div>
      )}

      {/* Empty State: No Jobs */}
      {!loadingJobs && (!myJobs || myJobs.length === 0) && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", alignItems: "center" }}>
          <Briefcase size={36} style={{ color: "var(--text-light)", marginBottom: "0.5rem" }} />
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            No Job Postings Available
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            Post and publish your first job listing to start receiving candidate applications.
          </p>
          <Link to="/employer/jobs/new" className="btn btn-primary">
            Post a Job
          </Link>
        </div>
      )}

      {/* Empty State: No Applicants for Job */}
      {!loadingApplicants && myJobs && myJobs.length > 0 && filteredApplications.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", alignItems: "center" }}>
          <Users size={36} style={{ color: "var(--text-light)", marginBottom: "0.5rem" }} />
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            {statusFilter === "ALL" ? "No Applicants for this Position Yet" : `No ${statusFilter.toLowerCase()} applicants`}
          </h3>
          <p style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            When job seekers apply to "{selectedJob?.title || "this job"}", their profiles and cover letters will appear here.
          </p>
        </div>
      )}

      {/* Applicants Table */}
      {!loadingApplicants && filteredApplications.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Cover Letter</th>
                <th>Resume</th>
                <th style={{ textAlign: "right" }}>Quick Status / Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const applicant = app.applicant;
                const profile = applicant?.UserProfile;
                const resumeUrl = app.cv_url || profile?.resume_url;

                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
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
                            onClick={() => setActiveApplicantId(app.id)}
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
                            {profile?.professional_title || applicant?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        <Calendar size={13} />
                        <span>{formatDate(app.created_at)}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                        {getStatusBadge(app.status)}
                        {app.status === "ACCEPTED" && applicant?.employeeProfile && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: "var(--success)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              padding: "0.1rem 0.4rem",
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              borderRadius: "4px",
                            }}
                          >
                            <CheckCircle2 size={11} /> Hired
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {app.cover_letter ? (
                        <button
                          type="button"
                          onClick={() => setActiveApplicantId(app.id)}
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                        >
                          <FileText size={12} /> View Note
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>None</span>
                      )}
                    </td>

                    <td>
                      {resumeUrl ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                        >
                          <FileText size={12} /> PDF Resume
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>No file</span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        {/* Quick status selector */}
                        <select
                          value={app.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              appId: app.id,
                              newStatus: e.target.value as ApplicationStatus,
                            })
                          }
                          disabled={statusMutation.isPending}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.45rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--surface)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="REVIEWING">REVIEWING</option>
                          <option value="INTERVIEW">INTERVIEW</option>
                          <option value="ACCEPTED">ACCEPTED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>

                        {/* View Full Candidate Profile Drawer/Modal */}
                        <button
                          type="button"
                          onClick={() => setActiveApplicantId(app.id)}
                          className="btn btn-primary"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", gap: "0.25rem" }}
                        >
                          <Eye size={12} />
                          <span>Review Profile</span>
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

      {/* Applicant Details Modal */}
      {activeApplicantId && (
        <ApplicantDetailsModal
          applicationId={activeApplicantId}
          onClose={() => setActiveApplicantId(null)}
          onStatusUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["jobApplications", effectiveJobId] });
          }}
        />
      )}
    </div>
  );
}
