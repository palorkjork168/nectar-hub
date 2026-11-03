import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { UserSkillItem, SkillLevel } from "../../types/profile";
import { Plus, Edit2, Trash2, Award, AlertCircle, Sparkles, Check, ChevronDown } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../common/Modal";

interface SkillsSectionProps {
  skills: UserSkillItem[];
}

const SKILL_LEVELS: { value: SkillLevel; label: string; color: string; desc: string }[] = [
  { value: "BEGINNER", label: "Beginner", color: "#6b7280", desc: "Basic knowledge / learning" },
  { value: "INTERMEDIATE", label: "Intermediate", color: "#2563eb", desc: "1-2 years experience" },
  { value: "ADVANCED", label: "Advanced", color: "#7c3aed", desc: "3-5 years solid delivery" },
  { value: "EXPERT", label: "Expert", color: "var(--color-primary-text)", desc: "5+ years mastery / architecture" },
];

export const POPULAR_RECOMMENDED_SKILLS = [
  // High demand web & cloud
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Next.js",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Tailwind CSS",
  "GraphQL",
  "MongoDB",
  "Git & GitHub",
  "Express.js",
  "Java",
  "Go (Golang)",
  "Kubernetes",
  "UI/UX Design",
  "Figma",
  "REST APIs",
  "CI/CD",
  "Redis",
  "Linux",
  "Vue.js",
  "FastAPI",
  "Flutter",
  "Spring Boot",
];

