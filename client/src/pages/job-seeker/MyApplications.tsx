import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { JobApplicationItem, GetMyApplicationsResponse, ApplicationStatus } from "../../types/profile";
import {
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  X,
  Eye,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { SkeletonTableRow } from "../../components/common/Skeleton";

export default function MyApplications() {
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<{
    jobTitle: string;
    companyName: string;
    text: string;
  } | null>(null);

  const { data: applications, isLoading, error } = useQuery<JobApplicationItem[]>({
    queryKey: ["myApplications"],
    queryFn: async () => {
      const res = await api.get<GetMyApplicationsResponse>("/applications/my");
      return res.data.data.applications;
    },
    staleTime: 60 * 1000,
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#b45309",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <Clock size={12} /> Pending Review
          </span>
        );
      case "REVIEWING":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              color: "#1d4ed8",
              border: "1px solid rgba(37, 99, 235, 0.3)",
            }}
          >
            <Eye size={12} /> In Review
          </span>
        );
      case "INTERVIEW":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(124, 58, 237, 0.12)",
              color: "#6d28d9",
              border: "1px solid rgba(124, 58, 237, 0.3)",
            }}
          >
            <HelpCircle size={12} /> Interview
          </span>
        );
      case "ACCEPTED":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 225, 124, 0.12)",
              color: "var(--color-primary-text)",
              border: "1px solid rgba(255, 225, 124, 0.3)",
            }}
          >
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <XCircle size={12} /> Declined
          </span>
        );
      case "WITHDRAWN":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
            }}
          >
            Withdrawn
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const formatDate = (dStr: string) => {
    try {
      return new Date(dStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Back Navigation */}
      <BackButton label="Back to Dashboard" fallback="/job-seeker/dashboard" />

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">My Applications</h1>
          <p className="dashboard-subtitle">
            Track the real-time status of your job applications
          </p>
        </div>
        <Link to="/jobs" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
          <Search size={15} /> Find More Jobs
        </Link>
      </div>

      {isLoading && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Job & Company</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Cover Letter</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={5} />
              <SkeletonTableRow cols={5} />
              <SkeletonTableRow cols={5} />
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-lg)",
            marginBottom: "1.5rem",
          }}
        >
          Failed to load applications. Please try again.
        </div>
      )}

      {!isLoading && !error && (!applications || applications.length === 0) && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            alignItems: "center",
          }}
        >
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
            <FileText size={30} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            You haven't applied to any jobs yet
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            Explore verified opportunities across top companies and submit applications directly with your profile.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            <Search size={16} /> Browse Open Jobs
          </Link>
        </div>
      )}

      {!isLoading && !error && applications && applications.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Job & Company</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Cover Letter</th>
                <th>CV / Resume</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const jobTitle = app.Job?.title || "Job Position";
                const companyName = app.Job?.Company?.name || "Company";

                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--primary-bg)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {app.Job?.Company?.logo_url ? (
                            <img
                              src={app.Job.Company.logo_url}
                              alt={companyName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            companyName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/jobs/${app.job_id}`}
                            style={{
                              fontWeight: 600,
                              color: "var(--text-main)",
                              textDecoration: "none",
                              display: "block",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                          >
                            {jobTitle}
                          </Link>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                            <Building2 size={12} />
                            <span>{companyName}</span>
                            {app.Job?.location && <span>• {app.Job.location}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        <Calendar size={13} />
                        <span>{formatDate(app.created_at)}</span>
                      </div>
                    </td>

                    <td>{getStatusBadge(app.status)}</td>

                    <td>
                      {app.cover_letter ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCoverLetter({
                              jobTitle,
                              companyName,
                              text: app.cover_letter!,
                            })
                          }
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        >
                          <Eye size={13} /> View Note
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>None</span>
                      )}
                    </td>

                    <td>
                      {app.cv_url ? (
                        <a
                          href={app.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", gap: "0.25rem" }}
                        >
                          <FileText size={13} />
                          <span>View PDF</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Attached</span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <Link
                        to={`/jobs/${app.job_id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        View Job
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cover Letter Modal */}
      {selectedCoverLetter && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>Cover Letter</h3>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {selectedCoverLetter.jobTitle} at {selectedCoverLetter.companyName}
                </p>
              </div>
              <button onClick={() => setSelectedCoverLetter(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--bg-color)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                  color: "var(--text-main)",
                }}
              >
                {selectedCoverLetter.text}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSelectedCoverLetter(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
