import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Calendar,
  BarChart3,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface SlideData {
  id: string;
  tag: string;
  title: string;
  description: string;
  badgeText: string;
  badgeNumber: string;
  ctaText: string;
  ctaLink: string;
  icon: typeof Sparkles;
  metricLabel: string;
  metricValue: string;
  subMetrics: { label: string; value: string }[];
  visualContent: {
    avatarText: string;
    cardTitle: string;
    cardSub: string;
    skills: string[];
    statusBadge: string;
  };
}

const SLIDES: SlideData[] = [
  {
    id: "ai-matching",
    tag: "Next-Gen Discovery",
    title: "Precision Skill Matrix & Real-Time Matching",
    description:
      "Our multi-dimensional skill analysis maps your strengths against verified company requirements, delivering candidates with a 98.4% match rate.",
    badgeText: "High Compatibility",
    badgeNumber: "98.4%",
    ctaText: "Explore Matches",
    ctaLink: "/jobs",
    icon: Sparkles,
    metricLabel: "Candidate Accuracy",
    metricValue: "98.4%",
    subMetrics: [
      { label: "Talent Pool", value: "10.2k+" },
      { label: "Avg. Match Time", value: "< 24 hrs" },
      { label: "Verified Roles", value: "500+" },
    ],
    visualContent: {
      avatarText: "SK",
      cardTitle: "Full Stack Systems Engineer",
      cardSub: "Senior Tier • FinTech Platform",
      skills: ["React 19", "Node.js", "PostgreSQL", "Docker", "TypeScript"],
      statusBadge: "Verified Applicant",
    },
  },
  {
    id: "fast-track",
    tag: "Frictionless Workflow",
    title: "1-Click Fast-Track Application Pipeline",
    description:
      "Apply in a single click with your Sakol Universe master credentials. Real-time stage updates ensure candidates and employers are never left waiting.",
    badgeText: "Instant Pipeline",
    badgeNumber: "3x Faster",
    ctaText: "Start Applying",
    ctaLink: "/jobs",
    icon: Zap,
    metricLabel: "Application Speed",
    metricValue: "3x Faster",
    subMetrics: [
      { label: "Direct Recruiter Response", value: "92%" },
      { label: "Profile Verification", value: "100%" },
      { label: "Average Turnaround", value: "2 Days" },
    ],
    visualContent: {
      avatarText: "JD",
      cardTitle: "Lead UI/UX Product Designer",
      cardSub: "Design Systems • SaaS Experience",
      skills: ["Figma 3D", "Design Tokens", "Accessibility", "Prototyping"],
      statusBadge: "Fast-Track Review",
    },
  },
  {
    id: "interviews",
    tag: "Synchronized Coordination",
    title: "Automated Interview Studio & Calendar Sync",
    description:
      "Eliminate tedious email back-and-forth. Schedule, confirm, and prepare for candidate technical sessions with automatic timezone conversion and alerts.",
    badgeText: "Zero Conflicts",
    badgeNumber: "100% Sync",
    ctaText: "View Portal",
    ctaLink: "/login",
    icon: Calendar,
    metricLabel: "On-Time Schedule",
    metricValue: "99.8%",
    subMetrics: [
      { label: "Interview Sessions", value: "3,400+" },
      { label: "Reschedule Rate", value: "< 2%" },
      { label: "Automated Reminders", value: "Real-Time" },
    ],
    visualContent: {
      avatarText: "IN",
      cardTitle: "Technical Architecture Interview",
      cardSub: "Scheduled: 10:30 AM (Indochina Time)",
      skills: ["System Design", "Microservices", "Security", "Scale"],
      statusBadge: "Session Confirmed",
    },
  },
  {
    id: "workforce",
    tag: "Enterprise Governance",
    title: "Real-Time Attendance & Shift Intelligence",
    description:
      "Empower your HR and management teams with live check-ins, automated shifts, overtime calculation, and company-wide role permission controls.",
    badgeText: "Enterprise Ready",
    badgeNumber: "99.2% Logged",
    ctaText: "Employer Portal",
    ctaLink: "/employer/dashboard",
    icon: BarChart3,
    metricLabel: "Workforce Coverage",
    metricValue: "99.2%",
    subMetrics: [
      { label: "Active Enterprises", value: "120+" },
      { label: "Check-in Precision", value: "Sub-Second" },
      { label: "Audit Compliance", value: "Full SOC-2" },
    ],
    visualContent: {
      avatarText: "WF",
      cardTitle: "Engineering Department Operations",
      cardSub: "48 Employees On-Duty • 0 Unresolved Leaves",
      skills: ["Shift Rotation", "Overtime Tracking", "Leave Policies"],
      statusBadge: "All Clear",
    },
  },
];

