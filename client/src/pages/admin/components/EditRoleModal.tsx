import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import type { Employee } from "../../../types/employee";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import Modal from "../../../components/common/Modal";

interface EditRoleModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRoleModal({ employee, onClose, onSuccess }: EditRoleModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const globalRoles = ["EMPLOYEE", "EMPLOYER", "JOB_SEEKER", "ADMIN"];
  const currentRoles = employee.Roles?.map((r) => r.name) || [];
  const assignableRoles = globalRoles.filter((r) => !currentRoles.includes(r));
  const [role, setRole] = useState(assignableRoles[0] || "");

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const response = await api.put(`/employees/${employee.id}/role`, { role: newRole });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Global role assigned successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) updateRoleMutation.mutate(role);
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary" disabled={updateRoleMutation.isPending}>
        Cancel
      </button>
      <button
        type="submit"
        form="edit-role-form"
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
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add Global Role"
      description={`Adds access without removing existing roles for ${employee.first_name} ${employee.last_name}`}
      footer={footer}
      maxWidth="420px"
    >
      <form id="edit-role-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Current Roles</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", minHeight: "28px" }}>
            {currentRoles.length > 0 ? (
              currentRoles.map((r) => (
                <span key={r} className="badge badge-gray">{r.replace("_", " ")}</span>
              ))
            ) : (
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                No global roles assigned
              </span>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="role-select">
            Add Global Role <span className="required" aria-hidden="true">*</span>
          </label>
          <select
            id="role-select"
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={assignableRoles.length === 0}
          >
            {assignableRoles.length === 0 ? (
              <option value="">All global roles are already assigned</option>
            ) : (
              assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))
            )}
          </select>
        </div>
      </form>
    </Modal>
  );
}
