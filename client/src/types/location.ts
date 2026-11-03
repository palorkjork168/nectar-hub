export interface CompanyLocation {
  id: string;
  company_id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationPayload {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active?: boolean;
}

export interface UpdateLocationPayload {
  name?: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  is_active?: boolean;
}
