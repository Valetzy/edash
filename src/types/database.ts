export type UserRole = 'registrar' | 'career_guidance' | 'president'
export type EnrollmentStatus = 'enrolled' | 'graduated' | 'dropped' | 'shifted'
export type SemesterType = '1st' | '2nd' | 'summer'
export type CaseStatus = 'pending' | 'investigating' | 'resolved'
export type CaseType = 'dropout' | 'shifted'
export type VisitOutcome = 're_enrolled' | 'confirmed_dropout' | 'confirmed_transfer_school' | 'unreachable' | 'other'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Program {
  id: string
  code: string
  name: string
  created_at: string
}

export interface SchoolTerm {
  id: string
  school_year: string
  semester: SemesterType
  term_order: number
  is_closed: boolean
  created_at: string
}

export interface Student {
  id: string
  student_no: string
  first_name: string
  last_name: string
  contact_number: string | null
  address: string | null
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  program_id: string
  term_id: string
  year_level: number
  status: EnrollmentStatus
  created_by: string | null
  created_at: string
}

export interface StudentCase {
  id: string
  student_id: string
  last_enrollment_id: string | null
  case_type: CaseType
  from_program_id: string | null
  to_program_id: string | null
  status: CaseStatus
  assigned_to: string | null
  created_at: string
  resolved_at: string | null
}

export interface FollowUpVisit {
  id: string
  case_id: string
  visited_by: string | null
  visit_date: string
  reason_category: string | null
  reason_notes: string | null
  outcome: VisitOutcome | null
  created_at: string
}

export interface CaseDetail {
  id: string
  case_type: CaseType
  status: CaseStatus
  created_at: string
  resolved_at: string | null
  assigned_to: string | null
  student_id: string
  student_no: string
  first_name: string
  last_name: string
  contact_number: string | null
  address: string | null
  from_program_name: string | null
  to_program_name: string | null
  school_year: string
  semester: SemesterType
  reason_category: string | null
  reason_notes: string | null
  outcome: VisitOutcome | null
  visit_date: string | null
}

export interface ProgramTermStat {
  term_id: string
  school_year: string
  semester: SemesterType
  term_order: number
  program_id: string
  program_name: string
  program_code: string
  enrolled_count: number
}

export interface RetentionRateRow {
  term_id: string
  school_year: string
  semester: SemesterType
  term_order: number
  program_id: string
  program_name: string
  retained_count: number
  dropout_count: number
  shifted_count: number
  prior_cohort_size: number
}

export interface DropoutReasonSummary {
  reason_category: string
  total: number
}

export const REASON_CATEGORIES = [
  'financial',
  'health',
  'distance',
  'family_obligation',
  'working',
  'not_interested',
  'transferred_school',
  'other',
] as const
