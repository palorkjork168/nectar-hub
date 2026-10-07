import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
  minHeight?: string;
}

export default function PageLoading({
  message = "Loading...",
  minHeight = "60vh",
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        width: "100%",
        padding: "2rem",
        gap: "1rem",
        color: "var(--color-text-secondary, #475569)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-xl, 16px)",
          backgroundColor: "var(--color-primary-soft, #eff6ff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))",
        }}
      >
        <Loader2
          size={24}
          style={{
            color: "var(--color-primary, #2563eb)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--color-text-muted, #64748b)",
          margin: 0,
        }}
      >
        {message}
      </p>

      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        {message}
      </span>
    </div>
  );
}
