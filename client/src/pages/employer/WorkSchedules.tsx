import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Search,
  Filter,
  Users,
  AlertCircle,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Timer,
  CalendarCheck
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  useCompanySchedules,
  useSetScheduleStatus,
  useDeleteSchedule
} from "../../hooks/useWorkSchedules";
import type { WorkSchedule } from "../../types/attendance";
import WorkScheduleFormModal from "../../components/schedules/WorkScheduleFormModal";
import WorkScheduleDetailsModal from "../../components/schedules/WorkScheduleDetailsModal";

type Company = { id: string; name: string };

export default function WorkSchedules() {
  const { isEmployer, hasPermission, isAdmin } = useAuth();
  const toast = useToast();

  const canManage = isAdmin || isEmployer || hasPermission("shifts.manage");

  const [companyId, setCompanyId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);

  // Deactivation confirmation modal
  const [deactivateScheduleTarget, setDeactivateScheduleTarget] = useState<WorkSchedule | null>(null);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<WorkSchedule | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length === 1 && !companyId) {
      setCompanyId(companies[0].id);
    } else if (companies.length > 0 && !companyId) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  const queryParams = {
    search: searchTerm.trim() || undefined,
    is_active: activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE",
  };

  const {
    data: schedules = [],
    isLoading,
    isError,
    refetch
  } = useCompanySchedules(companyId, queryParams);

  const setStatusMutation = useSetScheduleStatus();
  const deleteMutation = useDeleteSchedule();

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormModalOpen(true);
  };

  const handleOpenDetails = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setDetailsModalOpen(true);
  };

  const handleToggleStatusClick = (schedule: WorkSchedule) => {
    if (schedule.is_active) {
      // Deactivating requires explicit confirmation
      setDeactivateScheduleTarget(schedule);
    } else {
      // Activating directly
      setStatusMutation.mutate(
        { scheduleId: schedule.id, isActive: true, companyId },
        {
          onSuccess: () => {
            toast.success("Work schedule activated successfully");
            refetch();
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to activate schedule");
          }
        }
      );
    }
  };

  const confirmDeactivation = () => {
    if (!deactivateScheduleTarget) return;
    setStatusMutation.mutate(
      { scheduleId: deactivateScheduleTarget.id, isActive: false, companyId },
      {
        onSuccess: () => {
          toast.success("Work schedule deactivated successfully");
          setDeactivateScheduleTarget(null);
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to deactivate schedule");
        }
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteScheduleTarget) return;
    deleteMutation.mutate(
      { scheduleId: deleteScheduleTarget.id, companyId },
      {
        onSuccess: () => {
          toast.success("Work schedule deleted successfully");
          setDeleteScheduleTarget(null);
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to delete schedule");
        }
      }
    );
  };

  if (companiesQuery.isLoading) {
    return (
      <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem" }}>
        <Loader2 className="spinner" size={28} />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading work schedules...</p>
      </div>
    );
  }

  if (!companies.length) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Work Schedules</h1>
        <p className="dashboard-subtitle">Create or join a company before managing work schedules.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}
      >
        <div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={28} style={{ color: "var(--primary)" }} />
            Work Schedules
          </h1>
          <p className="dashboard-subtitle">
            Manage working hours, grace periods, and employee schedules.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {companies.length > 1 && (
            <select
              className="input-field"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              style={{ minWidth: "220px", height: "42px" }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {canManage && (
            <button
              className="btn btn-primary"
              onClick={handleOpenCreate}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", height: "42px" }}
            >
              <Plus size={18} />
              Create Schedule
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)"
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search schedules by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "2.5rem", width: "100%", height: "40px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <div style={{ display: "inline-flex", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveFilter(mode)}
                style={{
                  padding: "0.5rem 0.875rem",
                  fontSize: "0.8125rem",
                  fontWeight: activeFilter === mode ? 600 : 400,
                  backgroundColor: activeFilter === mode ? "var(--primary)" : "var(--surface)",
                  color: activeFilter === mode ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s ease"
                }}
              >
                {mode === "ALL" ? "All" : mode === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {!companyId ? (
        <div className="empty-state">
          <Building2 size={36} />
          <h3>Select a company</h3>
          <p>Choose a company to view and manage its work schedules.</p>
        </div>
      ) : isLoading ? (
        <div className="empty-state">
          <Loader2 className="spinner" size={32} />
          <p>Loading work schedules...</p>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <AlertCircle size={36} style={{ color: "var(--danger)" }} />
          <h3>Unable to load schedules</h3>
          <p>Check your permissions or network connection and try again.</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <CalendarCheck size={44} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
          <h3>No work schedules yet</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
            {searchTerm || activeFilter !== "ALL"
              ? "No schedules match your current filters. Try resetting search."
              : "Create your first work schedule to define standard hours, grace periods, and expected shift duration."}
          </p>
          {canManage && !searchTerm && activeFilter === "ALL" && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Schedule
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem"
          }}
        >
          {schedules.map((schedule) => {
            const assignedCount = schedule.assigned_employees_count ?? schedule.assignedCount ?? 0;

            return (
              <div
                key={schedule.id}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-sm)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  position: "relative"
                }}
              >
                <div>
                  {/* Top Bar: Title & Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      marginBottom: "0.75rem"
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          color: "var(--text-primary)"
                        }}
                      >
                        {schedule.name}
                      </h3>
                      {schedule.description ? (
                        <p
                          style={{
                            margin: "0.25rem 0 0 0",
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.4
                          }}
                        >
                          {schedule.description}
                        </p>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No description provided
                        </span>
                      )}
                    </div>

                    <span
                      className={`badge ${schedule.is_active ? "badge-success" : "badge-secondary"}`}
                      style={{
                        padding: "0.25rem 0.625rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {schedule.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Schedule Details Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                      padding: "0.875rem",
                      backgroundColor: "var(--surface-muted)",
                      borderRadius: "calc(var(--radius) - 2px)",
                      margin: "1rem 0"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                        Shift Hours
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontWeight: 600,
                          fontSize: "0.9375rem"
                        }}
                      >
                        <Clock size={15} style={{ color: "var(--primary)" }} />
                        {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                        Expected Hours
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontWeight: 600,
                          fontSize: "0.9375rem"
                        }}
                      >
                        <Timer size={15} style={{ color: "var(--primary)" }} />
                        {schedule.expected_hours} hrs
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                        Grace Period
                      </div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {schedule.grace_period_minutes} min
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                        Assigned
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: assignedCount > 0 ? "var(--primary)" : "var(--text-muted)"
                        }}
                      >
                        <Users size={14} />
                        {assignedCount} {assignedCount === 1 ? "employee" : "employees"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.875rem",
                    borderTop: "1px solid var(--border)",
                    marginTop: "0.5rem",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenDetails(schedule)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.8125rem",
                      padding: "0.4rem 0.75rem"
                    }}
                  >
                    <Eye size={14} /> View Details
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {canManage && (
                      <>
                        <button
                          className="btn btn-ghost"
                          title={schedule.is_active ? "Deactivate schedule" : "Activate schedule"}
                          onClick={() => handleToggleStatusClick(schedule)}
                          style={{
                            padding: "0.4rem 0.6rem",
                            color: schedule.is_active ? "var(--warning)" : "var(--success)"
                          }}
                        >
                          {schedule.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>

                        <button
                          className="btn btn-ghost"
                          title="Edit schedule"
                          onClick={() => handleOpenEdit(schedule)}
                          style={{ padding: "0.4rem 0.6rem", color: "var(--primary)" }}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          className="btn btn-ghost"
                          title="Delete schedule"
                          onClick={() => setDeleteScheduleTarget(schedule)}
                          style={{ padding: "0.4rem 0.6rem", color: "var(--danger)" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <WorkScheduleFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingSchedule(null);
          }}
          companyId={companyId}
          schedule={editingSchedule}
          onSuccess={() => refetch()}
        />
      )}

      {/* Schedule Details & Assigned Employees Modal */}
      {detailsModalOpen && selectedSchedule && (
        <WorkScheduleDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSchedule(null);
          }}
          scheduleId={selectedSchedule.id}
          companyId={companyId}
          canManage={canManage}
          onScheduleUpdated={() => refetch()}
        />
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivateScheduleTarget && (
        <div className="modal-backdrop" onClick={() => setDeactivateScheduleTarget(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Deactivate Schedule?</h3>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {deactivateScheduleTarget.name}
                </p>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: "1.5rem"
              }}
            >
              <p style={{ marginTop: 0 }}>
                Please take note of the following before deactivating:
              </p>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
                <li>Existing employee assignments remain intact.</li>
                <li>The schedule cannot be newly assigned to other employees.</li>
                <li>Historical attendance records remain valid.</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeactivateScheduleTarget(null)}
                disabled={setStatusMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDeactivation}
                disabled={setStatusMutation.isPending}
                style={{ backgroundColor: "var(--warning)", borderColor: "var(--warning)" }}
              >
                {setStatusMutation.isPending ? "Deactivating..." : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteScheduleTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteScheduleTarget(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Delete Schedule?</h3>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {deleteScheduleTarget.name}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Are you sure you want to permanently delete this schedule? This action cannot be undone. Schedules with assigned employees or attendance history cannot be deleted.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteScheduleTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
