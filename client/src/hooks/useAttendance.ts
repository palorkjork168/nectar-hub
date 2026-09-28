import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { Attendance } from "../types/attendance";

export function useMyAttendance(enabled: boolean = true) {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => {
      const response = await api.get("/attendance/me");
      return response.data.data.attendances as Attendance[];
    },
    enabled,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; companyId: string }) => {
      const response = await api.post("/attendance/check-in", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      const response = await api.post("/attendance/check-out", coords);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
    },
  });
}

export function useCompanyAttendance(
  companyId: string,
  filters?: { status?: string; isLate?: boolean; userId?: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["attendance", "company", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [] as Attendance[];
      const res = await api.get(`/attendance/company/${companyId}`, {
        params: filters,
      });
      return res.data.data.attendances as Attendance[];
    },
    enabled: Boolean(companyId) && enabled,
  });
}
