import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import {
  X,
  UserCheck,
  Building2,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface HireCandidateModalProps {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle?: string;
  companyName?: string;
  companyId?: string;
  onClose: () => void;
  onHired?: () => void;
}

export default function HireCandidateModal({
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyName,
  companyId,
  onClose,
  onHired,
}: HireCandidateModalProps) {
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [errorMsg, setErrorMsg] = useState("");

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<any[]>({
    queryKey: ["departments", companyId],
    queryFn: async () => (await api.get(`/departments/company/${companyId}`)).data.data,
    enabled: Boolean(companyId),
  });
  const { data: positions = [], isLoading: positionsLoading } = useQuery<any[]>({
    queryKey: ["positions", companyId],
    queryFn: async () => (await api.get(`/positions/company/${companyId}`)).data.data,
    enabled: Boolean(companyId),
  });
  const activeDepartments = departments.filter((department) => department.is_active !== false);
  const activePositions = positions.filter((position) => position.is_active !== false);
  const compatiblePositions = departmentId
    ? activePositions.filter((position) => !position.department_id || position.department_id === departmentId)
    : activePositions;

  const hireMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/applications/${applicationId}/hire`, {
        departmentId: departmentId || null,
        positionId: positionId || null,
        employmentType,
        startDate,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicantDetails", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (onHired) onHired();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to hire candidate");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    hireMutation.mutate();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
                Hire Candidate
              </h3>
              <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Convert accepted candidate to an employee
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" disabled={hireMutation.isPending}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {errorMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--danger)",
                  fontSize: "0.8125rem",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Candidate Summary Card */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-color)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Candidate
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "var(--success)",
                  }}
                >
                  ACCEPTED
                </span>
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-main)" }}>
                {candidateName}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {candidateEmail}
              </div>

              {(jobTitle || companyName) && (
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "0.5rem",
                    marginTop: "0.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {jobTitle && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Briefcase size={13} style={{ color: "var(--primary)" }} />
                      <span>{jobTitle}</span>
                    </div>
                  )}
                  {companyName && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Building2 size={13} style={{ color: "var(--primary)" }} />
                      <span>{companyName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Architectural Guarantee Notice */}
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(37, 99, 235, 0.04)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(37, 99, 235, 0.2)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: "var(--text-main)",
                display: "flex",
                gap: "0.65rem",
              }}
            >
              <ShieldCheck size={18} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.1rem" }} />
              <div>
                <strong>Single Account Architecture:</strong> This candidate's existing Sakol Universe account will receive the <strong>Employee</strong> role alongside their <strong>Job Seeker</strong> role. No duplicate account is created.
              </div>
            </div>

            {/* Structured employment fields */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="department" style={{ fontSize: "0.8125rem" }}>
                Assigned Department (Optional)
              </label>
              <select
                id="department"
                className="form-input"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  if (positionId && !activePositions.some((position) => position.id === positionId && (!e.target.value || !position.department_id || position.department_id === e.target.value))) setPositionId("");
                }}
                disabled={hireMutation.isPending || departmentsLoading || !companyId}
              >
                <option value="">{departmentsLoading ? "Loading departments..." : "No department"}</option>
                {activeDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                Stored on the company employment record; legacy profile text is mirrored only for compatibility.
              </span>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="position" style={{ fontSize: "0.8125rem" }}>Position (Optional)</label>
              <select id="position" className="form-input" value={positionId} disabled={hireMutation.isPending || positionsLoading || !companyId} onChange={(e) => {
                const selected = activePositions.find((position) => position.id === e.target.value);
                setPositionId(e.target.value);
                if (selected?.department_id) setDepartmentId(selected.department_id);
              }}>
                <option value="">{positionsLoading ? "Loading positions..." : "No position"}</option>
                {compatiblePositions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="employment-type" style={{ fontSize: "0.8125rem" }}>Employment Type</label>
              <select id="employment-type" className="form-input" value={employmentType} disabled={hireMutation.isPending} onChange={(e) => setEmploymentType(e.target.value)}>
                <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option><option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="start-date" style={{ fontSize: "0.8125rem" }}>Start Date</label>
              <input id="start-date" type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={hireMutation.isPending} required />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={hireMutation.isPending || !companyId || departmentsLoading || positionsLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={hireMutation.isPending}
              style={{
                backgroundColor: "var(--success)",
                borderColor: "var(--success)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {hireMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Hiring...</span>
                </>
              ) : (
                <>
                  <UserCheck size={15} />
                  <span>Confirm & Hire Candidate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
