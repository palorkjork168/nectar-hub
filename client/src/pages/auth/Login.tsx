import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { Loader2, Lock, Mail, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { NectarIcon } from "../../components/brand/NectarLogo";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const redirect = searchParams.get("redirect");
  const isRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSafeRedirect = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith("/") && !url.startsWith("//");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data?.data?.token;
      const user = response.data?.data?.user;

      if (!token || !user) {
        throw new Error("Invalid response format from server");
      }

      login(token, user);

      // Safe return redirection
      if (isSafeRedirect(redirect)) {
        navigate(redirect!);
        return;
      }

      // Default role-based redirection
      const roles = user.roles || [];
      const hasRole = (roleName: string) =>
        roles.some((r: any) => (typeof r === "string" ? r === roleName : r?.name === roleName));

      if (hasRole("ADMIN")) {
        navigate("/admin/dashboard");
      } else if (hasRole("EMPLOYER")) {
        navigate("/employer/dashboard");
      } else if (hasRole("EMPLOYEE")) {
        navigate("/employee/dashboard");
      } else if (hasRole("JOB_SEEKER")) {
        navigate("/job-seeker/dashboard");
      } else {
        navigate("/jobs");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <div
        className="card fade-in"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-md)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(16, 185, 129, 0.2)",
              }}
            >
              <NectarIcon size={24} />
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", display: "block", lineHeight: 1.15 }}>
                Nectar Hub
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)", letterSpacing: "0.02em" }}>
                Your Workplace, Connected.
              </span>
            </div>
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.375rem", color: "var(--color-text)" }}>
            Sign in to continue
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
            Access your jobs, applications, and workforce portal.
          </p>
        </div>

        {/* Success Alert */}
        {isRegistered && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              backgroundColor: "var(--color-success-soft)",
              color: "var(--color-success-text)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-success-border)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>Account created successfully! Please sign in below.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              backgroundColor: "var(--color-danger-soft)",
              color: "var(--color-danger-text)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-danger-border)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="login_email">
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                id="login_email"
                type="email"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
              <label className="form-label" htmlFor="login_password" style={{ margin: 0 }}>
                Password
              </label>
            </div>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                id="login_password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Don't have an account?{" "}
          <Link
            to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
