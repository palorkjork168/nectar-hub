import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  User as UserIcon,
  Briefcase,
  FileText,
  Bookmark,
  PlusSquare,
  LogOut,
  ShieldAlert,
  Users,
  LayoutDashboard,
} from "lucide-react";

export default function UserNavMenu() {
  const { user, isAdmin, isEmployer, isEmployee, isJobSeeker, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
  const initial = (user.first_name?.[0] || user.email?.[0] || "U").toUpperCase();

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/");
  };

  return (
    <div className="user-nav-dropdown-wrapper" ref={dropdownRef}>
      {/* Avatar Button matching reference circular initial */}
      <button
        type="button"
        className={`user-nav-avatar-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User navigation menu"
        aria-expanded={isOpen}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className="user-nav-avatar-img"
          />
        ) : (
          <span className="user-nav-avatar-initial">{initial}</span>
        )}
      </button>

      {/* Dropdown Menu matching Reference Screenshot */}
      {isOpen && (
        <div className="user-dropdown-menu fade-in" role="menu">
          {/* Header Profile Info */}
          <div className="user-dropdown-header">
            <div className="user-dropdown-name" title={displayName}>
              {displayName}
            </div>
            <div className="user-dropdown-email" title={user.email}>
              {user.email}
            </div>
            <div className="user-dropdown-roles">
              {isAdmin && <span className="role-tag role-admin">Admin</span>}
              {isEmployer && <span className="role-tag role-employer">Employer</span>}
              {isEmployee && <span className="role-tag role-employee">Employee</span>}
              {isJobSeeker && <span className="role-tag role-jobseeker">Job Seeker</span>}
            </div>
          </div>

          <div className="user-dropdown-divider" />

          {/* Dedicated Portals Section */}
          <div className="user-dropdown-section-title">Portals & Workspaces</div>
          <div className="user-dropdown-group">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="user-dropdown-item portal-item portal-admin"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <div className="portal-item-icon">
                  <ShieldAlert size={16} />
                </div>
                <div className="portal-item-content">
                  <span className="portal-item-title">Admin Portal</span>
                  <span className="portal-item-desc">System governance & roles</span>
                </div>
              </Link>
            )}

            {isEmployer && (
              <Link
                to="/employer/dashboard"
                className="user-dropdown-item portal-item portal-employer"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <div className="portal-item-icon">
                  <Briefcase size={16} />
                </div>
                <div className="portal-item-content">
                  <span className="portal-item-title">Employer Portal</span>
                  <span className="portal-item-desc">Job posts, applicants & team</span>
                </div>
              </Link>
            )}

            {isEmployee && (
              <Link
                to="/employee/dashboard"
                className="user-dropdown-item portal-item portal-employee"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <div className="portal-item-icon">
                  <Users size={16} />
                </div>
                <div className="portal-item-content">
                  <span className="portal-item-title">Employee Portal</span>
                  <span className="portal-item-desc">Attendance, schedules & leaves</span>
                </div>
              </Link>
            )}

            {/* Job Seeker Portal */}
            <Link
              to="/job-seeker/dashboard"
              className="user-dropdown-item portal-item portal-jobseeker"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <div className="portal-item-icon">
                <LayoutDashboard size={16} />
              </div>
              <div className="portal-item-content">
                <span className="portal-item-title">Job Seeker Portal</span>
                <span className="portal-item-desc">Applications, saved jobs & matches</span>
              </div>
            </Link>
          </div>

          <div className="user-dropdown-divider" />

          {/* Quick shortcuts matching reference screenshot */}
          <div className="user-dropdown-group">
            <Link
              to="/job-seeker/profile"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <UserIcon size={16} />
              <span>Profile</span>
            </Link>

            <Link
              to="/job-seeker/applications"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <FileText size={16} />
              <span>My Applications</span>
            </Link>

            <Link
              to="/job-seeker/saved"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <Bookmark size={16} />
              <span>Saved Jobs</span>
            </Link>

            {isAdmin || isEmployer ? (
              <Link
                to="/employer/jobs/new"
                className="user-dropdown-item"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <PlusSquare size={16} />
                <span>Post a Job</span>
              </Link>
            ) : (
              <Link
                to="/employer/company"
                className="user-dropdown-item"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <PlusSquare size={16} />
                <span>Company Registration</span>
              </Link>
            )}
          </div>

          <div className="user-dropdown-divider" />

          {/* Logout Action */}
          <button
            type="button"
            className="user-dropdown-item user-dropdown-logout"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
