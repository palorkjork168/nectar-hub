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

export function useMyCorrections(enabled: boolean = true) {
  return useQuery({
    queryKey: ["attendance", "corrections", "me"],
    queryFn: async () => {
      const response = await api.get("/attendance/corrections/me");
      return response.data.data.corrections as import("../types/attendance").AttendanceCorrectionRequest[];
    },
    enabled,
  });
}

export function useSubmitCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      companyId: string;
      attendanceId?: string | null;
      correctionType: string;
      requestedCheckInTime?: string | null;
      requestedCheckOutTime?: string | null;
      reason: string;
    }) => {
      const response = await api.post("/attendance/corrections", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "corrections", "me"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
    },
  });
}

export function useCompanyCorrections(
  companyId: string,
  filters?: {
    status?: string;
    correctionType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["attendance", "corrections", "company", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [] as import("../types/attendance").AttendanceCorrectionRequest[];
      const params: any = {};
      if (filters?.status && filters.status !== "ALL") params.status = filters.status;
      if (filters?.correctionType && filters.correctionType !== "ALL") params.correctionType = filters.correctionType;
      if (filters?.userId) params.userId = filters.userId;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;

      const response = await api.get(`/attendance/corrections/company/${companyId}`, {
        params,
      });
      return response.data.data.corrections as import("../types/attendance").AttendanceCorrectionRequest[];
    },
    enabled: Boolean(companyId) && enabled,
  });
}

export function useAllCorrections(
  filters?: {
    companyId?: string;
    status?: string;
    correctionType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["attendance", "corrections", "all", filters],
    queryFn: async () => {
      const params: any = {};
      if (filters?.companyId && filters.companyId !== "ALL") params.companyId = filters.companyId;
      if (filters?.status && filters.status !== "ALL") params.status = filters.status;
      if (filters?.correctionType && filters.correctionType !== "ALL") params.correctionType = filters.correctionType;
      if (filters?.userId) params.userId = filters.userId;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;

      const response = await api.get("/attendance/corrections", {
        params,
      });
      return response.data.data.corrections as import("../types/attendance").AttendanceCorrectionRequest[];
    },
    enabled,
  });
}

export function useAllAttendance(
  filters?: {
    companyId?: string;
    status?: string;
    missingCheckout?: boolean;
    isCorrected?: boolean;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["attendance", "all", filters],
    queryFn: async () => {
      const params: any = {};
      if (filters?.companyId && filters.companyId !== "ALL") params.companyId = filters.companyId;
      if (filters?.status && filters.status !== "ALL") params.status = filters.status;
      if (filters?.missingCheckout) params.missingCheckout = "true";
      if (filters?.isCorrected !== undefined) params.isCorrected = String(filters.isCorrected);

      const response = await api.get("/attendance", { params });
      return response.data.data.attendances as Attendance[];
    },
    enabled,
  });
}

export function useReviewCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      reviewNote,
    }: {
      id: string;
      decision: "approve" | "reject";
      reviewNote?: string;
    }) => {
      const response = await api.patch(`/attendance/corrections/${id}/${decision}`, {
        reviewNote,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "corrections"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "company"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "all"] });
    },
  });
}

export function useBatchReviewCorrections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      correctionIds,
      decision = "APPROVED",
      reviewNote,
    }: {
      correctionIds: string[];
      decision?: "APPROVED" | "REJECTED";
      reviewNote?: string;
    }) => {
      const response = await api.post("/attendance/corrections/batch-review", {
        correctionIds,
        decision,
        reviewNote,
      });
      return response.data.data as import("../types/attendance").BatchReviewResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "corrections"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "company"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "all"] });
    },
  });
}


