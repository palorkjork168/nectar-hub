import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { Check, X, Loader2, MessageSquare, Calendar } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";

export default function LeaveRequests() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const companiesQuery = useQuery({
    queryKey: ["myCompanies"],
    queryFn: async () => {
      const res = await api.get("/companies/my");
      return res.data.data.companies;
    },
  });

  const primaryCompany = companiesQuery.data?.[0];
  const queryKey = ["companyLeaveRequests", primaryCompany?.id];

  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/leave/company/${primaryCompany?.id}/requests`);
      return res.data.data;
    },
    enabled: !!primaryCompany,
  });

  const reviewMut = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) => {
      return api.patch(`/leave/requests/${id}/${action}`, { companyId: primaryCompany?.id, review_note: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setRejectingId(null);
      setReviewNote("");
    },
  });

  if (companiesQuery.isLoading || isLoading) {
    return <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem" }}><Loader2 className="animate-spin" /></div>;
  }

  if (!primaryCompany) {
    return <div className="dashboard-container"><p>No company profile found.</p></div>;
  }

  const filteredRequests = requests?.filter(r => filter === "ALL" || r.status === filter) || [];

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="dashboard-title">Leave Requests</h1>
        <p className="dashboard-subtitle">Review and manage employee leave requests for {primaryCompany.name}.</p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No leave requests found"
          description={filter === "ALL" ? "Employees have not submitted any leave requests yet." : `No leave requests match the ${filter.toLowerCase()} filter.`}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredRequests.map(req => {
            const start = new Date(req.start_date);
            const end = new Date(req.end_date);
            const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

            return (
              <div key={req.id} className="card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    {req.user?.avatar_url ? (
                      <img src={req.user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                        {req.user?.first_name?.[0]}{req.user?.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.125rem" }}>{req.user?.first_name} {req.user?.last_name}</h3>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{req.user?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>Leave Type</div>
                      <div style={{ fontWeight: 500 }}>{req.leaveType?.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>Dates</div>
                      <div style={{ fontWeight: 500 }}>{start.toLocaleDateString()} - {end.toLocaleDateString()} ({days} days)</div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", fontSize: "0.875rem" }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><MessageSquare size={14} /> Reason</div>
                    <div>{req.reason}</div>
                  </div>

                  {req.review_note && (
                    <div style={{ marginTop: "0.5rem", padding: "1rem", borderLeft: "3px solid var(--primary)", backgroundColor: "rgba(37, 99, 235, 0.05)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Reviewer Note</div>
                      <div>{req.review_note}</div>
                    </div>
                  )}
                </div>

                <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
                    <span className={`badge ${req.status === 'APPROVED' ? 'badge-primary' : req.status === 'PENDING' ? 'badge-warning' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-gray'}`} style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                      {req.status}
                    </span>
                  </div>

                  {req.status === "PENDING" && !rejectingId && (
                    <>
                      <button onClick={() => { if (confirm("Approve this leave request?")) reviewMut.mutate({ id: req.id, action: "approve" }); }} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={reviewMut.isPending}>
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => setRejectingId(req.id)} className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} disabled={reviewMut.isPending}>
                        <X size={16} /> Reject
                      </button>
                    </>
                  )}

                  {rejectingId === req.id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <textarea className="form-control" placeholder="Rejection reason..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} style={{ fontSize: "0.875rem" }} />
                      <button onClick={() => reviewMut.mutate({ id: req.id, action: "reject", note: reviewNote })} className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} disabled={reviewMut.isPending}>Confirm Reject</button>
                      <button onClick={() => { setRejectingId(null); setReviewNote(""); }} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
