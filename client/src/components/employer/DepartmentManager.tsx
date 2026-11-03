import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";

interface DepartmentManagerProps {
  companyId: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export default function DepartmentManager({ companyId }: DepartmentManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });

  const queryKey = ["departments", companyId];

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/departments/company/${companyId}`);
      return res.data.data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/departments", { ...data, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
      setFormData({ name: "", description: "", is_active: true });
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/departments/${id}`, { ...data, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/departments/${id}`, { data: { companyId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleSave = () => {
    if (!formData.name) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, data: formData });
    } else {
      createMut.mutate(formData);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, description: dept.description || "", is_active: dept.is_active });
    setIsAdding(false);
  };

  if (isLoading) return <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Departments</h2>
        {!isAdding && !editingId && (
          <button onClick={() => { setIsAdding(true); setFormData({ name: "", description: "", is_active: true }); }} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div style={{ background: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text)" }}>{editingId ? "Edit Department" : "New Department"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }}>
            <div>
              <label className="form-label">Name *</label>
              <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input type="text" className="form-control" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} id="active-dept" />
              <label htmlFor="active-dept">Active</label>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                <Save size={16} /> Save
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="btn btn-secondary">
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {departments?.length === 0 && !isAdding ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          No departments configured yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {departments?.map(dept => (
            <div key={dept.id} style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: dept.is_active ? 1 : 0.6 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {dept.name} {!dept.is_active && <span className="badge badge-gray">Inactive</span>}
                </h4>
                {dept.description && <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>{dept.description}</p>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => startEdit(dept)} className="btn btn-secondary btn-sm" disabled={!!editingId || isAdding}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if (confirm("Are you sure?")) deleteMut.mutate(dept.id); }} className="btn btn-danger btn-sm" disabled={!!editingId || isAdding}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
