import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";

export default function LeaveTypeManager({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", default_days: 14, is_paid: true, is_active: true });

  const queryKey = ["leaveTypes", companyId];

  const { data: leaveTypes, isLoading } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/leave/types/company/${companyId}`);
      return res.data.data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => api.post("/leave/types", { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.put(`/leave/types/${id}`, { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/leave/types/${id}`, { data: { companyId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleSave = () => {
    if (!formData.name) return;
    if (editingId) updateMut.mutate({ id: editingId, data: formData });
    else createMut.mutate(formData);
  };

  const startEdit = (type: any) => {
    setEditingId(type.id);
    setFormData({ name: type.name, description: type.description || "", default_days: type.default_days || 0, is_paid: type.is_paid, is_active: type.is_active });
    setIsAdding(false);
  };

  if (isLoading) return <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Leave Types</h2>
        {!isAdding && !editingId && (
          <button onClick={() => { setIsAdding(true); setFormData({ name: "", description: "", default_days: 14, is_paid: true, is_active: true }); }} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Leave Type
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div style={{ background: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text)" }}>{editingId ? "Edit Leave Type" : "New Leave Type"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Type Name *</label>
                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Annual Leave" />
              </div>
              <div>
                <label className="form-label">Default Days per Year</label>
                <input type="number" className="form-control" value={formData.default_days} onChange={(e) => setFormData({ ...formData, default_days: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <label className="form-label">Description</label>
              <input type="text" className="form-control" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><input type="checkbox" checked={formData.is_paid} onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })} /> Paid Leave</label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Active</label>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}><Save size={16} /> Save</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="btn btn-secondary"><X size={16} /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {leaveTypes?.length === 0 && !isAdding ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          No leave types configured yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {leaveTypes?.map(type => (
            <div key={type.id} style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: type.is_active ? 1 : 0.6 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {type.name}
                  {!type.is_active && <span className="badge badge-gray">Inactive</span>}
                  {type.is_paid ? <span className="badge" style={{ backgroundColor: "rgba(255, 225, 124, 0.1)", color: "var(--color-primary-text)" }}>Paid</span> : <span className="badge badge-gray">Unpaid</span>}
                </h4>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Default Allowance: {type.default_days} days</span>
                  {type.description && <span>• {type.description}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => startEdit(type)} className="btn btn-secondary btn-sm" disabled={!!editingId || isAdding}><Edit2 size={14} /></button>
                <button onClick={() => { if (confirm("Are you sure?")) deleteMut.mutate(type.id); }} className="btn btn-danger btn-sm" disabled={!!editingId || isAdding}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
