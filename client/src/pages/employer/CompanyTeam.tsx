import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import {
  Users,
  ShieldAlert,
  Search,
  Plus,
  Building2,
  X,
} from "lucide-react";

interface CompanyUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  status: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  company_id: string;
  user: CompanyUser;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  employment_type?: string | null;
  start_date: string;
  status: string;
  is_owner: boolean;
  company_roles: {
    id: string;
    role_id: string;
    role_name: string;
    description?: string;
  }[];
}

export default function CompanyTeam() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [roleModalMember, setRoleModalMember] = useState<TeamMember | null>(null);
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState("HR");


  // 1. Fetch Employer's primary company
  const { data: companies, isLoading: companyLoading } = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => {
      const res = await api.get("/companies/my");
      return res.data.data;
    },
  });

  const currentCompany = companies && companies.length > 0 ? companies[0] : null;

  // 2. Fetch Team Members for this company
  const { data: teamData, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ["company", currentCompany?.id, "team"],
    queryFn: async () => {
      const res = await api.get(`/companies/${currentCompany.id}/team`);
      return res.data.data.team as TeamMember[];
    },
    enabled: !!currentCompany?.id,
  });

  // Assign Role Mutation
  const assignMutation = useMutation({
    mutationFn: async ({ memberId, roleName }: { memberId: string; roleName: string }) => {
      const res = await api.post(`/companies/${currentCompany.id}/team/roles`, {
        user_id: memberId,
        role_name: roleName,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Company role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["company", currentCompany?.id, "team"] });
      setRoleModalMember(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign role");
    },
  });

  // Remove Role Mutation
  const removeMutation = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const res = await api.delete(`/companies/${currentCompany.id}/team/roles/${assignmentId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["company", currentCompany?.id, "team"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove role");
    },
  });

  const filteredTeam = useMemo(() => {
    if (!teamData) return [];
    return teamData.filter((member) => {
      const name = `${member.user.first_name} ${member.user.last_name}`.toLowerCase();
      const email = member.user.email.toLowerCase();
      const s = search.toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  }, [teamData, search]);

  const handleAssignRole = () => {
    if (!roleModalMember) return;
    assignMutation.mutate({
      memberId: roleModalMember.user_id,
      roleName: selectedRoleToAssign,
    });
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case "HR":
        return { bg: "rgba(37, 99, 235, 0.1)", text: "#2563eb", border: "rgba(37, 99, 235, 0.2)" };
      case "RECRUITER":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#059669", border: "rgba(16, 185, 129, 0.2)" };
      case "MANAGER":
        return { bg: "rgba(147, 51, 234, 0.1)", text: "#7c3aed", border: "rgba(147, 51, 234, 0.2)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.1)", text: "#4b5563", border: "rgba(107, 114, 128, 0.2)" };
    }
  };

  if (companyLoading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto" }}>
        <div className="skeleton" style={{ width: "200px", height: "32px", marginBottom: "1rem" }} />
        <div className="skeleton" style={{ width: "100%", height: "300px" }} />
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <Building2 size={48} style={{ color: "var(--color-text-muted)", margin: "0 auto 1rem" }} />
        <h2>No Company Profile Found</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Please register or create a company profile first to manage team members and company roles.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "var(--color-text)" }}>
              Company Team & Roles
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.2rem 0.6rem",
                borderRadius: "12px",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "var(--color-primary)",
              }}
            >
              {currentCompany.name}
            </span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", margin: "0.25rem 0 0 0", fontSize: "0.9375rem" }}>
            Manage company-scoped organizational roles (HR, Manager, Recruiter). All active workers are listed separately in Company Employees.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", width: "280px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", height: "40px" }}
          />
        </div>
      </div>

      {/* Team Table / List */}
      {teamLoading ? (
        <div className="card" style={{ padding: "2rem" }}>
          <div className="skeleton" style={{ width: "100%", height: "48px", marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "100%", height: "48px", marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "100%", height: "48px" }} />
        </div>
      ) : teamError ? (
        <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-danger)" }}>
          <ShieldAlert size={40} style={{ margin: "0 auto 1rem" }} />
          <h3>Error loading company team</h3>
          <p>You may not have authorization to view this company's team.</p>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <Users size={48} style={{ color: "var(--color-text-muted)", margin: "0 auto 1rem" }} />
          <h3>No team members found</h3>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "450px", margin: "0 auto" }}>
            Hired candidates converted into employees will automatically appear here. You can then assign them HR, Recruiter, or Manager roles.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-surface-muted)",
                    borderBottom: "1px solid var(--color-border)",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "1rem 1.25rem" }}>Employee</th>
                  <th style={{ padding: "1rem 1.25rem" }}>Department & Position</th>
                  <th style={{ padding: "1rem 1.25rem" }}>Company Roles</th>
                  <th style={{ padding: "1rem 1.25rem" }}>Status</th>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((member) => {
                  const isOwner = member.is_owner;
                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* User Info */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "var(--color-primary-soft)",
                              color: "var(--color-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              border: "1px solid rgba(37, 99, 235, 0.2)",
                            }}
                          >
                            {member.user.first_name.charAt(0)}
                            {member.user.last_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.9375rem" }}>
                                {member.user.first_name} {member.user.last_name}
                              </span>
                              {isOwner && (
                                <span
                                  style={{
                                    fontSize: "0.6875rem",
                                    fontWeight: 700,
                                    padding: "0.15rem 0.4rem",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(234, 88, 12, 0.1)",
                                    color: "#ea580c",
                                  }}
                                >
                                  Owner
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Position */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>
                          {member.position?.title || "Not Assigned"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {member.department?.name || "General"}
                        </div>
                      </td>

                      {/* Company Roles Badges */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
                          {isOwner && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "0.25rem 0.5rem",
                                borderRadius: "8px",
                                backgroundColor: "rgba(234, 88, 12, 0.1)",
                                color: "#ea580c",
                                border: "1px solid rgba(234, 88, 12, 0.2)",
                              }}
                            >
                              EMPLOYER
                            </span>
                          )}

                          {member.company_roles.map((cr) => {
                            const badge = getRoleBadgeColor(cr.role_name);
                            return (
                              <span
                                key={cr.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "8px",
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {cr.role_name}
                                <button
                                  type="button"
                                  onClick={() => removeMutation.mutate({ assignmentId: cr.id })}
                                  title={`Revoke ${cr.role_name}`}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    color: badge.text,
                                    opacity: 0.7,
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}

                          {!isOwner && member.company_roles.length === 0 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              Employee (Standard)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.25rem 0.5rem",
                            borderRadius: "12px",
                            backgroundColor:
                              member.status === "ACTIVE"
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
                            color: member.status === "ACTIVE" ? "#059669" : "#dc2626",
                          }}
                        >
                          {member.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setRoleModalMember(member)}
                          className="btn btn-sm btn-secondary"
                          style={{ gap: "0.375rem" }}
                        >
                          <Plus size={14} />
                          <span>Assign Role</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {roleModalMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Assign Company Role</h3>
              <button
                type="button"
                onClick={() => setRoleModalMember(null)}
                className="btn btn-ghost btn-icon-only"
                style={{ borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              Assign an organizational role to{" "}
              <strong>
                {roleModalMember.user.first_name} {roleModalMember.user.last_name}
              </strong>{" "}
              within <strong>{currentCompany.name}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                {
                  role: "HR",
                  title: "HR Specialist",
                  desc: "Can manage employees, departments, positions, and review leave requests.",
                },
                {
                  role: "RECRUITER",
                  title: "Recruiter",
                  desc: "Can create and manage jobs, review applicants, and schedule candidate interviews.",
                },
                {
                  role: "MANAGER",
                  title: "Team Manager",
                  desc: "Can view department employees and review leave requests.",
                },
              ].map((item) => (
                <label
                  key={item.role}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.875rem",
                    borderRadius: "8px",
                    border:
                      selectedRoleToAssign === item.role
                        ? "2px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    backgroundColor:
                      selectedRoleToAssign === item.role
                        ? "rgba(37, 99, 235, 0.05)"
                        : "var(--color-surface)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="companyRole"
                    value={item.role}
                    checked={selectedRoleToAssign === item.role}
                    onChange={() => setSelectedRoleToAssign(item.role)}
                    style={{ marginTop: "0.25rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.9375rem" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.125rem" }}>
                      {item.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setRoleModalMember(null)}
                className="btn btn-secondary"
                disabled={assignMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignRole}
                className="btn btn-primary"
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm Role Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
