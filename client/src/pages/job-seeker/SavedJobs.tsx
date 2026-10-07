import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { SavedJobRecord, GetSavedJobsResponse } from "../../types/profile";
import JobCard from "../../components/public/JobCard";
import { Bookmark, Search, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export default function SavedJobs() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: savedJobs, isLoading, error } = useQuery<SavedJobRecord[]>({
    queryKey: ["savedJobs"],
    queryFn: async () => {
      const res = await api.get<GetSavedJobsResponse>("/jobs/saved");
      return res.data.data.savedJobs;
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.delete(`/jobs/${jobId}/save`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove job from saved list");
    },
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dashboard-title">Saved Jobs</h1>
          <p className="dashboard-subtitle">
            Quickly access and apply to jobs you've bookmarked
          </p>
        </div>
        <Link to="/jobs" className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
          <Search size={15} /> Browse More Jobs
        </Link>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)" }}>
            <Loader2 className="animate-spin" size={20} />
            <span>Loading your saved jobs...</span>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} />
          <span>Failed to load saved jobs. Please try again.</span>
        </div>
      )}

      {!isLoading && !error && (!savedJobs || savedJobs.length === 0) && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            alignItems: "center",
          }}
        >
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
            <Bookmark size={30} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem", color: "var(--text-main)" }}>
            Jobs you save will appear here
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)", maxWidth: "420px", fontSize: "0.875rem" }}>
            When you see a job you like while browsing, bookmark it to review or apply later.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            <Search size={16} /> Browse Open Jobs
          </Link>
        </div>
      )}

      {!isLoading && !error && savedJobs && savedJobs.length > 0 && (
        <div className="job-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {savedJobs.map((record) => {
            if (!record.job) return null;
            return (
              <JobCard
                key={record.id}
                job={record.job}
                actionButton={
                  <button
                    type="button"
                    onClick={() => unsaveMutation.mutate(record.job_id)}
                    disabled={unsaveMutation.isPending}
                    title="Remove from saved jobs"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--danger-bg)",
                      color: "var(--danger-text)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Unsave</span>
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
