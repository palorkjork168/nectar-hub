import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { FullProfile, GetProfileResponse, JobApplicationItem, GetMyApplicationsResponse, SavedJobRecord, GetSavedJobsResponse } from "../../types/profile";
import type { Interview } from "../../types/interview";
import {
  Search,
  User,
  Award,
  Calendar,
  FileText,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Skeleton, SkeletonStatCard } from "../../components/common/Skeleton";

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const profileQuery = useQuery<FullProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get<GetProfileResponse>("/profile/me");
      return res.data.data.profile;
    },
    staleTime: 60 * 1000,
  });

  const applicationsQuery = useQuery<JobApplicationItem[]>({
    queryKey: ["myApplications"],
    queryFn: async () => {
      const res = await api.get<GetMyApplicationsResponse>("/applications/my");
      return res.data.data.applications;
    },
    staleTime: 60 * 1000,
  });

  const savedJobsQuery = useQuery<SavedJobRecord[]>({
    queryKey: ["savedJobs"],
    queryFn: async () => {
      const res = await api.get<GetSavedJobsResponse>("/jobs/saved");
      return res.data.data.savedJobs;
    },
    staleTime: 60 * 1000,
  });

  const interviewsQuery = useQuery<Interview[]>({
    queryKey: ["myInterviews"],
    queryFn: async () => {
      const res = await api.get("/interviews/my");
      return res.data.data.interviews;
    },
    staleTime: 60 * 1000,
  });

  const applications = applicationsQuery.data || [];
  const savedJobs = savedJobsQuery.data || [];
  const interviews = interviewsQuery.data || [];
  const profile = profileQuery.data;

  const now = new Date();
  const upcomingInterviews = interviews.filter(
    (iv) => iv.status === "SCHEDULED" && new Date(iv.scheduled_at) >= now
  );

  const skillsCount = profile?.UserSkills?.length || 0;
  const profileScore = Math.min(100, 50 + skillsCount * 10 + ((profile as any)?.resume_url || (profile as any)?.UserProfile?.resume_url ? 20 : 0));

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            Pending Review
          </span>
        );
      case "REVIEWING":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            Reviewing
          </span>
        );
      case "INTERVIEW":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
            Interview Stage
          </span>
        );
      case "ACCEPTED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(255, 225, 124, 0.12)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.3)" }}>
            Accepted Offer
          </span>
        );
      case "REJECTED":
        return (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            Not Selected
          </span>
        );
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const isInitialLoading = applicationsQuery.isLoading && profileQuery.isLoading;

  return (
    <div className="dashboard-content-wrap fade-in">
      {/* Header Block */}
      <div className="dashboard-header-block">
        <div>
          <div className="dashboard-pill-badge">
            <span className="dashboard-yellow-dot" />
            <span>OVERVIEW</span>
          </div>
          <h1 className="dashboard-title">
            Welcome back, {user?.first_name || "Job Seeker"}
          </h1>
          <p className="dashboard-subtitle">
            Track your applications and interview schedules.
          </p>
        </div>
        <div className="dashboard-actions-cluster">
          <Link to="/jobs" className="btn btn-primary">
            <Search size={16} />
            <span>Browse Jobs</span>
          </Link>
          <Link to="/job-seeker/profile" className="btn btn-secondary">
            <User size={16} />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* Metrics Stat Grid */}
      {isInitialLoading ? (
        <div className="nectar-stat-grid">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="nectar-stat-grid">
          {/* Applications */}
          <Link to="/job-seeker/applications" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Active Applications</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}
              >
                <FileText size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{applications.length}</div>
            <div className="nectar-stat-meta" style={{ color: "#2563eb" }}>
              <span>Track progress</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Saved Positions */}
          <Link to="/job-seeker/saved" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Saved Jobs</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.2)" }}
              >
                <Bookmark size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{savedJobs.length}</div>
            <div className="nectar-stat-meta" style={{ color: "#d97706" }}>
              <span>Review bookmarks</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Upcoming Interviews */}
          <Link to="/job-seeker/interviews" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Interviews</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)" }}
              >
                <Calendar size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">{upcomingInterviews.length}</div>
            <div className="nectar-stat-meta" style={{ color: "#7c3aed" }}>
              <span>Scheduled meetings</span>
              <ArrowRight size={13} />
            </div>
          </Link>

          {/* Profile Strength */}
          <Link to="/job-seeker/profile" className="nectar-stat-card">
            <div className="nectar-stat-top">
              <span className="nectar-stat-label">Profile Strength</span>
              <div
                className="nectar-stat-icon-wrap"
                style={{ backgroundColor: "rgba(255, 225, 124, 0.1)", color: "var(--color-primary-text)", border: "1px solid rgba(255, 225, 124, 0.2)" }}
              >
                <Award size={20} />
              </div>
            </div>
            <div className="nectar-stat-val">
              {profileScore}%
            </div>
            <div className="nectar-stat-meta" style={{ color: "var(--color-primary-text)" }}>
              <span>{skillsCount} verified skills</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="nectar-dashboard-grid-2">
        {/* Left Column: Recent Applications & Skills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Applications Status Card */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <FileText size={18} style={{ color: "var(--color-primary-text)" }} />
                Recent Applications
              </h3>
              <Link to="/job-seeker/applications" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                <span>View All ({applications.length})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="nectar-card-body">
              {applicationsQuery.isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Skeleton height="60px" borderRadius="10px" />
                  <Skeleton height="60px" borderRadius="10px" />
                </div>
              ) : applications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px" }}>
                  <Briefcase size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 0.75rem" }} />
                  <p style={{ margin: "0 0 1rem", fontSize: "0.9375rem", color: "var(--color-text-secondary)" }}>
                    You haven't applied to any job positions yet.
                  </p>
                  <Link to="/jobs" className="btn btn-primary">
                    <Search size={15} />
                    <span>Explore Verified Positions</span>
                  </Link>
                </div>
              ) : (
                <div className="nectar-list-group">
                  {applications.slice(0, 4).map((app) => (
                    <div key={app.id} className="nectar-list-row">
                      <div>
                        <Link
                          to={`/jobs/${app.job_id}`}
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            color: "var(--color-text)",
                            textDecoration: "none",
                          }}
                        >
                          {app.Job?.title || "Job Position"}
                        </Link>
                        <div style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                          {app.Job?.Company?.name || "Company Partner"}
                          {(() => {
                            const raw = (app as any).createdAt || app.created_at || (app as any).applied_at;
                            if (!raw) return null;
                            const d = new Date(raw);
                            return isNaN(d.getTime()) ? null : ` • Applied ${d.toLocaleDateString()}`;
                          })()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {getApplicationStatusBadge(app.status)}
                        <Link
                          to={`/jobs/${app.job_id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile Skills & Verification */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <ShieldCheck size={18} style={{ color: "var(--color-primary-text)" }} />
                Your Verified Skills & Strengths
              </h3>
              <Link to="/job-seeker/profile" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                <span>Manage Profile</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="nectar-card-body">
              {profile?.UserSkills && profile.UserSkills.length > 0 ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {profile.UserSkills.map((us) => (
                      <span
                        key={us.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.4rem 0.85rem",
                          borderRadius: "9999px",
                          backgroundColor: "var(--color-surface-muted)",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--color-text)",
                        }}
                      >
                        <CheckCircle2 size={13} style={{ color: "var(--color-primary-text)" }} />
                        <span>{us.skill_name || "Skill"}</span>
                        {us.level && (
                          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginLeft: "2px" }}>
                            • {us.level}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div style={{ padding: "1rem 1.25rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text)" }}>
                        Profile Completeness
                      </span>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary-text)" }}>
                        {profileScore}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-border)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${profileScore}%`,
                          height: "100%",
                          backgroundColor: "var(--color-primary)",
                          borderRadius: "9999px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 1rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px" }}>
                  <Award size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 0.5rem" }} />
                  <p style={{ margin: "0 0 0.85rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    Highlight your skills to get matched with top opportunities.
                  </p>
                  <Link to="/job-seeker/profile" className="btn btn-secondary">
                    <span>Add Skills & Certifications</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Interviews & Shortcuts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Upcoming Interviews Card */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <Calendar size={18} style={{ color: "#7c3aed" }} />
                Scheduled Interviews
              </h3>
              <Link to="/job-seeker/interviews" className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}>
                <span>Calendar</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="nectar-card-body">
              {upcomingInterviews.length > 0 ? (
                <div className="nectar-list-group">
                  {upcomingInterviews.slice(0, 3).map((iv) => {
                    const date = new Date(iv.scheduled_at);
                    return (
                      <div key={iv.id} className="nectar-list-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
                            {iv.application?.Job?.title || "Job Interview"}
                          </div>
                          <div style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                            {iv.application?.Job?.Company?.name || "Company"} • {iv.interview_type}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--color-primary-text)", fontSize: "0.78125rem", fontWeight: 600 }}>
                            <Clock size={12} />
                            <span>
                              {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })},{" "}
                              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <Link
                          to="/job-seeker/interviews"
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                        >
                          View
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", backgroundColor: "var(--color-surface-muted)", borderRadius: "10px" }}>
                  <Calendar size={28} style={{ color: "var(--color-text-muted)", margin: "0 auto 0.5rem" }} />
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)" }}>
                    No pending interviews
                  </p>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Once an employer schedules an interview with you, it will appear here.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Career Toolkit & Quick Shortcuts */}
          <div className="nectar-card">
            <div className="nectar-card-header">
              <h3 className="nectar-card-title">
                <Sparkles size={18} style={{ color: "#d97706" }} />
                Career Toolkit Shortcuts
              </h3>
            </div>

            <div className="nectar-card-body">
              <div className="nectar-list-group">
                <Link to="/coming-soon?feature=AI%20Resume%20Builder&category=Career%20Toolkit&eta=v1.1%20Release" className="nectar-list-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)" }}>
                        AI Resume Builder
                      </h4>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>SOON</span>
                    </div>
                    <span style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)" }}>
                      Craft ATS-friendly professional resumes in minutes
                    </span>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
                </Link>

                <Link to="/tools" className="nectar-list-row">
                  <div>
                    <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)" }}>
                      Compensation Calculator
                    </h4>
                    <span style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)" }}>
                      Benchmark market rates across industries
                    </span>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
                </Link>

                <Link to="/job-seeker/recommended" className="nectar-list-row">
                  <div>
                    <h4 style={{ fontSize: "0.9375rem", margin: "0 0 2px", color: "var(--color-text)" }}>
                      Smart Job Recommendations
                    </h4>
                    <span style={{ fontSize: "0.78125rem", color: "var(--color-text-muted)" }}>
                      Positions matched with your verified capabilities
                    </span>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
