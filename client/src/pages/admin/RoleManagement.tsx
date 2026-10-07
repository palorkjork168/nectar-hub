import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Briefcase,
  Building2,
  Check,
  X,
  Lock,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Settings,
  Search,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
  is_system_core: boolean;
  is_company_role: boolean;
  permission_count: number;
  user_count: number;
  company_assignment_count: number;
  permissions: { id: string; name: string; category: string }[];
}

const CATEGORY_META: Record<string, { label: string; description: string; icon: any; color: string; colorBg: string }> = {
  company: {
    label: "Company & Organization",
    description: "Company profile, settings, and organizational data",
    icon: Building2,
    color: "#2563eb",
    colorBg: "rgba(37, 99, 235, 0.08)",
  },
  jobs: {
    label: "Jobs & Postings",
    description: "Create, edit, and manage job listings",
    icon: Briefcase,
    color: "#059669",
    colorBg: "rgba(5, 150, 105, 0.08)",
  },
  applicants: {
    label: "Candidates & Applications",
    description: "View resumes, advance application pipelines",
    icon: Users,
    color: "#d97706",
    colorBg: "rgba(217, 119, 6, 0.08)",
  },
  interviews: {
    label: "Interviews",
    description: "Schedule, manage, and cancel interviews",
    icon: Calendar,
    color: "#7c3aed",
    colorBg: "rgba(124, 58, 237, 0.08)",
  },
  employees: {
    label: "Workforce & Employees",
    description: "View and manage employee profiles and records",
    icon: Users,
    color: "#0891b2",
    colorBg: "rgba(8, 145, 178, 0.08)",
  },
  attendance: {
    label: "Attendance Tracking",
    description: "View and manage workforce attendance data",
    icon: Clock,
    color: "#ea580c",
    colorBg: "rgba(234, 88, 12, 0.08)",
  },
  leave: {
    label: "Leave Management",
    description: "Request, review, and manage leave policies",
    icon: Calendar,
    color: "#4f46e5",
    colorBg: "rgba(79, 70, 229, 0.08)",
  },
  departments: {
    label: "Departments",
    description: "Create and manage company departments",
    icon: Building2,
    color: "#0284c7",
    colorBg: "rgba(2, 132, 199, 0.08)",
  },
  positions: {
    label: "Positions & Titles",
    description: "Manage job positions and organizational titles",
    icon: Layers,
    color: "#6366f1",
    colorBg: "rgba(99, 102, 241, 0.08)",
  },
  admin: {
    label: "System Administration",
    description: "Global user management and role governance",
    icon: Settings,
    color: "#dc2626",
    colorBg: "rgba(220, 38, 38, 0.08)",
  },
};

const PERMISSION_FRIENDLY_NAMES: Record<string, string> = {
  "company.view": "View Company Profile",
  "company.update": "Update Company Details",
  "jobs.view": "Browse Job Listings",
  "jobs.create": "Create Job Postings",
  "jobs.update": "Edit Job Postings",
  "jobs.close": "Close & Delist Jobs",
  "applicants.view": "View Applications & Resumes",
  "applicants.update_status": "Advance Application Pipeline",
  "interviews.view": "View Scheduled Interviews",
  "interviews.schedule": "Schedule Candidate Interviews",
  "interviews.update": "Reschedule & Edit Interviews",
  "interviews.cancel": "Cancel Interviews",
  "employees.view": "View Employee Profiles",
  "employees.manage": "Manage Employee Records",
  "attendance.view_own": "View Own Attendance",
  "attendance.manage": "Manage Workforce Attendance",
  "leave.request": "Submit Leave Requests",
  "leave.view_own": "View Own Leave Balance",
  "leave.review": "Review & Approve Leave",
  "leave.policy_manage": "Manage Leave Types & Policies",
  "departments.manage": "Manage Departments",
  "positions.manage": "Manage Job Positions",
  "users.manage": "Global User Management",
  "roles.manage": "Governance & Role Configuration",
};

const PERMISSION_SHORT_DESC: Record<string, string> = {
  "company.view": "Read company profile, industry, and contact details",
  "company.update": "Edit company name, description, logo, and settings",
  "jobs.view": "See all active and closed job listings",
  "jobs.create": "Post new job openings to the platform",
  "jobs.update": "Modify existing job titles, requirements, and details",
  "jobs.close": "Archive or delist job postings",
  "applicants.view": "Access candidate applications and submitted resumes",
  "applicants.update_status": "Move candidates through the hiring pipeline stages",
  "interviews.view": "See all scheduled interviews and participants",
  "interviews.schedule": "Book interview slots with candidates",
  "interviews.update": "Change interview times, locations, or participants",
  "interviews.cancel": "Cancel scheduled interviews",
  "employees.view": "Access employee profiles, contact info, and history",
  "employees.manage": "Edit employee data, contracts, and employment status",
  "attendance.view_own": "View personal clock-in/out records",
  "attendance.manage": "Manage attendance records for the entire workforce",
  "leave.request": "Submit personal leave applications",
  "leave.view_own": "Check personal leave balance and history",
  "leave.review": "Approve or reject leave requests from employees",
  "leave.policy_manage": "Create and configure leave types and accrual policies",
  "departments.manage": "Add, rename, or remove company departments",
  "positions.manage": "Define and maintain organizational job positions",
  "users.manage": "Create, suspend, and manage platform user accounts",
  "roles.manage": "Configure role permissions across the system",
};

