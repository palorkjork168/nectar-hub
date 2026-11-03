import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle, ArrowRight } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does the AI candidate matching work?",
    answer:
      "Our system performs multi-dimensional semantic vector analysis across candidate profiles, verified work experience, and tech stacks. It computes a contextual match score (e.g., 98.4%) rather than simple keyword counting, guaranteeing relevant recommendations for hiring managers.",
  },
  {
    question: "Can shift employees clock in from their mobile phones via GPS?",
    answer:
      "Yes! Employers can define custom geo-fenced perimeters around physical work sites, warehouses, or client offices. Employees can clock in directly from their mobile browser or phone. If they are outside the perimeter, the punch is flagged for manager review.",
  },
  {
    question: "How does multi-tenant data isolation work?",
    answer:
      "Every employer organization has an isolated multi-tenant data boundary. Candidates, internal job requisitions, employee shift logs, and salary details are strictly compartmentalized and inaccessible by other companies on the platform.",
  },
  {
    question: "What user roles are available in Nectar Hub?",
    answer:
      "Nectar Hub natively supports three primary roles: Job Seekers (who apply, track status, and coordinate interviews), Employers / HR Managers (who post roles, manage applicants, track attendance, and process leave), and System Administrators (who oversee platform governance).",
  },
  {
    question: "Can I try Nectar Hub for free without a credit card?",
    answer:
      "Absolutely. Our Starter Community plan is 100% free with no credit card required. You can post up to 3 active jobs, manage applicants, and try mobile attendance tracking immediately.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-layout-grid">
          {/* Left Column: Heading & Contact Card (Travexa Style) */}
          <div className="faq-info-col">
            <span className="faq-eyebrow">• GOT QUESTIONS? •</span>
            <h2 className="faq-title">Common Questions, Quick Answers.</h2>
            <p className="faq-desc">
              Everything you need to know about setting up your organization, managing shifts, or applying for verified roles.
            </p>

            <div className="faq-contact-box">
              <div className="contact-box-icon">
                <MessageCircle size={22} />
              </div>
              <div>
                <h4 className="contact-box-title">Need personalized help?</h4>
                <p className="contact-box-desc">
                  Our workforce specialist team is available 24/7 to guide you through onboarding.
                </p>
                <Link to="/register" className="btn btn-primary" style={{ marginTop: "0.75rem", display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                  <span>Get in Touch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion List */}
          <div className="faq-accordion-col">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className={`faq-accordion-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-button"
                    onClick={() => toggleIndex(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{item.question}</span>
                    <span className="faq-toggle-icon">
                      <ChevronDown size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
