import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { Interview, InterviewStatus } from "../../types/interview";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Building2,
  ExternalLink,
  AlertCircle,
  Search,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import { SkeletonCard } from "../../components/common/Skeleton";

export default function MyInterviews() {
  const [filter, setFilter] = useState<string>("UPCOMING");

  const { data: interviews, isLoading, error } = useQuery<Interview[]>({
    queryKey: ["myInterviews"],
    queryFn: async () => {
      const res = await api.get("/interviews/my");
      return res.data.data.interviews;
    },
    staleTime: 60 * 1000,
  });

  const now = new Date();

  const filteredInterviews = (interviews || []).filter((iv) => {
    if (filter === "UPCOMING") {
      return iv.status === "SCHEDULED" && new Date(iv.scheduled_at) >= now;
    }
    if (filter === "COMPLETED") {
      return iv.status === "COMPLETED" || (iv.status === "SCHEDULED" && new Date(iv.scheduled_at) < now);
    }
    if (filter === "ALL") return true;
    return iv.status === filter;
  });

  const getStatusBadge = (status: InterviewStatus, scheduledAt: string) => {
    const isPastScheduled = status === "SCHEDULED" && new Date(scheduledAt) < now;

    if (isPastScheduled) {
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.2rem 0.6rem",
            borderRadius: "9999px",
            backgroundColor: "rgba(107, 114, 128, 0.12)",
            color: "#4b5563",
            border: "1px solid rgba(107, 114, 128, 0.25)",
          }}
        >
          Passed
        </span>
      );
    }

    switch (status) {
      case "SCHEDULED":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
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
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 225, 124, 0.12)",
              color: "var(--color-primary-text)",
              border: "1px solid rgba(255, 225, 124, 0.25)",
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
              padding: "0.2rem 0.6rem",
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
      <BackButton label="Back to Dashboard" fallback="/job-seeker/dashboard" />

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">My Interviews</h1>
          <p className="dashboard-subtitle">
            View scheduled interview dates, prepare meeting credentials, and connect with prospective employers
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Upcoming", value: "UPCOMING" },
          { label: "All Interviews", value: "ALL" },
          { label: "Past / Completed", value: "COMPLETED" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
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
            When employers review your application and request an interview, your schedule and meeting links will appear here.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            <Search size={15} /> Explore Career Opportunities
          </Link>
        </div>
      )}

      {/* Interviews List */}
      {!isLoading && filteredInterviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredInterviews.map((iv) => {
            const job = iv.application?.Job;
            const company = job?.Company;
            const scheduledDate = new Date(iv.scheduled_at);
            const isUpcoming = iv.status === "SCHEDULED" && scheduledDate >= now;

            return (
              <div
                key={iv.id}
                className="card"
                style={{
                  borderLeft: isUpcoming ? "4px solid var(--primary)" : undefined,
                  transition: "box-shadow 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.25rem" }}>
                  {/* Left: Company & Job */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--primary-bg)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        flexShrink: 0,
                      }}
                    >
                      {company?.logo_url ? (
                        <img src={company.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        company?.name ? company.name.slice(0, 2).toUpperCase() : "CO"
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--text-main)" }}>
                          {job?.title}
                        </h3>
                        {getStatusBadge(iv.status, iv.scheduled_at)}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        <Building2 size={13} />
                        <span style={{ fontWeight: 500 }}>{company?.name}</span>
                        {(company?.city || company?.country) && (
                          <span>• {[company.city, company.country].filter(Boolean).join(", ")}</span>
                        )}
                      </div>

                      {/* Date, Time & Format */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={14} style={{ color: "var(--primary)" }} />
                          <strong>
                            {scheduledDate.toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </strong>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Clock size={14} style={{ color: "var(--primary)" }} />
                          <span>
                            {scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>({iv.duration_minutes} minutes)</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {iv.interview_type === "VIDEO" && <Video size={14} style={{ color: "var(--primary)" }} />}
                          {iv.interview_type === "IN_PERSON" && <MapPin size={14} style={{ color: "var(--color-primary-text)" }} />}
                          {iv.interview_type === "PHONE" && <Phone size={14} style={{ color: "#7c3aed" }} />}
                          <span style={{ fontWeight: 500 }}>
                            {iv.interview_type === "VIDEO"
                              ? "Video Meeting"
                              : iv.interview_type === "IN_PERSON"
                              ? "In-Person Interview"
                              : "Telephone Screening"}
                          </span>
                        </div>
                      </div>

                      {/* Location / Instructions if any */}
                      {iv.location && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                          <strong>Location / Details:</strong> {iv.location}
                        </div>
                      )}

                      {/* Employer Notes if any */}
                      {iv.notes && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.6rem 0.85rem",
                            backgroundColor: "var(--bg-color)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.8125rem",
                            color: "var(--text-main)",
                            lineHeight: 1.5,
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <strong style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "0.2rem" }}>
                            Employer Instructions:
                          </strong>
                          {iv.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Join Button & View Job */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    {iv.interview_type === "VIDEO" && iv.meeting_link && iv.status === "SCHEDULED" ? (
                      <a
                        href={iv.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                      >
                        <Video size={16} />
                        <span>Join Video Interview</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : null}

                    {job?.id && (
                      <Link
                        to={`/jobs/${job.id}`}
                        target="_blank"
                        className="btn btn-ghost"
                        style={{ fontSize: "0.8125rem", padding: "0.3rem 0.6rem" }}
                      >
                        View Job Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
