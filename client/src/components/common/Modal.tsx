import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close (ESC, outside click, or X button) */
  onClose: () => void;
  /** Modal title shown in the header */
  title: ReactNode;
  /** Optional subtitle / description under the title */
  description?: ReactNode;
  /** Content of the modal body */
  children: ReactNode;
  /** Optional footer content (buttons etc.) */
  footer?: ReactNode;
  /** Max width of the dialog panel. Default: 540px */
  maxWidth?: string;
  /**
   * When true, clicking the overlay and pressing ESC will NOT close the modal.
   * Use for destructive confirmations where accidental dismiss is dangerous.
   * The X button is also hidden.
   */
  dangerous?: boolean;
  /** Additional class for the modal content panel */
  className?: string;
  /** aria-describedby id for additional accessibility context */
  ariaDescribedBy?: string;
}

let modalCount = 0; // track nesting for body scroll lock

/**
 * Modal — Accessible, animated dialog with:
 *  - Body scroll lock
 *  - ESC to close (unless dangerous)
 *  - Click outside to close (unless dangerous)
 *  - Focus trap (first focusable element inside)
 *  - Focus restoration after close
 *  - Animated open/close via CSS (modalFadeIn / modalSlideUp in index.css)
 *  - Respects prefers-reduced-motion
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "540px",
  dangerous = false,
  className = "",
  ariaDescribedBy,
}: ModalProps) {
  useBodyScrollLock(isOpen);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Save the element that opened the modal so we can restore focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Focus the first focusable element inside the dialog
      const frame = requestAnimationFrame(() => {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      });
      return () => cancelAnimationFrame(frame);
    } else {
      // Restore focus to the element that triggered the modal
      requestAnimationFrame(() => {
        if (triggerRef.current instanceof HTMLElement) {
          triggerRef.current.focus();
        }
      });
    }
  }, [isOpen]);

  // Keyboard handler: ESC closes modal, Tab traps focus inside dialog
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !dangerous) {
      e.preventDefault();
      onClose();
    }

    // Focus trap
    if (e.key === "Tab" && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dangerous && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      style={{ zIndex: 1000 + modalCount * 10 }}
      aria-hidden={!isOpen}
    >
      <div
        ref={dialogRef}
        className={`modal-content ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        style={{ maxWidth, outline: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="modal-title"
              className="modal-title"
              style={{ margin: 0, fontSize: "1.125rem" }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  margin: "0.25rem 0 0 0",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {description}
              </p>
            )}
          </div>

          {!dangerous && (
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close dialog"
              style={{ marginLeft: "1rem", flexShrink: 0 }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body" id={ariaDescribedBy}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
