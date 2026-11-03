import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  TrendingUp,
  Shield,
  Zap,
  Sparkles,
  Search,
  Bell,
  Layers,
} from "lucide-react";

export default function PhoneHero3D() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"shifts" | "payouts">("shifts");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Normalized from -1 to 1
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Compute 3D rotation and translation based on scroll and mouse position
  // In reference Image 1, the phone starts upright and tilts backwards or rotates dynamically as you scroll down
  const scrollRatio = Math.min(Math.max(scrollY / 600, 0), 1);
  const rotateX = 12 - scrollRatio * 22 + mousePos.y * -4;
  const rotateY = -14 + scrollRatio * 28 + mousePos.x * 6;
  const rotateZ = -2 + scrollRatio * 6;
  const translateY = scrollRatio * 40;
  const scale = 1 - scrollRatio * 0.04;

  return (
    <section ref={containerRef} className="finmax-hero-section">
      {/* Background radial glow & biometric fingerprint contour line graphics */}
      <div className="finmax-glow-overlay" />
      <div className="finmax-contour-left" aria-hidden="true" />
      <div className="finmax-contour-right" aria-hidden="true" />

      <div className="finmax-hero-inner">
        {/* Top Eyebrow Tag */}
        <div className="finmax-pill-tag">
          <Sparkles size={14} className="finmax-pill-icon" />
          <span>Cambodia &amp; Southeast Asia's Modern Workforce Ecosystem</span>
        </div>

        {/* Hero Headline */}
        <h1 className="finmax-hero-title">
          Connecting Verified Talent <br />
          <span className="finmax-gradient-text">With Trusted Companies</span>
        </h1>

        {/* Subtitle */}
        <p className="finmax-hero-subtitle">
          Discover verified career openings, verify employee shifts with GPS attendance,
          and streamline hiring from one intelligent, unified platform.
        </p>

        {/* Action Buttons */}
        <div className="finmax-hero-cta-row">
          <Link to="/jobs" className="btn-finmax-emerald">
            <span>Browse Open Jobs</span>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/register" className="btn-finmax-dark">
            <span>For Employers</span>
          </Link>
        </div>

        {/* 3D Phone Showcase Stage with Floating Glass Cards */}
        <div className="finmax-phone-stage">
          {/* Floating Card 1: Top Left - Active Job Openings */}
          <div
            className="floating-metric-card card-top-left"
            style={{
              transform: `translate3d(${mousePos.x * -12}px, ${mousePos.y * -10 - scrollRatio * 30}px, 40px)`,
            }}
          >
            <div className="floating-metric-badge">
              <TrendingUp size={12} />
              <span>+18% this month</span>
            </div>
            <div className="floating-metric-label">Active Openings</div>
            <div className="floating-metric-val">1,250+</div>
            <div className="floating-metric-sub">Verified Enterprise Roles</div>
          </div>

          {/* Floating Card 2: Top Right - AI Skill Match Rate */}
          <div
            className="floating-metric-card card-top-right"
            style={{
              transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * -8 - scrollRatio * 25}px, 50px)`,
            }}
          >
            <div className="floating-metric-badge">
              <Shield size={12} />
              <span>Verified Accuracy</span>
            </div>
            <div className="floating-metric-label">AI Skill Match</div>
            <div className="floating-metric-val">98.4%</div>
            <div className="floating-metric-sub">Pre-Screened Candidates</div>
          </div>

          {/* Floating Card 3: Mid Right - Active Talents with Avatar Avatars */}
          <div
            className="floating-metric-card card-mid-right"
            style={{
              transform: `translate3d(${mousePos.x * 16}px, ${mousePos.y * 10 - scrollRatio * 20}px, 60px)`,
            }}
          >
            <div className="avatar-stack">
              <span className="avatar-chip chip-1">SR</span>
              <span className="avatar-chip chip-2">KV</span>
              <span className="avatar-chip chip-3">TD</span>
              <span className="avatar-badge-count">12k+</span>
            </div>
            <div className="green-circle-arrow">
              <ArrowUpRight size={16} />
            </div>
          </div>

          {/* 3D Phone Container */}
          <div
            className="phone-3d-wrapper"
            style={{
              transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateY(${translateY}px) scale(${scale})`,
            }}
          >
            {/* Phone Hardware Mockup Frame */}
            <div className="iphone-chassis">
              {/* Outer Edge Glare / Metallic Sheen */}
              <div className="iphone-rim-highlight" />

              {/* Screen Inner */}
              <div className="iphone-screen">
                {/* Dynamic Island Pill */}
                <div className="dynamic-island-wrap">
                  <div className="dynamic-island">
                    <span className="island-camera-dot" />
                    <span className="island-sensor-dot" />
                  </div>
                </div>

                {/* Status Bar */}
                <div className="screen-status-bar">
                  <span className="status-time">09:41</span>
                  <div className="status-icons">
                    <span className="status-5g">5G</span>
                    <span className="status-wifi">●●●</span>
                    <span className="status-battery">100%</span>
                  </div>
                </div>

                {/* In-App Header */}
                <div className="phone-app-header">
                  <div className="phone-brand-title">
                    <span className="brand-dot-logo" />
                    <span>Nectar Hub</span>
                  </div>
                  <div className="phone-header-actions">
                    <Search size={15} />
                    <Bell size={15} />
                  </div>
                </div>

                {/* Shift Attendance Card */}
                <div className="phone-wallet-card">
                  <div className="wallet-card-label">Today's Shift Attendance</div>
                  <div className="wallet-card-amount">08:30 — 17:30</div>
                  <div className="wallet-card-sub">
                    <span style={{ color: "var(--color-primary-text)", fontWeight: 700 }}>● Clocked In</span>
                    <span className="wallet-growth-pill">GPS Verified</span>
                  </div>

                  {/* Action Buttons: Punch Out / View Schedule */}
                  <div className="phone-wallet-actions">
                    <button
                      type="button"
                      className={`phone-action-btn ${activeTab === "shifts" ? "active" : ""}`}
                      onClick={() => setActiveTab("shifts")}
                    >
                      <Zap size={13} />
                      <span>Clock Out</span>
                    </button>
                    <button
                      type="button"
                      className={`phone-action-btn ${activeTab === "payouts" ? "active" : ""}`}
                      onClick={() => setActiveTab("payouts")}
                    >
                      <Shield size={13} />
                      <span>My Schedule</span>
                    </button>
                  </div>
                </div>

                {/* Recommended Roles Section */}
                <div className="phone-portfolio-section">
                  <div className="portfolio-section-header">
                    <span>Matched Opportunities</span>
                    <Link to="/jobs" style={{ textDecoration: "none" }} className="see-all-link">Browse All</Link>
                  </div>

                  <div className="portfolio-items-list">
                    <div className="portfolio-item">
                      <div className="item-icon-box green">
                        <Layers size={14} />
                      </div>
                      <div className="item-details">
                        <div className="item-title">Senior UI/UX Designer</div>
                        <div className="item-subtitle">Beta Labs • Phnom Penh</div>
                      </div>
                      <div className="item-rate">
                        <strong>$1,800/mo</strong>
                        <span className="item-status-tag">98% Match</span>
                      </div>
                    </div>

                    <div className="portfolio-item">
                      <div className="item-icon-box orange">
                        <Shield size={14} />
                      </div>
                      <div className="item-details">
                        <div className="item-title">Principal Cloud Architect</div>
                        <div className="item-subtitle">TechGlobal • Full-time</div>
                      </div>
                      <div className="item-rate">
                        <strong>$2,500/mo</strong>
                        <span className="item-status-tag queued">95% Match</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="screen-home-indicator" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
