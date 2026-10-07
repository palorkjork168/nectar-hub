import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({
  requireAdmin = false,
  requireEmployee = false,
  requireJobSeeker = false,
  requireEmployer = false,
}: {
  requireAdmin?: boolean;
  requireEmployee?: boolean;
  requireJobSeeker?: boolean;
  requireEmployer?: boolean;
}) {
  const { user, isLoading, isAdmin, isEmployee, isJobSeeker, isEmployer } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="skeleton" style={{ width: "160px", height: "32px", borderRadius: "var(--radius-md)" }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "var(--color-danger, #ef4444)" }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary, #475569)", margin: "0 0 1.25rem 0" }}>
            You do not have administrative permissions to view this section.
          </p>
          <a href="/" className="btn btn-secondary">
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (requireEmployee && !isEmployee && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireJobSeeker && !isJobSeeker && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireEmployer && !isEmployer && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
