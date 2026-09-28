import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import type { Employee } from "../../../types/employee";
import { X, Loader2 } from "lucide-react";

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEmployeeModal({ employee, onClose, onSuccess }: EditEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(employee.first_name || "");
  const [lastName, setLastName] = useState(employee.last_name || "");
  const [phone, setPhone] = useState(employee.phone || "");
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      first_name: string;
      last_name: string;
      phone: string;
    }) => {
      const response = await api.put(`/employees/${employee.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      alert("Employee updated successfully!");
      onSuccess();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Failed to update employee";
      setError(msg);
      alert(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (firstName.trim().length < 2) {
      setError("First name must be at least 2 characters");
      return;
    }

    if (lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters");
      return;
    }

    updateMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Edit Account</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Update profile details for {employee.first_name} {employee.last_name}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  backgroundColor: "var(--danger-bg)",
                  color: "var(--danger)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            <div className="form-grid two-cols">
              <div className="form-group">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="e.g. +855 12 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spinner" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
