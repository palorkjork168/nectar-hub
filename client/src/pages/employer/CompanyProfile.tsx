import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { Company, GetMyCompaniesResponse, CompanySize } from "../../types/job";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Edit3,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";

const COMPANY_SIZES: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function CompanyProfile() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Cambodia");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("11-50");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: companies, isLoading, error } = useQuery<Company[]>({
    queryKey: ["myCompanies"],
    queryFn: async () => {
      const res = await api.get<GetMyCompaniesResponse>("/companies/my");
      return res.data.data.companies;
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setWebsite("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("Cambodia");
    setIndustry("");
    setCompanySize("11-50");
    setEditingCompany(null);
    setFormError("");
    setModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setDescription(company.description || "");
    setWebsite(company.website || "");
    setEmail(company.email || "");
    setPhone(company.phone || "");
    setAddress(company.address || "");
    setCity(company.city || "");
    setCountry(company.country || "Cambodia");
    setIndustry(company.industry || "");
    setCompanySize(company.company_size || "11-50");
    setFormError("");
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/companies", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      setSuccessMessage("Company registered successfully!");
      setTimeout(() => setSuccessMessage(""), 3500);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to register company");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/companies/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["employerDashboard"] });
      setSuccessMessage("Company profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3500);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update company");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setFormError("Company name must be at least 2 characters");
      return;
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || "Cambodia",
      industry: industry.trim() || undefined,
      company_size: companySize || undefined,
    };

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">Company Profile</h1>
          <p className="dashboard-subtitle">
            Manage your company information, brand presence, and hiring identity
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
          <Plus size={16} /> Register Another Company
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 1rem",
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
          <Loader2 className="animate-spin" size={24} style={{ color: "var(--primary)" }} />
          <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading your company profile...
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <AlertCircle size={18} />
          <span>Failed to load company profiles. Please try again.</span>
        </div>
      )}

      {/* No Company Registered Yet */}
      {!isLoading && (!companies || companies.length === 0) && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", alignItems: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-bg)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <Building2 size={32} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "var(--text-main)" }}>
            No Company Registered Yet
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", maxWidth: "450px", fontSize: "0.875rem" }}>
            To post jobs and receive applicants on Nectar Hub, you must first register your business or organization profile.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Register Your Company
          </button>
        </div>
      )}

      {/* Companies List */}
      {!isLoading && companies && companies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {companies.map((comp) => (
            <div key={comp.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.25rem" }}>
                <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                  {/* Company Logo or Initials */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary-bg)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      flexShrink: 0,
                    }}
                  >
                    {comp.logo_url ? (
                      <img src={comp.logo_url} alt={comp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      comp.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 700, color: "var(--text-main)" }}>
                        {comp.name}
                      </h2>
                      {comp.status && (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            backgroundColor: comp.status === "ACTIVE" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                            color: comp.status === "ACTIVE" ? "#059669" : "#b45309",
                            border: `1px solid ${comp.status === "ACTIVE" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                          }}
                        >
                          {comp.status}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 500, marginTop: "0.2rem" }}>
                      {comp.industry || "General Industry"}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {(comp.city || comp.country) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <MapPin size={13} />
                          <span>{[comp.city, comp.country].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--primary)", textDecoration: "none" }}
                        >
                          <Globe size={13} />
                          <span>{comp.website.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {comp.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Mail size={13} />
                          <span>{comp.email}</span>
                        </div>
                      )}
                      {comp.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Phone size={13} />
                          <span>{comp.phone}</span>
                        </div>
                      )}
                      {comp.company_size && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Users size={13} />
                          <span>{comp.company_size} Employees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => openEditModal(comp)} className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
                  <Edit3 size={15} /> Edit Profile
                </button>
              </div>

              {comp.description && (
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    About Company
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-line" }}>
                    {comp.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Company Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                {editingCompany ? "Edit Company Profile" : "Register Company"}
              </h3>
              <button onClick={resetForm} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--danger-bg)",
                      color: "var(--danger-text)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8125rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">
                    Company Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Innovations Co., Ltd"
                    className="input-field"
                    style={{ width: "100%" }}
                    autoFocus
                  />
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Software, Banking, Education"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                      className="input-field"
                      style={{ width: "100%" }}
                    >
                      {COMPANY_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz} employees
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Website URL</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@example.com"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 23 123 456"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Phnom Penh"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-grid two-cols" style={{ marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Monivong Blvd, Daun Penh"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Cambodia"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">About Company / Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell candidates about your company culture, mission, and growth story..."
                    className="input-field"
                    rows={4}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : editingCompany ? "Save Changes" : "Register Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
