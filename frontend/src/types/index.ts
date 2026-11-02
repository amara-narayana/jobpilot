export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'REMOTE';

export type InterviewType =
  | 'SCREENING'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'SYSTEM_DESIGN'
  | 'ONSITE'
  | 'FINAL';

export type InterviewResult =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export type DocumentType =
  | 'RESUME'
  | 'COVER_LETTER'
  | 'CERTIFICATE'
  | 'PORTFOLIO'
  | 'OTHER';

export type ReminderType =
  | 'INTERVIEW'
  | 'DEADLINE'
  | 'FOLLOW_UP'
  | 'ASSESSMENT';

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  default_currency: string;
  timezone: string;
  email_notifications: boolean;
}

export interface NotificationPreferences {
  email_interview_reminders: boolean;
  email_deadline_reminders: boolean;
  email_followup_reminders: boolean;
  email_daily_digest: boolean;
  lead_time_hours: number;
}

export interface Company {
  id: number;
  user_id: number;
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  recruiter_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface Application {
  id: number;
  user_id: number;
  company_id?: number | null;
  company_name: string;
  job_title: string;
  job_description?: string | null;
  job_url?: string | null;
  location?: string | null;
  employment_type: EmploymentType;
  salary_min?: number | null;
  salary_max?: number | null;
  currency: string;
  date_discovered?: string | null;
  date_applied?: string | null;
  deadline?: string | null;
  resume_version?: string | null;
  cover_letter?: string | null;
  notes?: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusHistory {
  id: number;
  application_id: number;
  from_status?: ApplicationStatus | null;
  to_status: ApplicationStatus;
  notes?: string | null;
  changed_at: string;
}

export interface Interview {
  id: number;
  user_id: number;
  application_id: number;
  company_name?: string;
  job_title?: string;
  interview_date: string;
  timezone: string;
  interview_type: InterviewType;
  interview_round: number;
  meeting_link?: string | null;
  interviewer_details?: string | null;
  prep_notes?: string | null;
  feedback?: string | null;
  result: InterviewResult;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: number;
  user_id: number;
  application_id?: number | null;
  company_name?: string | null;
  document_name: string;
  document_type: DocumentType;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  application_id?: number | null;
  interview_id?: number | null;
  company_name?: string | null;
  job_title?: string | null;
  title: string;
  description?: string | null;
  reminder_type: ReminderType;
  due_date: string;
  is_completed: boolean;
  is_sent: boolean;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface DashboardMetrics {
  total_applications: number;
  applications_this_month: number;
  active_interviews: number;
  offers_received: number;
  rejections: number;
  upcoming_interviews: Interview[];
  pipeline_distribution: Record<ApplicationStatus, number>;
  monthly_trends: { month: string; count: number }[];
  recent_activity: ActivityLog[];
  pending_reminders: Reminder[];
}

export interface AnalyticsMetrics {
  total_applications: number;
  application_to_interview_rate: number;
  interview_to_offer_rate: number;
  overall_offer_rate: number;
  rejection_rate: number;
  monthly_applications: { month: string; count: number }[];
  applications_by_status: { status: ApplicationStatus; count: number }[];
  top_companies: { company_name: string; count: number }[];
  average_response_days: number | null;
  interviews_by_result: { result: InterviewResult; count: number }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
