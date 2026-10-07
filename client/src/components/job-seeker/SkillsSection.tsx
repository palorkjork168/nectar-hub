import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { UserSkillItem, SkillLevel } from "../../types/profile";
import { Plus, Edit2, Trash2, X, Award, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface SkillsSectionProps {
  skills: UserSkillItem[];
}

const SKILL_LEVELS: { value: SkillLevel; label: string; color: string }[] = [
  { value: "BEGINNER", label: "Beginner", color: "#6b7280" },
  { value: "INTERMEDIATE", label: "Intermediate", color: "#2563eb" },
  { value: "ADVANCED", label: "Advanced", color: "#7c3aed" },
  { value: "EXPERT", label: "Expert", color: "#059669" },
];

export default function SkillsSection({ skills }: SkillsSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<UserSkillItem | null>(null);

  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setSkillName("");
    setSkillLevel("INTERMEDIATE");
    setEditingSkill(null);
    setFormError("");
    setModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (skill: UserSkillItem) => {
    setEditingSkill(skill);
    setSkillName(skill.skill_name);
    setSkillLevel(skill.level || "INTERMEDIATE");
    setFormError("");
    setModalOpen(true);
  };

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (payload: { skill_name: string; level: SkillLevel }) => {
      const res = await api.post("/profile/skills", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to add skill");
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { skill_name: string; level: SkillLevel } }) => {
      const res = await api.put(`/profile/skills/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update skill");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/profile/skills/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete skill");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setFormError("Skill name is required");
      return;
    }

    if (editingSkill) {
      editMutation.mutate({
        id: editingSkill.id,
        payload: { skill_name: skillName.trim(), level: skillLevel },
      });
    } else {
      addMutation.mutate({
        skill_name: skillName.trim(),
        level: skillLevel,
      });
    }
  };

  const getLevelBadge = (level?: SkillLevel) => {
    const config = SKILL_LEVELS.find((l) => l.value === level) || SKILL_LEVELS[1];
    return (
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          padding: "0.125rem 0.5rem",
          borderRadius: "9999px",
          backgroundColor: `${config.color}15`,
          color: config.color,
          border: `1px solid ${config.color}30`,
        }}
      >
        {config.label}
      </span>
    );
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0, color: "var(--text-main)" }}>
            Skills & Expertise
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            Add skills to get matched with suitable job opportunities
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}>
          <Plus size={15} /> Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)" }}>
          <Award size={32} style={{ color: "var(--text-light)", marginBottom: "0.5rem" }} />
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
            No skills added yet. Add your key skills to improve job recommendations.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {skills.map((skill) => (
            <div
              key={skill.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.75rem",
                backgroundColor: "var(--bg-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                transition: "border-color 0.2s",
              }}
            >
              <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text-main)" }}>
                {skill.skill_name}
              </span>
              {getLevelBadge(skill.level)}
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => openEditModal(skill)}
                  className="btn-icon"
                  title="Edit skill"
                  style={{ padding: "0.2rem" }}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(skill.id)}
                  className="btn-icon"
                  title="Delete skill"
                  style={{ padding: "0.2rem", color: "var(--danger)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                {editingSkill ? "Edit Skill" : "Add New Skill"}
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
                    Skill Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g. React, PostgreSQL, Docker"
                    className="input-field"
                    style={{ width: "100%" }}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Proficiency Level</label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                    className="input-field"
                    style={{ width: "100%" }}
                  >
                    {SKILL_LEVELS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : editingSkill ? "Save Changes" : "Add Skill"}
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
                Delete Skill
              </h3>
              <button onClick={() => setDeleteConfirmId(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-main)" }}>
                Are you sure you want to remove this skill from your profile?
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
