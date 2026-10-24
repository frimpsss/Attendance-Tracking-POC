-- ==============================================================================
-- Migration 004: Grant USAGE on private_attendance schema to authenticated/anon
-- so RLS policies and public RPC wrappers can invoke private_attendance helpers
-- without "permission denied for schema private_attendance" (HTTP 403).
-- ==============================================================================

GRANT USAGE ON SCHEMA private_attendance TO postgres, service_role, authenticated, anon;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private_attendance TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, anon;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.get_active_user_role(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.get_active_user_role(auth.uid()) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT COALESCE(private_attendance.get_active_user_role(auth.uid()) = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT COALESCE(private_attendance.get_active_user_role(auth.uid()) = 'lecturer', false);
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT COALESCE(private_attendance.get_active_user_role(auth.uid()) = 'student', false);
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_lecturer(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT COALESCE(private_attendance.get_active_user_role(auth.uid()) = 'lecturer', false)
     AND private_attendance.check_lecturer_assigned(auth.uid(), p_course_id);
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled_student(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT COALESCE(private_attendance.get_active_user_role(auth.uid()) = 'student', false)
     AND private_attendance.check_student_enrolled(auth.uid(), p_course_id);
$$;
