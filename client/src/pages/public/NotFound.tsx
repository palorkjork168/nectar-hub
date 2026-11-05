import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "var(--color-bg-subtle, #f1f5f9)",
          color: "var(--color-primary-text, #2563eb)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <FileQuestion size={36} />
      </div>

      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--color-text-main, #0f172a)",
          margin: "0 0 0.5rem 0",
          letterSpacing: "-0.02em",
        }}
      >
        404 — Page Not Found
      </h1>

      <p
        style={{
          fontSize: "1.05rem",
          color: "var(--color-text-muted, #64748b)",
          maxWidth: "480px",
          margin: "0 0 2rem 0",
          lineHeight: 1.6,
        }}
      >
        This page does not exist or has been moved.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--color-border, #cbd5e1)",
            background: "#ffffff",
            color: "var(--color-text-main, #1e293b)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>

        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--color-primary, #2563eb)",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            transition: "all 0.15s ease",
          }}
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
