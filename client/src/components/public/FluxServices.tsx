import { Briefcase, MapPin, CalendarCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { splitWords } from "../../hooks/useScrollReveal";

export default function FluxServices() {
  const services = [
    {
      icon: Briefcase,
      title: "Job Portal",
      description:
        "Verified candidate profiles, resumes, and structured hiring pipelines.",
      badge: "HIRING",
      link: "/jobs",
      linkText: "Explore Jobs",
    },
    {
      icon: MapPin,
      title: "Shift Attendance",
      description:
        "Geofenced mobile clock-in with automated hours and attendance tracking.",
      badge: "ATTENDANCE",
      link: "/register",
      linkText: "Learn More",
    },
    {
      icon: CalendarCheck,
      title: "Leave & Schedules",
      description:
        "Custom leave policies, approval workflows, and flexible shift schedules.",
      badge: "WORKFORCE",
      link: "/register",
      linkText: "Get Started",
    },
    {
      icon: ShieldCheck,
      title: "Role Permissions",
      description:
        "Granular access control and secure enterprise company isolation.",
      badge: "SECURITY",
      link: "/about",
      linkText: "Learn More",
    },
  ];

  return (
    <section className="flux-services-section">
      <div className="flux-services-container">
        {/* Section Header */}
        <div className="flux-services-header">
          <div
            className="flux-pill-badge"
            data-rev
            style={{ margin: "0 auto 1.25rem", "--d": "60ms" } as React.CSSProperties}
          >
            <span className="flux-yellow-dot" />
            <span className="flux-badge-text">SERVICES</span>
          </div>
          <h2
            className="flux-services-headline rev-word-container"
            data-rev
            style={{ "--d": "100ms" } as React.CSSProperties}
          >
            {splitWords("MODERN WORKFORCE", 100)}
            <span className="flux-title-dot">.</span>
          </h2>
          <p
            className="flux-services-subtext rev-word-container"
            data-rev
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            {splitWords(
              "Everything you need to hire, schedule, and manage your team in one place.",
              180
            )}
          </p>
        </div>

        {/* 4 Services Grid */}
        <div className="flux-services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="flux-service-card"
                data-rev
                style={{ "--d": `${100 + index * 90}ms` } as React.CSSProperties}
              >
                <div className="flux-service-card-top">
                  <div className="flux-service-icon-box">
                    <Icon size={24} />
                  </div>
                  <span className="flux-mini-tag yellow">{service.badge}</span>
                </div>

                <h3 className="flux-service-title">{service.title}</h3>
                <p className="flux-service-desc">{service.description}</p>

                <Link to={service.link} className="flux-service-link">
                  <Icon size={14} className="flux-service-link-icon" />
                  <span>{service.linkText}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
