import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { Job, GetMyJobsResponse } from "../../types/job";
import JobSkillsManager from "../../components/employer/JobSkillsManager";
import {
  Briefcase,
  PlusCircle,
  Building2,
  MapPin,
  Calendar,
  Users,
  Edit,
  Tag,
  ExternalLink,
  AlertCircle,
  X,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { SkeletonTableRow } from "../../components/common/Skeleton";
import { useToast } from "../../contexts/ToastContext";

export default function MyJobs() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [skillsModalJobId, setSkillsModalJobId] = useState<{ id: string; title: string } | null>(null);

  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ["myJobs"],
    queryFn: async () => {
      const res = await api.get<GetMyJobsResponse>("/jobs/my");
      return res.data.data.jobs;
    },
    staleTime: 60 * 1000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const res = await api.put(`/jobs/${jobId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update job status");
    },
  });

  const filteredJobs = (jobs || []).filter((job) => {
    if (statusFilter === "ALL") return true;
    return job.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            Published
          </span>
        );
      case "DRAFT":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            Draft
          </span>
        );
      case "CLOSED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(107, 114, 128, 0.12)", color: "#4b5563", border: "1px solid rgba(107, 114, 128, 0.3)" }}>
            Closed
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "No deadline";
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

  return (
    <div className="dashboard-container">
      {/* Back Navigation */}
      <BackButton label="Back to Dashboard" fallback="/employer/dashboard" />

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">My Job Postings</h1>
          <p className="dashboard-subtitle">
            Manage your listings, toggle publishing status, and review applicant volumes
          </p>
        </div>
        <Link to="/employer/jobs/new" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
          <PlusCircle size={16} /> Post New Job
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "All Jobs", value: "ALL" },
          { label: "Published", value: "PUBLISHED" },
          { label: "Drafts", value: "DRAFT" },
          { label: "Closed", value: "CLOSED" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`btn ${statusFilter === tab.value ? "btn-primary" : "btn-secondary"}`}
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
                <th>Job Title & Company</th>
                <th>Status</th>
                <th>Employment Type</th>
                <th>Applicants</th>
                <th>Deadline</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={6} />
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
          <span>Failed to load job listings. Please try again.</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredJobs.length === 0 && (
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
            <Briefcase size={30} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            {statusFilter === "ALL" ? "You haven't posted any jobs yet" : `No ${statusFilter.toLowerCase()} jobs found`}
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            Create and publish targeted job postings to attract top talent across the career marketplace.
          </p>
          <Link to="/employer/jobs/new" className="btn btn-primary">
            <PlusCircle size={16} /> Create a Job
          </Link>
        </div>
      )}

      {/* Jobs Table */}
      {!isLoading && filteredJobs.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Job Title & Company</th>
                <th>Status</th>
                <th>Employment Type</th>
                <th>Applicants</th>
                <th>Deadline</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const applicantCount = job.Applications?.length || 0;
                return (
                  <tr key={job.id}>
                    <td>
                      <div>
                        <Link
                          to={`/employer/jobs/${job.id}/edit`}
                          title={job.title}
                          style={{
                            fontWeight: 600,
                            color: "var(--text-main)",
                            textDecoration: "none",
                            fontSize: "0.9375rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            maxWidth: "360px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                        >
                          {job.title}
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          <Building2 size={12} style={{ flexShrink: 0 }} />
                          <span
                            title={job.Company?.name || "Company"}
                            style={{
                              maxWidth: "180px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            }}
                          >
                            {job.Company?.name || "Company"}
                          </span>
                          <span>•</span>
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span>{job.location}</span>
                          {job.is_remote && <span style={{ color: "var(--primary)" }}>(Remote)</span>}
                        </div>
                      </div>
                    </td>

                    <td>{getStatusBadge(job.status)}</td>

                    <td>
                      <span className="badge badge-gray" style={{ fontSize: "0.75rem" }}>
                        {job.employment_type}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/employer/applicants?jobId=${job.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: applicantCount > 0 ? "var(--primary)" : "var(--text-muted)",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          textDecoration: "none",
                        }}
                      >
                        <Users size={14} />
                        <span>{applicantCount} candidates</span>
                      </Link>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        <Calendar size={13} />
                        <span>{formatDate(job.application_deadline)}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        {/* Quick Status Toggle */}
                        {job.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate({ jobId: job.id, status: "PUBLISHED" })}
                            disabled={statusMutation.isPending}
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                            title="Publish this job"
                          >
                            Publish
                          </button>
                        )}

                        {job.status === "PUBLISHED" && (
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate({ jobId: job.id, status: "CLOSED" })}
                            disabled={statusMutation.isPending}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                            title="Close this job"
                          >
                            Close
                          </button>
                        )}

                        {job.status === "CLOSED" && (
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate({ jobId: job.id, status: "PUBLISHED" })}
                            disabled={statusMutation.isPending}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                            title="Re-open this job"
                          >
                            Re-publish
                          </button>
                        )}

                        {/* Manage Skills Button */}
                        <button
                          type="button"
                          onClick={() => setSkillsModalJobId({ id: job.id, title: job.title })}
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          title="Manage Job Skills"
                        >
                          <Tag size={13} />
                          <span>Skills</span>
                        </button>

                        {/* Edit Button */}
                        <Link
                          to={`/employer/jobs/${job.id}/edit`}
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          title="Edit Job Details"
                        >
                          <Edit size={13} />
                        </Link>

                        {/* Public Link */}
                        <Link
                          to={`/jobs/${job.id}`}
                          target="_blank"
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          title="View Public Listing"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Skills Manager Modal */}
      {skillsModalJobId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                  Manage Skills: {skillsModalJobId.title}
                </h3>
              </div>
              <button onClick={() => setSkillsModalJobId(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <JobSkillsManager jobId={skillsModalJobId.id} />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSkillsModalJobId(null)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
