import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  Search,
  Users,
  Building2,
  Trash2,
  AlertTriangle,
  Coffee,
  Loader2,
  LayoutGrid,
  List,
  Info,
} from "lucide-react";
import api from "../../services/api";
import {
  useWeeklyRoster,
  useCompanySchedules,
  useAssignShift,
  useBulkAssignShifts,
  useDeleteShiftAssignment,
} from "../../hooks/useRoster";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import type {
  ShiftAssignment,
} from "../../types/roster";

type Company = { id: string; name: string };
type Department = { id: string; name: string };

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WeeklyRosterPlanner() {
  const toast = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Single Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Bulk Assignment Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkScheduleId, setBulkScheduleId] = useState("");
  const [bulkIsRestDay, setBulkIsRestDay] = useState(false);
  const [bulkSelectedEmpIds, setBulkSelectedEmpIds] = useState<string[]>([]);
  const [bulkSelectedDates, setBulkSelectedDates] = useState<string[]>([]);

  // 7 Dates of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(currentMonday, i);
      return {
        name: DAY_NAMES[i],
        date: d,
        dateString: formatDateISO(d),
        isToday: formatDateISO(d) === formatDateISO(new Date()),
      };
    });
  }, [currentMonday]);

  const startDateStr = weekDays[0].dateString;
  const endDateStr = weekDays[6].dateString;

  // 1. Fetch available companies
  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // 2. Fetch company departments
  const departmentsQuery = useQuery({
    queryKey: ["departments", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [] as Department[];
      const res = await api.get(`/departments?company_id=${selectedCompanyId}`);
      return (res.data.data?.departments || res.data.data || []) as Department[];
    },
    enabled: Boolean(selectedCompanyId),
  });
  const departments = departmentsQuery.data || [];

  // 3. Fetch Weekly Roster & Schedules
  const {
    data: roster = [],
    isLoading: isRosterLoading,
    isError: isRosterError,
    refetch: refetchRoster,
  } = useWeeklyRoster(
    selectedCompanyId,
    startDateStr,
    endDateStr,
    departmentFilter || undefined,
    Boolean(selectedCompanyId)
  );

  const { data: schedules = [] } = useCompanySchedules(
    selectedCompanyId,
    Boolean(selectedCompanyId)
  );

  const assignMutation = useAssignShift(selectedCompanyId);
  const bulkAssignMutation = useBulkAssignShifts(selectedCompanyId);
  const deleteAssignmentMutation = useDeleteShiftAssignment(selectedCompanyId);

  // Navigation Handlers
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => addDays(prev, 7));
  };

  const handleThisWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Filter employees
  const filteredRoster = useMemo(() => {
    return roster.filter((row) => {
      const emp = row.employmentRecord;
      const fullName = `${emp.user.first_name} ${emp.user.last_name}`.toLowerCase();
      const email = emp.user.email.toLowerCase();
      const q = searchQuery.toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [roster, searchQuery]);

  // Open single assign modal for a cell
  const handleOpenCellAssign = (
    empRecordId: string,
    empName: string,
    dateString: string,
    existingAssignment?: ShiftAssignment | null,
    baselineScheduleId?: string | null
  ) => {
    setSelectedEmp({ id: empRecordId, name: empName });
    setSelectedDate(dateString);
    if (existingAssignment) {
      setIsRestDay(existingAssignment.is_rest_day);
      setSelectedScheduleId(existingAssignment.work_schedule_id || "");
      setAssignmentNotes(existingAssignment.notes || "");
    } else {
      setIsRestDay(false);
      setSelectedScheduleId(baselineScheduleId || (schedules[0]?.id ?? ""));
      setAssignmentNotes("");
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveSingleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedDate) return;

    if (!isRestDay && !selectedScheduleId) {
      toast.error("Please select a work schedule or mark as rest day");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        employment_record_id: selectedEmp.id,
        shift_date: selectedDate,
        work_schedule_id: isRestDay ? null : selectedScheduleId,
        is_rest_day: isRestDay,
        notes: assignmentNotes.trim() || null,
      });

      toast.success(
        `Shift on ${selectedDate} for ${selectedEmp.name} saved (${
          isRestDay ? "Rest Day" : "Scheduled"
        })`
      );
      setIsAssignModalOpen(false);
      refetchRoster();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to assign shift");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAssignmentMutation.mutateAsync(assignmentId);
      toast.success("Custom shift removed (reverted to baseline)");
      refetchRoster();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to remove shift");
    }
  };

  // Open Bulk Assign Modal
  const handleOpenBulkModal = () => {
    setBulkSelectedEmpIds(filteredRoster.map((r) => r.employmentRecord.id));
    setBulkSelectedDates([weekDays[0].dateString]);
    setBulkScheduleId(schedules[0]?.id || "");
    setBulkIsRestDay(false);
    setIsBulkModalOpen(true);
  };

  const handleExecuteBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedEmpIds.length === 0 || bulkSelectedDates.length === 0) {
      toast.error("Select at least one employee and one date");
      return;
    }
    if (!bulkIsRestDay && !bulkScheduleId) {
      toast.error("Select a work schedule template or mark as rest day");
      return;
    }

    const assignments = [];
    for (const empId of bulkSelectedEmpIds) {
      for (const d of bulkSelectedDates) {
        assignments.push({
          employment_record_id: empId,
          shift_date: d,
          work_schedule_id: bulkIsRestDay ? null : bulkScheduleId,
          is_rest_day: bulkIsRestDay,
        });
      }
    }

    try {
      const res = await bulkAssignMutation.mutateAsync({ assignments });
      toast.success(
        `Bulk assigned ${res.data?.succeeded || assignments.length} shifts successfully`
      );
      setIsBulkModalOpen(false);
      refetchRoster();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Bulk assignment failed");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className="badge badge-primary" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
              Workforce Operations
            </span>
          </div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.25rem 0" }}>
            <Calendar size={28} style={{ color: "var(--color-primary-text)" }} />
            Shift Roster Planning
          </h1>
          <p className="dashboard-subtitle" style={{ margin: 0 }}>
            Plan, assign, and customize weekly employee work schedules, rest days, and operational shift coverage.
          </p>
        </div>

        {/* Company Selector & Action Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
          {companies.length > 1 && (
            <div style={{ minWidth: "200px" }}>
              <select
                aria-label="Select Company"
                className="input-field"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{ height: "40px", fontSize: "0.875rem" }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div style={{ display: "flex", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md, 8px)", padding: "2px" }}>
            <button
              onClick={() => setViewMode("grid")}
              className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", minHeight: "auto", fontSize: "0.78rem" }}
              title="7-Day Visual Calendar Grid"
            >
              <LayoutGrid size={14} />
              Calendar Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`btn ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", minHeight: "auto", fontSize: "0.78rem" }}
              title="Accessible Table & Schedule List"
            >
              <List size={14} />
              Accessible List
            </button>
          </div>

          <button
            onClick={handleOpenBulkModal}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "40px" }}
          >
            <Plus size={16} />
            Bulk Assign Shifts
          </button>
        </div>
      </div>

      {/* Week Navigation & Filters Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button onClick={handlePrevWeek} className="btn btn-secondary" style={{ padding: "0.4rem", minHeight: "auto" }} title="Previous Week">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextWeek} className="btn btn-secondary" style={{ padding: "0.4rem", minHeight: "auto" }} title="Next Week">
              <ChevronRight size={16} />
            </button>
          </div>

          <button onClick={handleThisWeek} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem", minHeight: "auto" }}>
            Current Week
          </button>

          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)" }}>
            {weekDays[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {weekDays[6].date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {departments.length > 0 && (
            <div style={{ minWidth: "160px" }}>
              <select
                aria-label="Filter by Department"
                className="input-field"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ height: "36px", fontSize: "0.8rem" }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "32px", height: "36px", fontSize: "0.8rem", width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isRosterLoading ? (
        <div style={{ padding: "4rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary-text)" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Loading weekly roster schedule...</p>
        </div>
      ) : isRosterError ? (
        <EmptyState
          title="Failed to Load Roster"
          description="Could not load the weekly roster for this company."
          icon={AlertTriangle}
          action={{ label: "Try Again", onClick: () => refetchRoster() }}
        />
      ) : filteredRoster.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No Employees Match Filter" : "No Active Employees Found"}
          description={
            searchQuery
              ? "Try adjusting your search query or department filter."
              : "There are currently no active employees enrolled in this company to plan shifts for."
          }
          icon={Users}
        />
      ) : viewMode === "grid" ? (
        /* ================= 7-DAY VISUAL WEEKLY GRID ================= */
        <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--color-border)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                  <th style={{ padding: "1rem", width: "260px", textAlign: "left", position: "sticky", left: 0, backgroundColor: "var(--color-surface)", zIndex: 2, borderRight: "1px solid var(--color-border)" }}>
                    Employee & Baseline
                  </th>
                  {weekDays.map((wd) => (
                    <th
                      key={wd.dateString}
                      style={{
                        padding: "0.75rem 0.5rem",
                        textAlign: "center",
                        borderRight: "1px solid var(--color-border)",
                        backgroundColor: wd.isToday ? "rgba(255, 225, 124, 0.08)" : undefined,
                      }}
                    >
                      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 700 }}>
                        {wd.name.slice(0, 3)}
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-text)", marginTop: "2px" }}>
                        {wd.date.getDate()}
                      </div>
                      {wd.isToday && (
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "999px",
                            backgroundColor: "rgba(255, 225, 124, 0.2)",
                            color: "var(--color-primary-text)",
                            marginTop: "3px",
                          }}
                        >
                          Today
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((row, rIdx) => {
                  const emp = row.employmentRecord;
                  const empFullName = `${emp.user.first_name} ${emp.user.last_name}`;
                  const baselineSched = emp.workSchedule;

                  return (
                    <tr
                      key={emp.id}
                      style={{
                        borderBottom: rIdx < filteredRoster.length - 1 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      {/* Employee Column */}
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          position: "sticky",
                          left: 0,
                          backgroundColor: "var(--color-surface)",
                          zIndex: 1,
                          borderRight: "1px solid var(--color-border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 225, 124, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-primary-text)",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              flexShrink: 0,
                            }}
                          >
                            {emp.user.first_name[0]}
                            {emp.user.last_name[0]}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {empFullName}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                              {emp.position?.title || emp.department?.name || "Staff"}
                            </div>
                            {baselineSched ? (
                              <div style={{ fontSize: "0.7rem", color: "var(--color-primary-text)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "2px" }}>
                                <Clock size={10} />
                                {baselineSched.start_time} - {baselineSched.end_time}
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                No baseline schedule
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7 Day Shift Tiles */}
                      {weekDays.map((wd) => {
                        const customAssignment = row.assignments.find((a) => a.shift_date === wd.dateString);
                        const hasCustom = Boolean(customAssignment);
                        const isDayRest = customAssignment?.is_rest_day;
                        const effectiveSchedule = customAssignment?.workSchedule || (!hasCustom ? baselineSched : null);

                        return (
                          <td
                            key={wd.dateString}
                            onClick={() =>
                              handleOpenCellAssign(
                                emp.id,
                                empFullName,
                                wd.dateString,
                                customAssignment,
                                baselineSched?.id
                              )
                            }
                            style={{
                              padding: "0.5rem",
                              textAlign: "center",
                              borderRight: "1px solid var(--color-border)",
                              cursor: "pointer",
                              backgroundColor: wd.isToday ? "rgba(255, 225, 124, 0.03)" : undefined,
                            }}
                          >
                            {isDayRest ? (
                              /* Rest Day Tile */
                              <div
                                style={{
                                  position: "relative",
                                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                                  border: "1px solid rgba(245, 158, 11, 0.35)",
                                  borderRadius: "var(--radius-md, 8px)",
                                  padding: "0.45rem 0.25rem",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--color-warning-text, #f59e0b)", fontWeight: 700, fontSize: "0.75rem" }}>
                                  <Coffee size={12} />
                                  Rest Day
                                </div>
                                <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", display: "block", marginTop: "2px" }}>Off Duty</span>
                                {customAssignment && (
                                  <button
                                    onClick={(e) => handleDeleteAssignment(customAssignment.id, e)}
                                    style={{
                                      position: "absolute",
                                      top: "-6px",
                                      right: "-6px",
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      backgroundColor: "var(--color-danger, #ef4444)",
                                      color: "#fff",
                                      border: "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                    }}
                                    title="Revert to baseline"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ) : effectiveSchedule ? (
                              /* Active Shift Tile */
                              <div
                                style={{
                                  position: "relative",
                                  borderRadius: "var(--radius-md, 8px)",
                                  padding: "0.45rem 0.25rem",
                                  backgroundColor: hasCustom ? "rgba(255, 225, 124, 0.12)" : "var(--color-surface)",
                                  border: hasCustom ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--color-text)" }}>
                                  {effectiveSchedule.start_time} - {effectiveSchedule.end_time}
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    display: "block",
                                    marginTop: "2px",
                                    color: hasCustom ? "var(--color-primary)" : "var(--color-text-muted)",
                                  }}
                                >
                                  {hasCustom ? "Custom Shift" : "Baseline"}
                                </span>
                                {customAssignment && (
                                  <button
                                    onClick={(e) => handleDeleteAssignment(customAssignment.id, e)}
                                    style={{
                                      position: "absolute",
                                      top: "-6px",
                                      right: "-6px",
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      backgroundColor: "var(--color-danger, #ef4444)",
                                      color: "#fff",
                                      border: "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                    }}
                                    title="Revert to baseline"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* Unassigned Day */
                              <div
                                style={{
                                  borderRadius: "var(--radius-md, 8px)",
                                  border: "1px dashed var(--color-border)",
                                  padding: "0.45rem 0.25rem",
                                  fontSize: "0.72rem",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                + Unassigned
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= ACCESSIBLE SCHEDULE LIST VIEW ================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "rgba(255, 225, 124, 0.08)",
              border: "1px solid rgba(255, 225, 124, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.8rem",
              color: "var(--color-primary-text)",
            }}
          >
            <Info size={16} />
            <span>Accessible Schedule List View displays assignments in a linearized format optimized for screen readers and high contrast.</span>
          </div>

          {filteredRoster.map((row) => {
            const emp = row.employmentRecord;
            const empFullName = `${emp.user.first_name} ${emp.user.last_name}`;

            return (
              <div key={emp.id} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                      {empFullName}
                    </h3>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      {emp.position?.title || "Staff"} • {emp.department?.name || "General Department"}
                    </span>
                  </div>
                  {emp.workSchedule && (
                    <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                      Default: {emp.workSchedule.start_time} - {emp.workSchedule.end_time} ({emp.workSchedule.name})
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem" }}>
                  {weekDays.map((wd) => {
                    const customAssignment = row.assignments.find((a) => a.shift_date === wd.dateString);
                    const hasCustom = Boolean(customAssignment);
                    const isDayRest = customAssignment?.is_rest_day;
                    const effectiveSchedule = customAssignment?.workSchedule || (!hasCustom ? emp.workSchedule : null);

                    return (
                      <div
                        key={wd.dateString}
                        onClick={() =>
                          handleOpenCellAssign(
                            emp.id,
                            empFullName,
                            wd.dateString,
                            customAssignment,
                            emp.workSchedule?.id
                          )
                        }
                        style={{
                          padding: "0.75rem",
                          borderRadius: "var(--radius-md, 8px)",
                          border: wd.isToday ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{wd.name.slice(0, 3)}</span>
                          <span>{wd.date.getDate()}</span>
                        </div>

                        {isDayRest ? (
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-warning-text, #f59e0b)" }}>
                            ☕ Rest Day
                          </span>
                        ) : effectiveSchedule ? (
                          <div>
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text)" }}>
                              {effectiveSchedule.start_time} - {effectiveSchedule.end_time}
                            </div>
                            <span style={{ fontSize: "0.68rem", color: hasCustom ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                              {hasCustom ? "Custom" : "Baseline"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Unassigned</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SINGLE ASSIGNMENT MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Shift — ${selectedEmp?.name || "Employee"}`}
      >
        <form onSubmit={handleSaveSingleAssignment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--color-border)", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Employee:</span>
              <strong style={{ color: "var(--color-text)" }}>{selectedEmp?.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Date:</span>
              <strong style={{ color: "var(--color-primary-text)" }}>{selectedDate}</strong>
            </div>
          </div>

          {/* Rest Day Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text)" }}>
                Mark as Rest Day (Off Duty)
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                Employee is relieved of scheduled duty on this date.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isRestDay}
              onChange={(e) => setIsRestDay(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--color-warning, #f59e0b)" }}
            />
          </div>

          {/* Schedule Template Selector (if not rest day) */}
          {!isRestDay && (
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
                Work Schedule Template <span style={{ color: "var(--color-primary-text)" }}>*</span>
              </label>
              <select
                required
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px" }}
              >
                <option value="" disabled>Select shift schedule...</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} – {s.end_time}, {s.expected_hours} hrs)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
              Assignment Notes (Optional)
            </label>
            <input
              type="text"
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="e.g. Coverage for evening launch"
              className="input-field"
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
            <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={assignMutation.isPending} className="btn btn-primary">
              {assignMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Save Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* BULK ASSIGN MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Assign Shifts & Schedules"
      >
        <form onSubmit={handleExecuteBulkAssign} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            Apply a shift template or mark rest days across multiple employees and dates simultaneously.
          </p>

          {/* Employee Selection */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                Select Employees ({bulkSelectedEmpIds.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setBulkSelectedEmpIds(
                    bulkSelectedEmpIds.length === filteredRoster.length
                      ? []
                      : filteredRoster.map((r) => r.employmentRecord.id)
                  )
                }
                style={{ background: "none", border: "none", color: "var(--color-primary-text)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
              >
                {bulkSelectedEmpIds.length === filteredRoster.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md, 8px)", padding: "0.5rem" }}>
              {filteredRoster.map((r) => {
                const emp = r.employmentRecord;
                const isChecked = bulkSelectedEmpIds.includes(emp.id);
                return (
                  <label key={emp.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem", cursor: "pointer", fontSize: "0.8rem" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setBulkSelectedEmpIds((prev) =>
                          isChecked ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                        )
                      }
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                      {emp.user.first_name} {emp.user.last_name}
                    </span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.72rem" }}>({emp.user.email})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
              Select Dates of Current Week
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.35rem" }}>
              {weekDays.map((wd) => {
                const isSelected = bulkSelectedDates.includes(wd.dateString);
                return (
                  <button
                    type="button"
                    key={wd.dateString}
                    onClick={() =>
                      setBulkSelectedDates((prev) =>
                        isSelected ? prev.filter((d) => d !== wd.dateString) : [...prev, wd.dateString]
                      )
                    }
                    className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "0.4rem 0.2rem", minHeight: "auto", textAlign: "center", fontSize: "0.75rem" }}
                  >
                    <div style={{ fontWeight: 700 }}>{wd.name.slice(0, 3)}</div>
                    <div style={{ fontSize: "0.68rem" }}>{wd.date.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rest Day Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text)" }}>
              Mark as Rest Day for selected dates
            </span>
            <input
              type="checkbox"
              checked={bulkIsRestDay}
              onChange={(e) => setBulkIsRestDay(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--color-warning, #f59e0b)" }}
            />
          </div>

          {/* Schedule Template */}
          {!bulkIsRestDay && (
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
                Work Schedule Template <span style={{ color: "var(--color-primary-text)" }}>*</span>
              </label>
              <select
                required
                value={bulkScheduleId}
                onChange={(e) => setBulkScheduleId(e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px" }}
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} – {s.end_time})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={bulkAssignMutation.isPending} className="btn btn-primary">
              {bulkAssignMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Apply Bulk Shifts
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
