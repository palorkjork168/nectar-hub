import {
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export default function FinmaxBentoFeatures() {
  const selectedMonth = "Monthly";

  return (
    <section className="finmax-features-section">
      <div className="finmax-features-container">
        {/* Section Header matching Reference Image 1 */}
        <div className="finmax-features-header">
          <h2 className="finmax-features-title">
            Powerful Features <br />
            Built For Smarter Workforce
          </h2>
          <p className="finmax-features-subtitle">
            Everything you need to recruit, verify, disburse payments, and scale your
            modern workforce operations — securely and efficiently from one platform.
          </p>
        </div>

        {/* 2 Top Bento Cards */}
        <div className="finmax-bento-grid-top">
          {/* Card 1: Innovative Financial & Workforce Tools */}
          <div className="finmax-bento-card">
            <div className="bento-card-header">
              <h3 className="bento-card-title">Innovative Workforce Tools</h3>
              <p className="bento-card-desc">
                Access intelligent predictive tools designed to simplify shift management & talent allocation.
              </p>
            </div>

            {/* Visual Widget 1: Interactive Wave Line Graph */}
            <div className="bento-chart-container">
              <div className="bento-chart-top">
                <div>
                  <div className="bento-stat-label">Shift Volume Today</div>
                  <div className="bento-stat-amount">$ 287.65</div>
                </div>
                <div className="bento-badge-peak">
                  <span>89.75% match</span>
                </div>
              </div>

              {/* Responsive SVG Wave Graph */}
              <div className="bento-svg-graph-wrap">
                <svg viewBox="0 0 400 160" className="bento-svg-wave" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffe17c" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ffe17c" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Wave Fill Area */}
                  <path
                    d="M 10 130 C 50 120, 80 140, 120 110 C 160 80, 190 25, 230 25 C 270 25, 300 110, 340 100 C 370 90, 385 105, 395 100 L 395 160 L 10 160 Z"
                    fill="url(#waveGradient)"
                  />
                  {/* Glowing Stroke Line */}
                  <path
                    d="M 10 130 C 50 120, 80 140, 120 110 C 160 80, 190 25, 230 25 C 270 25, 300 110, 340 100 C 370 90, 385 105, 395 100"
                    stroke="#ffe17c"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Peak Highlight Circle */}
                  <circle cx="230" cy="25" r="6" fill="#ffe17c" />
                  <circle cx="230" cy="25" r="11" stroke="#ffe17c" strokeWidth="2" opacity="0.4" />
                </svg>

                <div className="bento-graph-axes">
                  <span>2024</span>
                  <span>2025</span>
                  <span>2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Scalable Infrastructure */}
          <div className="finmax-bento-card">
            <div className="bento-card-header">
              <h3 className="bento-card-title">Scalable Infrastructure</h3>
              <p className="bento-card-desc">
                Built to handle enterprise-grade scheduling, automated attendance, and payroll without latency.
              </p>
            </div>

            {/* Visual Widget 2: Bar Statistics with Dual Comparative Bars */}
            <div className="bento-chart-container">
              <div className="bento-chart-top">
                <div>
                  <div className="bento-stat-label">Shift Statistics</div>
                  <div className="bento-stat-sub">Updated 1 hour ago</div>
                </div>
                <div className="bento-dropdown-pill">
                  <span>{selectedMonth}</span>
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Comparative Dual Bars matching Reference Image 1 */}
              <div className="bento-bars-graphic">
                <div className="bar-group">
                  <div className="bar-column bar-striped" style={{ height: "100px" }} />
                  <span className="bar-label">Quarter 1</span>
                </div>
                <div className="bar-group">
                  <div className="bar-column bar-green-solid" style={{ height: "140px" }} />
                  <span className="bar-label">Quarter 2</span>
                </div>
              </div>

              <div className="bento-bar-footer">
                <span className="footer-label">Verified Work Hours</span>
                <strong className="footer-value">26,954 hrs</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 1 Wide Bottom Bento Card: Insights That Drive Better Decisions */}
        <div className="finmax-bento-card bento-card-wide">
          <div className="bento-wide-content">
            <div className="bento-wide-text">
              <h3 className="bento-card-title">
                Insights That Drive Better Decisions &amp; Smarter Choices
              </h3>
              <p className="bento-card-desc">
                Real-time workforce analytics, hiring velocity metrics, and compliance scorecards that eliminate guesswork for leadership.
              </p>

              <div className="bento-checklist">
                <div className="bento-check-item">
                  <CheckCircle2 size={16} className="check-icon" />
                  <span>Sub-second biometric GPS attendance verification</span>
                </div>
                <div className="bento-check-item">
                  <CheckCircle2 size={16} className="check-icon" />
                  <span>Instant automated escrow &amp; performance ratings</span>
                </div>
                <div className="bento-check-item">
                  <CheckCircle2 size={16} className="check-icon" />
                  <span>Cambodian Ministry of Labour compliance records</span>
                </div>
              </div>
            </div>

            {/* Mock Table Widget with Floating "258 Active Users" Badge */}
            <div className="bento-wide-preview-wrap">
              {/* Floating Real-time Counter Badge */}
              <div className="floating-realtime-badge">
                <div className="realtime-dot-ping" />
                <div className="realtime-count">
                  <strong>258</strong> Active Staff
                </div>
                <span className="realtime-sub">Right Now</span>
              </div>

              {/* Mock Dashboard Table */}
              <div className="mini-dashboard-table">
                <div className="table-top-bar">
                  <div className="table-search-dummy">
                    <span className="dummy-icon" />
                    <span>Search personnel...</span>
                  </div>
                  <div className="table-tabs-dummy">
                    <span className="active">All</span>
                    <span>Clocked In</span>
                    <span>Break</span>
                  </div>
                </div>

                <div className="table-rows-mock">
                  <div className="table-row-mock">
                    <div className="col-avatar-pill blue">SR</div>
                    <div className="col-name-role">
                      <div className="col-name">Serey Visoth</div>
                      <div className="col-role">Logistics Lead</div>
                    </div>
                    <div className="col-status"><span className="badge-green-pill">Active</span></div>
                    <div className="col-bar"><div className="bar-fill" style={{ width: "92%" }} /></div>
                  </div>

                  <div className="table-row-mock">
                    <div className="col-avatar-pill purple">KV</div>
                    <div className="col-name-role">
                      <div className="col-name">Kalyan Vuth</div>
                      <div className="col-role">Frontend Specialist</div>
                    </div>
                    <div className="col-status"><span className="badge-green-pill">Active</span></div>
                    <div className="col-bar"><div className="bar-fill" style={{ width: "84%" }} /></div>
                  </div>

                  <div className="table-row-mock">
                    <div className="col-avatar-pill orange">TD</div>
                    <div className="col-name-role">
                      <div className="col-name">Thida Duong</div>
                      <div className="col-role">Quality Control</div>
                    </div>
                    <div className="col-status"><span className="badge-green-pill">Active</span></div>
                    <div className="col-bar"><div className="bar-fill" style={{ width: "78%" }} /></div>
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
