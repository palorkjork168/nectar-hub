export interface WorkScheduleTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  expected_hours: number;
}

export interface ShiftAssignment {
  id: string;
  company_id: string;
  employment_record_id: string;
  user_id: string;
  work_schedule_id?: string | null;
  shift_date: string;
  is_rest_day: boolean;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  workSchedule?: WorkScheduleTemplate | null;
  created_at: string;
  updated_at: string;
}

export interface RosterEmployee {
  id: string;
  user_id: string;
  company_id: string;
  status: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  position?: {
    id: string;
    title: string;
  } | null;
  workSchedule?: WorkScheduleTemplate | null;
  location?: {
    id: string;
    name: string;
    address?: string | null;
    radius_meters: number;
  } | null;
}

export interface WeeklyRosterRow {
  employmentRecord: RosterEmployee;
  assignments: ShiftAssignment[];
}

export interface AssignShiftPayload {
  employment_record_id: string;
  shift_date: string;
  work_schedule_id?: string | null;
  is_rest_day?: boolean;
  notes?: string | null;
}

export interface BulkAssignPayload {
  assignments: AssignShiftPayload[];
}
