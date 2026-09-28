import type { AttendanceStatus } from "../../types/attendance";

interface AttendanceStatusBadgeProps {
  status?: AttendanceStatus | string;
  isLate?: boolean;
  isEarlyDeparture?: boolean;
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  className?: string;
  showDetails?: boolean;
}

export default function AttendanceStatusBadge({
  status,
  isLate,
  isEarlyDeparture,
  lateMinutes = 0,
  earlyDepartureMinutes = 0,
  className = "",
  showDetails = false,
}: AttendanceStatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  let badgeClass = "badge-neutral";
  let label = "Unknown";

  switch (normalized) {
    case "ON_TIME":
      badgeClass = "badge-success";
      label = "On Time";
      break;
    case "LATE":
      badgeClass = "badge-warning";
      label = showDetails && lateMinutes > 0 ? `Late (${lateMinutes}m)` : "Late";
      break;
    case "EARLY_DEPARTURE":
      badgeClass = "badge-warning";
      label =
        showDetails && earlyDepartureMinutes > 0
          ? `Early Departure (${earlyDepartureMinutes}m)`
          : "Early Departure";
      break;
    case "LATE_AND_EARLY_DEPARTURE":
      badgeClass = "badge-danger";
      label =
        showDetails && (lateMinutes > 0 || earlyDepartureMinutes > 0)
          ? `Late (${lateMinutes}m) + Early (${earlyDepartureMinutes}m)`
          : "Late + Early Departure";
      break;
    case "IN_PROGRESS":
      badgeClass = "badge-info";
      label = "In Progress";
      break;
    case "COMPLETED":
      badgeClass = "badge-neutral";
      label = "Completed";
      break;
    default:
      if (isLate && isEarlyDeparture) {
        badgeClass = "badge-danger";
        label = "Late + Early Departure";
      } else if (isLate) {
        badgeClass = "badge-warning";
        label = lateMinutes > 0 ? `Late (${lateMinutes}m)` : "Late";
      } else if (isEarlyDeparture) {
        badgeClass = "badge-warning";
        label = earlyDepartureMinutes > 0 ? `Early (${earlyDepartureMinutes}m)` : "Early Departure";
      } else {
        badgeClass = "badge-neutral";
        label = status || "Completed";
      }
      break;
  }

  return (
    <span
      className={`badge ${badgeClass} ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "currentColor",
          opacity: 0.8,
        }}
      />
      {label}
    </span>
  );
}