// PermissionConfigModal — extracted for cleanliness
function PermissionConfigModal({
  role,
  permsData,
  onClose,
  onSave,
  isSaving,
}: {
  role: RoleData;
  permsData: { permissions: Permission[]; grouped: Record<string, Permission[]> };
  onClose: () => void;
  onSave: (permissions: string[]) => void;
  isSaving: boolean;
}) {
  useBodyScrollLock(true);

  const [editedPermissions, setEditedPermissions] = useState<string[]>(
    role.permissions ? role.permissions.map((p) => p.name) : []
  );
  const [permSearch, setPermSearch] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const isLocked = (permName: string) =>
    role.name === "ADMIN" && (permName === "roles.manage" || permName === "users.manage");

  const handleToggle = (permName: string) => {
    if (isLocked(permName)) return;
    setEditedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSelectAll = (category: string) => {
    const perms = permsData.grouped[category] || [];
    const unlocked = perms.filter((p) => !isLocked(p.name)).map((p) => p.name);
    const allSelected = unlocked.every((n) => editedPermissions.includes(n));
    if (allSelected) {
      setEditedPermissions((prev) => prev.filter((p) => !unlocked.includes(p)));
    } else {
      setEditedPermissions((prev) => Array.from(new Set([...prev, ...unlocked])));
    }
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const toggleAllCollapse = () => {
    const allCategories = Object.keys(permsData.grouped);
    const hasAnyOpen = allCategories.some((cat) => !collapsedCategories[cat]);
    const nextState: Record<string, boolean> = {};
    allCategories.forEach((cat) => {
      nextState[cat] = hasAnyOpen;
    });
    setCollapsedCategories(nextState);
  };

  // Filtered grouped permissions
  const filteredGrouped = useMemo(() => {
    let baseGrouped = permsData.grouped;
    if (selectedCategoryTab !== "ALL") {
      baseGrouped = { [selectedCategoryTab]: permsData.grouped[selectedCategoryTab] || [] };
    }

    if (!permSearch.trim()) return baseGrouped;
    const q = permSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [cat, perms] of Object.entries(baseGrouped)) {
      const matched = perms.filter(
        (p) =>
          (PERMISSION_FRIENDLY_NAMES[p.name] || p.name).toLowerCase().includes(q) ||
          (PERMISSION_SHORT_DESC[p.name] || "").toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[cat] = matched;
    }
    return result;
  }, [permsData.grouped, permSearch, selectedCategoryTab]);

  const totalSelected = editedPermissions.length;
  const totalAvailable = permsData.permissions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const categories = Object.keys(permsData.grouped);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 12, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        animation: "modalFadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-modal-title"
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
          animation: "modalSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
              <h2
                id="perm-modal-title"
                style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--color-text)" }}
              >
                Configure Permissions
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.625rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: role.is_system_core
                    ? "rgba(37, 99, 235, 0.1)"
                    : "rgba(124, 58, 237, 0.1)",
                  color: role.is_system_core ? "#2563eb" : "#7c3aed",
                }}
              >
                {role.name}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "0.2rem 0.625rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {totalSelected} / {totalAvailable} permissions enabled
              </span>
            </div>
            <p style={{ margin: "0.375rem 0 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              {role.description || "Configure fine-grained domain permissions for this role."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close permission editor"
            style={{ flexShrink: 0, marginTop: "0.125rem" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Pills Bar */}
        <div
          style={{
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
            backgroundColor: "var(--color-surface-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Top Search Line */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "420px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search permissions or categories..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: "2.25rem",
                  paddingRight: permSearch ? "2rem" : "0.75rem",
                  height: "38px",
                  fontSize: "0.875rem",
                }}
                aria-label="Search permissions"
              />
              {permSearch && (
                <button
                  type="button"
                  onClick={() => setPermSearch("")}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    padding: "0.25rem",
                    borderRadius: "var(--radius-sm)",
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={toggleAllCollapse}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}
            >
              Toggle Expand / Collapse
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
              scrollbarWidth: "thin",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategoryTab("ALL")}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: selectedCategoryTab === "ALL"
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                backgroundColor: selectedCategoryTab === "ALL"
                  ? "var(--color-primary-soft)"
                  : "var(--color-surface)",
                color: selectedCategoryTab === "ALL"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)",
              }}
            >
              All Categories ({totalAvailable})
            </button>

            {categories.map((cat) => {
              const meta = CATEGORY_META[cat] || { label: cat.toUpperCase() };
              const count = permsData.grouped[cat]?.length || 0;
              const isSelected = selectedCategoryTab === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.75rem",
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                    backgroundColor: isSelected
                      ? "var(--color-primary-soft)"
                      : "var(--color-surface)",
                    color: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Permission Groups */}
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            backgroundColor: "var(--color-bg)",
          }}
        >
          {Object.keys(filteredGrouped).length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--color-text-muted)",
              }}
            >
              <Search size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No permissions match &ldquo;{permSearch}&rdquo;</p>
            </div>
          ) : (
            Object.entries(filteredGrouped).map(([category, perms]) => {
              const meta = CATEGORY_META[category] || {
                label: category.toUpperCase(),
                description: "",
                icon: Shield,
                color: "#6b7280",
                colorBg: "rgba(107, 114, 128, 0.08)",
              };
              const Icon = meta.icon;
              const selectedInCategory = perms.filter((p) => editedPermissions.includes(p.name)).length;
              const unlockedPerms = perms.filter((p) => !isLocked(p.name));
              const allUnlockedSelected = unlockedPerms.length > 0 && unlockedPerms.every((p) => editedPermissions.includes(p.name));

              const isCollapsed = Boolean(collapsedCategories[category]);

              return (
                <div
                  key={category}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    backgroundColor: "var(--color-surface)",
                    flexShrink: 0, // CRITICAL: prevents cards from squishing to 0 height!
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Category Header */}
                  <div
                    style={{
                      padding: "0.875rem 1.25rem",
                      backgroundColor: meta.colorBg || "var(--color-surface-muted)",
                      borderBottom: isCollapsed ? "none" : "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onClick={() => toggleCategoryCollapse(category)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid var(--color-border)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                        }}
                      >
                        <Icon size={18} color={meta.color || "#10b981"} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)" }}>
                          {meta.label}
                        </div>
                        {meta.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.1rem" }}>
                            {meta.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: selectedInCategory > 0 ? "var(--color-primary)" : "var(--color-text-muted)",
                          backgroundColor: "var(--color-surface)",
                          padding: "0.2rem 0.625rem",
                          borderRadius: "var(--radius-full)",
                          border: "1px solid var(--color-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedInCategory} / {perms.length} enabled
                      </span>

                      {unlockedPerms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAll(category)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text)",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          title={allUnlockedSelected ? "Deselect all" : "Select all"}
                        >
                          {allUnlockedSelected ? (
                            <><CheckSquare size={13} /> Deselect all</>
                          ) : (
                            <><Square size={13} /> Select all</>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(category)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "0.25rem",
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label={isCollapsed ? "Expand category" : "Collapse category"}
                      >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Permission Items Grid */}
                  {!isCollapsed && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "0.625rem",
                        padding: "1rem",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {perms.map((perm) => {
                        const isChecked = editedPermissions.includes(perm.name);
                        const locked = isLocked(perm.name);
                        const friendlyTitle = PERMISSION_FRIENDLY_NAMES[perm.name] || perm.name;
                        const shortDesc = PERMISSION_SHORT_DESC[perm.name] || perm.description;

                        return (
                          <label
                            key={perm.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              padding: "0.75rem 0.875rem",
                              borderRadius: "var(--radius-md)",
                              border: isChecked
                                ? "1.5px solid rgba(16, 185, 129, 0.45)"
                                : "1.5px solid var(--color-border)",
                              backgroundColor: isChecked ? "rgba(16, 185, 129, 0.06)" : "var(--color-surface)",
                              cursor: locked ? "not-allowed" : "pointer",
                              opacity: locked ? 0.75 : 1,
                              transition: "all var(--transition-fast)",
                              userSelect: "none",
                            }}
                          >
                            {/* Custom Checkbox */}
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: isChecked ? "2px solid #10b981" : "2px solid var(--color-border-strong)",
                                backgroundColor: isChecked ? "#10b981" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "0.125rem",
                                transition: "all var(--transition-fast)",
                              }}
                            >
                              {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                            </div>

                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={locked}
                              onChange={() => handleToggle(perm.name)}
                              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                              aria-label={friendlyTitle}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                <span
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "var(--color-text)",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {friendlyTitle}
                                </span>
                                {locked && (
                                  <span
                                    title="System core permission — protected for ADMIN"
                                    style={{ display: "inline-flex", alignItems: "center" }}
                                  >
                                    <Lock size={12} color="var(--color-text-muted)" />
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                                {perm.name}
                              </div>
                              {shortDesc && (
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-text-secondary)",
                                    marginTop: "0.25rem",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {shortDesc}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            backgroundColor: "var(--color-surface)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {totalSelected} of {totalAvailable} permissions enabled
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(editedPermissions)}
              className="btn btn-primary"
              disabled={isSaving}
              style={{ gap: "0.5rem" }}
            >
              {isSaving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Check size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

  // Fetch all roles
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await api.get("/admin/roles");
      return res.data.data.roles as RoleData[];
    },
  });

  // Fetch all permissions grouped
  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => {
      const res = await api.get("/admin/permissions");
      return res.data.data as { permissions: Permission[]; grouped: Record<string, Permission[]> };
    },
  });

  // Mutation to update permissions
  const updateMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissionNames,
    }: {
      roleId: string;
      permissionNames: string[];
    }) => {
      const res = await api.put(`/admin/roles/${roleId}/permissions`, {
        permission_names: permissionNames,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role permissions updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      setSelectedRole(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update role permissions");
    },
  });

  const handleSave = (permissions: string[]) => {
    if (!selectedRole) return;
    updateMutation.mutate({ roleId: selectedRole.id, permissionNames: permissions });
  };

  const stats = useMemo(() => {
    if (!rolesData) return { totalRoles: 0, coreRoles: 0, companyRoles: 0, totalPerms: 0 };
    const core = rolesData.filter((r) => r.is_system_core).length;
    const company = rolesData.filter((r) => r.is_company_role).length;
    const perms = permsData?.permissions.length || 0;
    return { totalRoles: rolesData.length, coreRoles: core, companyRoles: company, totalPerms: perms };
  }, [rolesData, permsData]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Roles & Permissions Governance
            </h1>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.25rem 0 0 0", fontSize: "0.9375rem" }}>
              Configure domain permissions for global system roles and company-scoped roles.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { icon: Shield, color: "#2563eb", bg: "rgba(37, 99, 235, 0.1)", label: "Total Roles", value: rolesLoading ? "..." : stats.totalRoles },
          { icon: Lock, color: "#059669", bg: "rgba(16, 185, 129, 0.1)", label: "Core System Roles", value: rolesLoading ? "..." : stats.coreRoles },
          { icon: Building2, color: "#7c3aed", bg: "rgba(147, 51, 234, 0.1)", label: "Company Roles", value: rolesLoading ? "..." : stats.companyRoles },
          { icon: Sparkles, color: "#d97706", bg: "rgba(217, 119, 6, 0.1)", label: "Domain Permissions", value: permsLoading ? "..." : stats.totalPerms },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Grid */}
      {rolesLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card" style={{ padding: "1.5rem", height: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
                <div className="skeleton" style={{ width: "55%", height: "20px" }} />
              </div>
              <div className="skeleton" style={{ width: "90%", height: "14px", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ width: "70%", height: "14px", marginBottom: "1.25rem" }} />
              <div className="skeleton" style={{ width: "100%", height: "36px", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      ) : rolesError ? (
        <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-danger)" }}>
          <ShieldAlert size={40} style={{ margin: "0 auto 1rem" }} />
          <h3>Failed to load roles</h3>
          <p>Please ensure the backend server is online.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {rolesData?.map((role) => {
            const isSystem = role.is_system_core;
            const isSelected = selectedRole?.id === role.id;

            return (
              <div
                key={role.id}
                className="card"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  position: "relative",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: isSystem ? "rgba(37, 99, 235, 0.1)" : "rgba(147, 51, 234, 0.1)",
                          color: isSystem ? "#2563eb" : "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {role.name === "ADMIN" ? <ShieldCheck size={20} /> : isSystem ? <Lock size={18} /> : <Building2 size={18} />}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text)" }}>
                          {role.name}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {isSystem ? "Global System Role" : "Company-Scoped Role"}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        backgroundColor: isSystem ? "rgba(37, 99, 235, 0.1)" : "rgba(147, 51, 234, 0.1)",
                        color: isSystem ? "#2563eb" : "#7c3aed",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isSystem ? "Core" : "Company"}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "0.875rem",
                      minHeight: "40px",
                      margin: "0 0 1rem 0",
                      lineHeight: "1.5",
                    }}
                  >
                    {role.description || "No description provided."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "1.25rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--color-surface-muted)",
                      borderRadius: "8px",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Permissions
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                        {role.permission_count}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {isSystem ? "Global Users" : "Assignments"}
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                        {isSystem ? role.user_count : role.company_assignment_count}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <Settings size={16} />
                  <span>Configure Permissions</span>
                  <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Permission Configuration Modal */}
      {selectedRole && permsData && (
        <PermissionConfigModal
          role={selectedRole}
          permsData={permsData}
          onClose={() => setSelectedRole(null)}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  );
}
