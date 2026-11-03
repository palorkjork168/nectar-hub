import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { ExperienceItem } from "../../types/profile";
import { Plus, Edit2, Trash2, Briefcase, MapPin, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../common/Modal";

interface ExperienceSectionProps {
  experiences: ExperienceItem[];
}

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FREELANCE", label: "Freelance" },
] as const;

const RECOMMENDED_POSITIONS = [
  "Senior Full Stack Engineer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Software Engineer",
  "Mobile Developer",
];

export default function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ExperienceItem | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("FULL_TIME");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setCompanyName("");
    setPosition("");
    setEmploymentType("FULL_TIME");
    setLocation("");
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

  const openEditModal = (item: ExperienceItem) => {
    setEditingItem(item);
    setCompanyName(item.company_name);
    setPosition(item.position);
    setEmploymentType(item.employment_type || "FULL_TIME");
    setLocation(item.location || "");
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
      const res = await api.post("/profile/experiences", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Work experience added!");
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to add experience");
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/profile/experiences/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Work experience updated!");
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update experience");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/profile/experiences/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Work experience removed");
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete experience");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setFormError("Company name is required");
      return;
    }
    if (!position.trim()) {
      setFormError("Position / Job title is required");
      return;
    }

    const payload = {
      company_name: companyName.trim(),
      position: position.trim(),
      employment_type: employmentType || null,
      location: location.trim() || null,
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
        const date = new Date(d);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Work Experience</h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Roles, companies, dates, and achievements from your career history.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}
        >
          <Plus size={16} />
          <span>Add Experience</span>
        </button>
      </div>

      {/* Empty State */}
      {experiences.length === 0 ? (
        <div
          style={{
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            border: "1px dashed var(--color-border)",
            borderRadius: "14px",
            background: "var(--color-surface)",
          }}
        >
          <Briefcase size={36} style={{ color: "var(--color-text-secondary)", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem" }}>No experience records yet</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", maxWidth: "380px", margin: "0 auto 1.25rem" }}>
            Add your past or current roles to highlight your hands-on achievements and project responsibilities.
          </p>
          <button type="button" onClick={openAddModal} className="btn btn-outline btn-sm">
            <Plus size={14} style={{ marginRight: "0.35rem" }} />
            Add First Role
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {experiences.map((exp) => (
            <div
              key={exp.id}
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
                    {exp.position}
                  </h4>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-primary-text)", fontWeight: 500 }}>
                    at {exp.company_name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
                  {exp.employment_type && (
                    <span className="badge badge-gray" style={{ fontSize: "0.6875rem" }}>
                      {EMPLOYMENT_TYPES.find((t) => t.value === exp.employment_type)?.label || exp.employment_type}
                    </span>
                  )}

                  {exp.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      <MapPin size={12} />
                      <span>{exp.location}</span>
                    </div>
                  )}

                  {formatDateDisplay(exp.start_date, exp.end_date, exp.is_current) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      <Calendar size={12} />
                      <span>{formatDateDisplay(exp.start_date, exp.end_date, exp.is_current)}</span>
                      {exp.is_current && (
                        <span className="badge badge-success" style={{ fontSize: "0.6875rem", padding: "0.1rem 0.4rem" }}>
                          Current
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {exp.description && (
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-line" }}>
                    {exp.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "1rem" }}>
                <button
                  type="button"
                  onClick={() => openEditModal(exp)}
                  className="btn-icon"
                  title="Edit experience"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(exp.id)}
                  className="btn-icon"
                  title="Delete experience"
                  style={{ color: "var(--color-danger, #ef4444)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Experience Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={resetForm}
        title={editingItem ? "Edit Work Experience" : "Add Work Experience"}
        description="Share your role, company, dates, and key contributions."
        maxWidth="560px"
        footer={
          <>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !companyName.trim() || !position.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Add Experience"}
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

          {/* Position with Recommendation Chips */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">
              Position / Job Title <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="input-field"
              style={{ width: "100%" }}
              autoFocus
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
              {RECOMMENDED_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.68rem",
                    borderRadius: "4px",
                    background: position === pos ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                    color: position === pos ? "#fff" : "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid two-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group">
              <label className="form-label">
                Company Name <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Location (Optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Phnom Penh, Cambodia (or Remote)"
              className="input-field"
              style={{ width: "100%" }}
            />
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
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => {
                  setIsCurrent(e.target.checked);
                  if (e.target.checked) setEndDate("");
                }}
              />
              <span>I currently work here</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Key Responsibilities / Achievements</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your role, achievements, tools used..."
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
        title="Delete Experience Record"
        description="Are you sure you want to remove this experience record?"
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
          This record will be permanently removed from your profile history.
        </p>
      </Modal>
    </div>
  );
}
