import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Job } from "../../types/job";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface FeaturedRoleSpotlightProps {
  jobs: Job[];
}

export default function FeaturedRoleSpotlight({ jobs }: FeaturedRoleSpotlightProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeJobId, setActiveJobId] = useState<string>(jobs[0]?.id || "");

  // Filter jobs by category
  const filteredJobs = useMemo(() => {
    if (selectedCategory === "REMOTE") {
      return jobs.filter((j) => j.is_remote);
    }
    if (selectedCategory === "FULL_TIME") {
      return jobs.filter((j) => j.employment_type === "FULL_TIME");
    }
    if (selectedCategory === "TECH") {
      return jobs.filter(
        (j) =>
          j.Company?.industry?.toLowerCase().includes("tech") ||
          j.title.toLowerCase().includes("engineer") ||
          j.title.toLowerCase().includes("developer") ||
          j.title.toLowerCase().includes("designer") ||
          j.title.toLowerCase().includes("product")
      );
    }
    return jobs;
  }, [jobs, selectedCategory]);

  // Keep active job valid when filter changes
  const activeJob = useMemo(() => {
    const found = filteredJobs.find((j) => j.id === activeJobId);
    return found || filteredJobs[0] || jobs[0];
  }, [filteredJobs, activeJobId, jobs]);

  const formatEmploymentType = (type?: string) => {
    if (!type) return "Full-time";
    switch (type) {
      case "FULL_TIME": return "Full-time";
      case "PART_TIME": return "Part-time";
      case "CONTRACT": return "Contract";
      case "INTERNSHIP": return "Internship";
      case "FREELANCE": return "Freelance";
      default: return type.replace(/_/g, "-").toLowerCase();
    }
  };

  const formatSalary = (job: Job) => {
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
    return "Competitive";
  };

  const getCompanyInitials = (name?: string) => {
    if (!name) return "NH";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const categories = [
    { key: "ALL", label: "All Opportunities" },
    { key: "REMOTE", label: "Remote & Hybrid" },
    { key: "FULL_TIME", label: "Full-Time Roles" },
    { key: "TECH", label: "Technology & Product" },
  ];

  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="spotlight-showcase-wrap">
      {/* Category Pills Header */}
      <div className="spotlight-category-bar">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`spotlight-cat-pill ${selectedCategory === cat.key ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory(cat.key);
              const nextJobs =
                cat.key === "REMOTE"
                  ? jobs.filter((j) => j.is_remote)
                  : cat.key === "FULL_TIME"
                  ? jobs.filter((j) => j.employment_type === "FULL_TIME")
                  : jobs;
              if (nextJobs.length > 0) setActiveJobId(nextJobs[0].id);
            }}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 2-Column Master-Detail Layout */}
      <div className="spotlight-dual-grid">
        {/* Left Column: Compact Interactive Role Feed */}
        <div className="spotlight-role-list" role="tablist" aria-label="Featured jobs selector">
          {filteredJobs.slice(0, 5).map((job) => {
            const isSelected = activeJob?.id === job.id;
            return (
              <div
                key={job.id}
                role="tab"
                tabIndex={0}
                aria-selected={isSelected}
                className={`spotlight-role-row ${isSelected ? "is-selected" : ""}`}
                onClick={() => setActiveJobId(job.id)}
                onMouseEnter={() => setActiveJobId(job.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveJobId(job.id);
                  }
                }}
              >
                {/* Company Logo or Initials */}
                <div className="spotlight-mini-logo">
                  {job.Company?.logo_url ? (
                    <img src={job.Company.logo_url} alt={job.Company.name} />
                  ) : (
                    <span>{getCompanyInitials(job.Company?.name)}</span>
                  )}
                </div>

                {/* Job & Company Info */}
                <div className="spotlight-row-info">
                  <div className="spotlight-row-title-line">
                    <span className="spotlight-row-title">{job.title}</span>
                    {job.is_remote && (
                      <span className="spotlight-mini-badge remote">Remote</span>
                    )}
                  </div>
                  <div className="spotlight-row-company-line">
                    <span className="spotlight-row-company">{job.Company?.name || "Enterprise Partner"}</span>
                    <span className="spotlight-sep">•</span>
                    <span className="spotlight-row-loc">{job.location || "Phnom Penh"}</span>
                  </div>
                </div>

                {/* Salary Tag & Chevron */}
                <div className="spotlight-row-right">
                  <span className="spotlight-salary-tag">{formatSalary(job)}</span>
                  <ChevronRight size={16} className="spotlight-row-chevron" />
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="spotlight-empty-state">
              <p>No open roles in this category right now.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedCategory("ALL")}
              >
                View All Roles
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Spotlight Preview Card */}
        {activeJob && (
          <div className="spotlight-preview-card">
            {/* Top Bar: Company info & Verification badge */}
            <div className="spotlight-preview-top">
              <div className="spotlight-preview-company-box">
                <div className="spotlight-preview-logo">
                  {activeJob.Company?.logo_url ? (
                    <img src={activeJob.Company.logo_url} alt={activeJob.Company.name} />
                  ) : (
                    <span>{getCompanyInitials(activeJob.Company?.name)}</span>
                  )}
                </div>
                <div>
                  <h4 className="spotlight-preview-company-name">
                    {activeJob.Company?.name || "Enterprise Partner"}
                  </h4>
                  <div className="spotlight-preview-verified-row">
                    <ShieldCheck size={14} className="spotlight-verified-icon" />
                    <span>Verified Employer</span>
                    <span className="spotlight-sep">•</span>
                    <span>{activeJob.Company?.industry || "Corporate"}</span>
                  </div>
                </div>
              </div>

              <span className="spotlight-preview-pill">FEATURED SPOTLIGHT</span>
            </div>

            {/* Main Job Title */}
            <h3 className="spotlight-preview-title">{activeJob.title}</h3>

            {/* Key Value Metric Tiles */}
            <div className="spotlight-metric-tiles">
              <div className="spotlight-tile">
                <span className="spotlight-tile-label">Compensation</span>
                <span className="spotlight-tile-val highlighted">{formatSalary(activeJob)}</span>
              </div>
              <div className="spotlight-tile">
                <span className="spotlight-tile-label">Employment Type</span>
                <span className="spotlight-tile-val">{formatEmploymentType(activeJob.employment_type)}</span>
              </div>
              <div className="spotlight-tile">
                <span className="spotlight-tile-label">Workplace</span>
                <span className="spotlight-tile-val">
                  {activeJob.is_remote ? "Remote / Hybrid" : activeJob.location || "On-site"}
                </span>
              </div>
            </div>

            {/* Description Snippet */}
            <p className="spotlight-preview-desc">
              {activeJob.description
                ? activeJob.description.replace(/<[^>]+>/g, "").slice(0, 180) + "..."
                : "Join a fast-growing team with competitive compensation, modern workflows, and career progression opportunities."}
            </p>

            {/* Feature Perks Pill Row */}
            <div className="spotlight-perks-row">
              <div className="spotlight-perk-item">
                <CheckCircle2 size={14} />
                <span>Direct HR Pipeline</span>
              </div>
              <div className="spotlight-perk-item">
                <CheckCircle2 size={14} />
                <span>Geofenced Shifts</span>
              </div>
              <div className="spotlight-perk-item">
                <CheckCircle2 size={14} />
                <span>Fast Decision</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="spotlight-action-bar">
              <Link to={`/jobs/${activeJob.id}`} className="spotlight-view-btn">
                <span>View Full Position</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="spotlight-catalog-link">
                <span>Browse All {jobs.length}+ Positions</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

