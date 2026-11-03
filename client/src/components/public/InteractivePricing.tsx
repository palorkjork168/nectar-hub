import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export default function InteractivePricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter Community",
      tagline: "Ideal for individual candidates and early-stage small teams.",
      monthlyPrice: 0,
      annualPrice: 0,
      popular: false,
      cta: "Join Free Today",
      ctaLink: "/register",
      features: [
        "Unlimited job applications & profile hosting",
        "Up to 3 active company job postings",
        "Basic candidate skill parsing",
        "Mobile GPS clock-in for up to 5 employees",
        "Community forum & standard support",
      ],
    },
    {
      name: "Growth Pro",
      tagline: "For scaling companies hiring rapidly with active shifts.",
      monthlyPrice: 29,
      annualPrice: 24,
      popular: true,
      badge: "Most Popular",
      cta: "Start 14-Day Free Trial",
      ctaLink: "/register",
      features: [
        "Everything in Starter, plus:",
        "Unlimited active job postings & applicant management",
        "Precision AI Candidate Skill Match (98.4% accuracy)",
        "Advanced Geo-Fenced GPS attendance with overtime tracking",
        "Automated multi-stage interview calendar sync",
        "Leave request & balance management workflows",
        "Priority 24/7 technical support",
      ],
    },
    {
      name: "Enterprise Vault",
      tagline: "For organizations demanding strict data isolation & compliance.",
      monthlyPrice: 89,
      annualPrice: 72,
      popular: false,
      cta: "Contact Enterprise Sales",
      ctaLink: "/register",
      features: [
        "Everything in Growth Pro, plus:",
        "Complete multi-tenant organizational data isolation",
        "Custom Role-Based Access Control (RBAC) permissions",
        "Tamper-proof encrypted HR audit trail logs",
        "Automated digital offer letters with signature workflows",
        "Custom payroll CSV/API exports & integrations",
        "Dedicated account manager & 99.99% uptime SLA",
      ],
    },
  ];

  return (
    <section className="pricing-section">
      <div className="pricing-container">
        {/* Travexa Section Header */}
        <div className="pricing-header text-center">
          <span className="pricing-eyebrow">• SIMPLE, TRANSPARENT TIERS •</span>
          <h2 className="pricing-title">One Platform, Every Workforce. Choose Your Plan.</h2>
          <p className="pricing-subtitle">
            Scale seamlessly from your very first hire to a global multi-department enterprise.
          </p>

          {/* Monthly vs Annual Toggle */}
          <div className="pricing-toggle-wrap">
            <button
              type="button"
              className={`toggle-option ${!isAnnual ? "active" : ""}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              className={`toggle-option ${isAnnual ? "active" : ""}`}
              onClick={() => setIsAnnual(true)}
            >
              <span>Annual Billing</span>
              <span className="save-badge">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Deck */}
        <div className="pricing-cards-grid">
          {tiers.map((tier, idx) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;

            return (
              <div
                key={idx}
                className={`pricing-tier-card ${tier.popular ? "tier-popular" : ""}`}
              >
                {tier.popular && (
                  <div className="tier-popular-pill">
                    <Sparkles size={13} />
                    <span>{tier.badge}</span>
                  </div>
                )}

                <div className="tier-header">
                  <h3 className="tier-name">{tier.name}</h3>
                  <p className="tier-tagline">{tier.tagline}</p>
                </div>

                <div className="tier-price-row">
                  <span className="tier-currency">$</span>
                  <span className="tier-amount">{price}</span>
                  <span className="tier-period">
                    / mo {isAnnual && price > 0 ? "(billed annually)" : ""}
                  </span>
                </div>

                <Link
                  to={tier.ctaLink}
                  className={`tier-cta-btn ${tier.popular ? "btn-popular" : "btn-standard"}`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight size={15} />
                </Link>

                <div className="tier-divider" />

                <div className="tier-features-list">
                  <div className="features-label">INCLUDED CAPABILITIES:</div>
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="feature-item">
                      <div className="feature-icon-check">
                        <Check size={14} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
