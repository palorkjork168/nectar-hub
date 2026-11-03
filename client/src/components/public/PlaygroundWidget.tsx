import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2, Zap } from "lucide-react";

interface RolePreset {
  role: string;
  skills: string[];
  matchRate: number;
  openCount: number;
}

const PRESETS: RolePreset[] = [
  {
    role: "Full Stack Engineer",
    skills: ["React 19", "TypeScript", "Node.js", "PostgreSQL"],
    matchRate: 98.4,
    openCount: 42,
  },
  {
    role: "Product Designer",
    skills: ["Figma 3D", "Design Tokens", "Design Systems", "Prototyping"],
    matchRate: 96.8,
    openCount: 19,
  },
  {
    role: "Cloud DevOps SRE",
    skills: ["Kubernetes", "Docker", "AWS / GCP", "Terraform"],
    matchRate: 99.1,
    openCount: 28,
  },
  {
    role: "Talent & HR Partner",
    skills: ["Technical Recruitment", "Compensation Planning", "SaaS HRIS"],
    matchRate: 97.5,
    openCount: 15,
  },
];

export default function PlaygroundWidget() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const preset = PRESETS[selectedIdx];

  const handleSelectRole = (idx: number) => {
    setIsSimulating(true);
    setSelectedIdx(idx);
    setTimeout(() => {
      setIsSimulating(false);
    }, 350);
  };

  return (
    <section className="playground-section">
      <div className="playground-container">
        {/* Brandlyft-style handwritten note */}
        <div className="brandlyft-handwritten-note note-playground">
          <span className="handwritten-text">Interactive Demo Simulator • Test it live ↴</span>
          <svg
            className="doodle-curve-arrow"
            width="36"
            height="24"
            viewBox="0 0 36 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4C12 18 24 20 32 12M32 12L24 10M32 12L30 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="playground-card">
          <div className="playground-header">
            <div className="playground-pill">
              <Zap size={14} />
              <span>STARTER INTERACTIVE PLAYGROUND</span>
            </div>
            <h3 className="playground-title">
              Simulate Real-Time AI Skill Matching in Seconds
            </h3>
            <p className="playground-subtitle">
              Select any career track below to see how Nectar Hub dynamically maps competency matrices and matches open requisitions.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="playground-role-selector">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                className={`role-tab-btn ${selectedIdx === i ? "active" : ""}`}
                onClick={() => handleSelectRole(i)}
              >
                <span>{p.role}</span>
              </button>
            ))}
          </div>

          {/* Interactive Match Result Card */}
          <div className="playground-result-box">
            <div className="result-metric-column">
              <div className="result-dial-wrap">
                <div className={`result-dial ${isSimulating ? "spinning" : ""}`}>
                  <span className="dial-value">
                    {isSimulating ? "--" : `${preset.matchRate}%`}
                  </span>
                  <span className="dial-label">Match Score</span>
                </div>
              </div>

              <div className="result-meta">
                <div className="meta-badge-match">
                  <CheckCircle2 size={15} />
                  <span>Verified High Compatibility</span>
                </div>
                <div className="meta-roles-ready">
                  <strong>{preset.openCount}</strong> active positions available now
                </div>
              </div>
            </div>

            <div className="result-skills-column">
              <div className="skills-heading">Detected Competency Graph:</div>
              <div className="skills-badge-wrap">
                {preset.skills.map((skill, sIdx) => (
                  <span key={sIdx} className="interactive-skill-badge">
                    <Sparkles size={12} />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>

              <div className="result-action-bar">
                <Link
                  to={`/jobs?search=${encodeURIComponent(preset.role)}`}
                  className="btn btn-primary"
                >
                  <span>Explore These {preset.openCount} Matched Positions</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
