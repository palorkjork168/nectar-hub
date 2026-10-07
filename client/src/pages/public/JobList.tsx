import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { GetJobsResponse, Job } from "../../types/job";
import JobCard from "../../components/public/JobCard";
import {
  Search,
  MapPin,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filters from URL query
  const search = searchParams.get("search") || searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";
  const employmentType = searchParams.get("employment_type") || "";
  const experienceLevel = searchParams.get("experience_level") || "";
  const isRemote = searchParams.get("is_remote") || "";
  const datePosted = searchParams.get("date_posted") || "";
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = 10;

  // Build params object for API call
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (search) p.search = search;
    if (location) p.location = location;
    if (employmentType) p.employment_type = employmentType;
    if (experienceLevel) p.experience_level = experienceLevel;
    if (isRemote) p.is_remote = isRemote;
    if (datePosted) p.date_posted = datePosted;
    return p;
  }, [search, location, employmentType, experienceLevel, isRemote, datePosted, sortBy, sortOrder, page]);

  // Fetch jobs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", queryParams],
    queryFn: async () => {
      const response = await api.get<GetJobsResponse>("/jobs", {
        params: queryParams,
      });
      return response.data.data;
    },
  });

  // Filter mutation helper
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 whenever filters change
    if (key !== "page") {
      newParams.delete("page");
    }
    // Clean up deprecated "keyword" if set
    newParams.delete("keyword");
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    search || location || employmentType || experienceLevel || isRemote || datePosted
  );

  const pagination = data?.pagination;

  return (
    <div className="public-container">
      {/* Top Search & Filter Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 28, 21, 0.9) 0%, rgba(9, 16, 12, 0.95) 100%)",
          padding: "1.25rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          marginBottom: "2rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", alignItems: "center" }}>
          <div className="search-field-wrapper" style={{ backgroundColor: "#09120e", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Search size={18} style={{ color: "#10b981" }} />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search job title or keyword..."
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
            {search && (
              <button
                onClick={() => updateFilter("search", "")}
                className="btn-icon"
                style={{ width: "24px", height: "24px" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="search-field-wrapper" style={{ backgroundColor: "#09120e", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <MapPin size={18} style={{ color: "#10b981" }} />
            <input
              type="text"
              className="search-field-input"
              placeholder="Location (e.g. Phnom Penh)..."
              value={location}
              onChange={(e) => updateFilter("location", e.target.value)}
            />
            {location && (
              <button
                onClick={() => updateFilter("location", "")}
                className="btn-icon"
                style={{ width: "24px", height: "24px" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <select
              className="input-field"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                const newParams = new URLSearchParams(searchParams);
                newParams.set("sort_by", sb);
                newParams.set("sort_order", so);
                newParams.delete("page");
                setSearchParams(newParams);
              }}
              style={{ flex: 1 }}
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="salary_max-desc">Highest Salary</option>
              <option value="salary_min-asc">Lowest Salary</option>
            </select>

            {hasActiveFilters && (
              <button onClick={handleClearAll} className="btn btn-secondary" style={{ padding: "0.5rem 0.875rem" }} title="Clear all filters">
                <RotateCcw size={15} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Jobs Content */}
      <div className="job-list-layout">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-sidebar-header">
            <h3 className="filter-sidebar-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={18} /> Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="btn btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Employment Type */}
          <div className="filter-group">
            <label className="filter-group-label">Employment Type</label>
            <select
              className="input-field"
              value={employmentType}
              onChange={(e) => updateFilter("employment_type", e.target.value)}
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          {/* Experience Level */}
          <div className="filter-group">
            <label className="filter-group-label">Experience Level</label>
            <select
              className="input-field"
              value={experienceLevel}
              onChange={(e) => updateFilter("experience_level", e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead / Management</option>
            </select>
          </div>

          {/* Remote Option */}
          <div className="filter-group">
            <label className="filter-group-label">Remote Workplace</label>
            <select
              className="input-field"
              value={isRemote}
              onChange={(e) => updateFilter("is_remote", e.target.value)}
            >
              <option value="">All Settings</option>
              <option value="true">Remote Only</option>
              <option value="false">On-site / Office</option>
            </select>
          </div>

          {/* Date Posted */}
          <div className="filter-group">
            <label className="filter-group-label">Date Posted</label>
            <select
              className="input-field"
              value={datePosted}
              onChange={(e) => updateFilter("date_posted", e.target.value)}
            >
              <option value="">Anytime</option>
              <option value="today">Past 24 hours</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
            </select>
          </div>
        </aside>

        {/* Right Job Results List */}
        <section>
          {/* Header count & Active chips */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {isLoading ? "Searching jobs..." : `Showing ${pagination?.total ?? 0} jobs`}
              </h2>
              {hasActiveFilters && (
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Filtered results
                </span>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {search && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Search: "{search}"
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("search", "")} />
                </span>
              )}
              {location && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Location: {location}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("location", "")} />
                </span>
              )}
              {employmentType && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Type: {employmentType}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("employment_type", "")} />
                </span>
              )}
              {experienceLevel && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Level: {experienceLevel}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("experience_level", "")} />
                </span>
              )}
              {isRemote && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  {isRemote === "true" ? "Remote Only" : "On-site"}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("is_remote", "")} />
                </span>
              )}
              {datePosted && (
                <span className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Posted: {datePosted}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => updateFilter("date_posted", "")} />
                </span>
              )}
            </div>
          )}

          {/* State Rendering */}
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="job-card">
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)" }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: "22px", width: "60%", marginBottom: "0.5rem" }} />
                      <div className="skeleton" style={{ height: "16px", width: "35%" }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: "18px", width: "40%", marginBottom: "0.75rem" }} />
                  <div className="skeleton" style={{ height: "36px", width: "100%", marginBottom: "1rem" }} />
                  <div className="skeleton" style={{ height: "20px", width: "25%" }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="card empty-state" style={{ padding: "3rem" }}>
              <div className="empty-state-icon" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                <AlertCircle size={28} />
              </div>
              <h3>Failed to load jobs</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                An error occurred while fetching job listings from the server.
              </p>
              <button onClick={() => refetch()} className="btn btn-secondary">
                Try Again
              </button>
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <div className="card empty-state" style={{ padding: "3.5rem 2rem" }}>
              <div className="empty-state-icon">
                <Briefcase size={32} />
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>No matching jobs found</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                We couldn't find any job openings matching your current search or filter criteria. Try adjusting your keywords or clearing filters.
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearAll} className="btn btn-primary">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {data.jobs.map((job: Job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => updateFilter("page", (page - 1).toString())}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span className="pagination-info">
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
              </span>

              <button
                className="pagination-btn"
                disabled={page >= pagination.totalPages}
                onClick={() => updateFilter("page", (page + 1).toString())}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
