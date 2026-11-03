import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Rocket,
  Briefcase,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface AudienceRole {
  id: string;
  tag: string;
  label: string;
  icon: typeof Users;
  heading: string;
  description: string;
  perks: string[];
  ctaLabel: string;
  ctaLink: string;
}

const AUDIENCES: AudienceRole[] = [
  {
    id: "job-seekers",
    tag: "# Job Seekers",
    label: "Candidates & Talent",
    icon: Users,
    heading: "Supercharge your career with verified visibility",
    description:
      "Stop screaming into the void of traditional job boards. Nectar Hub matches your exact skills to top employers, tracks every application stage in real-time, and lets you manage interviews without scheduling headaches.",
    perks: [
      "1-Click profile applications with verified skill badges",
      "Real-time status updates: Screening, Interview, Offer",
      "Direct communication with hiring managers and HR teams",
    ],
    ctaLabel: "Find Dream Roles",
    ctaLink: "/jobs",
  },
  {
    id: "hr-leads",
    tag: "# HR & Talent Leads",
    label: "Recruiters & HR",
    icon: Briefcase,
    heading: "Cut hiring turnaround by 49% with intelligent workflows",
    description:
      "From job requisitions to verified contracts, coordinate hiring managers, schedule candidate interviews with zero back-and-forth, and manage employee leave without messy spreadsheets.",
    perks: [
      "AI resume parsing & semantic compatibility rankings",
      "Integrated calendar interview scheduling & scorecards",
      "Automated digital offer letter generation",
    ],
    ctaLabel: "Start Free Employer Trial",
    ctaLink: "/register",
  },
  {
    id: "startups",
    tag: "# Fast-Growing Startups",
    label: "Tech Startups",
    icon: Rocket,
    heading: "Scale your core engineering & business team on demand",
    description:
      "Rapidly onboard key technical talent without paying exorbitant 25% agency fees. Access pre-vetted engineers, designers, and managers eager to make an early-stage impact.",
    perks: [
      "Access pre-vetted candidates available immediately",
      "Integrated employee directory, shifts & leave tracking",
      "Scalable pricing that grows only as your headcount expands",
    ],
    ctaLabel: "Explore Talent Pool",
    ctaLink: "/jobs",
  },
  {
    id: "enterprise-ops",
    tag: "# Enterprise Operations",
    label: "Enterprise & Global Teams",
    icon: Building2,
    heading: "Multi-tenant governance, geo-fenced shifts & audit security",
    description:
      "Complete organizational hierarchy, departmental isolation, precise GPS shift punches, and tamper-proof audit trails meeting global compliance and data isolation standards.",
    perks: [
      "Granular Role-Based Access Control (RBAC) & tenant vaults",
      "Geo-fenced mobile shift clock-in with zero punch fraud",
      "Automated compliance, leave quotas & payroll export",
    ],
    ctaLabel: "Contact Enterprise Sales",
    ctaLink: "/register",
  },
];

export default function AudienceSelector() {
  const [activeAudienceId, setActiveAudienceId] = useState("job-seekers");

  const currentAudience =
    AUDIENCES.find((a) => a.id === activeAudienceId) || AUDIENCES[0];
  const Icon = currentAudience.icon;

  return (
    <section className="audience-selector-section">
      <div className="audience-container">
        {/* Travexa-Style Header */}
        <div className="audience-header text-center">
          <span className="audience-eyebrow">• DESIGNED FOR EVERY ROLE •</span>
          <h2 className="audience-title">
            Tailored Experiences Built for Modern Workforce Needs
          </h2>
          <p className="audience-subtitle">
            Whether you are taking the next leap in your career or managing thousands of shift employees worldwide.
          </p>
        </div>

        {/* Travexa Tag Pills Ribbon */}
        <div className="audience-chips-row">
          {AUDIENCES.map((aud) => (
            <button
              key={aud.id}
              type="button"
              className={`audience-chip-pill ${activeAudienceId === aud.id ? "active" : ""}`}
              onClick={() => setActiveAudienceId(aud.id)}
            >
              <span>{aud.tag}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Card Display */}
        <div className="audience-card-deck">
          <div className="audience-featured-card">
            <div className="audience-card-left">
              <div className="audience-badge-row">
                <div className="audience-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="audience-badge-text">{currentAudience.label}</span>
              </div>

              <h3 className="audience-featured-heading">{currentAudience.heading}</h3>
              <p className="audience-featured-desc">{currentAudience.description}</p>

              <div className="audience-perks-list">
                {currentAudience.perks.map((perk, i) => (
                  <div key={i} className="perk-row">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <div className="audience-cta-row">
                <Link to={currentAudience.ctaLink} className="btn btn-primary">
                  <span>{currentAudience.ctaLabel}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="audience-card-right">
              <div className="audience-preview-frame">
                <div className="preview-top-bar">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                  <span className="preview-url">nectarhub.io/portal/{currentAudience.id}</span>
                </div>
                <div className="preview-body">
                  <div className="preview-stat-grid">
                    <div className="preview-stat-box">
                      <div className="box-val">99.2%</div>
                      <div className="box-lbl">Satisfaction</div>
                    </div>
                    <div className="preview-stat-box">
                      <div className="box-val">&lt; 2 Days</div>
                      <div className="box-lbl">Response Time</div>
                    </div>
                    <div className="preview-stat-box">
                      <div className="box-val">Zero</div>
                      <div className="box-lbl">Timecard Fraud</div>
                    </div>
                  </div>

                  <div className="preview-workflow-step">
                    <div className="step-num">✓</div>
                    <div>
                      <div className="step-t">Fast-Track Profile Sync</div>
                      <div className="step-d">Verified credentials mapped instantly</div>
                    </div>
                  </div>

                  <div className="preview-workflow-step">
                    <div className="step-num">⚡</div>
                    <div>
                      <div className="step-t">Live Schedule & Notifications</div>
                      <div className="step-d">Automatic calendar sync with SMS / In-app alerts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
