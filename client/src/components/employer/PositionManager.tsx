import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";

interface PositionManagerProps {
  companyId: string;
}

interface Position {
  id: string;
  department_id: string;
  title: string;
  description: string;
  is_active: boolean;
  department?: { id: string; name: string; };
}

export default function PositionManager({ companyId }: PositionManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", department_id: "", description: "", is_active: true });

  const queryKey = ["positions", companyId];
  const deptsKey = ["departments", companyId];

  const { data: positions, isLoading } = useQuery<Position[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/positions/company/${companyId}`);
      return res.data.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: deptsKey,
    queryFn: async () => {
      const res = await api.get(`/departments/company/${companyId}`);
      return res.data.data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => api.post("/positions", { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.put(`/positions/${id}`, { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/positions/${id}`, { data: { companyId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleSave = () => {
    if (!formData.title) return;
    if (editingId) updateMut.mutate({ id: editingId, data: formData });
    else createMut.mutate(formData);
  };

  const startEdit = (pos: Position) => {
    setEditingId(pos.id);
    setFormData({ title: pos.title, department_id: pos.department_id || "", description: pos.description || "", is_active: pos.is_active });
    setIsAdding(false);
  };

  if (isLoading) return <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Positions</h2>
        {!isAdding && !editingId && (
          <button onClick={() => { setIsAdding(true); setFormData({ title: "", department_id: "", description: "", is_active: true }); }} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Position
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div style={{ background: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text)" }}>{editingId ? "Edit Position" : "New Position"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Job Title *</label>
                <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-control" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
                  <option value="">-- No Department --</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Description</label>
              <input type="text" className="form-control" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} id="active-pos" />
              <label htmlFor="active-pos">Active</label>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}><Save size={16} /> Save</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="btn btn-secondary"><X size={16} /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {positions?.length === 0 && !isAdding ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          No positions configured yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {positions?.map(pos => (
            <div key={pos.id} style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: pos.is_active ? 1 : 0.6 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {pos.title} {!pos.is_active && <span className="badge badge-gray">Inactive</span>}
                </h4>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  {pos.department ? <span>Department: {pos.department.name}</span> : <span>Unassigned Department</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => startEdit(pos)} className="btn btn-secondary btn-sm" disabled={!!editingId || isAdding}><Edit2 size={14} /></button>
                <button onClick={() => { if (confirm("Are you sure?")) deleteMut.mutate(pos.id); }} className="btn btn-danger btn-sm" disabled={!!editingId || isAdding}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
