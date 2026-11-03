import { useEffect, useRef } from "react";

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Custom hook to trigger entrance animations when elements enter the viewport.
 * Fully accessible with automatic prefers-reduced-motion fallback.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px", triggerOnce = true } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect user's accessibility preference
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("reveal-visible");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      element.classList.add("reveal-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove("reveal-visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return ref;
}

/**
 * Automatically observe all elements with .reveal-on-scroll inside a container.
 */
export function useScrollRevealGroup<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const containerRef = useRef<T | null>(null);
  const { threshold = 0.1, rootMargin = "0px 0px -30px 0px", triggerOnce = true } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = container.querySelectorAll<HTMLElement>(".reveal-on-scroll");

    if (isReduced || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove("reveal-visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return containerRef;
}

/**
 * Split text into individual rising word spans with 38ms staggered delays.
 */
export function splitWords(text: string, baseDelay = 0): React.ReactNode[] {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span
      key={i}
      className="rev-word"
      style={{ transitionDelay: `${baseDelay + i * 38}ms` }}
    >
      {word}
      {i < words.length - 1 ? "\u00A0" : ""}
    </span>
  ));
}

/**
 * Global website motion scrolling orchestrator:
 * Observes all [data-rev] and .rev-word elements with an IntersectionObserver,
 * and attaches a single rAF scroll handler for dynamic CSS custom properties.
 */
export function useWebsiteMotion() {
  useEffect(() => {
    const isReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const elements = document.querySelectorAll<HTMLElement>("[data-rev], .rev-word-container, .rev-word");
    if (isReduced) {
      elements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const root = document.documentElement;
          root.style.setProperty("--site-scroll-y", `${scrollY}px`);
          root.style.setProperty("--hero-drift", `${Math.min(100, scrollY * 0.25)}px`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}
