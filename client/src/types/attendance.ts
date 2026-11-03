export type AttendanceStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_TIME"
  | "LATE"
  | "EARLY_DEPARTURE"
  | "LATE_AND_EARLY_DEPARTURE";

export interface WorkSchedule {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
  grace_period_minutes: number;
  expected_hours: number | string;
  is_active: boolean;
  assignedCount?: number;
  assigned_employees_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleEmployee {
  id: string; // employment_record_id
  user_id: string;
  company_id: string;
  status: string;
  employment_type?: string | null;
  start_date?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  position?: {
    id: string;
    title: string;
  } | null;
}

export interface Attendance {
  id: string;
  user_id: string;
  company_id?: string | null;
  employment_record_id?: string | null;
  work_schedule_id?: string | null;
  company?: { id: string; name: string } | null;
  schedule?: WorkSchedule | null;
  check_in_time: string;
  check_in_lat: number;
  check_in_long: number;
  check_out_time: string | null;
  check_out_lat: number | null;
  check_out_long: number | null;
  is_late: boolean;
  late_minutes: number;
  is_early_departure: boolean;
  early_departure_minutes: number;
  actual_hours: number | string | null;
  completion_percentage: number | null;
  status: AttendanceStatus;
  is_corrected?: boolean;
  location_status?: string | null;
  original_check_in_time?: string | null;
  original_check_out_time?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export type CorrectionType =
  | "MISSING_CHECK_OUT"
  | "MISSING_CHECK_IN"
  | "INCORRECT_TIMES"
  | "MISSED_SHIFT";

export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AttendanceCorrectionRequest {
  id: string;
  attendance_id?: string | null;
  user_id: string;
  company_id: string;
  employment_record_id?: string | null;
  work_schedule_id?: string | null;
  correction_type: CorrectionType;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  original_check_in_time?: string | null;
  original_check_out_time?: string | null;
  reason: string;
  status: CorrectionStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string } | null;
  workSchedule?: WorkSchedule | null;
  attendance?: Attendance | null;
  reviewer?: { id: string; first_name: string; last_name: string; email: string } | null;
  user?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string } | null;
  employmentRecord?: {
    id: string;
    department?: { id: string; name: string } | null;
    position?: { id: string; title: string } | null;
  } | null;
}

export interface BatchReviewResult {
  total: number;
  succeeded: Array<{ id: string; status: "APPROVED" | "REJECTED"; data?: any }>;
  failed: Array<{ id: string; error: string }>;
  allSucceeded: boolean;
}

