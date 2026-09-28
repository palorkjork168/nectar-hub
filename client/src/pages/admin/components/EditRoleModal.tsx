import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import type { Employee } from "../../../types/employee";
import { X, Loader2 } from "lucide-react";

interface EditRoleModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRoleModal({ employee, onClose, onSuccess }: EditRoleModalProps) {
  const queryClient = useQueryClient();
  const globalRoles = ["EMPLOYEE", "EMPLOYER", "JOB_SEEKER", "ADMIN"];
  const currentRoles = employee.Roles?.map((currentRole) => currentRole.name) || [];
  const assignableRoles = globalRoles.filter((globalRole) => !currentRoles.includes(globalRole));
  const [role, setRole] = useState(assignableRoles[0] || "");

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const response = await api.put(`/employees/${employee.id}/role`, { role: newRole });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      alert("Global role assigned successfully!");
      onSuccess();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to update role");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) updateRoleMutation.mutate(role);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Add Global Role</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Adds access without removing existing roles for {employee.first_name} {employee.last_name}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Current Roles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {currentRoles.length > 0 ? currentRoles.map((currentRole) => (
                  <span key={currentRole} className="badge badge-gray">{currentRole}</span>
                )) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No global roles assigned</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Add Global Role <span className="required">*</span>
              </label>
              <select
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={assignableRoles.length === 0}
              >
                {assignableRoles.length === 0 ? (
                  <option value="">All global roles are already assigned</option>
                ) : assignableRoles.map((assignableRole) => (
                  <option key={assignableRole} value={assignableRole}>
                    {assignableRole.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateRoleMutation.isPending || !role}
              className="btn btn-primary"
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spinner" /> Adding...
                </>
              ) : (
                "Add Role"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
