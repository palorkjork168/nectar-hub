import { Star } from "lucide-react";

export default function FluxTestimonials() {
  const testimonials = [
    {
      id: 1,
      theme: "light",
      stars: 5,
      quote:
        "Nectar Hub has completely transformed how our team handles handoff. The developers actually look forward to receiving designs and applicant briefs now.",
      name: "ELENA ROSS",
      role: "PRODUCT LEAD @ STRIPE",
      avatarText: "ER",
      avatarImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      theme: "dark", // Center elevated card
      stars: 5,
      quote:
        "Finally, a tool that respects the design and hiring process but adds the structure we desperately needed. It's the GitHub for modern teams we've been waiting for.",
      name: "MARCUS CHEN",
      role: "DESIGN SYSTEM LEAD",
      avatarText: "MC",
      avatarImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      theme: "light",
      stars: 5,
      quote:
        "The version control is magic. I can branch off for explorations and merge back without breaking the master file. Pure genius and zero administrative overhead.",
      name: "SARAH JENKINS",
      role: "FREELANCE UX & OPERATIONS",
      avatarText: "SJ",
      avatarImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section className="flux-testimonials-section">
      <div className="flux-testimonials-container">
        {/* Section Title */}
        <div className="flux-testimonials-header">
          <div className="flux-pill-badge" style={{ margin: "0 auto 1.25rem" }}>
            <span className="flux-yellow-dot" />
            <span className="flux-badge-text">COMMUNITY PRAISE</span>
          </div>
          <h2 className="flux-testimonials-title">
            PROVEN BY LEADING <br />
            TEAMS & TALENT
          </h2>
        </div>

        {/* 3-Card Grid */}
        <div className="flux-testimonials-grid">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`flux-testimonial-card ${t.theme === "dark" ? "card-dark-center" : "card-light-side"}`}
            >
              {/* Star Rating (5 yellow stars #ffe17c) */}
              <div className="flux-stars-row">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} size={20} className="flux-star-icon" fill="currentColor" />
                ))}
              </div>

              {/* Quote Body in Satoshi-Medium (lg) */}
              <p className="flux-testimonial-quote">"{t.quote}"</p>

              {/* Avatar Footer with grayscale 48px avatar and Anton uppercase name */}
              <div className="flux-testimonial-author">
                <div className="flux-author-avatar-wrap">
                  <img
                    src={t.avatarImg}
                    alt={t.name}
                    className="flux-author-avatar"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flux-author-fallback">{t.avatarText}</div>
                </div>
                <div className="flux-author-meta">
                  <div className="flux-author-name">{t.name}</div>
                  <div className="flux-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
