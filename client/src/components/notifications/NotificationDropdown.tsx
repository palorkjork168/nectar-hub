import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, BellOff, ArrowRight, Loader2 } from "lucide-react";
import { useNotifications, useMarkAllAsRead } from "../../hooks/useNotifications";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  unreadCount,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ limit: 6 }, isOpen);
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const notifications = data?.notifications || [];

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: "calc(100% + 0.5rem)",
        right: 0,
        width: "360px",
        maxWidth: "calc(100vw - 2rem)",
        backgroundColor: "var(--color-surface, #ffffff)",
        borderRadius: "var(--radius-lg, 0.75rem)",
        border: "1px solid var(--color-border, #e2e8f0)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        overflow: "hidden",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1rem",
          borderBottom: "1px solid var(--color-border, #e2e8f0)",
          backgroundColor: "var(--color-surface-subtle, #f8fafc)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text, #0f172a)",
            }}
          >
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: "var(--color-primary-soft, rgba(37, 99, 235, 0.1))",
                color: "var(--color-primary-text, #2563eb)",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.125rem 0.5rem",
                borderRadius: "9999px",
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "none",
              border: "none",
              color: "var(--color-primary-text, #2563eb)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: isMarkingAll ? "not-allowed" : "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "var(--radius-sm, 0.25rem)",
            }}
            title="Mark all notifications as read"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem 1rem",
              color: "var(--color-text-secondary, #64748b)",
              gap: "0.5rem",
            }}
          >
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: "0.8125rem" }}>Loading updates...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem 1.5rem",
              textAlign: "center",
              color: "var(--color-text-secondary, #64748b)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "var(--color-surface-muted, #f1f5f9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <BellOff size={20} />
            </div>
            <p
              style={{
                margin: "0 0 0.25rem 0",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text, #0f172a)",
              }}
            >
              No new notifications
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", maxWidth: "220px" }}>
              When applications, interviews, or leave requests update, you'll see them here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onItemClick={onClose}
              compact={true}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--color-border, #e2e8f0)",
          backgroundColor: "var(--color-surface-subtle, #f8fafc)",
          padding: "0.625rem 1rem",
          textAlign: "center",
        }}
      >
        <Link
          to="/notifications"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-primary-text, #2563eb)",
            textDecoration: "none",
          }}
        >
          <span>View all notifications</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
