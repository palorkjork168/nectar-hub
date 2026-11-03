import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Search, Briefcase } from "lucide-react";
import { splitWords } from "../../hooks/useScrollReveal";

export default function FluxHeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle ambient drifting particle / stroke canvas that reacts to scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || 600;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = 24;
    const rows = 12;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = time * 0.0008;

      const cellW = width / cols;
      const cellH = height / rows;
      ctx.lineWidth = 1.2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const driftX = Math.sin(t * 0.7 + index * 0.2) * 5;
          const driftY = Math.cos(t * 0.5 + index * 0.15) * 4;
          const alphaNorm = 0.5 + 0.5 * Math.sin(t + index * 0.1);
          const alpha = 0.03 + 0.07 * alphaNorm;

          const cx = c * cellW + cellW * 0.5 + driftX;
          const cy = r * cellH + cellH * 0.5 + driftY;
          const len = 10 + Math.sin(index) * 3;
          const angle = Math.sin(t * 0.3 + index * 0.04) * 0.25;

          ctx.strokeStyle = `rgba(255, 225, 124, .)})`;
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(angle) * (len * 0.5), cy - Math.sin(angle) * (len * 0.5));
          ctx.lineTo(cx + Math.cos(angle) * (len * 0.5), cy + Math.sin(angle) * (len * 0.5));
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="flux-hero-section" style={{ position: "relative", overflow: "hidden" }}>
      {/* 40px Grid pattern background overlay */}
      <div className="flux-grid-bg" />

      {/* Kinetic ambient drifting canvas */}
      <canvas ref={canvasRef} className="flux-hero-ambient-canvas" />

      <div className="flux-hero-container" style={{ position: "relative", zIndex: 2 }}>
        {/* Platform Pill Badge */}
        <div
          className="flux-pill-badge"
          data-rev
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          <span className="flux-yellow-dot" />
          <span className="flux-badge-text">ALL-IN-ONE WORKFORCE PLATFORM</span>
        </div>

        {/* Display Headline in Anton with Word-split kinetic reveal */}
        <h1
          className="flux-hero-title rev-word-container"
          data-rev
          style={{ "--d": "100ms" } as React.CSSProperties}
        >
          {splitWords("WORKFORCE WITHOUT", 120)}
          <div className="flux-title-break">
            <span className="flux-highlight-wrapper">
              <span className="flux-highlight-box" />
              <span className="flux-highlight-word">CHAOS</span>
            </span>
          </div>
        </h1>

        {/* Subtitle with per-word rising reveals */}
        <p
          className="flux-hero-subtitle rev-word-container"
          data-rev
          style={{ "--d": "180ms" } as React.CSSProperties}
        >
          {splitWords(
            "Stop wrestling with fragmented job boards, messy spreadsheets, and lost attendance. Nectar Hub is the single operating system connecting employers, managers, and verified talent.",
            220
          )}
        </p>

        {/* Action Buttons */}
        <div
          className="flux-hero-actions"
          data-rev
          style={{ "--d": "260ms" } as React.CSSProperties}
        >
          <Link to="/jobs" className="flux-hero-primary-btn">
            <Search size={18} />
            <span>EXPLORE OPEN JOBS</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/register" className="flux-hero-secondary-btn">
            <Briefcase size={18} />
            <span>POST A JOB / SIGN UP</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Trust & Key Features Pill Row */}
        <div
          className="flux-hero-trust-row"
          data-rev
          style={{ "--d": "320ms" } as React.CSSProperties}
        >
          <div className="flux-trust-pill">
            <CheckCircle2 size={16} className="flux-trust-icon" />
            <span>Verified Talent & Companies</span>
          </div>
          <span className="flux-link-dot">•</span>
          <div className="flux-trust-pill">
            <CheckCircle2 size={16} className="flux-trust-icon" />
            <span>GPS Geofenced Attendance</span>
          </div>
          <span className="flux-link-dot">•</span>
          <div className="flux-trust-pill">
            <CheckCircle2 size={16} className="flux-trust-icon" />
            <span>Automated HR & Leave Tracking</span>
          </div>
        </div>
      </div>
    </section>
  );
}
