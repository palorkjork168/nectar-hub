import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import type { GetJobsResponse, Job } from "../../types/job";
import JobCard from "../../components/public/JobCard";
import EmptyState from "../../components/common/EmptyState";
import FeatureCarousel from "../../components/public/FeatureCarousel";
import {
  Search,
  MapPin,
  ArrowRight,
  Sparkles,
  Building2,
  Users2,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Award,
  Wifi,
  Globe2,
  ArrowUpRight,
  Layers,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }
    if (locationTerm.trim()) {
      params.set("location", locationTerm.trim());
    }
    navigate(`/jobs?${params.toString()}`);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      const response = await api.get<GetJobsResponse>("/jobs", {
        params: {
          limit: 6,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data.data.jobs;
    },
  });

  return (
    <div style={{ background: "#070c09", color: "#f8fafc" }}>
      {/* Hero Section — Dual Column GreenBank Reference Style */}
      <section className="hero-section">
        <div className="hero-split-container">
          {/* Left Column: Headlines & Search */}
          <div className="hero-left">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Next-Gen Talent Ecosystem in Southeast Asia</span>
            </div>

            <h1 className="hero-headline">
              Discover the Perfect <br />
              <span className="hero-gradient-text">Career for You</span>
            </h1>

            <p className="hero-subheadline">
              Unlock verified career opportunities, automated skill verifications, and enterprise-grade recruitment pathways on Nectar Hub.
            </p>

            {/* Glass Search Form */}
            <div className="hero-search-card" style={{ width: "100%", margin: "0 0 1.25rem 0" }}>
              <form onSubmit={handleSearch} className="hero-search-form">
                <div className="search-field-wrapper">
                  <Search size={18} style={{ color: "var(--color-primary)" }} />
                  <input
                    type="text"
                    className="search-field-input"
                    placeholder="Job title, tech stack, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="search-field-wrapper">
                  <MapPin size={18} style={{ color: "var(--color-primary)" }} />
                  <input
                    type="text"
                    className="search-field-input"
                    placeholder="City, region, or 'Remote'..."
                    value={locationTerm}
                    onChange={(e) => setLocationTerm(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", whiteSpace: "nowrap" }}>
                  Explore Jobs <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Trending Searches */}
            <div className="trending-searches" style={{ justifyContent: "flex-start", marginBottom: "2rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Hot:</span>
              <Link to="/jobs?search=Fullstack" className="trending-pill">Fullstack</Link>
              <Link to="/jobs?search=Engineering" className="trending-pill">Engineering</Link>
              <Link to="/jobs?is_remote=true" className="trending-pill">Remote ⚡</Link>
              <Link to="/jobs?search=DevOps" className="trending-pill">DevOps</Link>
              <Link to="/jobs?location=Phnom+Penh" className="trending-pill">Phnom Penh</Link>
            </div>

            {/* Active Metrics Bar */}
            <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", width: "100%" }}>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>500+</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Active Roles</div>
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#34d399", lineHeight: 1 }}>120+</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Tech Partners</div>
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>10.2k+</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Verified Talents</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating Glass Card Showcase (GreenBank Reference) */}
          <div className="hero-right-visual">
            <div className="hero-orb-glow" />

            <div className="card-stack-wrapper">
              {/* Back Card */}
              <div className="nectar-glass-card-back" />

              {/* Front Card */}
              <div className="nectar-glass-card-front">
                <div className="card-top-row">
                  <div className="card-chip" />
                  <div className="card-brand">
                    <Wifi size={18} style={{ transform: "rotate(90deg)", color: "#34d399" }} />
                    <div className="card-circles">
                      <div className="card-circle one" />
                      <div className="card-circle two" />
                    </div>
                  </div>
                </div>

                <div className="card-number">
                  NECTAR • 2026 • 8820
                </div>

                <div className="card-bottom-row">
                  <div>
                    <div className="card-holder-label">Talent Pass ID</div>
                    <div className="card-holder-val">ALEXANDER REEVES</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="card-holder-label">Tier / Status</div>
                    <div className="card-holder-val" style={{ color: "#34d399" }}>VERIFIED PRO</div>
                  </div>
                </div>
              </div>

              {/* Floating Status Pill 1 */}
              <div className="hero-floating-pill pill-pos-1">
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
                  <Award size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>Top 1% Candidate</div>
                  <div style={{ fontSize: "0.65rem", color: "#34d399" }}>Score 98.4 / 100</div>
                </div>
              </div>

              {/* Floating Status Pill 2 */}
              <div className="hero-floating-pill pill-pos-2">
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                  <Zap size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>Matched in 48h</div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>3 Enterprise Offers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Logos Ribbon */}
      <section className="partner-ribbon-section">
        <div className="partner-ribbon-container">
          <div className="partner-logo-item">
            <Globe2 size={18} /> SMART AXIATA
          </div>
          <div className="partner-logo-item">
            <Building2 size={18} /> WING BANK
          </div>
          <div className="partner-logo-item">
            <ShieldCheck size={18} /> ABA ENTERPRISE
          </div>
          <div className="partner-logo-item">
            <Zap size={18} /> CODIGO LABS
          </div>
          <div className="partner-logo-item">
            <Layers size={18} /> NEXUS GLOBAL
          </div>
          <div className="partner-logo-item">
            <Sparkles size={18} /> QUANTUM CORP
          </div>
        </div>
      </section>

      {/* Interactive Feature Carousel (Requested by User) */}
      <FeatureCarousel />

      {/* Latest Opportunities Section */}
      <section className="public-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="section-header" style={{ marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              <TrendingUp size={14} /> Curated Openings
            </div>
            <h2 className="section-title">Latest High-Impact Roles</h2>
            <p className="section-subtitle">
              Verified positions hand-picked for engineering, technical management, and digital craft
            </p>
          </div>
          <Link to="/jobs" className="btn btn-secondary" style={{ gap: "0.375rem" }}>
            View All Jobs <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="jobs-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="job-card">
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "0.5rem" }} />
                    <div className="skeleton" style={{ height: "14px", width: "40%" }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: "16px", width: "50%", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ height: "40px", width: "100%", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ height: "20px", width: "30%" }} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Unable to load latest jobs"
            description="Please verify your server connection and try again."
            action={{ label: "Try Again", onClick: () => refetch() }}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs published yet"
            description="Check back soon as top employers post new opportunities daily."
            action={{ label: "Browse Job Catalog", to: "/jobs" }}
          />
        ) : (
          <div className="jobs-grid">
            {data.map((job: Job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Bento Grid — Reference 2: Coquice Smart Solutions Style */}
      <section className="bento-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontWeight: 700, fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            <Sparkles size={16} /> Elite Workforce Infrastructure
          </div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            Engineered for Precision Hiring & Rapid Growth
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1.125rem", maxWidth: "640px", margin: "0 auto" }}>
            We eliminate outdated hiring silos with cryptographically secured profiles, automated interview pipelines, and real-time candidate matchmaking.
          </p>

          <div className="bento-grid">
            {/* Bento Card 1: Large feature */}
            <div className="bento-card bento-col-8" style={{ textAlign: "left" }}>
              <div className="bento-icon-wrapper">
                <ShieldCheck size={28} />
              </div>
              <h3 className="bento-title">Cryptographically Verified Credentials</h3>
              <p className="bento-desc">
                Say goodbye to falsified resumes. Every diploma, certificate, and prior work tenure can be verified directly on our ledger-backed employee database, cutting HR compliance time by over 80%.
              </p>
              <div className="bento-metric-highlight">
                <span className="bento-metric-number">99.8%</span>
                <span className="bento-metric-text">credential accuracy rate across enterprise clients</span>
              </div>
            </div>

            {/* Bento Card 2: Metric Accent */}
            <div className="bento-card bento-col-4" style={{ textAlign: "left", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 30, 20, 0.8) 100%)" }}>
              <div className="bento-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.25)" }}>
                <Zap size={28} />
              </div>
              <h3 className="bento-title">Sub-48h Placement</h3>
              <p className="bento-desc">
                High-priority engineering roles are filled in less than 2 business days on average.
              </p>
              <div className="bento-metric-highlight">
                <span className="bento-metric-number">3.2x</span>
                <span className="bento-metric-text">faster than traditional agency headhunting</span>
              </div>
            </div>

            {/* Bento Card 3: Interactive Interview Hub */}
            <div className="bento-card bento-col-4" style={{ textAlign: "left" }}>
              <div className="bento-icon-wrapper">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="bento-title">Integrated Interview Hub</h3>
              <p className="bento-desc">
                Real-time meeting dispatch, automated candidate reminders, and structured grading rubrics for hiring managers.
              </p>
              <div className="bento-metric-highlight">
                <span className="bento-metric-number">100%</span>
                <span className="bento-metric-text">audit-logged scoring & feedback</span>
              </div>
            </div>

            {/* Bento Card 4: Enterprise RBAC */}
            <div className="bento-card bento-col-4" style={{ textAlign: "left" }}>
              <div className="bento-icon-wrapper">
                <Users2 size={28} />
              </div>
              <h3 className="bento-title">Granular RBAC Security</h3>
              <p className="bento-desc">
                Configure role capabilities down to individual API actions with instant permission reflection and zero token leaks.
              </p>
              <div className="bento-metric-highlight">
                <span className="bento-metric-number">0</span>
                <span className="bento-metric-text">security compromises or privilege escalations</span>
              </div>
            </div>

            {/* Bento Card 5: Smart Matching Engine */}
            <div className="bento-card bento-col-4" style={{ textAlign: "left" }}>
              <div className="bento-icon-wrapper">
                <TrendingUp size={28} />
              </div>
              <h3 className="bento-title">Skill-Vector Matching</h3>
              <p className="bento-desc">
                Algorithmic indexing maps applicants to role competencies, ensuring cultural and technical synergy.
              </p>
              <div className="bento-metric-highlight">
                <span className="bento-metric-number">94%</span>
                <span className="bento-metric-text">candidate probation pass rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section style={{ padding: "5rem 1.5rem", background: "radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 60%), #070c09", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "rgba(16, 28, 20, 0.8)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "24px", padding: "3.5rem 2rem", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.2)", backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#fff" }}>
            Ready to Accelerate Your Career or Scale Your Team?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1.0625rem", maxWidth: "560px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            Join thousands of professionals and forward-thinking enterprises building the future of work on Nectar Hub today.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>
              Create Free Account <ArrowUpRight size={18} />
            </Link>
            <Link to="/jobs" className="btn btn-secondary" style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>
              Explore All Openings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

