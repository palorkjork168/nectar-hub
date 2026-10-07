import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * PageTransition — Wraps page content with a subtle fade-in + slide-up animation.
 *
 * Uses CSS animations defined in index.css (.page-animate).
 * The key={pathname} forces a re-mount on every route change,
 * which re-triggers the animation without needing a JS animation library.
 *
 * Respects prefers-reduced-motion via CSS media query in index.css.
 */
interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-animate">
      {children}
    </div>
  );
}
