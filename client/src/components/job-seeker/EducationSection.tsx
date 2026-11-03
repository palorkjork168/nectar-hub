import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { EducationItem } from "../../types/profile";
import { Plus, Edit2, Trash2, GraduationCap, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../common/Modal";

interface EducationSectionProps {
  educations: EducationItem[];
}

const RECOMMENDED_DEGREES = [
  "Bachelor's Degree",
  "Master's Degree",
  "Associate Degree",
  "High School Diploma",
  "Professional Certificate",
  "Bootcamp Graduate",
];

const RECOMMENDED_FIELDS = [
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Business Administration",
  "Data Science",
  "Design & Media",
];

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
      toast.success("Education record added!");
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to add education");
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
      toast.success("Education record updated!");
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update education");
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
      toast.success("Education record removed");
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete education");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim()) {
      setFormError("Institution / University name is required");
      return;
    }

    const payload = {
      institution: institution.trim(),
      degree: degree.trim() || null,
      field_of_study: fieldOfStudy.trim() || null,
      start_date: startDate || null,
      end_date: isCurrent ? null : endDate || null,
      is_current: isCurrent,
      description: description.trim() || null,
    };

    if (editingItem) {
      editMutation.mutate({ id: editingItem.id, payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const formatDateDisplay = (start?: string | null, end?: string | null, current?: boolean) => {
    if (!start && !end && !current) return null;
    const formatY = (d: string) => {
      try {
        return new Date(d).getFullYear();
      } catch {
        return d;
      }
    };
    const s = start ? formatY(start) : "";
    const e = current ? "Present" : end ? formatY(end) : "";
    return `${s} — ${e}`;
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Education & Qualifications</h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Degrees, academic background, coursework, and credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}
        >
          <Plus size={16} />
          <span>Add Education</span>
        </button>
      </div>

      {/* Empty State */}
      {educations.length === 0 ? (
        <div
          style={{
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            border: "1px dashed var(--color-border)",
            borderRadius: "14px",
            background: "var(--color-surface)",
          }}
        >
          <GraduationCap size={36} style={{ color: "var(--color-text-secondary)", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem" }}>No education listed yet</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", maxWidth: "380px", margin: "0 auto 1.25rem" }}>
            Add your degrees or relevant educational background to showcase your credentials.
          </p>
          <button type="button" onClick={openAddModal} className="btn btn-outline btn-sm">
            <Plus size={14} style={{ marginRight: "0.35rem" }} />
            Add Education
          </button>
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
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)" }}>
                    {edu.institution}
                  </h4>
                  {edu.degree && (
                    <span style={{ fontSize: "0.875rem", color: "var(--color-primary-text)", fontWeight: 500 }}>
                      • {edu.degree}
                    </span>
                  )}
                </div>

                {edu.field_of_study && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                    Field: {edu.field_of_study}
                  </div>
                )}

                {formatDateDisplay(edu.start_date, edu.end_date, edu.is_current) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.375rem" }}>
                    <Calendar size={12} />
                    <span>{formatDateDisplay(edu.start_date, edu.end_date, edu.is_current)}</span>
                    {edu.is_current && (
                      <span className="badge badge-success" style={{ fontSize: "0.6875rem", padding: "0.1rem 0.4rem" }}>
                        Current
                      </span>
                    )}
                  </div>
                )}

                {edu.description && (
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-line" }}>
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
                  style={{ color: "var(--color-danger, #ef4444)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Education Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={resetForm}
        title={editingItem ? "Edit Education Record" : "Add Education Record"}
        description="Share your school, university, degree, or credentials."
        maxWidth="540px"
        footer={
          <>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !institution.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Add Education"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "var(--color-danger-bg, #fee2e2)",
                color: "var(--color-danger-text, #b91c1c)",
                borderRadius: "8px",
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
              Institution / University <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
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

          {/* Degree with Recommendation Chips */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Degree</label>
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. Bachelor's Degree"
              className="input-field"
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
              {RECOMMENDED_DEGREES.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setDegree(deg)}
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.68rem",
                    borderRadius: "4px",
                    background: degree === deg ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                    color: degree === deg ? "#fff" : "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          {/* Field of Study with Recommendation Chips */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Field of Study / Major</label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science, Information Technology"
              className="input-field"
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
              {RECOMMENDED_FIELDS.map((fld) => (
                <button
                  key={fld}
                  type="button"
                  onClick={() => setFieldOfStudy(fld)}
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.68rem",
                    borderRadius: "4px",
                    background: fieldOfStudy === fld ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                    color: fieldOfStudy === fld ? "#fff" : "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  {fld}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid two-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
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
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Education Record"
        description="Are you sure you want to remove this education record?"
        maxWidth="400px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              className="btn btn-danger"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          This record will be permanently removed from your profile.
        </p>
      </Modal>
    </div>
  );
}
