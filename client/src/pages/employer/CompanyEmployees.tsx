import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, AlertCircle, Loader2, Clock, CalendarClock, Plus } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { WorkSchedule } from "../../types/attendance";
import ScheduleAssignmentModal from "../../components/schedules/ScheduleAssignmentModal";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTableRow } from "../../components/common/Skeleton";

type Company = { id: string; name: string };
type DirectoryEmployee = {
  employee: { user: { id: string; first_name: string; last_name: string; email: string; status: string } };
  employment: {
    id: string;
    status: string;
    employment_type?: string | null;
    start_date: string;
    work_schedule_id?: string | null;
    workSchedule?: WorkSchedule | null;
  };
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
};

export default function CompanyEmployees() {
  const { isEmployer, hasPermission, isAdmin } = useAuth();
  const canManageSchedules = isAdmin || isEmployer || hasPermission("shifts.manage");

  const [companyId, setCompanyId] = useState("");
  const [assignmentTarget, setAssignmentTarget] = useState<{
    employmentId: string;
    employeeName: string;
    currentScheduleId?: string | null;
  } | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length === 1) setCompanyId(companies[0].id);
  }, [companies]);

  const directoryQuery = useQuery({
    queryKey: ["company", companyId, "employees"],
    queryFn: async () => (await api.get(`/companies/${companyId}/employees`)).data.data.employees as DirectoryEmployee[],
    enabled: Boolean(companyId),
  });

  if (companiesQuery.isLoading) {
    return (
      <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem" }}>
        <Loader2 className="spinner" size={24} /> Loading companies...
      </div>
    );
  }

  if (!companies.length) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Company Employees</h1>
        <p className="dashboard-subtitle">Create or join a company before viewing its workforce.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">Company Employees</h1>
          <p className="dashboard-subtitle">Active workforce members for the selected company, including department, position, and work schedule.</p>
        </div>
        <select
          className="input-field"
          aria-label="Select company"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          style={{ minWidth: "220px" }}
        >
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {!companyId ? (
        <div className="empty-state">
          <Building2 size={32} />
          <h3>Select a company</h3>
          <p>Choose the company whose workforce you want to view.</p>
        </div>
      ) : directoryQuery.isLoading ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Work Schedule</th>
                <th>Employment Type</th>
                <th>Start Date</th>
                <th>Status</th>
                {canManageSchedules && <th>Schedule Action</th>}
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={canManageSchedules ? 8 : 7} />
              <SkeletonTableRow cols={canManageSchedules ? 8 : 7} />
              <SkeletonTableRow cols={canManageSchedules ? 8 : 7} />
              <SkeletonTableRow cols={canManageSchedules ? 8 : 7} />
            </tbody>
          </table>
        </div>
      ) : directoryQuery.isError ? (
        <div className="empty-state">
          <AlertCircle size={32} />
          <h3>Unable to load employees</h3>
          <p>You may not have permission to view this company's workforce.</p>
        </div>
      ) : !directoryQuery.data?.length ? (
        <EmptyState
          icon={Users}
          title="No active employees"
          description="Active employment records will appear here as candidates are hired."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Work Schedule</th>
                <th>Employment Type</th>
                <th>Start Date</th>
                <th>Status</th>
                {canManageSchedules && <th>Schedule Action</th>}
              </tr>
            </thead>
            <tbody>
              {directoryQuery.data.map(({ employee, employment, department, position }) => {
                const assignedSchedule = employment.workSchedule;
                const empName = `${employee.user.first_name} ${employee.user.last_name}`;

                return (
                  <tr key={employment.id}>
                    <td>
                      <strong>{empName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{employee.user.email}</div>
                    </td>
                    <td>{department?.name || "—"}</td>
                    <td>{position?.title || "—"}</td>
                    <td>
                      {assignedSchedule ? (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
                            <Clock size={14} style={{ color: "var(--primary)" }} />
                            {assignedSchedule.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {assignedSchedule.start_time.slice(0, 5)} — {assignedSchedule.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No schedule assigned</span>
                      )}
                    </td>
                    <td>{employment.employment_type || "—"}</td>
                    <td>{new Date(employment.start_date).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">{employment.status}</span>
                    </td>
                    {canManageSchedules && (
                      <td>
                        <button
                          type="button"
                          className={assignedSchedule ? "btn btn-secondary" : "btn btn-primary"}
                          onClick={() =>
                            setAssignmentTarget({
                              employmentId: employment.id,
                              employeeName: empName,
                              currentScheduleId: employment.work_schedule_id || assignedSchedule?.id,
                            })
                          }
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.35rem 0.65rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          {assignedSchedule ? (
                            <>
                              <CalendarClock size={13} /> Change
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Assign
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Assignment Modal */}
      {assignmentTarget && (
        <ScheduleAssignmentModal
          isOpen={Boolean(assignmentTarget)}
          onClose={() => setAssignmentTarget(null)}
          companyId={companyId}
          employmentId={assignmentTarget.employmentId}
          employeeName={assignmentTarget.employeeName}
          currentScheduleId={assignmentTarget.currentScheduleId}
          onSuccess={() => directoryQuery.refetch()}
        />
      )}
    </div>
  );
}
