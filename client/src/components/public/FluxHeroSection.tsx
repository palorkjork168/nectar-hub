import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Search, Briefcase } from "lucide-react";
import { splitWords } from "../../hooks/useScrollReveal";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  phaseSpeed: number;
}

export default function FluxHeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic slow kinetic constellation & interactive ambient glow canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Track smooth mouse position
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);

    const resize = () => {
      width = section.clientWidth || window.innerWidth;
      height = section.clientHeight || 650;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize minimalist slow particles
    const particleCount = Math.min(48, Math.max(24, Math.floor((width * height) / 22000)));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 1.2 + Math.random() * 1.4,
        baseAlpha: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.015 + Math.random() * 0.02,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Check current theme
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;

        // Subtle interactive radial spotlight on cursor
        const spotRadius = 180;
        const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, spotRadius);
        spotGrad.addColorStop(
          0,
          isDark ? "rgba(255, 225, 124, 0.09)" : "rgba(255, 217, 92, 0.14)"
        );
        spotGrad.addColorStop(
          0.6,
          isDark ? "rgba(255, 225, 124, 0.03)" : "rgba(255, 217, 92, 0.04)"
        );
        spotGrad.addColorStop(1, "rgba(255, 225, 124, 0)");

        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, spotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw particles
      const maxConnectDist = 115;
      const count = particles.length;

      // Draw faint connections first
      ctx.lineWidth = 0.65;
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * (isDark ? 0.16 : 0.12);
            ctx.strokeStyle = isDark
              ? `rgba(255, 225, 124, ${lineAlpha})`
              : `rgba(217, 119, 6, ${lineAlpha * 0.75})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing nodes and update physics
      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Move slowly
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges gracefully
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Subtle gentle mouse repulsion
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < 95 && mdist > 0.1) {
            const force = (1 - mdist / 95) * 0.6;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
          }
        }

        // Pulse phase
        p.phase += p.phaseSpeed;
        const currentAlpha = Math.max(
          0.1,
          p.baseAlpha + Math.sin(p.phase) * 0.18
        );

        // Draw soft glowing particle
        const dotColor = isDark
          ? `rgba(255, 225, 124, ${currentAlpha})`
          : `rgba(217, 119, 6, ${currentAlpha * 0.8})`;

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Optional tiny subtle outer glow halo for larger nodes
        if (p.radius > 1.8) {
          const haloGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
          haloGrad.addColorStop(0, isDark ? "rgba(255, 225, 124, 0.2)" : "rgba(255, 217, 92, 0.25)");
          haloGrad.addColorStop(1, "rgba(255, 225, 124, 0)");
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} className="flux-hero-section" style={{ position: "relative", overflow: "hidden" }}>
      {/* Ambient Slow Floating Aurora Blobs */}
      <div className="flux-hero-ambient-wrap" aria-hidden="true">
        <div className="flux-ambient-orb flux-ambient-orb-1" />
        <div className="flux-ambient-orb flux-ambient-orb-2" />
        <div className="flux-ambient-orb flux-ambient-orb-3" />
      </div>

      {/* 40px Grid pattern background overlay */}
      <div className="flux-grid-bg" />

      {/* Kinetic ambient drifting constellation canvas */}
      <canvas ref={canvasRef} className="flux-hero-ambient-canvas" />

      <div className="flux-hero-container" style={{ position: "relative", zIndex: 2 }}>
        {/* Platform Pill Badge */}
        <div
          className="flux-pill-badge"
          data-rev
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          <span className="flux-yellow-dot" />
          <span className="flux-badge-text">WORKFORCE PLATFORM</span>
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
            "The unified platform connecting verified talent, employers, and modern teams.",
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
            <span>BROWSE JOBS</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/register" className="flux-hero-secondary-btn">
            <Briefcase size={18} />
            <span>POST A JOB</span>
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
            <span>Verified Talent</span>
          </div>
          <span className="flux-link-dot">•</span>
          <div className="flux-trust-pill">
            <CheckCircle2 size={16} className="flux-trust-icon" />
            <span>Smart Attendance</span>
          </div>
          <span className="flux-link-dot">•</span>
          <div className="flux-trust-pill">
            <CheckCircle2 size={16} className="flux-trust-icon" />
            <span>HR & Leaves</span>
          </div>
        </div>
      </div>
    </section>
  );
}
