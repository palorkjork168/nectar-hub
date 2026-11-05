import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { GetJobsResponse, Job } from "../../types/job";
import EmptyState from "../../components/common/EmptyState";
import {
  Briefcase,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Search,
  RotateCcw,
} from "lucide-react";

import FluxHeroSection from "../../components/public/FluxHeroSection";
import FluxServices from "../../components/public/FluxServices";
import FluxFinalCta from "../../components/public/FluxFinalCta";
import FeaturedRoleSpotlight from "../../components/public/FeaturedRoleSpotlight";
import { useWebsiteMotion, splitWords } from "../../hooks/useScrollReveal";

export default function Home() {
  useWebsiteMotion();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      const response = await api.get<GetJobsResponse>("/jobs", {
        params: {
          limit: 8,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data.data.jobs;
    },
  });

  return (
    <div className="flux-page-root" style={{ width: "100%", overflowX: "hidden" }}>
      {/* ====================================================================
          1. INTRODUCE US (HERO & CORE MISSION)
          ==================================================================== */}
      <FluxHeroSection />

      {/* ====================================================================
          2. OUR JOBS (FEATURED OPPORTUNITIES)
          ==================================================================== */}
      <section className="flux-jobs-section">
        <div className="flux-jobs-container">
          <div className="flux-jobs-header-row">
            <div>
              <div
                className="flux-pill-badge"
                data-rev
                style={{ marginBottom: "0.75rem", "--d": "60ms" } as React.CSSProperties}
              >
                <span className="flux-yellow-dot" />
                <span className="flux-badge-text">FEATURED</span>
              </div>
              <h2
                className="flux-jobs-headline rev-word-container"
                data-rev
                style={{ "--d": "100ms" } as React.CSSProperties}
              >
                {splitWords("FEATURED JOBS", 80)}
                <span className="flux-title-dot">.</span>
              </h2>
            </div>
            <Link
              to="/jobs"
              className="flux-browse-all-btn"
              data-rev
              style={{ "--d": "140ms" } as React.CSSProperties}
            >
              <Search size={15} />
              <span>Browse All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flux-jobs-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card skeleton" style={{ height: "240px", borderRadius: "14px" }} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="card flux-error-card">
              <AlertCircle size={40} style={{ color: "var(--color-danger)", margin: "0 auto 1rem" }} />
              <h3 style={{ marginBottom: "0.5rem", fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
                Unable to load featured positions
              </h3>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
                Please check your network connection and try again.
              </p>
              <button
                onClick={() => refetch()}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RotateCcw size={15} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!data || data.length === 0) && (
            <EmptyState
              icon={Briefcase}
              title="No open positions right now"
              description="Check back soon for new opportunities."
              action={{
                label: "Browse Jobs",
                to: "/jobs",
                icon: Search,
              }}
            />
          )}

          {/* Populated Live Jobs: Interactive Spotlight */}
          {!isLoading && !isError && data && data.length > 0 && (
            <div data-rev style={{ "--d": "120ms" } as React.CSSProperties}>
              <FeaturedRoleSpotlight jobs={data} />
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          3. OUR SERVICES (CORE CAPABILITIES & PILLARS)
          ==================================================================== */}
      <FluxServices />

      {/* ====================================================================
          4. START / BEGIN SECTION (FINAL CTA)
          ==================================================================== */}
      <FluxFinalCta />

      {/* Floating Shortcut Sticker */}
      <Link to="/jobs" className="floating-sticker-widget" title="Explore All Opportunities" aria-label="Explore All Opportunities">
        <Sparkles size={24} />
      </Link>
    </div>
  );
}
