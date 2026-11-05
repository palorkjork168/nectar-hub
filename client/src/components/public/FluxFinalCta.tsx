import { ArrowRight, Search, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { splitWords } from "../../hooks/useScrollReveal";

export default function FluxFinalCta() {
  return (
    <section className="flux-final-cta-section">
      {/* Massive Background Decorative Watermark in Anton with 10% opacity */}
      <div className="flux-watermark-text" aria-hidden="true">
        NECTAR
      </div>

      <div className="flux-final-cta-container">
        {/* Centralized Stack */}
        <h2
          className="flux-final-headline rev-word-container"
          data-rev
          style={{ "--d": "80ms" } as React.CSSProperties}
        >
          {splitWords("READY TO GET STARTED?", 80)}
        </h2>

        <p
          className="flux-final-subtext rev-word-container"
          data-rev
          style={{ "--d": "160ms" } as React.CSSProperties}
        >
          {splitWords(
            "Hire top talent or take the next step in your career.",
            140
          )}
        </p>

        {/* Action Buttons */}
        <div
          className="flux-final-actions"
          data-rev
          style={{ "--d": "240ms" } as React.CSSProperties}
        >
          <Link to="/jobs" className="flux-final-primary-btn">
            <Search size={20} />
            <span>FIND JOBS</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="flux-final-secondary-btn">
            <Briefcase size={20} />
            <span>POST A JOB</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        <div
          className="flux-final-footer-note"
          data-rev
          style={{ "--d": "300ms" } as React.CSSProperties}
        >
          <span>Free for job seekers</span>
          <span className="dot">•</span>
          <span>No credit card required</span>
          <span className="dot">•</span>
          <span>Instant setup</span>
        </div>
      </div>
    </section>
  );
}
