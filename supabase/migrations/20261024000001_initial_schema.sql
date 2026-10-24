-- ==============================================================================
-- Migration 001: Initial Schema, Enums, Constraints, and Indexes
-- Student Attendance Management System (POC)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Domain Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'lecturer', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('scheduled', 'open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.credential_method AS ENUM ('qr', 'code');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_source AS ENUM ('qr', 'code', 'manual', 'correction');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.correction_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Profiles & User Roles (Separated so clients cannot self-escalate roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0),
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Academic Entities
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (char_length(trim(code)) > 0),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE RESTRICT,
  student_number TEXT NOT NULL UNIQUE CHECK (char_length(trim(student_number)) > 0),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  academic_level TEXT NOT NULL DEFAULT '100',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lecturers (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE RESTRICT,
  staff_number TEXT NOT NULL UNIQUE CHECK (char_length(trim(staff_number)) > 0),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL CHECK (char_length(trim(code)) > 0),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  academic_period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE RESTRICT,
  level TEXT NOT NULL DEFAULT '100',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT courses_code_period_unique UNIQUE (code, academic_period_id)
);

CREATE TABLE IF NOT EXISTS public.course_lecturers (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  lecturer_id UUID NOT NULL REFERENCES public.lecturers(user_id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, lecturer_id)
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE RESTRICT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unenrolled_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time),
  venue TEXT NOT NULL CHECK (char_length(trim(venue)) > 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- 4. Attendance Sessions, Credentials, and Entries
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT 'Class Session',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  status public.session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  method public.credential_method NOT NULL,
  credential_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE RESTRICT,
  status public.attendance_status NOT NULL,
  source public.attendance_source NOT NULL,
  checked_in_at TIMESTAMPTZ,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  override_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attendance_entries_session_student_unique UNIQUE (session_id, student_id)
);

-- 5. Correction Requests, Notifications, Audit Logs, and System Settings
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_entry_id UUID NOT NULL REFERENCES public.attendance_entries(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE RESTRICT,
  requested_status public.attendance_status NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3),
  supporting_note TEXT,
  status public.correction_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decision_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial UNIQUE index: A student may have at most one pending correction request per attendance entry
CREATE UNIQUE INDEX IF NOT EXISTS correction_requests_one_pending_per_entry_idx
  ON public.correction_requests (attendance_entry_id)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  dedupe_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  low_attendance_threshold NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (low_attendance_threshold BETWEEN 1 AND 100),
  late_grace_minutes INTEGER NOT NULL DEFAULT 10 CHECK (late_grace_minutes BETWEEN 0 AND 180),
  checkin_window_minutes INTEGER NOT NULL DEFAULT 30 CHECK (checkin_window_minutes BETWEEN 1 AND 240),
  qr_enabled BOOLEAN NOT NULL DEFAULT true,
  code_enabled BOOLEAN NOT NULL DEFAULT true,
  manual_enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Rate limiting table for check-in attempts (restricted to server routines)
CREATE TABLE IF NOT EXISTS public.checkin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  succeeded BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_department ON public.lecturers(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_period ON public.courses(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_course_lecturers_lecturer ON public.course_lecturers(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetables_course ON public.timetables(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course_status ON public.attendance_sessions(course_id, status);
CREATE INDEX IF NOT EXISTS idx_credentials_session_active ON public.attendance_credentials(session_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entries_session ON public.attendance_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_entries_student ON public.attendance_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_corrections_student ON public.correction_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_corrections_status ON public.correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_attempts_student_time ON public.checkin_attempts(student_id, attempted_at DESC);