export default function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSlide = SLIDES[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activeIndex]);

  return (
    <section
      className="carousel-showcase-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        padding: "4rem 1.5rem 5rem",
        position: "relative",
        background: "linear-gradient(180deg, #070c09 0%, #0a130f 50%, #070c09 100%)",
        borderTop: "1px solid rgba(16, 185, 129, 0.15)",
        borderBottom: "1px solid rgba(16, 185, 129, 0.15)",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow orb */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: "700px",
          height: "400px",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1240px", margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 1rem",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "0.8125rem",
              fontWeight: 700,
              marginBottom: "1rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={14} /> Interactive Platform Capabilities
          </div>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "#f8fafc",
              margin: "0 0 0.75rem 0",
              letterSpacing: "-0.025em",
            }}
          >
            Engineered for High-Growth <span className="hero-gradient-text">Talent & Teams</span>
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "#94a3b8",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Explore how Sakol Universe redefines technical recruitment, workflow management, and applicant matching.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.625rem",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {SLIDES.map((slide, idx) => {
            const isSelected = idx === activeIndex;
            const Icon = slide.icon;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.125rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.875rem",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#051a10" : "#94a3b8",
                  background: isSelected
                    ? "linear-gradient(135deg, #10b981 0%, #00e599 100%)"
                    : "rgba(16, 28, 20, 0.65)",
                  border: isSelected
                    ? "1px solid rgba(16, 185, 129, 0.6)"
                    : "1px solid rgba(16, 185, 129, 0.18)",
                  boxShadow: isSelected ? "0 0 20px rgba(16, 185, 129, 0.4)" : "none",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                <Icon size={16} />
                <span>{slide.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Stage — Bento Glass Layout */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 28, 21, 0.95) 0%, rgba(10, 17, 13, 0.9) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.28)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.1)",
            backdropFilter: "blur(20px)",
            padding: "2.5rem",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2.5rem",
            alignItems: "center",
            position: "relative",
          }}
          className="carousel-stage-grid"
        >
          <style>{`
            @media (min-width: 960px) {
              .carousel-stage-grid {
                grid-template-columns: 1.15fr 0.85fr !important;
                padding: 3.5rem !important;
              }
            }
          `}</style>

          {/* Left Column: Narrative & Micro-Metrics */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#34d399",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                {activeSlide.tag}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "var(--radius-full)",
                }}
              >
                Feature {activeIndex + 1} of {SLIDES.length}
              </span>
            </div>

            <h3
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.2,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {activeSlide.title}
            </h3>

            <p
              style={{
                fontSize: "1.0625rem",
                lineHeight: 1.65,
                color: "#94a3b8",
                margin: 0,
              }}
            >
              {activeSlide.description}
            </p>

            {/* Sub-Metrics Row (like Reference 1 stats) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                padding: "1.25rem 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                marginTop: "0.5rem",
              }}
            >
              {activeSlide.subMetrics.map((sm, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: 800,
                      color: "#34d399",
                      lineHeight: 1.1,
                      textShadow: "0 0 15px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    {sm.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      marginTop: "0.25rem",
                      fontWeight: 500,
                    }}
                  >
                    {sm.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Action CTA + Prev/Next Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                marginTop: "0.5rem",
              }}
            >
              <Link
                to={activeSlide.ctaLink}
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.75rem", fontSize: "0.9375rem" }}
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRight size={17} />
              </Link>

              {/* Prev / Next Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn btn-secondary btn-icon-only"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                  aria-label="Previous capability"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-secondary btn-icon-only"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                  aria-label="Next capability"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Neo-Glass Preview Card (Inspired by GreenBank + Coquice Reference) */}
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "340px",
            }}
          >
            {/* Ambient Circular Glow Badge behind card */}
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(0, 229, 153, 0.1) 100%)",
                filter: "blur(40px)",
                zIndex: 1,
              }}
            />

            {/* Glowing Neo-Glass Card (3D Tilt Look) */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: "380px",
                background: "linear-gradient(145deg, rgba(22, 38, 28, 0.95) 0%, rgba(12, 20, 15, 0.9) 100%)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "24px",
                padding: "1.75rem",
                boxShadow: "0 25px 40px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)",
                backdropFilter: "blur(16px)",
                transform: "perspective(1000px) rotateY(-4deg) rotateX(3deg)",
                transition: "all 0.4s ease",
              }}
            >
              {/* Card Top: Chip & NFC Icon */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                      boxShadow: "0 2px 6px rgba(217, 119, 6, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontFamily: "var(--font-mono)",
                      color: "#34d399",
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                    }}
                  >
                    SAKOL-PASSPORT
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#34d399",
                    padding: "0.2rem 0.625rem",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>{activeSlide.visualContent.statusBadge}</span>
                </div>
              </div>

              {/* Title & Role Info */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    fontSize: "1.1875rem",
                    fontWeight: 800,
                    color: "#f8fafc",
                    lineHeight: 1.25,
                    marginBottom: "0.25rem",
                  }}
                >
                  {activeSlide.visualContent.cardTitle}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                  {activeSlide.visualContent.cardSub}
                </div>
              </div>

              {/* Skill Tag Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
                {activeSlide.visualContent.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "0.2rem 0.55rem",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#34d399",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Card Bottom Meta */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "#64748b", textTransform: "uppercase" }}>
                    Verified Match
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                    {activeSlide.badgeNumber}
                  </div>
                </div>

                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1.5px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                    fontWeight: 800,
                    fontSize: "0.8125rem",
                  }}
                >
                  {activeSlide.visualContent.avatarText}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicator Dots & Progress */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            marginTop: "2rem",
          }}
        >
          {SLIDES.map((_, i) => {
            const isCurrent = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                style={{
                  height: "8px",
                  width: isCurrent ? "32px" : "8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isCurrent ? "#10b981" : "rgba(255, 255, 255, 0.15)",
                  boxShadow: isCurrent ? "0 0 12px rgba(16, 185, 129, 0.6)" : "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
