import { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCw,
  Sparkles,
} from "lucide-react";

interface CarouselCard {
  id: string;
  tag: string;
  title: string;
  metric: string;
  subtext: string;
  theme: "white" | "sky" | "dark" | "lime" | "cream";
  icon: typeof TrendingUp;
  pillBadge?: string;
}

const CARDS: CarouselCard[] = [
  {
    id: "match-score",
    tag: "Match Accuracy",
    title: "Alex R. • Senior Engineer",
    metric: "98.4%",
    subtext: "Deep Skill Graph & Culture Compatibility",
    theme: "white",
    icon: TrendingUp,
    pillBadge: "Top 1% Candidate",
  },
  {
    id: "comp-benchmark",
    tag: "Verified Comp",
    title: "Market Compensation",
    metric: "$4,900 / $5,800",
    subtext: "Real-Time Enterprise Tech Benchmark",
    theme: "white",
    icon: Zap,
    pillBadge: "Verified Market",
  },
  {
    id: "candidate-spotlight",
    tag: "Live Candidate",
    title: "Sara K. • Full Stack Lead",
    metric: "$2,670 / $1,200",
    subtext: "Available for Contract & Full-Time",
    theme: "sky",
    icon: Sparkles,
    pillBadge: "Ready to Interview",
  },
  {
    id: "enterprise-ai",
    tag: "Enterprise AI",
    title: "Workforce Intelligence",
    metric: "Multi-Tenant",
    subtext: "Isolated Data Vaults & Strategic Automations",
    theme: "dark",
    icon: ShieldCheck,
    pillBadge: "SOC-2 Type II",
  },
  {
    id: "shift-gps",
    tag: "Shift Operations",
    title: "Live GPS Geo-Fence",
    metric: "Live GPS",
    subtext: "Zero Punch-Card Fraud • Auto-Overtime",
    theme: "sky",
    icon: Clock,
    pillBadge: "Active Beacon",
  },
  {
    id: "hours-logged",
    tag: "Data Points",
    title: "Active Platform Velocity",
    metric: "520k+",
    subtext: "Hours Logged & Processed Seamlessly",
    theme: "lime",
    icon: CheckCircle2,
    pillBadge: "Platform Scale",
  },
  {
    id: "velocity",
    tag: "Hiring Velocity",
    title: "Time-to-Offer Speed",
    metric: "49% Faster",
    subtext: "From First Application to Verified Contract",
    theme: "white",
    icon: TrendingUp,
    pillBadge: "Rapid Pipeline",
  },
];

export default function CylinderCarousel3D() {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const requestRef = useRef<number | null>(null);

  const numCards = CARDS.length;
  const angleStep = 360 / numCards;
  const cylinderRadius = 380; // Distance in Z space

  // Auto-rotation engine
  const animate = useCallback(() => {
    if (isAutoPlaying && !isDragging) {
      setRotationAngle((prev) => (prev - 0.18) % 360);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isAutoPlaying, isDragging]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setRotationAngle((prev) => prev + angleStep);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setRotationAngle((prev) => prev - angleStep);
  };

  const handleCardClick = (index: number) => {
    setIsAutoPlaying(false);
    // Bring this card to 0 degrees front
    const targetAngle = -index * angleStep;
    setRotationAngle(targetAngle);
  };

  // Mouse / Touch Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    dragStartX.current = e.clientX;
    dragStartAngle.current = rotationAngle;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    // Map pixels to rotation degrees
    setRotationAngle(dragStartAngle.current + deltaX * 0.35);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    setIsAutoPlaying(false);
    dragStartX.current = e.touches[0].clientX;
    dragStartAngle.current = rotationAngle;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    setRotationAngle(dragStartAngle.current + deltaX * 0.4);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="cylinder-carousel-container">
      {/* Brandlyft Whimsical Annotation above 3D Carousel */}
      <div className="brandlyft-handwritten-note note-above-carousel">
        <svg
          className="doodle-curve-arrow"
          width="48"
          height="28"
          viewBox="0 0 48 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 22C14 8 28 6 42 16M42 16L34 10M42 16L38 24"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="handwritten-text">Interactive 3D Round Orbit — Drag or click to spin ↵</span>
      </div>

      {/* 3D Viewport Arena */}
      <div
        className="cylinder-3d-stage"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          className="cylinder-3d-ring"
          style={{
            transform: `rotateY(${rotationAngle}deg)`,
          }}
        >
          {CARDS.map((card, idx) => {
            const cardBaseAngle = idx * angleStep;
            // Normalize relative angle to [-180, 180]
            const totalAngle = (cardBaseAngle + rotationAngle) % 360;
            const normalizedAngle =
              totalAngle > 180 ? totalAngle - 360 : totalAngle < -180 ? totalAngle + 360 : totalAngle;
            const isFacingFront = Math.abs(normalizedAngle) < 70;
            const isCenterFront = Math.abs(normalizedAngle) < 25;

            const Icon = card.icon;

            return (
              <div
                key={card.id}
                className={`cylinder-card-item card-theme-${card.theme} ${
                  isCenterFront ? "is-center" : ""
                } ${isFacingFront ? "is-facing-front" : "is-facing-back"}`}
                style={{
                  transform: `rotateY(${cardBaseAngle}deg) translateZ(${cylinderRadius}px)`,
                }}
                onClick={() => handleCardClick(idx)}
                role="button"
                tabIndex={0}
                title={`Click to focus: ${card.title}`}
              >
                {/* Top Card Header */}
                <div className="card-top-header">
                  <span className="card-tag">{card.tag}</span>
                  <div className="card-icon-pill">
                    <Icon size={14} />
                  </div>
                </div>

                {/* Main Metric */}
                <div className="card-metric">{card.metric}</div>

                {/* Subtitle / Title */}
                <div className="card-title">{card.title}</div>
                <div className="card-subtext">{card.subtext}</div>

                {/* Pill Badge */}
                {card.pillBadge && (
                  <div className="card-footer-pill">
                    <span className="pill-dot" />
                    <span>{card.pillBadge}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating 3D Carousel Controls */}
      <div className="cylinder-controls-row">
        <button
          type="button"
          onClick={handlePrev}
          className="cylinder-nav-btn"
          aria-label="Rotate Previous"
          title="Rotate Left"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`cylinder-play-btn ${isAutoPlaying ? "active" : ""}`}
          aria-label={isAutoPlaying ? "Pause 3D Orbit" : "Play 3D Orbit"}
          title={isAutoPlaying ? "Pause 3D Orbit" : "Play 3D Orbit"}
        >
          {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isAutoPlaying ? "3D Orbiting" : "Paused"}</span>
        </button>

        <button
          type="button"
          onClick={() => setRotationAngle(0)}
          className="cylinder-nav-btn"
          aria-label="Reset to Front"
          title="Reset to Center"
        >
          <RotateCw size={15} />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="cylinder-nav-btn"
          aria-label="Rotate Next"
          title="Rotate Right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
