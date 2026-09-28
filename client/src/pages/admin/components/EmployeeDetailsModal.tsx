import type { Employee } from "../../../types/employee";
import { X, Mail, Clock, Shield } from "lucide-react";

interface EmployeeDetailsModalProps {
  employee: Employee;
  onClose: () => void;
}

export default function EmployeeDetailsModal({ employee, onClose }: EmployeeDetailsModalProps) {
  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "500px" }}>
        <div className="modal-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <button onClick={onClose} className="btn-icon" style={{ marginLeft: "auto" }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ paddingTop: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
            <div 
              style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "50%", 
                backgroundColor: "var(--primary-bg)", 
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "1rem"
              }}
            >
              {getInitials(employee.first_name, employee.last_name)}
            </div>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem" }}>{employee.first_name} {employee.last_name}</h2>
            <span className={`badge badge-${employee.status === "ACTIVE" ? "success" : employee.status === "SUSPENDED" ? "danger" : "gray"}`}>
              {employee.status}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)" }}>
              <Mail size={18} style={{ color: "var(--text-muted)" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Email Address</div>
                <div style={{ color: "var(--text-main)" }}>{employee.email}</div>
              </div>
            </div>


            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)" }}>
              <Shield size={18} style={{ color: "var(--text-muted)" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Global Roles</div>
                <div style={{ color: "var(--text-main)" }}>{employee.Roles?.map((role) => role.name).join(", ") || "None"}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)" }}>
              <Clock size={18} style={{ color: "var(--text-muted)" }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Joined Date</div>
                <div style={{ color: "var(--text-main)" }}>
                  {new Date(employee.created_at).toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
