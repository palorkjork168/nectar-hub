import { useState, useMemo, useRef, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const search = searchParams.get("search") || searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";
  const employmentType = searchParams.get("employment_type") || "";
  const industry = searchParams.get("industry") || "";
  const company = searchParams.get("company") || "";
  const minSalary = searchParams.get("salary_min") || "";
  const maxSalary = searchParams.get("salary_max") || "";
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = 10;

  // Local UI expansion toggles
  const [showMoreIndustries, setShowMoreIndustries] = useState(false);
  const [showMoreCompanies, setShowMoreCompanies] = useState(false);

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
    if (minSalary) p.salary_min = minSalary;
    if (maxSalary) p.salary_max = maxSalary;
    return p;
  }, [search, location, employmentType, minSalary, maxSalary, sortBy, sortOrder, page]);

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

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== "page") {
      newParams.delete("page");
    }
    newParams.delete("keyword");
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    search || location || employmentType || industry || company || minSalary || maxSalary
  );

  const pagination = data?.pagination;
  const totalJobsCount = pagination?.total ?? (data?.jobs?.length ?? 0);

  // Industry options
  const industryList = [
    "Technology / SaaS",
    "Microfinance & Banking",
    "Education & Training",
    "Healthcare & Pharma",
    "Sales & Marketing",
    "Logistics & Supply Chain",
    "HR & Staff Outsourcing",
    "Hospitality & Tourism",
    "Real Estate & Construction",
    "Legal & Accounting",
  ];

  // Company options
  const companyList = [
    "MR Training and Jobs Center",
    "Nectar Enterprise Hub",
    "ICS International School",
    "OXLEY WORLDBRIDGE",
    "Angkor Social Innovation Park",
    "TechGlobal Solutions",
    "InnovateAI Southeast Asia",
    "Nexus Enterprises",
  ];

  const displayedIndustries = showMoreIndustries ? industryList : industryList.slice(0, 4);
  const displayedCompanies = showMoreCompanies ? companyList : companyList.slice(0, 4);

  // Search recommendations & location combo-box state
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const locationBoxRef = useRef<HTMLDivElement>(null);

  const POPULAR_JOB_TITLES = [
    "Graphic Designer",
    "UI/UX Designer",
    "Product Designer",
    "Game Developer",
    "Growth Marketing Specialist",
    "General Manager",
    "Frontend Developer",
    "Full Stack Engineer",
    "Backend Developer",
    "Mobile Developer",
    "DevOps Engineer",
    "Data Analyst",
    "Human Resources (HR)",
    "Content Creator",
    "Sales Executive",
    "Project Manager",
    "QA Engineer",
  ];

  const POPULAR_LOCATIONS = [
    "Phnom Penh, Cambodia",
    "Siem Reap, Cambodia",
    "Battambang, Cambodia",
    "Sihanoukville, Cambodia",
    "Remote",
    "Bangkok, Thailand",
    "Singapore",
    "Kuala Lumpur, Malaysia",
    "Ho Chi Minh City, Vietnam",
  ];

  const filteredTitles = useMemo(() => {
    if (!search.trim()) return POPULAR_JOB_TITLES.slice(0, 6);
    return POPULAR_JOB_TITLES.filter((t) =>
      t.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const filteredLocations = useMemo(() => {
    if (!location.trim()) return POPULAR_LOCATIONS;
    return POPULAR_LOCATIONS.filter((l) =>
      l.toLowerCase().includes(location.toLowerCase())
    );
  }, [location]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (locationBoxRef.current && !locationBoxRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="public-container">
      {/* Top Banner Search Bar */}
      <div className="jobs-top-search-banner">
        <div className="jobs-search-row">
          {/* Job Title / Skill with Recommendations Dropdown */}
          <div className="jobs-search-input-box" ref={searchBoxRef}>
            <div className="jobs-search-icon-wrap">
              <Search size={18} className="jobs-search-icon" />
            </div>
            <input
              type="text"
              className="jobs-search-input-field"
              placeholder="Search by job title, skill, or keyword..."
              value={search}
              onFocus={() => setShowSearchSuggestions(true)}
              onChange={(e) => {
                updateFilter("search", e.target.value);
                setShowSearchSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSearchSuggestions(false);
                if (e.key === "Enter" && filteredTitles.length > 0 && showSearchSuggestions) {
                  updateFilter("search", filteredTitles[0]);
                  setShowSearchSuggestions(false);
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  updateFilter("search", "");
                  setShowSearchSuggestions(false);
                }}
                className="btn-icon"
                style={{ width: "24px", height: "24px", color: "var(--color-text-muted)", flexShrink: 0 }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {/* Recommendations Dropdown */}
            {showSearchSuggestions && filteredTitles.length > 0 && (
              <div className="search-suggestions-dropdown">
                <div className="search-suggestions-header">
                  {search.trim() ? "Recommended Roles & Skills" : "Popular Searches"}
                </div>
                {filteredTitles.map((title) => (
                  <button
                    key={title}
                    type="button"
                    className="search-suggestion-item"
                    onClick={() => {
                      updateFilter("search", title);
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <div className="search-suggestion-content">
                      <Search size={14} className="search-suggestion-icon" />
                      <span>{title}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-primary-text)", fontWeight: 600 }}>
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Combo-Box with Dropdown Selection */}
          <div className="jobs-search-input-box" ref={locationBoxRef}>
            <div className="jobs-search-icon-wrap">
              <MapPin size={18} className="jobs-search-icon" />
            </div>
            <input
              type="text"
              className="jobs-search-input-field"
              placeholder="Location (e.g. Phnom Penh, Remote)..."
              value={location}
              onFocus={() => setShowLocationDropdown(true)}
              onChange={(e) => {
                updateFilter("location", e.target.value);
                setShowLocationDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowLocationDropdown(false);
                if (e.key === "Enter" && filteredLocations.length > 0 && showLocationDropdown) {
                  updateFilter("location", filteredLocations[0]);
                  setShowLocationDropdown(false);
                }
              }}
            />
            {location && (
              <button
                type="button"
                onClick={() => {
                  updateFilter("location", "");
                  setShowLocationDropdown(false);
                }}
                className="btn-icon"
                style={{ width: "24px", height: "24px", color: "var(--color-text-muted)", flexShrink: 0 }}
                aria-label="Clear location"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLocationDropdown((prev) => !prev)}
              className="btn-icon"
              style={{ width: "28px", height: "28px", color: "var(--color-text-muted)", flexShrink: 0, marginLeft: "0.25rem" }}
              title="Select location option"
              aria-label="Toggle location options"
            >
              <ChevronDown size={16} />
            </button>

            {/* Location Combo Dropdown */}
            {showLocationDropdown && (
              <div className="search-suggestions-dropdown">
                <div className="search-suggestions-header">
                  Select or Type Location
                </div>
                {filteredLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className="search-suggestion-item"
                    onClick={() => {
                      updateFilter("location", loc);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <div className="search-suggestion-content">
                      <MapPin size={14} className="search-suggestion-icon" />
                      <span>{loc}</span>
                    </div>
                    {location === loc && (
                      <span style={{ fontSize: "0.72rem", color: "var(--color-primary-text)", fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout matching Image 2 reference */}
      <div className="browse-jobs-grid-layout">
        {/* Left Column: Sidebar Filters */}
        <aside className="card filters-sidebar-card">
          <div className="filters-sidebar-header">
            <h3 className="filters-title">
              <Filter size={18} />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="filters-reset-link"
              >
                Reset
              </button>
            )}
          </div>

          {/* 1. Employment Type Checkboxes */}
          <div className="filter-section">
            <div className="filter-section-title">Employment Type</div>
            <div className="filter-checkbox-list">
              {[
                { label: "Full-time", value: "FULL_TIME" },
                { label: "Internship", value: "INTERNSHIP" },
                { label: "Part-time", value: "PART_TIME" },
                { label: "Contract", value: "CONTRACT" },
              ].map((item) => (
                <label key={item.value} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={employmentType === item.value}
                    onChange={(e) => updateFilter("employment_type", e.target.checked ? item.value : "")}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Industry Checkboxes */}
          <div className="filter-section">
            <div className="filter-section-title">Industry</div>
            <div className="filter-checkbox-list">
              {displayedIndustries.map((ind) => (
                <label key={ind} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={industry === ind}
                    onChange={(e) => updateFilter("industry", e.target.checked ? ind : "")}
                  />
                  <span>{ind}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="filter-show-more-btn"
              onClick={() => setShowMoreIndustries(!showMoreIndustries)}
            >
              {showMoreIndustries ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>Show {industryList.length - 4} more <ChevronDown size={14} /></>
              )}
            </button>
          </div>

          {/* 3. Salary Range Inputs & Slider */}
          <div className="filter-section">
            <div className="filter-section-header-row">
              <span className="filter-section-title">Salary Range</span>
              <span className="filter-any-tag">Any</span>
            </div>

            <div className="salary-inputs-row">
              <div className="salary-input-wrap">
                <span className="salary-prefix">$</span>
                <input
                  type="number"
                  className="salary-number-input"
                  placeholder="0"
                  value={minSalary}
                  onChange={(e) => updateFilter("salary_min", e.target.value)}
                />
              </div>
              <span style={{ color: "var(--color-text-muted)" }}>to</span>
              <div className="salary-input-wrap">
                <span className="salary-prefix">$</span>
                <input
                  type="number"
                  className="salary-number-input"
                  placeholder="5000"
                  value={maxSalary}
                  onChange={(e) => updateFilter("salary_max", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Company Filter */}
          <div className="filter-section">
            <div className="filter-section-title">Company</div>
            <div className="filter-checkbox-list">
              {displayedCompanies.map((c) => (
                <label key={c} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={company === c}
                    onChange={(e) => updateFilter("company", e.target.checked ? c : "")}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="filter-show-more-btn"
              onClick={() => setShowMoreCompanies(!showMoreCompanies)}
            >
              {showMoreCompanies ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>Show {companyList.length - 4} more <ChevronDown size={14} /></>
              )}
            </button>
          </div>

          {/* Clear All Filters Action */}
          <button
            type="button"
            onClick={handleClearAll}
            className="btn-clear-all-filters"
          >
            Clear All Filters
          </button>
        </aside>

        {/* Right Column: Results & List */}
        <section className="browse-jobs-results-column">
          {/* Header count matching Image 2 ("Showing 20/1430 jobs") */}
          <div className="browse-jobs-results-header">
            <h2 className="browse-jobs-count-text">
              Showing <strong>{data?.jobs?.length ?? 0}</strong>/{totalJobsCount} jobs
            </h2>

            {/* Sort selector */}
            <div className="browse-jobs-sort-wrap">
              <span className="sort-label">Sort:</span>
              <select
                className="sort-select-input"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("-");
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("sort_by", sb);
                  newParams.set("sort_order", so);
                  newParams.delete("page");
                  setSearchParams(newParams);
                }}
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="salary_max-desc">Highest Salary</option>
                <option value="salary_min-asc">Lowest Salary</option>
              </select>
            </div>
          </div>

          {/* Active Chips */}
          {hasActiveFilters && (
            <div className="active-filters-chips-row">
              {search && (
                <span className="filter-chip">
                  Search: "{search}"
                  <X size={12} className="chip-remove-icon" onClick={() => updateFilter("search", "")} />
                </span>
              )}
              {location && (
                <span className="filter-chip">
                  Location: {location}
                  <X size={12} className="chip-remove-icon" onClick={() => updateFilter("location", "")} />
                </span>
              )}
              {employmentType && (
                <span className="filter-chip">
                  Type: {employmentType}
                  <X size={12} className="chip-remove-icon" onClick={() => updateFilter("employment_type", "")} />
                </span>
              )}
              {minSalary && (
                <span className="filter-chip">
                  Min: ${minSalary}
                  <X size={12} className="chip-remove-icon" onClick={() => updateFilter("salary_min", "")} />
                </span>
              )}
              {maxSalary && (
                <span className="filter-chip">
                  Max: ${maxSalary}
                  <X size={12} className="chip-remove-icon" onClick={() => updateFilter("salary_max", "")} />
                </span>
              )}
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card skeleton" style={{ height: "180px", borderRadius: "1rem" }} />
              ))}
            </div>
          ) : isError ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <AlertCircle size={36} style={{ color: "#ef4444", margin: "0 auto 1rem" }} />
              <h3 style={{ margin: "0 0 0.5rem" }}>Failed to load jobs</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                An error occurred while fetching job listings from the server.
              </p>
              <button onClick={() => refetch()} className="btn btn-secondary">
                Try Again
              </button>
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
              <Briefcase size={36} style={{ color: "var(--color-primary-text)", margin: "0 auto 1rem" }} />
              <h3 style={{ margin: "0 0 0.5rem" }}>No matching jobs found</h3>
              <p style={{ color: "var(--color-text-muted)", maxWidth: "440px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
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
            <div className="pagination-container" style={{ marginTop: "2rem" }}>
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
