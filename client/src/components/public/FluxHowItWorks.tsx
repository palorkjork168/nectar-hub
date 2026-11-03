import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FluxHowItWorks() {
  const steps = [
    {
      numeral: "01",
      title: "REGISTER VERIFIED PROFILE",
      description:
        "Talents and enterprises create cryptographic verified profiles in under 3 minutes. Verify skills, portfolios, and company tax IDs with zero paperwork.",
      tag: "STEP 1 • ONBOARDING",
    },
    {
      numeral: "02",
      title: "SMART MATCH & DIRECT PIPELINE",
      description:
        "Skip ghost postings and inbox clutter. Our algorithm pairs verified talent directly with open company requisitions for instant review and interview scheduling.",
      tag: "STEP 2 • DISCOVERY",
    },
    {
      numeral: "03",
      title: "EXECUTE, TRACK & GET PAID",
      description:
        "Manage real-time shifts with tamper-proof GPS verification, automated milestone approvals, and unified multi-currency disbursements straight to bank accounts.",
      tag: "STEP 3 • FULFILLMENT",
    },
  ];

  return (
    <section className="flux-how-it-works-section">
      <div className="flux-how-container">
        {/* Left Column (1/3): Sticky Anton Title */}
        <div className="flux-how-left-col">
          <div className="flux-sticky-box">
            <div className="flux-pill-badge" style={{ marginBottom: "1rem" }}>
              <span className="flux-yellow-dot" />
              <span className="flux-badge-text">SEAMLESS WORKFLOW</span>
            </div>
            <h2 className="flux-how-title">
              HOW IT <br />
              WORKS<span className="flux-title-dot">.</span>
            </h2>
            <p className="flux-how-subtitle">
              Three surgical steps to replace broken job boards, endless email threads, and manual paper timesheets.
            </p>
            <Link to="/register" className="flux-how-cta-btn">
              <span>GET STARTED TODAY</span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>

        {/* Right Column (2/3): Vertical Stack of 3 Steps */}
        <div className="flux-how-right-col">
          {steps.map((step, index) => (
            <div key={index} className="flux-step-card">
              <div className="flux-step-header">
                <span className="flux-step-tag">{step.tag}</span>
                <span className="flux-step-numeral">{step.numeral}</span>
              </div>
              <div className="flux-step-body">
                <h3 className="flux-step-title">{step.title}</h3>
                <p className="flux-step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
