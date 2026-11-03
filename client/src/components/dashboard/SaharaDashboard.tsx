import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  User,
  Award,
  Star,
  FileText,
  Trophy,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  FileCheck2,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { NectarIcon } from "../brand/NectarLogo";

interface SaharaDashboardProps {
  user: any;
  completionScore?: number;
  applicationCount?: number;
}

export default function SaharaDashboard({
  user,
  completionScore = 86,
  applicationCount = 24,
}: SaharaDashboardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [requests, setRequests] = useState([
    {
      id: "req-1",
      title: "Design UI/UX for FinTech Portal",
      manager: "Beta Labs Request Manager",
      initials: "BL",
      status: "pending",
    },
    {
      id: "req-2",
      title: "Developing Mobile Attendance App",
      manager: "TechGlobal Engineering",
      initials: "TG",
      status: "pending",
    },
    {
      id: "req-3",
      title: "AI Video Production & Editing",
      manager: "Nexus Media Studio",
      initials: "NM",
      status: "pending",
    },
    {
      id: "req-4",
      title: "Cloud Infrastructure Setup",
      manager: "Alpha Inc DevOps",
      initials: "AI",
      status: "pending",
    },
    {
      id: "req-5",
      title: "React Frontend Security Audit",
      manager: "SecureCorp Lead Architect",
      initials: "SC",
      status: "pending",
    },
  ]);

  const [activeSkillSlide, setActiveSkillSlide] = useState(0);

  const recommendedSkills = [
    { title: "Accounting & Payroll", action: "Learn Skill", category: "Finance" },
    { title: "Copywriting & SEO", action: "Learn Skill", category: "Marketing" },
    { title: "Financial Modeling", action: "Learn Skill", category: "Analytics" },
    { title: "Docker & Kubernetes", action: "Learn Skill", category: "DevOps" },
    { title: "UI Design Systems", action: "Learn Skill", category: "Product" },
  ];

  const handleAction = (id: string, action: "accept" | "reject") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === "accept" ? "accepted" : "rejected" } : r))
    );
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const displayName = user?.first_name || "Jason";
  const userRole = user?.role === "EMPLOYEE" ? "Employee" : "Job Seeker";

  return (
    <div className="sahara-dashboard-canvas">
      <div className="sahara-card-shell">
        {/* Left Distinctive Red/Coral Curved Sidebar */}
        <aside className="sahara-sidebar">
          <div>
            {/* Nectar Hub Brand Header */}
            <div className="sahara-logo-wrap">
              <div className="sahara-logo-icon">
                <NectarIcon size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="sahara-brand-name">Nectar Hub</span>
                <span style={{ fontSize: "0.6875rem", opacity: 0.85, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Talent Portal</span>
              </div>
            </div>

            {/* Navigation items with Signature Active Notch Cutout */}
            <nav className="sahara-nav-list">
              <div
                className={`sahara-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>

              <Link
                to="/job-seeker/profile"
                className={`sahara-nav-item ${activeTab === "profile" ? "active" : ""}`}
              >
                <User size={18} />
                <span>Profile</span>
              </Link>

              <div
                className={`sahara-nav-item ${activeTab === "skills" ? "active" : ""}`}
                onClick={() => setActiveTab("skills")}
              >
                <Award size={18} />
                <span>Skills</span>
              </div>

              <div
                className={`sahara-nav-item ${activeTab === "ratings" ? "active" : ""}`}
                onClick={() => setActiveTab("ratings")}
              >
                <Star size={18} />
                <span>Ratings</span>
              </div>

              <Link
                to="/job-seeker/applications"
                className={`sahara-nav-item ${activeTab === "requests" ? "active" : ""}`}
              >
                <FileText size={18} />
                <span>Requests</span>
                <span className="sahara-badge-counter">{pendingRequests.length || applicationCount}</span>
              </Link>

              <div
                className={`sahara-nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
                onClick={() => setActiveTab("leaderboard")}
              >
                <Trophy size={18} />
                <span>Leaderboard</span>
              </div>
            </nav>
          </div>

          {/* Sidebar Bottom Footer: Logout & Role */}
          <div className="sahara-sidebar-bottom">
            <button
              type="button"
              className="sahara-logout-btn"
              onClick={() => logout()}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
            <span className="sahara-role-pill">{userRole}</span>
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="sahara-main-workspace">
          {/* Top Header Bar */}
          <header className="sahara-top-header">
            <div className="sahara-page-title">Dashboard</div>

            <div className="sahara-header-right">
              <div className="sahara-welcome-text">
                Welcome back, <span className="sahara-welcome-name">{displayName}</span>
              </div>

              <div className="sahara-user-avatar-wrap">
                <div className="sahara-user-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="sahara-bell-badge" onClick={() => navigate("/notifications")}>
                <Bell size={18} />
                <span className="sahara-bell-dot" />
              </div>

              <div className="sahara-search-input-wrap">
                <Search size={14} style={{ color: "#94a3b8" }} />
                <input type="text" placeholder="Search..." />
              </div>
            </div>
          </header>

          {/* Top Hero Skills & Rating Card */}
          <section className="sahara-hero-card">
            <div className="sahara-hero-left">
              {/* Colorful Gradient Ring Avatar */}
              <div className="sahara-avatar-ring-box">
                <div className="sahara-avatar-inner">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Big Score: 86 Points */}
              <div className="sahara-hero-score">{completionScore}</div>

              <div className="sahara-hero-score-meta">
                <span className="sahara-score-title">Your skills level points</span>
                <span className="sahara-score-sub">Keep it up and improve your skills!</span>
              </div>
            </div>

            {/* Right Side 4.5 Rating */}
            <div className="sahara-hero-rating">
              <div style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>
                Rating
              </div>
              <div className="sahara-rating-val">4.5</div>
              <div className="sahara-rating-stars">★★★★★</div>
            </div>
          </section>

          {/* Middle Row (2 Cards: Your Skills donut + Your Ratings reviews) */}
          <div className="sahara-mid-grid">
            {/* Card 1: Your Skills */}
            <div className="sahara-mid-card">
              <div className="sahara-card-head">
                <h4>Your skills</h4>
                <Link to="/job-seeker/profile" className="sahara-see-more-link">
                  See More →
                </Link>
              </div>

              <div className="sahara-skills-body">
                {/* Donut Chart Gauge */}
                <div className="sahara-donut-wrap">
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="9" fill="none" />
                    {/* Programming 85% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-primary, #ffe17c)"
                      strokeWidth="9"
                      strokeDasharray="251"
                      strokeDashoffset={251 - 251 * 0.85}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="sahara-donut-center">
                    <div className="sahara-donut-score">{completionScore}</div>
                    <div className="sahara-donut-sub">Points</div>
                  </div>
                </div>

                {/* Skill Legend Breakdown */}
                <div className="sahara-skill-legend">
                  <div className="sahara-legend-item">
                    <div className="legend-dot-label">
                      <span className="legend-dot primary" />
                      <span>Programming</span>
                    </div>
                    <strong>85%</strong>
                  </div>
                  <div className="sahara-legend-item">
                    <div className="legend-dot-label">
                      <span className="legend-dot yellow" />
                      <span>Design</span>
                    </div>
                    <strong>75%</strong>
                  </div>
                  <div className="sahara-legend-item">
                    <div className="legend-dot-label">
                      <span className="legend-dot cyan" />
                      <span>Editing</span>
                    </div>
                    <strong>80%</strong>
                  </div>
                  <div className="sahara-legend-item">
                    <div className="legend-dot-label">
                      <span className="legend-dot purple" />
                      <span>Marketing</span>
                    </div>
                    <strong>65%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Your Ratings */}
            <div className="sahara-mid-card">
              <div className="sahara-card-head">
                <h4>Your Ratings</h4>
                <span className="sahara-see-more-link">See More →</span>
              </div>

              <div className="sahara-ratings-summary">
                <span className="sahara-big-rate">4.5</span>
                <span style={{ fontSize: "1rem", color: "#94a3b8" }}>/5</span>
                <span className="sahara-rating-stars" style={{ marginLeft: "6px" }}>★★★★★</span>
              </div>
              <div className="sahara-completed-sub">164 Completed requests</div>

              {/* Review Items */}
              <div className="sahara-reviews-list">
                <div className="sahara-review-item">
                  <div className="sahara-review-avatar">BL</div>
                  <div className="sahara-review-details">
                    <div className="sahara-review-title">Design UI/UX for X Company</div>
                    <div className="sahara-review-author">Created By Request Manager</div>
                  </div>
                  <div className="sahara-review-stars">★ 4.5</div>
                </div>

                <div className="sahara-review-item">
                  <div className="sahara-review-avatar" style={{ background: "#ffe17c" }}>TG</div>
                  <div className="sahara-review-details">
                    <div className="sahara-review-title">Developing Mobile App</div>
                    <div className="sahara-review-author">Created By Request Manager</div>
                  </div>
                  <div className="sahara-review-stars">★ 4.5</div>
                </div>

                <div className="sahara-review-item">
                  <div className="sahara-review-avatar" style={{ background: "#8b5cf6" }}>NM</div>
                  <div className="sahara-review-details">
                    <div className="sahara-review-title">Editing Video Company</div>
                    <div className="sahara-review-author">Created By Request Manager</div>
                  </div>
                  <div className="sahara-review-stars">★ 4.5</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recommended Skills */}
          <section className="sahara-recommended-section">
            <div className="sahara-recom-head">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h4>Recommended skills</h4>
                <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>ⓘ</span>
              </div>

              <div className="sahara-arrow-controls">
                <button
                  type="button"
                  className="sahara-arrow-btn"
                  onClick={() => setActiveSkillSlide((prev) => Math.max(0, prev - 1))}
                  disabled={activeSkillSlide === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="sahara-arrow-btn"
                  onClick={() => setActiveSkillSlide((prev) => Math.min(2, prev + 1))}
                  disabled={activeSkillSlide >= 2}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="sahara-skills-cards-row">
              {recommendedSkills.slice(activeSkillSlide, activeSkillSlide + 3).map((skill, idx) => (
                <div key={idx} className="sahara-skill-card">
                  <div className="sahara-skill-card-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="sahara-skill-card-body">
                    <div className="sahara-skill-card-name">{skill.title}</div>
                    <div className="sahara-skill-card-action">
                      <span>{skill.action}</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Right Panel: Requests (24) */}
        <aside className="sahara-requests-panel">
          <div className="sahara-requests-head">
            <div className="sahara-requests-head-left">
              <h4 className="sahara-requests-title">Requests</h4>
              <span className="sahara-req-counter">{pendingRequests.length || 24}</span>
            </div>
            <SlidersHorizontal size={16} style={{ color: "#94a3b8", cursor: "pointer" }} />
          </div>

          <div className="sahara-requests-list">
            {requests.map((req) => (
              <div key={req.id} className="sahara-req-card">
                <div className="sahara-req-top">
                  <div className="sahara-req-avatar">{req.initials}</div>
                  <div className="sahara-req-info">
                    <div className="sahara-req-job-title" title={req.title}>
                      {req.title}
                    </div>
                    <div className="sahara-req-manager">{req.manager}</div>
                  </div>
                </div>

                <div className="sahara-req-bottom">
                  <span className="sahara-agreement-link">
                    <FileCheck2 size={12} />
                    <span>Project Agreement</span>
                  </span>

                  {req.status === "pending" ? (
                    <div className="sahara-req-actions">
                      <button
                        type="button"
                        className="sahara-btn-reject"
                        onClick={() => handleAction(req.id, "reject")}
                        title="Decline Request"
                      >
                        <X size={13} />
                      </button>
                      <button
                        type="button"
                        className="sahara-btn-accept"
                        onClick={() => handleAction(req.id, "accept")}
                        title="Accept Agreement"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : req.status === "accepted" ? (
                    <span style={{ fontSize: "0.72rem", color: "var(--color-primary-text)", fontWeight: 700 }}>
                      Accepted ✓
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 700 }}>
                      Declined ✕
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            className="sahara-see-more-btn"
            onClick={() => navigate("/job-seeker/applications")}
          >
            See More
          </div>
        </aside>
      </div>
    </div>
  );
}
