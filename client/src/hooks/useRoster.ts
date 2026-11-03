import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type {
  WeeklyRosterRow,
  AssignShiftPayload,
  BulkAssignPayload,
  WorkScheduleTemplate,
} from "../types/roster";

export function useWeeklyRoster(
  companyId: string,
  startDate: string,
  endDate: string,
  departmentId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["roster", companyId, startDate, endDate, { departmentId }],
    queryFn: async () => {
      if (!companyId || !startDate || !endDate) return [] as WeeklyRosterRow[];
      const res = await api.get(`/roster/company/${companyId}`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          department_id: departmentId || undefined,
        },
      });
      return res.data.data.roster as WeeklyRosterRow[];
    },
    enabled: Boolean(companyId && startDate && endDate) && enabled,
  });
}

export function useCompanySchedules(companyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["company-schedules", companyId],
    queryFn: async () => {
      if (!companyId) return [] as WorkScheduleTemplate[];
      const res = await api.get(`/shifts/company/${companyId}`);
      return (res.data.data || res.data) as WorkScheduleTemplate[];
    },
    enabled: Boolean(companyId) && enabled,
  });
}

export function useAssignShift(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AssignShiftPayload) => {
      const res = await api.post(`/roster/company/${companyId}/assign`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", companyId] });
    },
  });
}

export function useBulkAssignShifts(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkAssignPayload) => {
      const res = await api.post(`/roster/company/${companyId}/bulk-assign`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", companyId] });
    },
  });
}

export function useDeleteShiftAssignment(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.delete(`/roster/company/${companyId}/assignments/${assignmentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", companyId] });
    },
  });
}
