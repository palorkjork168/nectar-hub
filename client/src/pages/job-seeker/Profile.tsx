import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { FullProfile, GetProfileResponse } from "../../types/profile";
import { calculateProfileCompletion } from "../../utils/profileCompletion";
import SkillsSection from "../../components/job-seeker/SkillsSection";
import EducationSection from "../../components/job-seeker/EducationSection";
import ExperienceSection from "../../components/job-seeker/ExperienceSection";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../../components/common/Modal";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Sparkles,
  Camera,
  Loader2,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

const RECOMMENDED_TITLES = [
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Data Scientist",
  "Mobile Developer",
  "QA Engineer",
];

const RECOMMENDED_CITIES = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Singapore",
  "Remote",
];

const RECOMMENDED_COUNTRIES = [
  "Cambodia",
  "Singapore",
  "United States",
  "Thailand",
  "Remote",
];

export default function Profile() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");

  // Edit Personal/Professional Info form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [infoError, setInfoError] = useState("");

  // Change Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Query profile
  const { data: profile, isLoading, error } = useQuery<FullProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get<GetProfileResponse>("/profile/me");
      return res.data.data.profile;
    },
  });

  // Open Edit Info Modal
  const openEditInfoModal = () => {
    if (!profile) return;
    const up = profile.UserProfile;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setProfTitle(up?.professional_title || "");
    setBio(up?.bio || "");
    setPhone(up?.phone || "");
    setAddress(up?.address || "");
    setCity(up?.city || "");
    setCountry(up?.country || "");
    setInfoError("");
    setEditInfoModalOpen(true);
  };

  // Open Change Password Modal
  const openChangePasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setChangePasswordModalOpen(true);
  };

  // Update Profile Info Mutation
  const updateInfoMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put("/profile/me", payload);
      return res.data;
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditInfoModalOpen(false);
      toast.success("Profile information updated successfully!");
    },
    onError: (err: any) => {
      setInfoError(err.response?.data?.message || "Failed to update profile information");
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const res = await api.put("/auth/change-password", payload);
      return res.data;
    },
    onSuccess: () => {
      setChangePasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      toast.success("Password changed successfully!");
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    },
  });

  // Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAvatarSuccess("Avatar updated successfully!");
      setAvatarError("");
      toast.success("Profile photo updated!");
      setTimeout(() => setAvatarSuccess(""), 3500);
    },
    onError: (err: any) => {
      setAvatarError(err.response?.data?.message || err.message || "Failed to upload avatar");
      setAvatarSuccess("");
    },
  });

  // Resume Upload Mutation
  const resumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await api.post("/profile/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setResumeSuccess("Resume uploaded successfully!");
      setResumeError("");
      toast.success("Resume updated!");
      setTimeout(() => setResumeSuccess(""), 3500);
    },
    onError: (err: any) => {
      setResumeError(err.response?.data?.message || err.message || "Failed to upload resume");
      setResumeSuccess("");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (5MB)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Only JPG, PNG and WEBP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar image size must be less than 5MB");
      return;
    }

    setAvatarError("");
    avatarMutation.mutate(file);
    e.target.value = "";
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF and size (10MB)
    if (file.type !== "application/pdf") {
      setResumeError("Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("Resume PDF size must be less than 10MB");
      return;
    }

    setResumeError("");
    resumeMutation.mutate(file);
    e.target.value = "";
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setInfoError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setInfoError("Last name is required");
      return;
    }

    updateInfoMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      professional_title: profTitle.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="dashboard-container" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
          <Loader2 className="animate-spin" size={20} />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="dashboard-container" style={{ padding: "3rem 1.5rem" }}>
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--color-danger-bg, #fee2e2)",
            color: "var(--color-danger-text, #b91c1c)",
            borderRadius: "var(--radius-lg, 12px)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <AlertCircle size={20} />
          <span>Failed to load profile. Please try refreshing the page.</span>
        </div>
      </div>
    );
  }

  const completion = calculateProfileCompletion(profile);
  const up = profile.UserProfile;
  const educations = profile.Education || profile.Educations || [];
  const experiences = profile.Experiences || [];
  const skills = profile.UserSkills || [];

  const getInitials = (first?: string, last?: string) => {
    if (!first) return "JS";
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <div className="dashboard-container">
      {/* Profile Completion Card */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)",
          borderColor: "rgba(37, 99, 235, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Sparkles size={20} style={{ color: "var(--color-primary-text, #2563eb)" }} />
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, color: "var(--color-text)" }}>
              Profile Strength: {completion.percentage}%
            </h3>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            {completion.completedCount} of {completion.totalCount} sections complete
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "8px",
            backgroundColor: "rgba(0, 0, 0, 0.06)",
            borderRadius: "9999px",
            overflow: "hidden",
            marginBottom: completion.missingItems.length > 0 ? "0.875rem" : "0",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completion.percentage}%`,
              backgroundColor:
                completion.percentage === 100
                  ? "var(--color-success, #ffe17c)"
                  : completion.percentage >= 60
                  ? "var(--color-primary, #2563eb)"
                  : "var(--color-warning, #f59e0b)",
              borderRadius: "9999px",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Missing Suggestions */}
        {completion.missingItems.length > 0 && (
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 500 }}>Next steps to reach 100%:</span>
            {completion.missingItems.map((item, idx) => (
              <span
                key={idx}
                style={{
                  padding: "0.15rem 0.5rem",
                  backgroundColor: "var(--color-surface, #fff)",
                  borderRadius: "9999px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.75rem",
                }}
              >
                + {typeof item === "string" ? item : (item as any)?.label || (item as any)?.key || ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Profile Header Info Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Avatar with Camera upload trigger */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-light, #eff6ff)",
                  color: "var(--color-primary-text, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: 700,
                  overflow: "hidden",
                  border: "3px solid var(--color-surface, #fff)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {up?.avatar_url ? (
                  <img
                    src={up.avatar_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(profile.first_name, profile.last_name)
                )}
              </div>

              {/* Upload avatar overlay button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarMutation.isPending}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "var(--color-primary, #2563eb)",
                  color: "white",
                  border: "2px solid var(--color-surface, #fff)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
                title="Change profile photo"
              >
                {avatarMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
              />
            </div>

            {/* Name, Title, and Contact */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
                  {profile.first_name} {profile.last_name}
                </h2>
              </div>

              <div style={{ fontSize: "1rem", color: "var(--color-primary-text, #2563eb)", fontWeight: 500, marginTop: "0.25rem" }}>
                {up?.professional_title || "Job Seeker / Specialist"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.625rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Mail size={14} />
                  <span>{profile.email}</span>
                </div>
                {up?.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Phone size={14} />
                    <span>{up.phone}</span>
                  </div>
                )}
                {(up?.city || up?.country) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MapPin size={14} />
                    <span>{[up.city, up.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons: Edit Info & Change Password */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={openEditInfoModal}
              className="btn btn-secondary"
              style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={openChangePasswordModal}
              className="btn btn-outline"
              style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Key size={15} />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts for avatar upload */}
        {avatarSuccess && (
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-success-text)", fontSize: "0.8125rem" }}>
            <CheckCircle2 size={15} /> {avatarSuccess}
          </div>
        )}
        {avatarError && (
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)", fontSize: "0.8125rem" }}>
            <AlertCircle size={15} /> {avatarError}
          </div>
        )}

        {/* Bio / Summary */}
        {up?.bio && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              ABOUT ME
            </h4>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {up.bio}
            </p>
          </div>
        )}
      </div>

      {/* Resume Section Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>Resume / CV</h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              Upload your latest resume (PDF format, up to 10MB).
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {up?.resume_url && (
              <a
                href={up.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <FileText size={15} /> View Resume <ExternalLink size={13} />
              </a>
            )}
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={resumeMutation.isPending}
              className="btn btn-primary"
              style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {resumeMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={15} /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} /> {up?.resume_url ? "Update Resume" : "Upload Resume"}
                </>
              )}
            </button>
            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeChange}
              accept="application/pdf"
              style={{ display: "none" }}
            />
          </div>
        </div>

        {resumeSuccess && (
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-success-text)", fontSize: "0.8125rem" }}>
            <CheckCircle2 size={15} /> {resumeSuccess}
          </div>
        )}
        {resumeError && (
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)", fontSize: "0.8125rem" }}>
            <AlertCircle size={15} /> {resumeError}
          </div>
        )}
      </div>

      {/* Skills Section with Combobox & Recommendations */}
      <SkillsSection skills={skills} />

      {/* Education Section */}
      <EducationSection educations={educations} />

      {/* Experience Section */}
      <ExperienceSection experiences={experiences} />

      {/* Edit Personal & Professional Info Modal */}
      <Modal
        isOpen={editInfoModalOpen}
        onClose={() => setEditInfoModalOpen(false)}
        title="Edit Personal & Professional Profile"
        description="Update your contact information, name, professional title, and bio."
        maxWidth="640px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditInfoModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInfoSubmit}
              disabled={updateInfoMutation.isPending}
              className="btn btn-primary"
            >
              {updateInfoMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form onSubmit={handleInfoSubmit}>
          {infoError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "var(--color-danger-bg, #fee2e2)",
                color: "var(--color-danger-text, #b91c1c)",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={16} />
              <span>{infoError}</span>
            </div>
          )}

          {/* Name fields (First Name & Last Name) */}
          <div className="form-grid two-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                First Name <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="input-field"
                style={{ width: "100%" }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Last Name <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="input-field"
                style={{ width: "100%" }}
                required
              />
            </div>
          </div>

          {/* Professional Title with Recommendation Chips */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
              <span>Professional Title</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Choose or type custom</span>
            </label>
            <input
              type="text"
              value={profTitle}
              onChange={(e) => setProfTitle(e.target.value)}
              placeholder="e.g. Full Stack Developer, Systems Architect"
              className="input-field"
              style={{ width: "100%" }}
            />
            {/* Recommendation chips */}
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Recommended titles:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {RECOMMENDED_TITLES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setProfTitle(title)}
                    style={{
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.72rem",
                      borderRadius: "6px",
                      background: profTitle === title ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                      color: profTitle === title ? "#fff" : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +855 12 345 678"
              className="input-field"
              style={{ width: "100%" }}
            />
          </div>

          {/* Location: City and Country with Recommendations */}
          <div className="form-grid two-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Phnom Penh"
                className="input-field"
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
                {RECOMMENDED_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    style={{
                      padding: "0.15rem 0.4rem",
                      fontSize: "0.68rem",
                      borderRadius: "4px",
                      background: city === c ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                      color: city === c ? "#fff" : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Cambodia"
                className="input-field"
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
                {RECOMMENDED_COUNTRIES.map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setCountry(ct)}
                    style={{
                      padding: "0.15rem 0.4rem",
                      fontSize: "0.68rem",
                      borderRadius: "4px",
                      background: country === ct ? "var(--color-primary)" : "var(--color-surface-muted, #f1f5f9)",
                      color: country === ct ? "#fff" : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Street Address */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Street 2004, Sen Sok"
              className="input-field"
              style={{ width: "100%" }}
            />
          </div>

          {/* Bio / Professional Summary */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Bio / Professional Summary</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Highlight your background, core strengths, and goals..."
              className="input-field"
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Security & Change Password"
        description="Enter your current password and set a new secure password for your account."
        maxWidth="460px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setChangePasswordModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={changePasswordMutation.isPending}
              className="btn btn-primary"
            >
              {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
            </button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit}>
          {passwordError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "var(--color-danger-bg, #fee2e2)",
                color: "var(--color-danger-text, #b91c1c)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Current Password <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="input-field"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              New Password <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Confirm New Password <span className="required" style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="input-field"
              style={{ width: "100%" }}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
