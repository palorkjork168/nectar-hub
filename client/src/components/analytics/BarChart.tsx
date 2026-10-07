interface BarItem {
  label: string;
  count: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  items: BarItem[];
  emptyMessage?: string;
  maxDisplay?: number;
}

const DEFAULT_COLORS = [
  "#2563eb", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
];

export function BarChart({
  title,
  items,
  emptyMessage = "No distribution data available.",
  maxDisplay = 8,
}: BarChartProps) {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-bg-card, #0e1712)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #f8fafc)" }}>
          {title}
        </h3>
        <div
          style={{
            padding: "2rem 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.85rem",
          }}
        >
          {emptyMessage}
        </div>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const displayItems = items.slice(0, maxDisplay);

  return (
    <div
      style={{
        background: "var(--color-bg-card, #0e1712)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #f8fafc)" }}>
          {title}
        </h3>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94a3b8)" }}>
          Total: <strong style={{ color: "var(--color-text-main, #f8fafc)" }}>{total}</strong>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {displayItems.map((item, index) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
          const barWidthPercent = ((item.count / maxCount) * 100).toFixed(1);
          const barColor = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.825rem",
                  color: "var(--color-text-secondary, #cbd5e1)",
                }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "70%",
                    color: "#f8fafc",
                  }}
                  title={item.label}
                >
                  {item.label}
                </span>
                <span style={{ color: "var(--color-text-muted, #94a3b8)", fontSize: "0.8rem" }}>
                  <strong style={{ color: "#f8fafc" }}>{item.count}</strong> ({percentage}%)
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidthPercent}%`,
                    height: "100%",
                    background: barColor,
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
