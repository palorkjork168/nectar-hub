import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type {
  AdminOverviewData,
  CompanyAnalyticsData,
  CompanyAttendanceAnalyticsData,
  EmployeePersonalAnalyticsData,
} from "../types/analytics";

export function useAdminAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ["analytics", "admin", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const res = await api.get(`/analytics/admin/overview?${params.toString()}`);
      return res.data.data as AdminOverviewData;
    },
    staleTime: 60 * 1000,
  });
}

export function useCompanyAnalytics(companyId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["analytics", "company", companyId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const res = await api.get(`/analytics/company/${companyId}/overview?${params.toString()}`);
      return res.data.data as CompanyAnalyticsData;
    },
    enabled: Boolean(companyId),
    staleTime: 60 * 1000,
  });
}

export function useCompanyAttendanceAnalytics(
  companyId?: string,
  from?: string,
  to?: string,
  departmentId?: string,
  scheduleId?: string,
  status?: string
) {
  return useQuery({
    queryKey: ["analytics", "company-attendance", companyId, from, to, departmentId, scheduleId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (departmentId) params.append("departmentId", departmentId);
      if (scheduleId) params.append("scheduleId", scheduleId);
      if (status) params.append("status", status);
      const res = await api.get(`/analytics/company/${companyId}/attendance?${params.toString()}`);
      return res.data.data as CompanyAttendanceAnalyticsData;
    },
    enabled: Boolean(companyId),
    staleTime: 60 * 1000,
  });
}

export async function exportCompanyAttendanceCsv(
  companyId: string,
  filters?: { from?: string; to?: string; departmentId?: string; scheduleId?: string; status?: string }
) {
  const params = new URLSearchParams();
  if (filters?.from) params.append("from", filters.from);
  if (filters?.to) params.append("to", filters.to);
  if (filters?.departmentId) params.append("departmentId", filters.departmentId);
  if (filters?.scheduleId) params.append("scheduleId", filters.scheduleId);
  if (filters?.status) params.append("status", filters.status);

  const res = await api.get(`/analytics/company/${companyId}/attendance/export?${params.toString()}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `attendance_report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function usePersonalAnalytics() {
  return useQuery({
    queryKey: ["analytics", "me"],
    queryFn: async () => {
      const res = await api.get("/analytics/me/overview");
      return res.data.data as EmployeePersonalAnalyticsData;
    },
    staleTime: 30 * 1000,
  });
}

