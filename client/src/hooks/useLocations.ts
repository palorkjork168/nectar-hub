import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type {
  CompanyLocation,
  CreateLocationPayload,
  UpdateLocationPayload,
} from "../types/location";

export function useCompanyLocations(
  companyId: string,
  includeInactive: boolean = false,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["locations", companyId, { includeInactive }],
    queryFn: async () => {
      if (!companyId) return [] as CompanyLocation[];
      const res = await api.get(`/locations/company/${companyId}`, {
        params: { include_inactive: includeInactive },
      });
      return res.data.data.locations as CompanyLocation[];
    },
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCreateLocation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLocationPayload) => {
      const res = await api.post(`/locations/company/${companyId}`, payload);
      return res.data.data.location as CompanyLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", companyId] });
    },
  });
}

export function useUpdateLocation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: UpdateLocationPayload;
    }) => {
      const res = await api.patch(`/locations/${locationId}`, payload);
      return res.data.data.location as CompanyLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", companyId] });
    },
  });
}

export function useDeactivateLocation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId: string) => {
      const res = await api.patch(`/locations/${locationId}/deactivate`);
      return res.data.data.location as CompanyLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", companyId] });
    },
  });
}
