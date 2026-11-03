import { Briefcase, MapPin, CalendarCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { splitWords } from "../../hooks/useScrollReveal";

export default function FluxServices() {
  const services = [
    {
      icon: Briefcase,
      title: "Talent Recruitment & Job Portal",
      description:
        "Fast faceted job discovery, verified candidate profiles, resume portfolios, and structured interview pipelines for employers.",
      badge: "HIRING PIPELINE",
      link: "/jobs",
      linkText: "Explore Job Openings",
    },
    {
      icon: MapPin,
      title: "GPS-Verified Shift Attendance",
      description:
        "Tamper-proof geofenced mobile clock-in and clock-out with automated lateness tracking and real-time worked hours computation.",
      badge: "SMART ATTENDANCE",
      link: "/register",
      linkText: "Learn More",
    },
    {
      icon: CalendarCheck,
      title: "HR Leave & Schedule Management",
      description:
        "Company-scoped leave types, collision-guarded approval workflows, leave balance tracking, and flexible team work schedules.",
      badge: "WORKFORCE OPS",
      link: "/register",
      linkText: "Get Started",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Role RBAC & Governance",
      description:
        "Strict multi-tenant company isolation with granular platform roles for Administrators, HR Managers, Employers, Employees, and Job Seekers.",
      badge: "ENTERPRISE SECURITY",
      link: "/about",
      linkText: "Our Governance",
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
            <span className="flux-badge-text">OUR CORE SERVICES</span>
          </div>
          <h2
            className="flux-services-headline rev-word-container"
            data-rev
            style={{ "--d": "100ms" } as React.CSSProperties}
          >
            {splitWords("BUILT FOR MODERN WORKPLACES", 100)}
            <span className="flux-title-dot">.</span>
          </h2>
          <p
            className="flux-services-subtext rev-word-container"
            data-rev
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            {splitWords(
              "From hiring verified candidates to managing daily attendance and leave schedules, Nectar Hub powers your entire employment lifecycle.",
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
