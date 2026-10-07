import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import {
  Calendar as CalendarIcon,
  Plus,
  CalendarCheck,
  FileQuestion,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import RequestLeaveModal from "../../components/employee/RequestLeaveModal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import BackButton from "../../components/common/BackButton";
import { SkeletonStatCard, SkeletonTableRow } from "../../components/common/Skeleton";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../../components/common/Modal";

type LeaveTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export default function Leave() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaveTab>("ALL");
  const [companyId, setCompanyId] = useState("");
  const employmentsQuery = useQuery<any[]>({ queryKey: ["myActiveEmployments"], queryFn: async () => (await api.get("/employment/me")).data.data });
  const employments = useMemo(() => employmentsQuery.data || [], [employmentsQuery.data]);
  useEffect(() => { if (employments.length === 1) setCompanyId(employments[0].company_id); }, [employments]);

  const {
    data: balance = [],
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useQuery<any[]>({
    queryKey: ["leaveBalance", companyId],
    queryFn: async () => {
      const res = await api.get(`/leave/balance?companyId=${companyId}`);
      return res.data.data;
    },
    enabled: Boolean(companyId), staleTime: 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
    isError: requestsError,
    refetch: refetchRequests,
  } = useQuery<any[]>({
    queryKey: ["myLeaveRequests", companyId],
    queryFn: async () => {
      const res = await api.get(`/leave/my${companyId ? `?companyId=${companyId}` : ""}`);
      return res.data.data;
    },
    enabled: Boolean(companyId), staleTime: 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => api.patch(`/leave/requests/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      toast.success("Leave request cancelled successfully");
      setCancelConfirmId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    },
  });

  const filteredRequests = useMemo(() => {
    if (activeTab === "ALL") return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const formatDates = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    if (startStr === endStr) {
      return s.toLocaleDateString(undefined, options);
    }
    return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${e.toLocaleDateString(undefined, options)}`;
  };

  const tabs: { id: LeaveTab; label: string }[] = [
    { id: "ALL", label: `All (${requests.length})` },
    { id: "PENDING", label: `Pending (${requests.filter((r) => r.status === "PENDING").length})` },
    { id: "APPROVED", label: `Approved (${requests.filter((r) => r.status === "APPROVED").length})` },
    { id: "REJECTED", label: `Rejected (${requests.filter((r) => r.status === "REJECTED").length})` },
    { id: "CANCELLED", label: `Cancelled (${requests.filter((r) => r.status === "CANCELLED").length})` },
  ];

  return (
    <div className="page-container fade-in">
      {/* Back Navigation */}
      <BackButton label="Back to Dashboard" fallback="/employee/dashboard" />

      {/* Page Header - Renders immediately */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Off</h1>
          <p className="page-subtitle">Manage your leave requests and review your balance allowances.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Request Time Off
        </button>
      </div>
      {employmentsQuery.isLoading ? <p>Loading active company employment...</p> : employments.length === 0 ? <EmptyState icon={AlertCircle} title="No active company employment found" description="Leave requests require active employment with a company." /> : <div className="form-group" style={{ maxWidth: "360px", marginBottom: "1.5rem" }}><label className="form-label">Company</label><select className="form-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}><option value="">Select a company</option>{employments.map((employment) => <option key={employment.id} value={employment.company_id}>{employment.company?.name || "Company"}</option>)}</select></div>}

      {!companyId ? null : <>

      {/* Leave Balances Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1rem" }}>
          Leave Balances
        </h2>

        {balanceLoading ? (
          <div className="card-grid">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : balanceError ? (
          <div
            className="card"
            style={{
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--color-danger-soft)",
              color: "var(--color-danger-text)",
              border: "1px solid var(--color-danger-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={20} />
              <span>We couldn't load your leave balances. Please try again.</span>
            </div>
            <button
              type="button"
              onClick={() => refetchBalance()}
              className="btn btn-sm btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : balance.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No leave policies available"
            description="Your company has not configured active leave types yet. Please contact your employer or HR team."
          />
        ) : (
          <div className="card-grid">
            {balance.map((bal) => {
              const hasAllowance = bal.default_days !== null;
              const remaining = hasAllowance ? (bal.remaining_days ?? bal.default_days) : "Unlimited";
              const percentUsed = hasAllowance && bal.default_days > 0
                ? Math.min(100, Math.round(((bal.used_days || 0) / bal.default_days) * 100))
                : 0;

              return (
                <div key={bal.leave_type_id} className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                      {bal.name}
                    </h3>
                    <span className="badge badge-neutral">
                      {bal.paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>
                      {remaining}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      {hasAllowance ? "days remaining" : ""}
                    </span>
                  </div>

                  {hasAllowance ? (
                    <>
                      {/* Progress Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: "var(--color-surface-muted)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden",
                          margin: "0.75rem 0",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentUsed}%`,
                            height: "100%",
                            backgroundColor: percentUsed > 85 ? "var(--color-danger)" : "var(--color-primary)",
                            borderRadius: "var(--radius-full)",
                            transition: "width var(--transition-base)",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                        <span>Entitlement: <strong>{bal.default_days}d</strong></span>
                        <span>Used: <strong>{bal.used_days || 0}d</strong></span>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                      Used: <strong>{bal.used_days || 0} days</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave Requests Section */}
      <div style={{ marginTop: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            Request History
          </h2>

          {/* Filter Tabs */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--color-surface-muted)",
              padding: "3px",
              borderRadius: "var(--radius-md)",
              gap: "2px",
              flexWrap: "wrap",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: "none",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  backgroundColor: activeTab === tab.id ? "var(--color-surface)" : "transparent",
                  color: activeTab === tab.id ? "var(--color-text)" : "var(--color-text-secondary)",
                  boxShadow: activeTab === tab.id ? "var(--shadow-xs)" : "none",
                  transition: "all var(--transition-fast)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {requestsLoading ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Review Note</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
              </tbody>
            </table>
          </div>
        ) : requestsError ? (
          <div
            className="card"
            style={{
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--color-danger-soft)",
              color: "var(--color-danger-text)",
              border: "1px solid var(--color-danger-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={20} />
              <span>We couldn't load your leave requests. Please try again.</span>
            </div>
            <button
              type="button"
              onClick={() => refetchRequests()}
              className="btn btn-sm btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title={activeTab === "ALL" ? "No time off requests yet" : `No ${activeTab.toLowerCase()} requests`}
            description="When you submit a leave request, you will be able to track approvals and notes here."
            action={activeTab === "ALL" ? { label: "Request Time Off", onClick: () => setIsModalOpen(true), icon: Plus } : undefined}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Review Note</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: "var(--color-text)" }}>
                        {req.LeaveType?.name || "Time Off"}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CalendarIcon size={14} style={{ color: "var(--color-text-muted)" }} />
                        <span>{formatDates(req.start_date, req.end_date)}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{req.days_count}</strong> {req.days_count === 1 ? "day" : "days"}
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td style={{ maxWidth: "220px", color: "var(--color-text-secondary)" }}>
                      <span style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={req.reason}>
                        {req.reason || "—"}
                      </span>
                    </td>
                    <td style={{ maxWidth: "200px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      <span style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={req.review_note}>
                        {req.review_note || "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {req.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmId(req.id)}
                          disabled={cancelMut.isPending}
                          className="btn btn-sm btn-ghost"
                          style={{ color: "var(--color-danger)" }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      {isModalOpen && (
        <RequestLeaveModal
          balance={balance}
          companyId={companyId}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setCancelConfirmId(null)}
          title="Cancel Leave Request"
        >
          <div style={{ padding: "1.5rem" }}>
            <p style={{ margin: "0 0 1.5rem 0", color: "var(--color-text-secondary)" }}>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelMut.isPending}
              >
                Keep Request
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => cancelMut.mutate(cancelConfirmId)}
                disabled={cancelMut.isPending}
              >
                {cancelMut.isPending ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      </>}</div>
  );
}
