import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";

export default function Blogs() {
  const blogs = [
    {
      id: 1,
      title: "Top 10 High-Demand Skills Employers Look For in 2026",
      category: "Career Advice",
      date: "Oct 12, 2026",
      readTime: "5 min",
      author: "Nectar Editorial",
      excerpt: "The technical and leadership skills driving modern compensation and hiring velocity.",
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "How to Build a High-Converting Resume That Beats ATS Filters",
      category: "Resume Guide",
      date: "Oct 08, 2026",
      readTime: "7 min",
      author: "HR Team",
      excerpt: "Formatting guidelines, quantifiable metrics, and structures modern ATS systems prefer.",
      imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "The Future of Hybrid Work in Southeast Asia: Trends & Strategies",
      category: "Industry Trends",
      date: "Sep 28, 2026",
      readTime: "6 min",
      author: "Strategy Board",
      excerpt: "How companies are structuring hybrid collaboration, shift flexibility, and retention.",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="public-container">
      <div style={{ textAlign: "center", maxWidth: "750px", margin: "0 auto 3.5rem" }}>
        <div className="hero-career-pill" style={{ margin: "0 auto 1.25rem" }}>
          <Sparkles size={14} />
          <span>Insights</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
          Articles & Insights
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Practical advice on hiring, careers, and workforce trends.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {blogs.map((blog) => (
          <article key={blog.id} className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "200px", width: "100%", overflow: "hidden", position: "relative" }}>
              <img src={blog.imageUrl} alt={blog.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "rgba(0, 0, 0, 0.7)", color: "#ffffff", backdropFilter: "blur(8px)", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px" }}>
                {blog.category}
              </span>
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Calendar size={13} /> {blog.date}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Clock size={13} /> {blog.readTime}</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.35, margin: "0 0 0.75rem" }}>
                  {blog.title}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                  {blog.excerpt}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{blog.author}</span>
                <Link
                  to={`/coming-soon?feature=${encodeURIComponent(blog.title)}&category=Editorial%20%26%20Insights&eta=Full%20Article%20Coming%20Soon`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary-text)", textDecoration: "none" }}
                >
                  <span>Read Article</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
