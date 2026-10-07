import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { JobSkill, GetJobSkillsResponse } from "../../types/job";
import { Plus, Trash2, Tag, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface JobSkillsManagerProps {
  jobId: string;
  readonly?: boolean;
}

export default function JobSkillsManager({ jobId, readonly = false }: JobSkillsManagerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [skillName, setSkillName] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState("");

  const { data: skills, isLoading, error: queryError } = useQuery<JobSkill[]>({
    queryKey: ["jobSkills", jobId],
    queryFn: async () => {
      const res = await api.get<GetJobSkillsResponse>(`/jobs/${jobId}/skills`);
      return res.data.data.skills;
    },
    enabled: Boolean(jobId),
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { skill_name: string; is_required: boolean }) => {
      const res = await api.post(`/jobs/${jobId}/skills`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobSkills", jobId] });
      setSkillName("");
      setIsRequired(true);
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to add job skill");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const res = await api.delete(`/jobs/${jobId}/skills/${skillId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobSkills", jobId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete skill");
    },
  });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError("Skill name is required");
      return;
    }
    setError("");
    addMutation.mutate({
      skill_name: skillName.trim(),
      is_required: isRequired,
    });
  };

  return (
    <div className="card" style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-main)" }}>
            Job Skills & Competencies
          </h3>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Specify technical and functional skills. These powers candidate matching algorithms.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 0.875rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.8125rem",
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Skill Form */}
      {!readonly && (
        <form
          onSubmit={handleAddSkill}
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
            padding: "1rem",
            backgroundColor: "var(--bg-color)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. React, PostgreSQL, Figma, AWS..."
              className="input-field"
              style={{ width: "100%" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.84375rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
            />
            <span style={{ fontWeight: 500 }}>Required Skill</span>
          </label>

          <button
            type="submit"
            disabled={addMutation.isPending || !skillName.trim()}
            className="btn btn-primary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem" }}
          >
            {addMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            <span>Add Skill</span>
          </button>
        </form>
      )}

      {/* Skills List */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "1.5rem" }}>
          <Loader2 className="animate-spin" size={18} style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {queryError && (
        <p style={{ color: "var(--danger)", fontSize: "0.875rem" }}>Failed to load skills.</p>
      )}

      {!isLoading && (!skills || skills.length === 0) && (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.84375rem" }}>
          <Tag size={24} style={{ color: "var(--text-light)", marginBottom: "0.25rem" }} />
          <div>No skills attached to this job yet. Add skills to help job seekers find this position!</div>
        </div>
      )}

      {!isLoading && skills && skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {skills.map((skill) => (
            <div
              key={skill.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.65rem",
                backgroundColor: skill.is_required ? "rgba(37, 99, 235, 0.08)" : "var(--bg-color)",
                border: `1px solid ${skill.is_required ? "rgba(37, 99, 235, 0.25)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
              }}
            >
              <span style={{ fontWeight: 600, color: skill.is_required ? "var(--primary)" : "var(--text-main)" }}>
                {skill.skill_name}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "9999px",
                  backgroundColor: skill.is_required ? "var(--primary)" : "var(--text-light)",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              >
                {skill.is_required ? "Required" : "Preferred"}
              </span>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(skill.id)}
                  disabled={deleteMutation.isPending}
                  title="Remove skill"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.15rem",
                    color: "var(--danger)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
