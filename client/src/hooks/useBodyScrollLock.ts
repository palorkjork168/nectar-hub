import { useEffect } from "react";

/**
 * useBodyScrollLock — locks body scroll while a modal/dialog is open.
 *
 * Usage:
 *   useBodyScrollLock(isOpen);
 *
 * When `locked` is true:
 *  - Adds overflow:hidden to <body>
 *  - Compensates for scrollbar width so content doesn't shift
 *
 * When `locked` is false (or on unmount):
 *  - Restores original overflow
 *  - Removes scrollbar compensation
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const original = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = "";
    };
  }, [locked]);
}
