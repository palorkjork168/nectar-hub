import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Compass,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
  Search,
} from "lucide-react";
import api from "../../services/api";
import {
  useCompanyLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeactivateLocation,
} from "../../hooks/useLocations";
import { useToast } from "../../contexts/ToastContext";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import type { CompanyLocation, CreateLocationPayload } from "../../types/location";

type Company = { id: string; name: string };

export default function GeoFenceSettings() {
  const toast = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null);
  const [deactivatingLocation, setDeactivatingLocation] = useState<CompanyLocation | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // 1. Fetch available companies
  const companiesQuery = useQuery({
    queryKey: ["companies", "my"],
    queryFn: async () => (await api.get("/companies/my")).data.data.companies as Company[],
  });
  const companies = useMemo(() => companiesQuery.data || [], [companiesQuery.data]);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // 2. Fetch locations
  const {
    data: locations = [],
    isLoading,
    isError,
    refetch,
  } = useCompanyLocations(selectedCompanyId, true, Boolean(selectedCompanyId));

  const createMutation = useCreateLocation(selectedCompanyId);
  const updateMutation = useUpdateLocation(selectedCompanyId);
  const deactivateMutation = useDeactivateLocation(selectedCompanyId);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        (loc.address && loc.address.toLowerCase().includes(q))
      );
    });
  }, [locations, searchQuery]);

  const activeLocationsCount = useMemo(
    () => locations.filter((l) => l.is_active).length,
    [locations]
  );

  const openCreateModal = () => {
    setEditingLocation(null);
    setFormName("");
    setFormAddress("");
    setFormLat("");
    setFormLng("");
    setFormRadius(100);
    setFormIsActive(true);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (loc: CompanyLocation) => {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormAddress(loc.address || "");
    setFormLat(loc.latitude.toString());
    setFormLng(loc.longitude.toString());
    setFormRadius(loc.radius_meters);
    setFormIsActive(loc.is_active);
    setIsCreateModalOpen(true);
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        setFormLat(pos.coords.latitude.toFixed(6));
        setFormLng(pos.coords.longitude.toFixed(6));
        toast.success("Current GPS coordinates captured successfully");
      },
      (err) => {
        setIsDetectingGps(false);
        toast.error(`Failed to capture GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);

    if (!formName.trim()) {
      toast.error("Workplace location name is required");
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude must be a valid number between -90 and 90");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error("Longitude must be a valid number between -180 and 180");
      return;
    }
    if (formRadius < 10 || formRadius > 10000) {
      toast.error("Radius must be between 10 and 10,000 meters");
      return;
    }

    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({
          locationId: editingLocation.id,
          payload: {
            name: formName.trim(),
            address: formAddress.trim() || null,
            latitude: lat,
            longitude: lng,
            radius_meters: formRadius,
            is_active: formIsActive,
          },
        });
        toast.success(`Workplace "${formName}" updated successfully`);
      } else {
        const payload: CreateLocationPayload = {
          name: formName.trim(),
          address: formAddress.trim() || null,
          latitude: lat,
          longitude: lng,
          radius_meters: formRadius,
          is_active: formIsActive,
        };
        await createMutation.mutateAsync(payload);
        toast.success(`Workplace "${formName}" created with ${formRadius}m radius`);
      }
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save location");
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingLocation) return;
    try {
      await deactivateMutation.mutateAsync(deactivatingLocation.id);
      toast.success(`Workplace "${deactivatingLocation.name}" deactivated`);
      setDeactivatingLocation(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to deactivate location");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Block */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className="badge badge-primary" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
              Workplace & Compliance
            </span>
          </div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.25rem 0" }}>
            <Radio size={28} style={{ color: "var(--color-primary-text)" }} />
            Company Geo-Fence Customization
          </h1>
          <p className="dashboard-subtitle" style={{ margin: 0 }}>
            Configure workplace branches, permitted GPS boundaries, and radius enforcement for live employee attendance.
          </p>
        </div>

        {/* Company Selector & Add Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {companies.length > 1 && (
            <div style={{ minWidth: "200px" }}>
              <select
                aria-label="Select Company"
                className="input-field"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{ height: "40px", fontSize: "0.875rem" }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "40px" }}
          >
            <Plus size={16} />
            Add Workplace Location
          </button>
        </div>
      </div>

      {/* Enforcement Status Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        {activeLocationsCount === 0 ? (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg, 12px)",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.85rem",
            }}
          >
            <AlertTriangle size={20} style={{ color: "var(--color-warning-text, #f59e0b)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-warning-text, #f59e0b)" }}>
                No Active Geofence Configured — Open Punch Mode
              </h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
                Your company currently has no active geofence locations configured. Employees can check in and check out from any GPS coordinate. Add your first workplace branch to restrict punches to verified sites.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg, 12px)",
              backgroundColor: "rgba(255, 225, 124, 0.08)",
              border: "1px solid rgba(255, 225, 124, 0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.85rem",
            }}
          >
            <ShieldCheck size={20} style={{ color: "var(--color-primary-text)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary-text)" }}>
                Active Geofence Enforcement Enabled ({activeLocationsCount} Workplace{activeLocationsCount > 1 ? "s" : ""})
              </h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
                Authoritative server-side GPS distance validation is actively protecting all live check-ins and check-outs. Unassigned employees may punch at any active branch; employees assigned to a specific branch must punch within that branch's radius.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Total Workplaces</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", marginTop: "0.25rem" }}>
              {locations.length}
            </div>
          </div>
          <Building2 size={32} style={{ color: "var(--color-primary-text)", opacity: 0.35 }} />
        </div>

        <div className="card" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Active Geofences</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary-text)", marginTop: "0.25rem" }}>
              {activeLocationsCount}
            </div>
          </div>
          <ShieldCheck size={32} style={{ color: "var(--color-primary-text)", opacity: 0.35 }} />
        </div>

        <div className="card" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Default Radius</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", marginTop: "0.25rem" }}>
              100m
            </div>
          </div>
          <Compass size={32} style={{ color: "var(--color-primary-text)", opacity: 0.35 }} />
        </div>
      </div>

      {/* Search & Location Card Grid */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "420px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search workplace by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "36px", height: "38px", width: "100%", fontSize: "0.85rem" }}
            />
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Showing {filteredLocations.length} of {locations.length} locations
          </span>
        </div>

        {/* Location Grid View */}
        {isLoading ? (
          <div style={{ padding: "4rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary-text)" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Loading workplace geofence locations...</p>
          </div>
        ) : isError ? (
          <EmptyState
            title="Failed to Load Locations"
            description="Could not retrieve workplace locations for this company."
            icon={AlertTriangle}
            action={{ label: "Try Again", onClick: () => refetch() }}
          />
        ) : filteredLocations.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No Matching Workplaces" : "No Workplace Locations Configured"}
            description={
              searchQuery
                ? "No workplace matches your search query."
                : "Add your first company workplace location to enable automatic geofence protection for attendance check-ins."
            }
            icon={MapPin}
            action={searchQuery ? undefined : { label: "Add Location", onClick: openCreateModal }}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className="card"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: loc.is_active ? 1 : 0.65,
                  border: loc.is_active ? "1px solid var(--color-border)" : "1px dashed var(--color-border)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-md, 8px)",
                          backgroundColor: "rgba(255, 225, 124, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--color-primary-text)",
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 0.15rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" }}>
                          {loc.name}
                        </h4>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "999px",
                            backgroundColor: loc.is_active ? "rgba(255, 225, 124, 0.15)" : "rgba(107, 114, 128, 0.15)",
                            color: loc.is_active ? "var(--color-primary, var(--color-primary-text))" : "var(--color-text-muted)",
                          }}
                        >
                          {loc.is_active ? (
                            <>
                              <CheckCircle2 size={10} /> Active Geofence
                            </>
                          ) : (
                            <>
                              <XCircle size={10} /> Inactive
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        onClick={() => openEditModal(loc)}
                        className="btn btn-secondary"
                        style={{ padding: "0.4rem", minHeight: "auto", borderRadius: "6px" }}
                        title="Edit location"
                      >
                        <Edit2 size={14} />
                      </button>
                      {loc.is_active && (
                        <button
                          onClick={() => setDeactivatingLocation(loc)}
                          className="btn btn-secondary"
                          style={{ padding: "0.4rem", minHeight: "auto", borderRadius: "6px", color: "var(--color-danger, #ef4444)" }}
                          title="Deactivate location"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {loc.address && (
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "0 0 0.75rem", lineHeight: 1.4 }}>
                      {loc.address}
                    </p>
                  )}

                  {/* Geofence Radar Preview Tile */}
                  <div
                    style={{
                      backgroundColor: "var(--color-bg, #070c09)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md, 8px)",
                      padding: "0.75rem",
                      fontSize: "0.78rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Allowed Radius:</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary-text)" }}>{loc.radius_meters} meters</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Coordinates:</span>
                      <span style={{ fontFamily: "monospace", color: "var(--color-text)" }}>
                        {Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "4px", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          backgroundColor: "var(--color-primary)",
                          width: `${Math.min(100, (loc.radius_meters / 1000) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--color-border)",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span>Added {new Date(loc.created_at).toLocaleDateString()}</span>
                  <a
                    href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-primary-text)", display: "flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}
                  >
                    View Map
                    <Navigation size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingLocation ? "Edit Workplace Location" : "Add Workplace Location"}
      >
        <form onSubmit={handleSaveLocation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
              Workplace Name <span style={{ color: "var(--color-primary-text)" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Headquarters Campus, Warehouse North"
              className="input-field"
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
              Address / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Full street address or workplace description..."
              className="input-field"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
                Latitude <span style={{ color: "var(--color-primary-text)" }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formLat}
                onChange={(e) => setFormLat(e.target.value)}
                placeholder="e.g. 11.5564"
                className="input-field"
                style={{ width: "100%", height: "38px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.35rem" }}>
                Longitude <span style={{ color: "var(--color-primary-text)" }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formLng}
                onChange={(e) => setFormLng(e.target.value)}
                placeholder="e.g. 104.9282"
                className="input-field"
                style={{ width: "100%", height: "38px" }}
              />
            </div>
          </div>

          {/* GPS Quick Capture Button */}
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isDetectingGps}
            className="btn btn-secondary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", height: "36px", fontSize: "0.8rem" }}
          >
            {isDetectingGps ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Capturing GPS Coordinates...
              </>
            ) : (
              <>
                <Navigation size={14} />
                Use My Current Location Coordinates
              </>
            )}
          </button>

          {/* Radius Configuration */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                Allowed Geofence Radius
              </label>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary-text)" }}>
                {formRadius} meters
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={2000}
              step={10}
              value={formRadius}
              onChange={(e) => setFormRadius(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)" }}
            />

            {/* Quick Presets */}
            <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem" }}>
              {[50, 100, 250, 500, 1000].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setFormRadius(r)}
                  className={`btn ${formRadius === r ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1, padding: "0.25rem 0.5rem", minHeight: "auto", fontSize: "0.75rem" }}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Status Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>Workplace Active Status</span>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
              />
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                {formIsActive ? "Active" : "Inactive"}
              </span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
              {editingLocation ? "Save Changes" : "Create Workplace"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DEACTIVATE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deactivatingLocation)}
        onClose={() => setDeactivatingLocation(null)}
        title="Deactivate Workplace Location"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text)", margin: 0 }}>
            Are you sure you want to deactivate workplace <strong style={{ color: "var(--color-text)" }}>"{deactivatingLocation?.name}"</strong>?
          </p>

          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontSize: "0.8rem",
              color: "var(--color-warning-text, #f59e0b)",
            }}
          >
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700 }}>Consequences of deactivation:</p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.45 }}>
              <li>Live check-ins and check-outs will no longer be permitted within this zone.</li>
              <li>Employees explicitly assigned to this branch will receive instructions to contact HR.</li>
              <li>Historical attendance records punched at this location remain preserved.</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
            <button onClick={() => setDeactivatingLocation(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleConfirmDeactivate}
              disabled={deactivateMutation.isPending}
              className="btn btn-danger"
              style={{ backgroundColor: "var(--color-danger, #ef4444)", color: "#fff" }}
            >
              {deactivateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Deactivate Workplace
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
