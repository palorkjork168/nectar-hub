import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Loader2, Lock, Mail, Phone, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { NectarIcon } from "../../components/brand/NectarLogo";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get("redirect") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (firstName.trim().length < 2) {
      setError("First name must be at least 2 characters.");
      return;
    }
    if (lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        phone?: string;
      } = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      await api.post("/auth/register", payload);

      // Redirect to login preserving destination
      const loginUrl = redirect
        ? `/login?redirect=${encodeURIComponent(redirect)}&registered=true`
        : "/login?registered=true";

      navigate(loginUrl);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Registration failed. Please try again.";
      setError(msg);
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
          maxWidth: "480px",
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
            Join Nectar Hub
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
            Build your career. Find opportunities. Connect with the right people.
          </p>
        </div>

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
          <div className="form-grid two-cols">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
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
                  id="first_name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="last_name">
                Last Name <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
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
                  id="last_name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="register_email">
              Email Address <span className="required">*</span>
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
                id="register_email"
                type="email"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="register_password">
              Password <span className="required">*</span>
            </label>
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
                id="register_password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="register_phone">
              Phone Number <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(Optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <Phone
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
                id="register_phone"
                type="tel"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="012 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
                <Loader2 size={18} className="animate-spin" /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Already have an account?{" "}
          <Link
            to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
