export type NotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_STATUS_CHANGED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_RESCHEDULED"
  | "INTERVIEW_CANCELLED"
  | "CANDIDATE_HIRED"
  | "LEAVE_REQUESTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_CANCELLED"
  | "ATTENDANCE_CORRECTION_REQUESTED"
  | "ATTENDANCE_CORRECTION_APPROVED"
  | "ATTENDANCE_CORRECTION_REJECTED";


export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
