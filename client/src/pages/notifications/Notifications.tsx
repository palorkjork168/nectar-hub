import { useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
} from "lucide-react";
import { useNotifications, useMarkAllAsRead } from "../../hooks/useNotifications";
import NotificationItem from "../../components/notifications/NotificationItem";

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const isReadParam = activeFilter === "UNREAD" ? false : undefined;

  const { data, isLoading, isFetching } = useNotifications({
    page: currentPage,
    limit: 15,
    is_read: isReadParam,
  });

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  };

  const handleFilterChange = (filter: "ALL" | "UNREAD") => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="page-container fade-in" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1
            className="page-title"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              fontSize: "1.75rem",
              fontWeight: 800,
              margin: "0 0 0.375rem 0",
            }}
          >
            <Bell size={26} style={{ color: "var(--color-primary-text, #2563eb)" }} />
            <span>Notification Center</span>
          </h1>
          <p
            className="page-subtitle"
            style={{ margin: 0, color: "var(--color-text-secondary, #64748b)", fontSize: "0.9375rem" }}
          >
            Stay updated with your applications, interviews, workforce, and leave activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => markAllAsRead()}
          disabled={isMarkingAll || notifications.length === 0}
          className="btn btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <CheckCheck size={16} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border, #e2e8f0)",
          marginBottom: "1.5rem",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleFilterChange("ALL")}
            style={{
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: activeFilter === "ALL" ? 700 : 500,
              color: activeFilter === "ALL" ? "var(--color-primary, #2563eb)" : "var(--color-text-secondary, #64748b)",
              border: "none",
              background: "none",
              borderBottom: activeFilter === "ALL" ? "2px solid var(--color-primary, #2563eb)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("UNREAD")}
            style={{
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: activeFilter === "UNREAD" ? 700 : 500,
              color: activeFilter === "UNREAD" ? "var(--color-primary, #2563eb)" : "var(--color-text-secondary, #64748b)",
              border: "none",
              background: "none",
              borderBottom: activeFilter === "UNREAD" ? "2px solid var(--color-primary, #2563eb)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Unread Only
          </button>
        </div>

        {isFetching && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--color-text-secondary, #64748b)", fontSize: "0.75rem" }}>
            <Loader2 size={14} className="animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Notifications List Card */}
      <div
        style={{
          backgroundColor: "var(--color-surface, #ffffff)",
          borderRadius: "var(--radius-xl, 1rem)",
          border: "1px solid var(--color-border, #e2e8f0)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--color-text-secondary, #64748b)" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "var(--color-primary-text, #2563eb)" }} />
            <p style={{ margin: 0, fontSize: "0.9375rem" }}>Loading notification feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "4.5rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "var(--color-surface-muted, #f1f5f9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-secondary, #64748b)",
                marginBottom: "1rem",
              }}
            >
              <Inbox size={28} />
            </div>
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text, #0f172a)",
              }}
            >
              {activeFilter === "UNREAD" ? "No unread notifications" : "You're all caught up"}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-secondary, #64748b)",
                maxWidth: "380px",
                lineHeight: 1.5,
              }}
            >
              {activeFilter === "UNREAD"
                ? "You have reviewed all your updates. Switch to 'All Activity' to browse previous history."
                : "Important updates about applications, interviews, work schedule, and leave will appear here."}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1.5rem",
            padding: "0 0.5rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary, #64748b)" }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.8125rem",
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