export default function SkillsSection({ skills = [] }: SkillsSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<UserSkillItem | null>(null);

  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [formError, setFormError] = useState("");

  // Combobox dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter recommendations based on current input and exclude already-added skills
  const existingSkillNames = useMemo(
    () => new Set(skills.map((s) => s.skill_name.toLowerCase())),
    [skills]
  );

  const filteredSuggestions = useMemo(() => {
    const q = skillName.trim().toLowerCase();
    return POPULAR_RECOMMENDED_SKILLS.filter((s) => {
      const match = s.toLowerCase().includes(q);
      const isAlreadyAdded = existingSkillNames.has(s.toLowerCase());
      // In edit mode, allow the skill being edited
      if (editingSkill && editingSkill.skill_name.toLowerCase() === s.toLowerCase()) {
        return true;
      }
      return match && !isAlreadyAdded;
    });
  }, [skillName, existingSkillNames, editingSkill]);

  // Unadded popular recommendations for one-click pill buttons
  const availablePopularChips = useMemo(() => {
    return POPULAR_RECOMMENDED_SKILLS.filter(
      (s) => !existingSkillNames.has(s.toLowerCase())
    ).slice(0, 10);
  }, [existingSkillNames]);

  const resetForm = () => {
    setSkillName("");
    setSkillLevel("INTERMEDIATE");
    setEditingSkill(null);
    setFormError("");
    setDropdownOpen(false);
    setModalOpen(false);
  };

  const openAddModal = (presetSkill?: string) => {
    resetForm();
    if (presetSkill) {
      setSkillName(presetSkill);
    }
    setModalOpen(true);
  };

  const openEditModal = (skill: UserSkillItem) => {
    setEditingSkill(skill);
    setSkillName(skill.skill_name);
    setSkillLevel(skill.level || "INTERMEDIATE");
    setFormError("");
    setDropdownOpen(false);
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
      toast.success("Skill added successfully!");
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to add skill");
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { skill_name: string; level: SkillLevel };
    }) => {
      const res = await api.put(`/profile/skills/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Skill updated successfully!");
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
      toast.success("Skill removed");
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete skill");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = skillName.trim();
    if (!cleanName) {
      setFormError("Skill name is required");
      return;
    }

    if (editingSkill) {
      editMutation.mutate({
        id: editingSkill.id,
        payload: { skill_name: cleanName, level: skillLevel },
      });
    } else {
      addMutation.mutate({
        skill_name: cleanName,
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
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          backgroundColor: `${config.color}15`,
          color: config.color,
          border: `1px solid ${config.color}30`,
          letterSpacing: "0.02em",
        }}
      >
        {config.label}
      </span>
    );
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Skills & Competencies
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Showcase your technical proficiencies, tools, and expertise.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}
        >
          <Plus size={16} />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Quick Add Suggestions if user has few skills */}
      {availablePopularChips.length > 0 && skills.length < 12 && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            backgroundColor: "var(--color-surface-muted, rgba(0,0,0,0.02))",
            borderRadius: "12px",
            border: "1px dashed var(--color-border)",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--color-primary-text)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.6rem",
            }}
          >
            <Sparkles size={14} />
            <span>Recommended for your profile:</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {availablePopularChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => openAddModal(chip)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  borderRadius: "9999px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-primary)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Plus size={12} />
                <span>{chip}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {skills.length === 0 ? (
        <div
          style={{
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            border: "1px dashed var(--color-border)",
            borderRadius: "14px",
            background: "var(--color-surface)",
          }}
        >
          <Award size={36} style={{ color: "var(--color-text-secondary)", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem" }}>No skills listed yet</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", maxWidth: "380px", margin: "0 auto 1.25rem" }}>
            Add your programming languages, frameworks, or domain skills to increase recruiter visibility.
          </p>
          <button type="button" onClick={() => openAddModal()} className="btn btn-outline btn-sm">
            <Plus size={14} style={{ marginRight: "0.35rem" }} />
            Add First Skill
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {skills.map((skill) => (
            <div
              key={skill.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {skill.skill_name}
                </div>
                <div>{getLevelBadge(skill.level)}</div>
              </div>

              <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => openEditModal(skill)}
                  className="btn-icon"
                  title="Edit skill"
                  style={{ padding: "0.35rem", borderRadius: "6px" }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(skill.id)}
                  className="btn-icon"
                  title="Delete skill"
                  style={{ padding: "0.35rem", borderRadius: "6px", color: "var(--color-danger, #ef4444)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={resetForm}
        title={editingSkill ? "Edit Skill & Proficiency" : "Add Skill with Recommendations"}
        description="Select or type your skill, with instant auto-suggestions and proficiency level."
        maxWidth="500px"
        footer={
          <>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !skillName.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? "Saving..." : editingSkill ? "Save Changes" : "Add to Profile"}
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
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Combobox with Autocomplete Input */}
          <div ref={comboboxRef} className="form-group" style={{ marginBottom: "1.25rem", position: "relative" }}>
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Skill Name <span className="required" style={{ color: "var(--color-danger)" }}>*</span></span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Combo-box with live search</span>
            </label>

            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value);
                  setDropdownOpen(true);
                  if (formError) setFormError("");
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search or type a skill (e.g. React, PostgreSQL, AWS)..."
                className="input-field"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
                tabIndex={-1}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {dropdownOpen && filteredSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  maxHeight: "220px",
                  overflowY: "auto",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  zIndex: 100,
                  padding: "0.35rem 0",
                }}
              >
                <div
                  style={{
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderBottom: "1px solid var(--color-border-faint, rgba(0,0,0,0.06))",
                  }}
                >
                  Recommended Matches ({filteredSuggestions.length})
                </div>
                {filteredSuggestions.map((suggestion) => {
                  const isSelected = skillName.trim().toLowerCase() === suggestion.toLowerCase();
                  return (
                    <div
                      key={suggestion}
                      onClick={() => {
                        setSkillName(suggestion);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: "0.6rem 0.875rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        backgroundColor: isSelected ? "var(--color-surface-muted, #f8fafc)" : "transparent",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                        fontWeight: isSelected ? 600 : 400,
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface-muted, #f1f5f9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? "var(--color-surface-muted, #f8fafc)" : "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Sparkles size={14} style={{ color: "var(--color-primary-text)", opacity: 0.7 }} />
                        <span>{suggestion}</span>
                      </div>
                      {isSelected && <Check size={14} style={{ color: "var(--color-primary-text)" }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick-add chips inside modal */}
            <div style={{ marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                Popular quick tags:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {POPULAR_RECOMMENDED_SKILLS.slice(0, 8).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSkillName(chip);
                      setDropdownOpen(false);
                    }}
                    style={{
                      padding: "0.25rem 0.55rem",
                      fontSize: "0.72rem",
                      borderRadius: "6px",
                      background: skillName === chip ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                      color: skillName === chip ? "#fff" : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Proficiency Level Grid */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
              Proficiency Level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
              {SKILL_LEVELS.map((lvl) => {
                const isSelected = skillLevel === lvl.value;
                return (
                  <div
                    key={lvl.value}
                    onClick={() => setSkillLevel(lvl.value)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: `1.5px solid ${isSelected ? lvl.color : "var(--color-border)"}`,
                      backgroundColor: isSelected ? `${lvl.color}10` : "var(--color-surface)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? lvl.color : "var(--color-text)" }}>
                        {lvl.label}
                      </span>
                      {isSelected && <Check size={14} style={{ color: lvl.color }} />}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                      {lvl.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Remove Skill"
        description="Are you sure you want to remove this skill from your profile?"
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
              {deleteMutation.isPending ? "Removing..." : "Remove Skill"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
          This will update your profile skills and recommendation rankings. You can add it back anytime.
        </p>
      </Modal>
    </div>
  );
}
