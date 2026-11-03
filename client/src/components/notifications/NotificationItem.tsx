import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  Briefcase,
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { Notification, NotificationType } from "../../types/notification";
import { useMarkAsRead } from "../../hooks/useNotifications";
import { useAuth } from "../../contexts/AuthContext";

interface NotificationItemProps {
  notification: Notification;
  onItemClick?: () => void;
  compact?: boolean;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return <FileText size={18} style={{ color: "#2563eb" }} />;
    case "APPLICATION_STATUS_CHANGED":
      return <FileText size={18} style={{ color: "#0284c7" }} />;
    case "INTERVIEW_SCHEDULED":
    case "INTERVIEW_RESCHEDULED":
      return <Calendar size={18} style={{ color: "#d97706" }} />;
    case "INTERVIEW_CANCELLED":
      return <AlertCircle size={18} style={{ color: "#dc2626" }} />;
    case "CANDIDATE_HIRED":
      return <Briefcase size={18} style={{ color: "var(--color-primary-text)" }} />;
    case "LEAVE_REQUESTED":
      return <CalendarDays size={18} style={{ color: "#7c3aed" }} />;
    case "LEAVE_APPROVED":
      return <CheckCircle size={18} style={{ color: "var(--color-primary-text)" }} />;
    case "LEAVE_REJECTED":
      return <XCircle size={18} style={{ color: "#dc2626" }} />;
    case "LEAVE_CANCELLED":
      return <Clock size={18} style={{ color: "#64748b" }} />;
    case "ATTENDANCE_CORRECTION_REQUESTED":
      return <Clock size={18} style={{ color: "#f59e0b" }} />;
    case "ATTENDANCE_CORRECTION_APPROVED":
      return <CheckCircle size={18} style={{ color: "var(--color-primary-text)" }} />;
    case "ATTENDANCE_CORRECTION_REJECTED":
      return <XCircle size={18} style={{ color: "#ef4444" }} />;
    default:
      return <AlertCircle size={18} style={{ color: "#64748b" }} />;
  }
}


function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationItem({
  notification,
  onItemClick,
  compact = false,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkAsRead();
  const { refreshUser } = useAuth();

  const handleClick = async () => {
    // 1. Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 2. If candidate was hired, refresh auth to load EMPLOYEE role into session
    if (notification.type === "CANDIDATE_HIRED" && refreshUser) {
      try {
        await refreshUser();
      } catch (err) {
        console.error("Failed to refresh user auth state:", err);
      }
    }

    // 3. Optional callback (e.g. close popover)
    if (onItemClick) {
      onItemClick();
    }

    // 4. Safe internal route navigation
    if (notification.link && notification.link.startsWith("/")) {
      navigate(notification.link);
    } else {
      navigate("/notifications");
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: compact ? "0.75rem 1rem" : "1.125rem 1.25rem",
        backgroundColor: notification.is_read
          ? "transparent"
          : "var(--color-primary-soft, rgba(37, 99, 235, 0.04))",
        borderBottom: "1px solid var(--color-border, #e2e8f0)",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = notification.is_read
          ? "var(--color-surface-hover, rgba(0, 0, 0, 0.02))"
          : "var(--color-primary-soft-hover, rgba(37, 99, 235, 0.08))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.is_read
          ? "transparent"
          : "var(--color-primary-soft, rgba(37, 99, 235, 0.04))";
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: compact ? "34px" : "40px",
          height: compact ? "34px" : "40px",
          borderRadius: "50%",
          backgroundColor: "var(--color-surface, #ffffff)",
          border: "1px solid var(--color-border, #e2e8f0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "0.125rem",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        }}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: compact ? "0.875rem" : "0.9375rem",
              fontWeight: notification.is_read ? 600 : 700,
              color: "var(--color-text, #0f172a)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {notification.title}
          </h4>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary, #64748b)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: compact ? "0.8125rem" : "0.875rem",
            color: notification.is_read
              ? "var(--color-text-secondary, #64748b)"
              : "var(--color-text, #1e293b)",
            lineHeight: 1.45,
            display: compact ? "-webkit-box" : "block",
            WebkitLineClamp: compact ? 2 : undefined,
            WebkitBoxOrient: compact ? "vertical" : undefined,
            overflow: compact ? "hidden" : "visible",
          }}
        >
          {notification.message}
        </p>
      </div>

      {/* Unread indicator dot */}
      {!notification.is_read && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary, #2563eb)",
            flexShrink: 0,
            marginTop: "0.5rem",
          }}
          title="Unread notification"
        />
      )}
    </div>
  );
}
