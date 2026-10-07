import { createPortal } from "react-dom";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import api from "../../../services/api";
import { X, Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const createEmployeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string(),
  department: z.string(),
});

function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    return error.map((item) => getErrorMessage(item)).filter(Boolean).join(", ");
  }
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

export default function CreateEmployeeModal({ onClose, onSuccess }: CreateEmployeeModalProps) {
  const toast = useToast();
  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      department: "",
    },
    validators: {
      onChange: createEmployeeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await api.post("/employees", value);
        toast.success("Employee account created successfully.");
        onSuccess();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to create employee");
      }
    },
  });

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Add New Employee</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>Create a new employee account and set their initial access.</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
          <div className="modal-body">
            <div className="form-grid two-cols">
              
              <form.Field name="first_name">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">First Name <span className="required">*</span></label>
                    <input 
                      className="input-field"
                      placeholder="e.g. Jane"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                    {field.state.meta.errors?.length ? <span className="form-error">{getErrorMessage(field.state.meta.errors)}</span> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="last_name">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">Last Name <span className="required">*</span></label>
                    <input 
                      className="input-field"
                      placeholder="e.g. Doe"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                    {field.state.meta.errors?.length ? <span className="form-error">{getErrorMessage(field.state.meta.errors)}</span> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input 
                      type="email"
                      className="input-field"
                      placeholder="jane.doe@example.com"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                    {field.state.meta.errors?.length ? <span className="form-error">{getErrorMessage(field.state.meta.errors)}</span> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">Temporary Password <span className="required">*</span></label>
                    <input 
                      type="password"
                      className="input-field"
                      placeholder="At least 6 characters"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                    {field.state.meta.errors?.length ? <span className="form-error">{getErrorMessage(field.state.meta.errors)}</span> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="department">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      className="input-field"
                      placeholder="e.g. Engineering"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="phone">
                {(field) => (
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      className="input-field"
                      placeholder="e.g. +1 555 0123"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button type="submit" disabled={!canSubmit || isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={16} className="spinner" /> Creating...</> : "Create Employee"}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
