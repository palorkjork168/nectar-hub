import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Clock,
  User,
  Info
} from "lucide-react";
import api from "../../services/api";

type Company = { id: string; name: string };

type AuditLogItem = {
  id: string;
  company_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
};

type AuditApiResponse = {
  success: boolean;
  data: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function AuditLogs() {
  const [companyId, setCompanyId] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, any> | null>(null);

  // Fetch companies user has access to
  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length > 0 && !companyId) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  // Fetch audit logs
  const auditQuery = useQuery({
    queryKey: ["auditLogs", companyId, page, actionFilter, entityFilter, searchTerm, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit: 20,
      };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get<AuditApiResponse>(`/audit/company/${companyId}`, { params });
      return res.data;
    },
    enabled: Boolean(companyId),
  });

  const logs = auditQuery.data?.data || [];
  const pagination = auditQuery.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("FAILED") || action.includes("DELETE") || action.includes("REJECT") || action.includes("CANCEL")) {
      return "badge-danger";
    }
    if (action.includes("CREATE") || action.includes("SUCCESS") || action.includes("APPROVE") || action.includes("ACTIVE")) {
      return "badge-success";
    }
    if (action.includes("UPDATE") || action.includes("ASSIGN") || action.includes("CHANGED")) {
      return "badge-primary";
    }
    return "badge-secondary";
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Shield className="text-primary" size={26} />
            Security & Audit Trail
          </h1>
          <p className="text-secondary" style={{ marginTop: "0.25rem", fontSize: "0.925rem" }}>
            Immutable record of sensitive mutations, access, and schedule activities.
          </p>
        </div>

        {/* Company Switcher */}
        {companies.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={16} className="text-secondary" />
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setPage(1);
              }}
              className="form-control"
              style={{ padding: "0.375rem 0.75rem", borderRadius: "6px" }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="form-control"
            style={{ paddingLeft: "32px", fontSize: "0.875rem" }}
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="form-control"
          style={{ fontSize: "0.875rem" }}
        >
          <option value="">All Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="USER_REGISTERED">USER_REGISTERED</option>
          <option value="SCHEDULE_CREATED">SCHEDULE_CREATED</option>
          <option value="SCHEDULE_UPDATED">SCHEDULE_UPDATED</option>
          <option value="SCHEDULE_ACTIVATED">SCHEDULE_ACTIVATED</option>
          <option value="SCHEDULE_DEACTIVATED">SCHEDULE_DEACTIVATED</option>
          <option value="SCHEDULE_DELETED">SCHEDULE_DELETED</option>
          <option value="SCHEDULE_ASSIGNED">SCHEDULE_ASSIGNED</option>
          <option value="SCHEDULE_UNASSIGNED">SCHEDULE_UNASSIGNED</option>
          <option value="LEAVE_CREATED">LEAVE_CREATED</option>
          <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
          <option value="LEAVE_REJECTED">LEAVE_REJECTED</option>
          <option value="LEAVE_CANCELLED">LEAVE_CANCELLED</option>
          <option value="HIRING_ACTION">HIRING_ACTION</option>
          <option value="APPLICATION_STATUS_CHANGED">APPLICATION_STATUS_CHANGED</option>
          <option value="PERMISSION_CHANGED">PERMISSION_CHANGED</option>
        </select>

        {/* Entity filter */}
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="form-control"
          style={{ fontSize: "0.875rem" }}
        >
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="WorkSchedule">WorkSchedule</option>
          <option value="EmploymentRecord">EmploymentRecord</option>
          <option value="LeaveRequest">LeaveRequest</option>
          <option value="Application">Application</option>
          <option value="Role">Role</option>
        </select>

        {/* Date Filters */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="form-control"
            style={{ fontSize: "0.875rem" }}
            title="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="form-control"
            style={{ fontSize: "0.875rem" }}
            title="End date"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {auditQuery.isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 1rem", color: "var(--primary)" }} />
            <p className="text-secondary">Loading audit trail...</p>
          </div>
        ) : auditQuery.isError ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <AlertCircle size={32} style={{ margin: "0 auto 0.5rem", color: "var(--danger)" }} />
            <p style={{ color: "var(--danger)", fontWeight: 500 }}>Failed to load company audit logs.</p>
            <p className="text-secondary" style={{ fontSize: "0.875rem" }}>You may not have the required audit.view permission.</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Shield size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
            <p className="text-secondary">No audit logs found matching the filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", textTransform: "uppercase" }}>Timestamp</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", textTransform: "uppercase" }}>Actor</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", textTransform: "uppercase" }}>Action</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", textTransform: "uppercase" }}>Target Entity</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", textTransform: "uppercase" }}>Description</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "0.8rem", textTransform: "uppercase" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actorDisplay = log.actor
                    ? `${log.actor.first_name || ""} ${log.actor.last_name || ""} (${log.actor.email})`.trim()
                    : log.actor_user_id
                    ? `User (${log.actor_user_id.slice(0, 8)}...)`
                    : "System / Public";

                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.825rem", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <Clock size={14} className="text-secondary" />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <User size={14} className="text-secondary" />
                          {actorDisplay}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.825rem" }}>
                        <strong>{log.entity_type}</strong>
                        {log.entity_id && (
                          <span className="text-secondary" style={{ display: "block", fontSize: "0.75rem" }}>
                            {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}>
                        {log.description}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <button
                            onClick={() => setSelectedMeta(log.metadata)}
                            className="btn btn-sm btn-ghost"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            title="View sanitized event metadata"
                          >
                            <Info size={14} />
                          </button>
                        ) : (
                          <span className="text-secondary" style={{ fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "0.75rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
              fontSize: "0.875rem",
            }}
          >
            <span className="text-secondary">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} events)
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-sm btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-sm btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedMeta && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedMeta(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Event Metadata</h3>
              <button onClick={() => setSelectedMeta(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>
            <pre
              style={{
                background: "var(--bg-tertiary)",
                padding: "1rem",
                borderRadius: "6px",
                overflowX: "auto",
                fontSize: "0.8rem",
                maxHeight: "300px",
              }}
            >
              {JSON.stringify(selectedMeta, null, 2)}
            </pre>
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button onClick={() => setSelectedMeta(null)} className="btn btn-sm btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
