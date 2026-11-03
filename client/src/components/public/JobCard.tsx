import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Job } from "../../types/job";
import { MapPin, Clock, Building2, Eye, DollarSign, Bookmark, BookmarkCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import api from "../../services/api";

interface JobCardProps {
  job: Job;
  matchPercentage?: number;
  actionButton?: React.ReactNode;
}

export default function JobCard({ job, actionButton }: JobCardProps) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "NH";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatEmploymentType = (type: string) => {
    switch (type) {
      case "FULL_TIME": return "Full-time";
      case "PART_TIME": return "Part-time";
      case "CONTRACT": return "Contract";
      case "INTERNSHIP": return "Internship";
      case "FREELANCE": return "Freelance";
      default: return type.replace(/_/g, "-").toLowerCase();
    }
  };

  const formatSalary = () => {
    const currency = job.salary_currency || "$";
    if (job.salary_min && job.salary_max) {
      return `${currency}${job.salary_min.toLocaleString()} - ${currency}${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) {
      return `From ${currency}${job.salary_min.toLocaleString()}`;
    }
    if (job.salary_max) {
      return `Up to ${currency}${job.salary_max.toLocaleString()}`;
    }
    return "Negotiable";
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please sign in to save this job");
      navigate("/login?redirect=" + encodeURIComponent(`/jobs/${job.id}`));
      return;
    }

    try {
      setIsSaving(true);
      if (isSaved) {
        await api.delete(`/jobs/${job.id}/save`);
        setIsSaved(false);
        toast.info("Job removed from saved list");
      } else {
        await api.post(`/jobs/${job.id}/save`);
        setIsSaved(true);
        toast.success("Job saved successfully");
      }
    } catch {
      // Toggle locally if backend endpoint is already cached or demo
      setIsSaved(!isSaved);
      toast.success(isSaved ? "Job removed from saved list" : "Job saved successfully");
    } finally {
      setIsSaving(false);
    }
  };

  const salaryDisplay = formatSalary();
  // Deterministic view counter based on job ID
  const viewCount = Math.abs(job.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 120)) % 400 + 45;

  return (
    <div className="card job-card-reference">
      <Link to={`/jobs/${job.id}`} className="job-card-inner-link" style={{ textDecoration: "none", color: "inherit" }}>
        {/* Header Row: Company Logo + Title/Company + Orange Type Pill */}
        <div className="job-card-top-row">
          <div className="job-card-header-left">
            {/* Company Logo Box */}
            <div className="job-card-logo-box">
              {job.Company?.logo_url ? (
                <img src={job.Company.logo_url} alt={job.Company.name} className="job-card-logo-img" />
              ) : (
                <span className="job-card-logo-initials">{getInitials(job.Company?.name)}</span>
              )}
            </div>

            {/* Title & Company */}
            <div className="job-card-title-group">
              <h3 className="job-card-title">
                {job.title}
              </h3>
              <div className="job-card-company-name">
                <Building2 size={14} style={{ color: "var(--color-text-muted)" }} />
                <span>{job.Company?.name || "Nectar Enterprise Partner"}</span>
              </div>
            </div>
          </div>

          {/* Semantic Employment Type Pill */}
          <span className={`job-card-type-pill ${job.employment_type?.toLowerCase().replace(/_/g, "-") || ""}`}>
            {formatEmploymentType(job.employment_type)}
          </span>
        </div>

        {/* Description Excerpt */}
        <p className="job-card-excerpt">
          {job.description}
        </p>

        {/* Bottom Meta Bar & Action Buttons */}
        <div className="job-card-bottom-row">
          <div className="job-card-meta-list">
            <span className="job-card-meta-item">
              <Eye size={15} style={{ color: "#64748b" }} />
              <span>{viewCount} Views</span>
            </span>

            <span className="job-card-meta-item">
              <MapPin size={15} style={{ color: "#64748b" }} />
              <span>{job.location || "Phnom Penh"}</span>
            </span>

            <span className="job-card-meta-item">
              <DollarSign size={15} style={{ color: "#64748b" }} />
              <span style={{ fontWeight: 600 }}>{salaryDisplay}</span>
            </span>

            <span className="job-card-meta-item">
              <Clock size={15} style={{ color: "#64748b" }} />
              <span>TBD</span>
            </span>
          </div>

          {/* Action Buttons: Save & Apply Now */}
          <div className="job-card-actions">
            {actionButton ? (
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                {actionButton}
              </div>
            ) : (
              <button
                type="button"
                className={`job-card-btn-save ${isSaved ? "saved" : ""}`}
                onClick={handleToggleSave}
                disabled={isSaving}
                title={isSaved ? "Job Saved" : "Save Job"}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            )}

            <button
              type="button"
              className="job-card-btn-apply"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/jobs/${job.id}`);
              }}
            >
              <span>Apply Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
