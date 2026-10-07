import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import EmployeeTable from "./components/EmployeeTable";
import EditEmployeeModal from "./components/EditEmployeeModal";
import EditRoleModal from "./components/EditRoleModal";
import EmployeeDetailsModal from "./components/EmployeeDetailsModal";
import {
  LogOut,
  Search,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import type { Employee } from "../../types/employee";
import BackButton from "../../components/common/BackButton";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function EmployeeManagement() {
  const { logout, user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [roleEditingEmployee, setRoleEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await api.get("/employees");
      return response.data.data.employees as Employee[];
    },
  });

  // Derived Statistics
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, recent: 0 };
    const active = data.filter((e) => e.status === "ACTIVE").length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = data.filter((e) => new Date(e.created_at) > thirtyDaysAgo).length;
    return { total: data.length, active, recent };
  }, [data]);

  // Filtering (resets to page 1 when search/filter changes)
  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = filteredEmployees.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const firstItem = filteredEmployees.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, filteredEmployees.length);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  // Pagination page numbers to display (smart ellipsis)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (safePage > 3) pages.push("...");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="dashboard-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <BackButton label="Back to Dashboard" fallback="/admin/dashboard" style={{ marginBottom: 0 }} />
        <div className="breadcrumb" style={{ margin: 0 }}>
          Dashboard <ChevronRight size={14} />{" "}
          <span style={{ color: "var(--text-main)", fontWeight: 500 }}>User Management</span>
        </div>
      </div>

      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">User Management</h1>
          <p className="dashboard-subtitle">
            Manage platform user accounts, global roles, and account status. Company workforce data is managed in the
            Employer workspace.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Welcome, <strong>{user?.first_name}</strong>
          </span>
          <button onClick={logout} className="btn btn-secondary">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={16} /> Total Users
          </h3>
          <div className="card-value">
            {isLoading ? <div className="skeleton" style={{ height: "2rem", width: "50px" }} /> : stats.total}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={16} /> Active Users
          </h3>
          <div className="card-value">
            {isLoading ? <div className="skeleton" style={{ height: "2rem", width: "50px" }} /> : stats.active}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} /> Joined Recently
          </h3>
          <div className="card-value">
            {isLoading ? <div className="skeleton" style={{ height: "2rem", width: "50px" }} /> : stats.recent}
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="filter-bar">
        <div className="input-group">
          <Search size={16} className="input-group-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ width: "250px" }}
            aria-label="Search users"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
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
                alignItems: "center",
                padding: "0.25rem",
                borderRadius: "var(--radius-sm)",
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {(search || statusFilter !== "ALL") && (
          <button onClick={handleClearFilters} className="btn btn-ghost" style={{ fontSize: "0.8125rem" }}>
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isLoading && !isError && (
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
              {filteredEmployees.length === 0
                ? "No users"
                : `Showing ${firstItem}–${lastItem} of ${filteredEmployees.length} users`}
            </span>
          )}

          {/* Page size selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              htmlFor="page-size-select"
              style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}
            >
              Per page
            </label>
            <select
              id="page-size-select"
              className="input-field"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{ width: "80px", padding: "0.375rem 0.5rem" }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0 }} />
                      <div>
                        <div className="skeleton" style={{ height: "14px", width: "140px", marginBottom: "0.375rem" }} />
                        <div className="skeleton" style={{ height: "12px", width: "100px" }} />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton" style={{ height: "22px", width: "60px", borderRadius: "12px" }} /></td>
                  <td><div className="skeleton" style={{ height: "14px", width: "80px" }} /></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Failed to load users</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
            An error occurred while communicating with the server.
          </p>
          <button onClick={() => refetch()} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={32} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>No users found</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
            {data?.length === 0
              ? "There are no platform user accounts yet."
              : "No employees match your current search and filter criteria."}
          </p>
          {data?.length !== 0 && (
            <button onClick={handleClearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <EmployeeTable
            employees={paginatedEmployees}
            onEdit={(emp) => setEditingEmployee(emp)}
            onEditRole={(emp) => setRoleEditingEmployee(emp)}
            onView={(emp) => setViewingEmployee(emp)}
            refetch={refetch}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.25rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
              role="navigation"
              aria-label="Pagination"
            >
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Page {safePage} of {totalPages}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="btn btn-secondary btn-sm"
                  aria-label="Previous page"
                  style={{ padding: "0.4rem 0.75rem" }}
                >
                  <ChevronLeft size={16} />
                  <span style={{ marginLeft: "0.25rem" }}>Prev</span>
                </button>

                {/* Page Numbers */}
                {pageNumbers.map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: "0 0.5rem",
                        color: "var(--color-text-muted)",
                        userSelect: "none",
                      }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn btn-sm ${page === safePage ? "btn-primary" : "btn-ghost"}`}
                      aria-label={`Page ${page}`}
                      aria-current={page === safePage ? "page" : undefined}
                      style={{ minWidth: "36px", padding: "0.4rem" }}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="btn btn-secondary btn-sm"
                  aria-label="Next page"
                  style={{ padding: "0.4rem 0.75rem" }}
                >
                  <span style={{ marginRight: "0.25rem" }}>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => {
            setEditingEmployee(null);
            refetch();
          }}
        />
      )}

      {roleEditingEmployee && (
        <EditRoleModal
          employee={roleEditingEmployee}
          onClose={() => setRoleEditingEmployee(null)}
          onSuccess={() => {
            setRoleEditingEmployee(null);
            refetch();
          }}
        />
      )}

      {viewingEmployee && (
        <EmployeeDetailsModal employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />
      )}
    </div>
  );
}
