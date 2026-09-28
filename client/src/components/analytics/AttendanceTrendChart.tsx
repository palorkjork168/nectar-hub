import { useState } from "react";
import type { AttendanceTrendPoint } from "../../types/analytics";

interface AttendanceTrendChartProps {
  title?: string;
  data: AttendanceTrendPoint[];
  height?: number;
  emptyMessage?: string;
}

export function AttendanceTrendChart({
  title = "Attendance & Punctuality Trends",
  data,
  height = 220,
  emptyMessage = "No attendance trend data recorded for this period.",
}: AttendanceTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-bg-card, #ffffff)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--color-border, #e2e8f0)",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
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

  const maxVal = Math.max(...data.map((d) => Math.max(d.total, d.onTime, d.late, d.earlyDeparture)), 5);
  const minVal = 0;

  const svgWidth = 640;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const getPoints = (key: "total" | "onTime" | "late" | "earlyDeparture") => {
    return data.map((d, index) => {
      const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
      const y = paddingY + chartHeight - ((d[key] - minVal) / (maxVal - minVal || 1)) * chartHeight;
      return { x, y, value: d[key] };
    });
  };

  const totalPoints = getPoints("total");
  const onTimePoints = getPoints("onTime");
  const latePoints = getPoints("late");
  const earlyPoints = getPoints("earlyDeparture");

  const buildPath = (pts: { x: number; y: number }[]) => {
    return pts.reduce((acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`), "");
  };

  const totalPath = buildPath(totalPoints);
  const onTimePath = buildPath(onTimePoints);
  const latePath = buildPath(latePoints);
  const earlyPath = buildPath(earlyPoints);

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
  const hoveredX = hoveredIndex !== null ? totalPoints[hoveredIndex].x : null;

  return (
    <div
      style={{
        background: "var(--color-bg-card, #ffffff)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--color-border, #e2e8f0)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        position: "relative",
      }}
    >
      {/* Header and Series Legends */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
          {title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#3b82f6" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
            Total Logs
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#10b981" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            On-Time
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#f59e0b" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            Late
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#f43f5e" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f43f5e" }} />
            Early Dep.
          </span>
        </div>
      </div>

      <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="var(--color-border, #f1f5f9)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={svgWidth - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="var(--color-border, #f1f5f9)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={svgWidth - paddingX}
            y2={paddingY + chartHeight}
            stroke="var(--color-border, #e2e8f0)"
          />

          {/* Hover crosshair line */}
          {hoveredX !== null && (
            <line
              x1={hoveredX}
              y1={paddingY}
              x2={hoveredX}
              y2={paddingY + chartHeight}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Trend lines */}
          <path d={totalPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={onTimePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={latePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={earlyPath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive touch targets */}
          {data.map((_, i) => {
            const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
            return (
              <rect
                key={i}
                x={x - chartWidth / (data.length * 2)}
                y={paddingY}
                width={chartWidth / data.length || 20}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredData && hoveredX !== null && (
          <div
            style={{
              position: "absolute",
              left: `${(hoveredX / svgWidth) * 100}%`,
              top: "10px",
              transform: "translateX(-50%)",
              background: "#0f172a",
              color: "#ffffff",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.75rem",
              pointerEvents: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 10,
              minWidth: "130px",
            }}
          >
            <div style={{ fontWeight: 600, borderBottom: "1px solid #334155", paddingBottom: "0.25rem", marginBottom: "0.35rem" }}>
              {hoveredData.date}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#93c5fd" }}>
              <span>Total:</span> <strong>{hoveredData.total}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#86efac" }}>
              <span>On-Time:</span> <strong>{hoveredData.onTime}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#fde047" }}>
              <span>Late:</span> <strong>{hoveredData.late}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#fda4af" }}>
              <span>Early Dep.:</span> <strong>{hoveredData.earlyDeparture}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Axis dates */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "var(--color-text-muted, #94a3b8)",
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
        }}
      >
        <span>{data[0]?.date}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
