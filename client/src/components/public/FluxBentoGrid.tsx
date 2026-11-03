import { Sparkles, MapPin, Code2, Users2, ShieldCheck, Zap } from "lucide-react";

export default function FluxBentoGrid() {
  return (
    <section className="flux-bento-section">
      <div className="flux-bento-container">
        {/* Section Header */}
        <div className="flux-bento-header">
          <div className="flux-pill-badge" style={{ margin: "0 auto 1.25rem" }}>
            <span className="flux-yellow-dot" />
            <span className="flux-badge-text">MODERN WORKFORCE ENGINE</span>
          </div>
          <h2 className="flux-bento-headline">
            EVERYTHING YOU NEED TO SCALE. <br />
            ZERO PROTOCOL SLOWDOWN.
          </h2>
          <p className="flux-bento-subtext">
            Engineered for high-performing product companies, fast-growing startups, and verified talent.
          </p>
        </div>

        {/* 3-Column Bento Grid with Auto-Rows 400px (Cards 1 & 4 span 2 columns) */}
        <div className="flux-bento-grid">
          {/* Card 1 (Span 2 Columns): Live Talent Radar */}
          <div className="flux-bento-card flux-card-span-2 flux-card-light">
            <div className="flux-bento-card-header">
              <div className="flux-card-badge-row">
                <span className="flux-mini-tag yellow">LIVE STREAM</span>
                <span className="flux-mini-tag">AI SCORING 99.2%</span>
              </div>
              <h3 className="flux-bento-card-title">LIVE TALENT RADAR</h3>
              <p className="flux-bento-card-desc">
                Continuous radar stream of pre-screened product designers, full-stack engineers, and ops leads ready for instant hire.
              </p>
            </div>

            {/* Abstract UI element: Animated Radar / Pulse Block */}
            <div className="flux-radar-ui">
              <div className="flux-radar-screen">
                <div className="flux-radar-circle circle-1" />
                <div className="flux-radar-circle circle-2" />
                <div className="flux-radar-circle circle-3" />
                <div className="flux-radar-sweep" />

                {/* Blips on the radar */}
                <div className="flux-radar-blip blip-1" title="Lead React Architect — Available">
                  <span className="blip-dot" />
                  <span className="blip-label">Senior Frontend • $3.5k/mo</span>
                </div>
                <div className="flux-radar-blip blip-2" title="Product Designer — Available">
                  <span className="blip-dot" />
                  <span className="blip-label">UI/UX Designer • Matched</span>
                </div>
                <div className="flux-radar-blip blip-3" title="DevOps Engineer — Active">
                  <span className="blip-dot" />
                  <span className="blip-label">Cloud Architect • Available</span>
                </div>
              </div>

              {/* Status bar */}
              <div className="flux-radar-footer">
                <div className="flux-radar-metric">
                  <span className="metric-val">1,250+</span>
                  <span className="metric-lbl">ACTIVE PROFILES</span>
                </div>
                <div className="flux-radar-metric">
                  <span className="metric-val">14 min</span>
                  <span className="metric-lbl">AVG TIME TO INTERVIEW</span>
                </div>
                <div className="flux-radar-metric">
                  <span className="metric-val">99.4%</span>
                  <span className="metric-lbl">ACCURACY RATING</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (1 Column): Geo-Shift Engine (Dark Charcoal Card) */}
          <div className="flux-bento-card flux-card-span-1 flux-card-dark">
            <div className="flux-bento-card-header">
              <div className="flux-card-badge-row">
                <span className="flux-mini-tag dark-yellow">TAMPER-PROOF</span>
              </div>
              <h3 className="flux-bento-card-title text-white">GEO CLOCK-IN</h3>
              <p className="flux-bento-card-desc text-sage">
                Cryptographic GPS verification ensures shifts are logged precisely on location.
              </p>
            </div>

            {/* Abstract UI element: Punch Widget */}
            <div className="flux-geo-widget">
              <div className="flux-geo-clock">
                <div className="flux-time-display">08:30:45 AM</div>
                <div className="flux-geo-coords">
                  <MapPin size={12} style={{ color: "#ffe17c" }} />
                  <span>11.5564° N, 104.9282° E • Office Geofence</span>
                </div>
              </div>
              <div className="flux-geo-punch-bar">
                <div className="flux-punch-indicator">
                  <span className="status-pulsing-dot" />
                  <span className="punch-text">CLOCKED IN & VERIFIED</span>
                </div>
                <button type="button" className="flux-mini-punch-btn">
                  Shift Active
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 (1 Column): Automated Contracts & API (Dark Charcoal Card) */}
          <div className="flux-bento-card flux-card-span-1 flux-card-dark">
            <div className="flux-bento-card-header">
              <div className="flux-card-badge-row">
                <span className="flux-mini-tag dark-yellow">DEVELOPER FIRST</span>
              </div>
              <h3 className="flux-bento-card-title text-white">API & CONTRACTS</h3>
              <p className="flux-bento-card-desc text-sage">
                Instant offer letter generation and REST webhooks for automated payroll.
              </p>
            </div>

            {/* Abstract UI element: Terminal Code Block */}
            <div className="flux-code-terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="t-dot red" />
                  <span className="t-dot yellow" />
                  <span className="t-dot green" />
                </div>
                <span className="terminal-file">contracts.ts</span>
              </div>
              <pre className="terminal-body">
                <code>{`// Instant digital offer
await nectar.offers.create({
  talentId: "usr_99x",
  role: "Lead Designer",
  rate: 4200,
  verified: true
});
// Status: 201 Created`}</code>
              </pre>
            </div>
          </div>

          {/* Card 4 (Span 2 Columns): Enterprise Team Matrix */}
          <div className="flux-bento-card flux-card-span-2 flux-card-light">
            <div className="flux-bento-card-header">
              <div className="flux-card-badge-row">
                <span className="flux-mini-tag yellow">UNIFIED ROSTER</span>
                <span className="flux-mini-tag">MULTI-ORGANIZATION</span>
              </div>
              <h3 className="flux-bento-card-title">TEAM MATRIX</h3>
              <p className="flux-bento-card-desc">
                Coordinate full-time employees, contractors, and agencies under one seamless dashboard with granular permission hierarchies.
              </p>
            </div>

            {/* Abstract UI element: Avatar stack with status indicators */}
            <div className="flux-roster-ui">
              <div className="flux-roster-row">
                <div className="flux-roster-avatar-stack">
                  <div className="flux-avatar-bubble av-1">
                    <span>EL</span>
                    <span className="av-status-dot online" />
                  </div>
                  <div className="flux-avatar-bubble av-2">
                    <span>MK</span>
                    <span className="av-status-dot online" />
                  </div>
                  <div className="flux-avatar-bubble av-3">
                    <span>SJ</span>
                    <span className="av-status-dot busy" />
                  </div>
                  <div className="flux-avatar-bubble av-4">
                    <span>DL</span>
                    <span className="av-status-dot online" />
                  </div>
                  <div className="flux-avatar-counter">+42 more</div>
                </div>

                <div className="flux-department-tags">
                  <span className="flux-dept-tag active">Engineering (18)</span>
                  <span className="flux-dept-tag">Product & Design (9)</span>
                  <span className="flux-dept-tag">Operations (15)</span>
                </div>
              </div>

              <div className="flux-matrix-stats-bar">
                <div className="matrix-stat-item">
                  <ShieldCheck size={16} style={{ color: "var(--color-primary-text)" }} />
                  <span>100% Identity Checked</span>
                </div>
                <div className="matrix-stat-item">
                  <Zap size={16} style={{ color: "#d97706" }} />
                  <span>Real-time Sync Active</span>
                </div>
                <div className="matrix-stat-item">
                  <Sparkles size={16} style={{ color: "#0284c7" }} />
                  <span>Automated Payroll Routing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
