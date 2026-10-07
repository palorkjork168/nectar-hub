import React from "react";

interface NectarLogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  tagline?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function NectarIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nectarGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="nectarCore" x1="12" y1="10" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      
      {/* Outer Honeycomb Geometry */}
      <path
        d="M16 2.5L28 9.4V22.6L16 29.5L4 22.6V9.4L16 2.5Z"
        stroke="url(#nectarGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(16, 185, 129, 0.08)"
      />

      {/* Internal Connection Bridges (Workplace Network) */}
      <path
        d="M16 7.5V12M24 12L20 14.5M24 20L20 17.5M16 24.5V20M8 20L12 17.5M8 12L12 14.5"
        stroke="url(#nectarGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Central Nectar Droplet / Connected Hub Node */}
      <circle cx="16" cy="16" r="3.75" fill="url(#nectarCore)" />
      
      {/* Network Nodes */}
      <circle cx="16" cy="5.5" r="1.5" fill="#f59e0b" />
      <circle cx="25.5" cy="11" r="1.5" fill="#10b981" />
      <circle cx="25.5" cy="21" r="1.5" fill="#10b981" />
      <circle cx="16" cy="26.5" r="1.5" fill="#059669" />
      <circle cx="6.5" cy="21" r="1.5" fill="#10b981" />
      <circle cx="6.5" cy="11" r="1.5" fill="#f59e0b" />
    </svg>
  );
}

export default function NectarLogo({
  size = 28,
  showText = true,
  subtitle,
  tagline,
  className = "",
  style,
}: NectarLogoProps) {
  return (
    <div
      className={`nectar-brand ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.625rem",
        textDecoration: "none",
        ...style,
      }}
    >
      <div
        className="brand-icon"
        style={{
          width: `${size + 10}px`,
          height: `${size + 10}px`,
          borderRadius: "10px",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(16, 185, 129, 0.15)",
          flexShrink: 0,
        }}
      >
        <NectarIcon size={size} />
      </div>

      {showText && (
        <div className="brand-text" style={{ display: "flex", flexDirection: "column" }}>
          <span
            className="brand-title"
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--color-text, #ffffff)",
              lineHeight: 1.15,
            }}
          >
            Nectar Hub
          </span>
          {subtitle && (
            <span
              className="brand-subtitle"
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-primary, #10b981)",
                marginTop: "1px",
              }}
            >
              {subtitle}
            </span>
          )}
          {tagline && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted, #94a3b8)",
                marginTop: "2px",
              }}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
