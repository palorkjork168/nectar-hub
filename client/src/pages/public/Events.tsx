import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, ArrowUpRight, Sparkles } from "lucide-react";

export default function Events() {
  const events = [
    {
      id: 1,
      title: "Cambodia Tech & HR Career Expo 2026",
      date: "Nov 15, 2026",
      time: "9:00 AM - 5:00 PM",
      location: "Diamond Island, Phnom Penh",
      category: "Job Fair",
      attendees: "3,500+ Registered",
      description: "Connect directly with hiring leaders from 80+ top companies across technology, banking, and logistics.",
      badgeColor: "#0284c7",
    },
    {
      id: 2,
      title: "Resume & Interview Masterclass",
      date: "Nov 22, 2026",
      time: "2:00 PM - 4:30 PM",
      location: "Live Webinar",
      category: "Workshop",
      attendees: "1,200+ Attending",
      description: "Learn ATS resume optimization, interview communication, and salary negotiation skills.",
      badgeColor: "#ffe17c",
    },
    {
      id: 3,
      title: "HR & Talent Acquisition Summit",
      date: "Dec 05, 2026",
      time: "8:30 AM - 4:00 PM",
      location: "Rosewood Phnom Penh",
      category: "Conference",
      attendees: "300+ Executives",
      description: "Insights on modern workforce operations, retention strategies, and regional market trends.",
      badgeColor: "#f59e0b",
    },
  ];

  return (
    <div className="public-container">
      <div style={{ textAlign: "center", maxWidth: "750px", margin: "0 auto 3.5rem" }}>
        <div className="hero-career-pill" style={{ margin: "0 auto 1.25rem" }}>
          <Sparkles size={14} />
          <span>Events</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
          Events & Workshops
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Career expos, masterclasses, and networking sessions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem" }}>
        {events.map((event) => (
          <div key={event.id} className="card" style={{ padding: "2rem", borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: event.badgeColor, background: `${event.badgeColor}18`, padding: "0.25rem 0.65rem", borderRadius: "9999px" }}>
                  {event.category}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Users size={14} /> {event.attendees}
                </span>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.85rem", lineHeight: 1.35 }}>
                {event.title}
              </h3>

              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {event.description}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={15} style={{ color: "var(--color-primary-text)" }} />
                  <span>{event.date}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={15} style={{ color: "var(--color-primary-text)" }} />
                  <span>{event.time}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={15} style={{ color: "var(--color-primary-text)" }} />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/coming-soon?feature=${encodeURIComponent(event.title + " Registration")}&category=Career%20Events&eta=Registration%20Opens%20Soon`}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>Register Free Pass</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
