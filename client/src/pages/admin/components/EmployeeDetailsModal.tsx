import type { Employee } from "../../../types/employee";
import { Mail, Clock, Shield } from "lucide-react";
import Modal from "../../../components/common/Modal";

interface EmployeeDetailsModalProps {
  employee: Employee;
  onClose: () => void;
}

export default function EmployeeDetailsModal({ employee, onClose }: EmployeeDetailsModalProps) {
  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const footer = (
    <button onClick={onClose} className="btn btn-secondary">
      Close
    </button>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${employee.first_name} ${employee.last_name}`}
      description="Account details and access information"
      footer={footer}
      maxWidth="500px"
    >
      {/* Avatar + Status */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-bg)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.375rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            border: "2px solid var(--color-primary-border)",
          }}
          aria-hidden="true"
        >
          {getInitials(employee.first_name, employee.last_name)}
        </div>
        <span
          className={`badge badge-${
            employee.status === "ACTIVE"
              ? "success"
              : employee.status === "SUSPENDED"
              ? "danger"
              : "gray"
          }`}
        >
          {employee.status}
        </span>
      </div>

      {/* Detail Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.875rem",
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Mail size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, marginBottom: "0.125rem" }}>
              Email Address
            </div>
            <div style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>{employee.email}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.875rem",
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Shield size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, marginBottom: "0.125rem" }}>
              Global Roles
            </div>
            <div style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
              {employee.Roles?.map((role) => role.name).join(", ") || "None"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.875rem",
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Clock size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, marginBottom: "0.125rem" }}>
              Joined Date
            </div>
            <div style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
              {(() => {
                const raw = employee.created_at || (employee as any).createdAt;
                if (!raw) return "Recently joined";
                const d = new Date(raw);
                return isNaN(d.getTime())
                  ? "Recently joined"
                  : d.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
              })()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
