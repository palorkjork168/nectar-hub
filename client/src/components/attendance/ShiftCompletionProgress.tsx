interface ShiftCompletionProgressProps {
  percentage: number | null | undefined;
  expectedHours?: number | string | null;
  actualHours?: number | string | null;
  compact?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg" | string;
}

export default function ShiftCompletionProgress({
  percentage,
  expectedHours,
  actualHours,
  compact = false,
  showLabel = true,
  size = "md",
}: ShiftCompletionProgressProps) {
  if (percentage === null || percentage === undefined) {
    return <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>—</span>;
  }

  const validPct = Math.min(100, Math.max(0, Math.round(Number(percentage))));

  // Color mapping
  let barColor = "var(--color-primary)";
  if (validPct >= 100) {
    barColor = "var(--color-success)";
  } else if (validPct < 60) {
    barColor = "var(--color-warning)";
  }

  const height = size === "sm" ? "4px" : size === "lg" ? "8px" : "6px";

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            flex: 1,
            height,
            backgroundColor: "var(--color-surface-muted, #f1f5f9)",
            borderRadius: "4px",
            overflow: "hidden",
            minWidth: "50px",
          }}
        >
          <div
            style={{
              width: `${validPct}%`,
              height: "100%",
              backgroundColor: barColor,
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        {showLabel && (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-main)" }}>
            {validPct}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "110px" }}>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {actualHours !== undefined && actualHours !== null && expectedHours !== undefined && expectedHours !== null
              ? `${actualHours}h / ${expectedHours}h`
              : "Completion"}
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: barColor }}>
            {validPct}%
          </span>
        </div>
      )}
      <div
        style={{
          width: "100%",
          height,
          backgroundColor: "var(--color-surface-muted, #f1f5f9)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${validPct}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
