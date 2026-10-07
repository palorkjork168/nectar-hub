import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import type { Employee } from "../../../types/employee";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import Modal from "../../../components/common/Modal";

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEmployeeModal({ employee, onClose, onSuccess }: EditEmployeeModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success("Employee profile updated successfully.");
      onSuccess();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Failed to update employee";
      setError(msg);
      toast.error(msg);
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

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary" disabled={updateMutation.isPending}>
        Cancel
      </button>
      <button
        type="submit"
        form="edit-employee-form"
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
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Account"
      description={`Update profile details for ${employee.first_name} ${employee.last_name}`}
      footer={footer}
      maxWidth="500px"
    >
      <form id="edit-employee-form" onSubmit={handleSubmit}>
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
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="form-grid two-cols">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-first-name">
              First Name <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-first-name"
              type="text"
              className="input-field"
              placeholder="e.g. Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-last-name">
              Last Name <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-last-name"
              type="text"
              className="input-field"
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-phone">Phone Number</label>
          <input
            id="edit-phone"
            type="tel"
            className="input-field"
            placeholder="e.g. +855 12 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
      </form>
    </Modal>
  );
}
