import { useState, useEffect } from "react";
import type { Employee } from "../../../types/employee";
import api from "../../../services/api";
import { MoreVertical, Edit, Ban, CheckCircle, Eye, Shield } from "lucide-react";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onEditRole?: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  refetch: () => void;
}

export default function EmployeeTable({ employees, onEdit, onEditRole, onView, refetch }: EmployeeTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!window.confirm(`Are you sure you want to ${newStatus === "INACTIVE" ? "deactivate" : "activate"} ${employee.first_name}?`)) {
      return;
    }

    try {
      await api.put(`/employees/${employee.id}/status`, { status: newStatus });
      refetch();
    } catch (error) {
      alert("Failed to update status");
      console.error(error);
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

  return (
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
                  <div className="avatar">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      getInitials(emp.first_name, emp.last_name)
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{emp.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span style={{ color: "var(--text-muted)" }}>
                  {new Date(emp.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </span>
              </td>
              <td>{getStatusBadge(emp.status)}</td>
              <td style={{ textAlign: "center", position: "relative" }}>
                <div className="dropdown-container">
                  <button 
                    className="btn-icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === emp.id ? null : emp.id);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {openDropdownId === emp.id && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item" 
                        onClick={() => { setOpenDropdownId(null); onView(emp); }}
                      >
                        <Eye size={16} /> View Details
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => { setOpenDropdownId(null); onEdit(emp); }}
                      >
                        <Edit size={16} /> Edit Account
                      </button>
                      {onEditRole && (
                        <button 
                          className="dropdown-item" 
                          onClick={() => { setOpenDropdownId(null); onEditRole(emp); }}
                        >
                          <Shield size={16} /> Add Global Role
                        </button>
                      )}
                      <button 
                        className={`dropdown-item ${emp.status === "ACTIVE" ? "danger" : ""}`} 
                        onClick={() => { setOpenDropdownId(null); handleToggleStatus(emp); }}
                      >
                        {emp.status === "ACTIVE" ? (
                          <><Ban size={16} /> Deactivate Account</>
                        ) : (
                          <><CheckCircle size={16} color="var(--success)" /> Activate Account</>
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
  );
}
