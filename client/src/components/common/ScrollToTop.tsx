import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop — Fires on every route change.
 * Scrolls the window to (0, 0) instantly so the user always
 * sees the top of the new page, not the previous scroll position.
 *
 * Mount this once inside <BrowserRouter>, above <Routes>.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use "instant" to avoid visible smooth-scroll during page transitions.
    // The page transition animation handles the visual smoothness.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
