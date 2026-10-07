import { useState } from "react";
import type { Employee } from "../../../types/employee";
import api from "../../../services/api";
import { MoreVertical, Edit, Ban, CheckCircle, Eye, Shield } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import Modal from "../../../components/common/Modal";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onEditRole?: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  refetch: () => void;
}

export default function EmployeeTable({ employees, onEdit, onEditRole, onView, refetch }: EmployeeTableProps) {
  const toast = useToast();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmEmployee, setConfirmEmployee] = useState<Employee | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setIsUpdatingStatus(true);
    try {
      await api.put(`/employees/${employee.id}/status`, { status: newStatus });
      toast.success(
        `${employee.first_name} ${employee.last_name} has been ${newStatus === "INACTIVE" ? "deactivated" : "activated"}.`
      );
      refetch();
    } catch (error) {
      toast.error("Failed to update account status. Please try again.");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
      setConfirmEmployee(null);
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="badge badge-success">Active</span>;
      case "SUSPENDED":
        return <span className="badge badge-danger">Suspended</span>;
      case "INACTIVE":
      default:
        return <span className="badge badge-gray">Inactive</span>;
    }
  };

  const pendingAction = confirmEmployee?.status === "ACTIVE" ? "Deactivate" : "Activate";
  const pendingActionLower = pendingAction.toLowerCase();

  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Joined Date</th>
              <th>Status</th>
              <th style={{ width: "60px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar" aria-hidden="true">
                      {emp.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt=""
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        getInitials(emp.first_name, emp.last_name)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {emp.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {(() => {
                      const raw = emp.created_at || (emp as any).createdAt;
                      if (!raw) return "—";
                      const d = new Date(raw);
                      return isNaN(d.getTime())
                        ? "—"
                        : d.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });
                    })()}
                  </span>
                </td>
                <td>{getStatusBadge(emp.status)}</td>
                <td style={{ textAlign: "center", position: "relative" }}>
                  <div className="dropdown-container">
                    <button
                      className="btn-icon"
                      aria-label={`Actions for ${emp.first_name} ${emp.last_name}`}
                      aria-haspopup="true"
                      aria-expanded={openDropdownId === emp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === emp.id ? null : emp.id);
                      }}
                      onBlur={() => {
                        // Small delay to allow click on menu items before closing
                        setTimeout(() => setOpenDropdownId(null), 150);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openDropdownId === emp.id && (
                      <div className="dropdown-menu" role="menu">
                        <button
                          className="dropdown-item"
                          role="menuitem"
                          onClick={() => { setOpenDropdownId(null); onView(emp); }}
                        >
                          <Eye size={16} /> View Details
                        </button>
                        <button
                          className="dropdown-item"
                          role="menuitem"
                          onClick={() => { setOpenDropdownId(null); onEdit(emp); }}
                        >
                          <Edit size={16} /> Edit Account
                        </button>
                        {onEditRole && (
                          <button
                            className="dropdown-item"
                            role="menuitem"
                            onClick={() => { setOpenDropdownId(null); onEditRole(emp); }}
                          >
                            <Shield size={16} /> Add Global Role
                          </button>
                        )}
                        <button
                          className={`dropdown-item ${emp.status === "ACTIVE" ? "danger" : ""}`}
                          role="menuitem"
                          onClick={() => { setOpenDropdownId(null); setConfirmEmployee(emp); }}
                        >
                          {emp.status === "ACTIVE" ? (
                            <><Ban size={16} /> Deactivate Account</>
                          ) : (
                            <><CheckCircle size={16} color="var(--color-success)" /> Activate Account</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status change confirmation modal */}
      {confirmEmployee && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmEmployee(null)}
          title={`${pendingAction} Account`}
          dangerous={confirmEmployee.status === "ACTIVE"}
          maxWidth="420px"
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmEmployee(null)}
                className="btn btn-secondary"
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(confirmEmployee)}
                className={`btn ${confirmEmployee.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? "Updating..." : `Yes, ${pendingActionLower}`}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Are you sure you want to{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {pendingActionLower} {confirmEmployee.first_name} {confirmEmployee.last_name}
            </strong>
            ?
            {confirmEmployee.status === "ACTIVE" && (
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                This will prevent the user from logging in until reactivated.
              </span>
            )}
          </p>
        </Modal>
      )}
    </>
  );
}
