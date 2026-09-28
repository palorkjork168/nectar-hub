import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { WorkSchedule, ScheduleEmployee } from "../types/attendance";

export interface ScheduleFilters {
  isActive?: boolean;
  search?: string;
}

export function useCompanySchedules(companyId: string, filters?: ScheduleFilters) {
  return useQuery({
    queryKey: ["schedules", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [] as WorkSchedule[];
      const params: Record<string, any> = {};
      if (filters?.isActive !== undefined) {
        params.isActive = filters.isActive;
      }
      if (filters?.search) {
        params.search = filters.search;
      }
      const res = await api.get(`/shifts/company/${companyId}`, { params });
      return res.data.data as WorkSchedule[];
    },
    enabled: Boolean(companyId),
  });
}

export function useSchedule(scheduleId: string) {
  return useQuery({
    queryKey: ["schedule", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      const res = await api.get(`/shifts/${scheduleId}`);
      return res.data.data as WorkSchedule;
    },
    enabled: Boolean(scheduleId),
  });
}

export function useScheduleEmployees(scheduleId: string) {
  return useQuery({
    queryKey: ["scheduleEmployees", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [] as ScheduleEmployee[];
      const res = await api.get(`/shifts/${scheduleId}/employees`);
      return res.data.data as ScheduleEmployee[];
    },
    enabled: Boolean(scheduleId),
  });
}

export function useMySchedule(companyId?: string) {
  return useQuery({
    queryKey: ["mySchedule", companyId],
    queryFn: async () => {
      const params = companyId ? { companyId } : {};
      const res = await api.get("/shifts/my/current", { params });
      return res.data.data as WorkSchedule | null;
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      data,
    }: {
      companyId: string;
      data: {
        name: string;
        description?: string;
        start_time: string;
        end_time: string;
        grace_period_minutes?: number;
        expected_hours?: number;
        is_active?: boolean;
      };
    }) => {
      const res = await api.post(`/shifts/company/${companyId}`, data);
      return res.data.data as WorkSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schedules", variables.companyId] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      companyId?: string;
      data: {
        name?: string;
        description?: string;
        start_time?: string;
        end_time?: string;
        grace_period_minutes?: number;
        expected_hours?: number;
      };
    }) => {
      const res = await api.put(`/shifts/${scheduleId}`, data);
      return res.data.data as WorkSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.scheduleId] });
    },
  });
}

export function useSetScheduleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scheduleId,
      isActive,
    }: {
      scheduleId: string;
      companyId?: string;
      isActive: boolean;
    }) => {
      const res = await api.patch(`/shifts/${scheduleId}/status`, { isActive });
      return res.data.data as WorkSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.scheduleId] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      target: string | { scheduleId: string; companyId?: string }
    ) => {
      const scheduleId = typeof target === "string" ? target : target.scheduleId;
      const res = await api.delete(`/shifts/${scheduleId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useAssignScheduleToEmployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employmentRecordId,
      workScheduleId,
    }: {
      employmentRecordId: string;
      workScheduleId: string | null;
      companyId?: string;
    }) => {
      const res = await api.patch(`/employment/${employmentRecordId}/schedule`, {
        workScheduleId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["scheduleEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveEmployments"] });
    },
  });
}

export function useUnassignScheduleFromEmployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employmentRecordId,
    }: {
      employmentRecordId: string;
      companyId?: string;
    }) => {
      const res = await api.delete(`/employment/${employmentRecordId}/schedule`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["scheduleEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveEmployments"] });
    },
  });
}
