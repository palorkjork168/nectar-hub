import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { EducationItem } from "../../types/profile";
import { Plus, Edit2, Trash2, X, GraduationCap, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface EducationSectionProps {
  educations: EducationItem[];
}

export default function EducationSection({ educations }: EducationSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<EducationItem | null>(null);

  // Form states
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
    setDescription("");
    setEditingItem(null);
    setFormError("");
    setModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (item: EducationItem) => {
    setEditingItem(item);
    setInstitution(item.institution);
    setDegree(item.degree || "");
    setFieldOfStudy(item.field_of_study || "");
    setStartDate(item.start_date ? item.start_date.substring(0, 10) : "");
    setEndDate(item.end_date ? item.end_date.substring(0, 10) : "");
    setIsCurrent(item.is_current || false);
    setDescription(item.description || "");
    setFormError("");
    setModalOpen(true);
  };

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/profile/educations", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to add education record");
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/profile/educations/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update education record");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/profile/educations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete education record");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim()) {
      setFormError("Institution name is required");
      return;
    }

    const payload: any = {
      institution: institution.trim(),
      degree: degree.trim() || undefined,
      field_of_study: fieldOfStudy.trim() || undefined,
      start_date: startDate || undefined,
      end_date: isCurrent ? undefined : endDate || undefined,
      is_current: isCurrent,
      description: description.trim() || undefined,
    };

    if (editingItem) {
      editMutation.mutate({ id: editingItem.id, payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const formatDateDisplay = (start?: string | null, end?: string | null, current?: boolean) => {
    if (!start && !end && !current) return null;
    const format = (dStr: string) => {
      try {
        const d = new Date(dStr);
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
      } catch {
        return dStr;
      }
    };

    const s = start ? format(start) : "";
    const e = current ? "Present" : end ? format(end) : "";
    if (s && e) return `${s} - ${e}`;
    if (s) return `${s} - Present`;
    return e;
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0, color: "var(--text-main)" }}>
            Education
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            Add your degrees, certifications, and educational credentials
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}>
          <Plus size={15} /> Add Education
        </button>
      </div>

      {educations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)" }}>
          <GraduationCap size={32} style={{ color: "var(--text-light)", marginBottom: "0.5rem" }} />
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
            No education history added yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {educations.map((edu) => (
            <div
              key={edu.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "1rem",
                backgroundColor: "var(--bg-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-main)" }}>
                    {edu.institution}
                  </h4>
                  {edu.degree && (
                    <span style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 500 }}>
                      • {edu.degree}
                    </span>
                  )}
                </div>

                {edu.field_of_study && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Field: {edu.field_of_study}
                  </div>
                )}

                {formatDateDisplay(edu.start_date, edu.end_date, edu.is_current) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.375rem" }}>
                    <Calendar size={12} />
                    <span>{formatDateDisplay(edu.start_date, edu.end_date, edu.is_current)}</span>
                    {edu.is_current && (
                      <span className="badge badge-success" style={{ fontSize: "0.6875rem", padding: "0 0.4rem" }}>
                        Current
                      </span>
                    )}
                  </div>
                )}

                {edu.description && (
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
                    {edu.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "1rem" }}>
                <button
                  type="button"
                  onClick={() => openEditModal(edu)}
                  className="btn-icon"
                  title="Edit education"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(edu.id)}
                  className="btn-icon"
                  title="Delete education"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Education Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                {editingItem ? "Edit Education" : "Add Education"}
              </h3>
              <button onClick={resetForm} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--danger-bg)",
                      color: "var(--danger-text)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8125rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">
                    Institution / University <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Royal University of Phnom Penh"
                    className="input-field"
                    style={{ width: "100%" }}
                    autoFocus
                  />
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Degree</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. Bachelor's Degree"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Field of Study</label>
                    <input
                      type="text"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isCurrent}
                      className="input-field"
                      style={{ width: "100%", opacity: isCurrent ? 0.5 : 1 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isCurrent}
                      onChange={(e) => {
                        setIsCurrent(e.target.checked);
                        if (e.target.checked) setEndDate("");
                      }}
                    />
                    <span>I am currently studying here</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Activities (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your coursework, achievements, or honors..."
                    className="input-field"
                    rows={3}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Add Education"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "380px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--danger)" }}>
                Delete Education
              </h3>
              <button onClick={() => setDeleteConfirmId(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-main)" }}>
                Are you sure you want to remove this education record?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="btn btn-danger"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
