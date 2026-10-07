import { useState } from "react";

interface DataPoint {
  date: string;
  count: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export function TrendChart({
  title,
  data,
  color = "#2563eb",
  height = 180,
  emptyMessage = "No trend data available for this range.",
}: TrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  if (!data || data.length === 0) {
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
            height,
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

  const counts = data.map((d) => d.count);
  const maxCount = Math.max(...counts, 5);
  const minCount = 0;

  const svgWidth = 600;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 25;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.count - minCount) / (maxCount - minCount || 1)) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${
    paddingY + chartHeight
  } Z`;

  const totalSum = counts.reduce((a, b) => a + b, 0);

  return (
    <div
      style={{
        background: "var(--color-bg-card, #0e1712)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--color-border, rgba(16, 185, 129, 0.2))",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #f8fafc)" }}>
          {title}
        </h3>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94a3b8)" }}>
          Total: <strong style={{ color: "var(--color-text-main, #f8fafc)" }}>{totalSum}</strong>
        </span>
      </div>

      <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={svgWidth - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={svgWidth - paddingX}
            y2={paddingY + chartHeight}
            stroke="rgba(16, 185, 129, 0.2)"
          />

          {/* Filled Area */}
          <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, "")})`} />

          {/* Main Trend Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.point.date === p.data.date ? "5" : "3"}
              fill={hoveredPoint?.point.date === p.data.date ? "#ffffff" : color}
              stroke={color}
              strokeWidth="2"
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
              onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, point: p.data })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              transform: "translate(-50%, -120%)",
              background: "#0d1611",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#ffffff",
              padding: "0.25rem 0.5rem",
              borderRadius: "6px",
              fontSize: "0.75rem",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 10,
              boxShadow: "0 8px 16px rgba(0,0,0,0.6)",
            }}
          >
            <div>{hoveredPoint.point.date}</div>
            <strong style={{ color: "#34d399" }}>{hoveredPoint.point.count}</strong>
          </div>
        )}
      </div>

      {/* Axis range labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "var(--color-text-muted, #94a3b8)",
        }}
      >
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};
