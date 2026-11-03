import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MapPin,
  Check,
  FileCheck,
  Building2,
  Users,
} from "lucide-react";

export default function HorizontalScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [maxTranslate, setMaxTranslate] = useState(0);

  // Chamber 2 interactive state: Clock-in punch simulation
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  // Chamber 1 interactive state: Candidate invite button
  const [invitedCandidate, setInvitedCandidate] = useState(false);

  // Calculate maxTranslate based on track width vs viewport width
  useEffect(() => {
    const updateDimensions = () => {
      if (trackRef.current) {
        const trackWidth = trackRef.current.scrollWidth;
        const windowWidth = window.innerWidth;
        const overflow = Math.max(0, trackWidth - windowWidth + 40);
        setMaxTranslate(overflow);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Sync window vertical scroll with horizontal progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);
      setScrollProgress(progress);

      // Determine active slide index (0, 1, 2, 3)
      const slide = Math.min(Math.floor(progress * 4), 3);
      setActiveSlide(slide);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSlide = (slideIndex: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
    const containerHeight = containerRef.current.offsetHeight;
    const totalScrollable = containerHeight - window.innerHeight;
    const targetProgress = slideIndex / 3;
    const targetY = containerTop + targetProgress * totalScrollable;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const handlePunchToggle = () => {
    if (!isClockedIn) {
      setIsClockedIn(true);
      const now = new Date();
      setClockInTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } else {
      setIsClockedIn(false);
      setClockInTime(null);
    }
  };

  return (
    <section ref={containerRef} className="horizontal-pin-outer">
      <div className="horizontal-pin-sticky">
        {/* Top Control Bar with Slide Numbers & Progress Bar */}
        <div className="horizontal-topbar">
          <div className="topbar-left">
            <span className="topbar-eyebrow">• SCROLL-X MOTION SHOWCASE •</span>
            <div className="topbar-title-row">
              <h2 className="topbar-title">The Four Pillars of Nectar Hub</h2>
              <span className="topbar-counter">
                0{activeSlide + 1} <span style={{ opacity: 0.5 }}>/ 04</span>
              </span>
            </div>
          </div>

          {/* Interactive Slide Jump Tabs */}
          <div className="topbar-step-pills">
            {[
              { label: "01 AI Discovery", idx: 0 },
              { label: "02 GPS Shifts", idx: 1 },
              { label: "03 Interview Studio", idx: 2 },
              { label: "04 Compliance Vault", idx: 3 },
            ].map((step) => (
              <button
                key={step.idx}
                type="button"
                className={`step-jump-pill ${activeSlide === step.idx ? "active" : ""}`}
                onClick={() => scrollToSlide(step.idx)}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Progress Indicator Line */}
        <div className="horizontal-progress-track">
          <div
            className="horizontal-progress-bar"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>

        {/* Pinned Horizontal Track Translating on X Axis */}
        <div className="horizontal-viewport-window">
          <div
            ref={trackRef}
            className="horizontal-chambers-track"
            style={{
              transform: `translateX(-${scrollProgress * maxTranslate}px)`,
            }}
          >
            {/* ==========================================================
                CHAMBER 01: AI TALENT DISCOVERY & SMART MATCH
                ========================================================== */}
            <div className="feature-chamber chamber-ai">
              <div className="chamber-content-grid">
                <div className="chamber-info-pane">
                  <div className="chamber-pill-tag tag-sky">
                    <Sparkles size={13} />
                    <span>01 • TALENT INTELLIGENCE</span>
                  </div>
                  <h3 className="chamber-headline">
                    Precision Candidate Matching Driven by Deep AI
                  </h3>
                  <p className="chamber-desc">
                    Eliminate manual resume filtering. Nectar Hub parses verified skills, previous career trajectory, and cultural parameters to surface candidates with a 98.4% compatibility rating.
                  </p>

                  <div className="chamber-highlights">
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Zero keyword stuffing — semantic skill verification</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Instant automated salary benchmark comparisons</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Direct 1-click invitation to interview pipeline</span>
                    </div>
                  </div>

                  <div className="chamber-action-row">
                    <Link to="/jobs" className="btn btn-primary">
                      <span>Explore Open Roles</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Interactive Simulated Candidate Card */}
                <div className="chamber-interactive-pane">
                  <div className="interactive-match-card">
                    <div className="match-card-header">
                      <div className="candidate-avatar">MV</div>
                      <div>
                        <div className="candidate-name">Marcus Vance</div>
                        <div className="candidate-role">Senior Distributed Systems Engineer</div>
                      </div>
                      <div className="compatibility-dial" title="98.4% Match Score">
                        <TrendingUp size={16} />
                        <span>98.4%</span>
                      </div>
                    </div>

                    <div className="match-skills-matrix">
                      <span className="skill-pill active">React 19</span>
                      <span className="skill-pill active">TypeScript</span>
                      <span className="skill-pill active">PostgreSQL</span>
                      <span className="skill-pill active">Docker</span>
                      <span className="skill-pill">Go Microservices</span>
                    </div>

                    <div className="match-card-meta">
                      <div className="meta-col">
                        <span className="meta-label">Experience</span>
                        <span className="meta-val">7+ Years</span>
                      </div>
                      <div className="meta-col">
                        <span className="meta-label">Compensation</span>
                        <span className="meta-val">$5,200 / mo</span>
                      </div>
                      <div className="meta-col">
                        <span className="meta-label">Availability</span>
                        <span className="meta-val text-success">Immediate</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn-interactive-invite ${invitedCandidate ? "invited" : ""}`}
                      onClick={() => setInvitedCandidate(!invitedCandidate)}
                    >
                      {invitedCandidate ? (
                        <>
                          <Check size={16} />
                          <span>Interview Invitation Dispatched!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Test 1-Click Fast-Track Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================================
                CHAMBER 02: LIVE GEO-FENCED GPS SHIFTS & ATTENDANCE
                ========================================================== */}
            <div className="feature-chamber chamber-shifts">
              <div className="chamber-content-grid">
                <div className="chamber-info-pane">
                  <div className="chamber-pill-tag tag-lime">
                    <Clock size={13} />
                    <span>02 • WORKFORCE CLOCK-IN</span>
                  </div>
                  <h3 className="chamber-headline">
                    Geo-Fenced Mobile Attendance with Zero Timecard Fraud
                  </h3>
                  <p className="chamber-desc">
                    Empower on-site and hybrid teams to clock in securely. High-precision GPS boundary verification ensures shift punches are real, authenticated, and calculated instantly.
                  </p>

                  <div className="chamber-highlights">
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Custom geo-fencing perimeter per job site or office</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Live shift dashboard with instant presence indicators</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Automated break tracking, late alerts, and overtime</span>
                    </div>
                  </div>

                  <div className="chamber-action-row">
                    <Link to="/register" className="btn btn-outline">
                      <span>Set Up Company Shifts</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Interactive Simulated Shift Punch Card */}
                <div className="chamber-interactive-pane">
                  <div className="interactive-punch-card">
                    <div className="punch-status-header">
                      <div className="punch-beacon-row">
                        <span className={`pulse-beacon ${isClockedIn ? "active" : ""}`} />
                        <span className="beacon-label">
                          {isClockedIn ? "SHIFT ACTIVE • RECORDING" : "OFF-DUTY • READY TO PUNCH"}
                        </span>
                      </div>
                      <div className="gps-badge">
                        <MapPin size={12} />
                        <span>HQ Geo-Fence: Valid</span>
                      </div>
                    </div>

                    <div className="punch-digital-clock">
                      <div className="clock-digits">
                        {isClockedIn ? clockInTime : "09:00:00 AM"}
                      </div>
                      <div className="clock-caption">
                        {isClockedIn ? "Clocked-In Timestamp" : "Scheduled Shift: 09:00 AM — 05:00 PM"}
                      </div>
                    </div>

                    <div className="punch-interactive-cta">
                      <button
                        type="button"
                        onClick={handlePunchToggle}
                        className={`punch-action-button ${isClockedIn ? "btn-punch-out" : "btn-punch-in"}`}
                      >
                        <Clock size={18} />
                        <span>{isClockedIn ? "Simulate Clock-Out Punch" : "Simulate Live Clock-In"}</span>
                      </button>
                    </div>

                    <div className="punch-footnote">
                      Interactive starter demo • Try clicking the punch button above
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================================
                CHAMBER 03: AUTOMATED INTERVIEW STUDIO & PIPELINE
                ========================================================== */}
            <div className="feature-chamber chamber-pipeline">
              <div className="chamber-content-grid">
                <div className="chamber-info-pane">
                  <div className="chamber-pill-tag tag-coral">
                    <Calendar size={13} />
                    <span>03 • HIRING FUNNEL</span>
                  </div>
                  <h3 className="chamber-headline">
                    Automated Candidate Pipeline & Interview Coordination
                  </h3>
                  <p className="chamber-desc">
                    Coordinate hiring teams across departments with synchronized calendars, structured interview scorecards, and multi-stage status management.
                  </p>

                  <div className="chamber-highlights">
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Drag-and-drop recruitment stages: Screen, Tech, Final, Offer</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Automatic candidate email and in-app status updates</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>49% faster turnaround from first screening to contract</span>
                    </div>
                  </div>

                  <div className="chamber-action-row">
                    <Link to="/jobs" className="btn btn-secondary">
                      <span>View Open Positions</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Simulated Kanban Pipeline Preview */}
                <div className="chamber-interactive-pane">
                  <div className="interactive-kanban-board">
                    <div className="kanban-col">
                      <div className="kanban-col-header">
                        <span className="col-name">Applied</span>
                        <span className="col-count">18</span>
                      </div>
                      <div className="kanban-candidate-chip">
                        <div className="chip-name">Elena Rostova</div>
                        <div className="chip-role">Senior UI Architect</div>
                        <div className="chip-tag tag-new">New Profile</div>
                      </div>
                      <div className="kanban-candidate-chip">
                        <div className="chip-name">Kenji Sato</div>
                        <div className="chip-role">Cloud DevOps Lead</div>
                        <div className="chip-tag">Portfolio ✓</div>
                      </div>
                    </div>

                    <div className="kanban-col">
                      <div className="kanban-col-header">
                        <span className="col-name">Technical Screen</span>
                        <span className="col-count">5</span>
                      </div>
                      <div className="kanban-candidate-chip active-stage">
                        <div className="chip-name">Amara Okafor</div>
                        <div className="chip-role">Lead Backend Eng</div>
                        <div className="chip-tag tag-schedule">Today 2:30 PM</div>
                      </div>
                      <div className="kanban-candidate-chip">
                        <div className="chip-name">Julian Vance</div>
                        <div className="chip-role">Product Designer</div>
                        <div className="chip-tag">Score: 4.8 / 5</div>
                      </div>
                    </div>

                    <div className="kanban-col">
                      <div className="kanban-col-header">
                        <span className="col-name">Offer Stage</span>
                        <span className="col-count">2</span>
                      </div>
                      <div className="kanban-candidate-chip offer-chip">
                        <div className="chip-name">Chloe Dupont</div>
                        <div className="chip-role">Principal Engineer</div>
                        <div className="chip-tag tag-offer">Offer Sent ✉</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================================
                CHAMBER 04: ENTERPRISE COMPLIANCE, PAYROLL & LEAVE
                ========================================================== */}
            <div className="feature-chamber chamber-compliance">
              <div className="chamber-content-grid">
                <div className="chamber-info-pane">
                  <div className="chamber-pill-tag tag-dark">
                    <ShieldCheck size={13} />
                    <span>04 • ENTERPRISE GOVERNANCE</span>
                  </div>
                  <h3 className="chamber-headline">
                    Multi-Tenant Company Vault, Audit Trails & Leave Tracking
                  </h3>
                  <p className="chamber-desc">
                    Safeguard corporate records with enterprise-grade tenant isolation. Generate compliant digital employment contracts, approve vacation leaves, and export audit-ready payroll reports.
                  </p>

                  <div className="chamber-highlights">
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Role-Based Access Control (Admin, Employer, Job Seeker)</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Automated annual, sick, and bereavement leave balances</span>
                    </div>
                    <div className="highlight-item">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>Encrypted tamper-proof audit trail for HR compliance</span>
                    </div>
                  </div>

                  <div className="chamber-action-row">
                    <Link to="/register" className="btn btn-primary">
                      <span>Create Employer Organization</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Simulated Enterprise Security Vault Card */}
                <div className="chamber-interactive-pane">
                  <div className="interactive-vault-card">
                    <div className="vault-header">
                      <div className="vault-icon-box">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div className="vault-title">Nectar Security & Vault</div>
                        <div className="vault-sub">Multi-Tenant Tenant ID: ORG-88219</div>
                      </div>
                      <span className="vault-status-pill">Encrypted 256-bit</span>
                    </div>

                    <div className="vault-items-list">
                      <div className="vault-row">
                        <FileCheck size={16} className="text-success" />
                        <span className="row-title">Digital Offer Letter Template</span>
                        <span className="row-badge">Verified Sign</span>
                      </div>
                      <div className="vault-row">
                        <Users size={16} className="text-primary" />
                        <span className="row-title">Employee Leave Quota Engine</span>
                        <span className="row-badge">18/20 Days Left</span>
                      </div>
                      <div className="vault-row">
                        <Building2 size={16} className="text-info" />
                        <span className="row-title">Exportable Payroll Summary</span>
                        <span className="row-badge">CSV / PDF</span>
                      </div>
                    </div>

                    <div className="vault-footer">
                      <span className="pulse-dot-green" />
                      <span>Compliance Standard: SOC-2 Type II Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Whimsical Scroll Hint */}
        <div className="horizontal-bottom-hint">
          <span className="hint-arrow">↓</span>
          <span>Scroll down to advance horizontally through the chambers</span>
        </div>
      </div>
    </section>
  );
}
