-- ==============================================================================
-- Migration 002: Row Level Security (RLS) Matrix & Trusted Transactional RPCs
-- Student Attendance Management System (POC)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS private_attendance;
REVOKE ALL ON SCHEMA private_attendance FROM PUBLIC;
GRANT USAGE ON SCHEMA private_attendance TO postgres, service_role, authenticated, anon;

-- ==============================================================================
-- 1. Security Helper Functions (Enforcing Active User + Role Resolution from DB)
-- ==============================================================================

CREATE OR REPLACE FUNCTION private_attendance.get_active_user_role(p_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.user_id = p_user_id
    AND p.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private_attendance.get_active_user_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.get_active_user_role(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.get_active_user_role(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT public.current_user_role() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(public.current_user_role() = 'lecturer', false);
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(public.current_user_role() = 'student', false);
$$;

CREATE OR REPLACE FUNCTION private_attendance.check_lecturer_assigned(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_lecturers cl
    JOIN public.profiles p ON p.id = cl.lecturer_id
    WHERE cl.course_id = p_course_id
      AND cl.lecturer_id = p_user_id
      AND p.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION private_attendance.check_lecturer_assigned(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.check_lecturer_assigned(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_assigned_lecturer(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT public.is_lecturer() AND private_attendance.check_lecturer_assigned(auth.uid(), p_course_id);
$$;

CREATE OR REPLACE FUNCTION private_attendance.check_student_enrolled(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    JOIN public.profiles p ON p.id = ce.student_id
    WHERE ce.course_id = p_course_id
      AND ce.student_id = p_user_id
      AND p.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION private_attendance.check_student_enrolled(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.check_student_enrolled(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_enrolled_student(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT public.is_student() AND private_attendance.check_student_enrolled(auth.uid(), p_course_id);
$$;

-- ==============================================================================
-- 2. Enable Row Level Security on ALL Tables
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_attempts ENABLE ROW LEVEL SECURITY;

-- Restrict direct table privileges on sensitive tables
REVOKE ALL ON public.attendance_credentials FROM anon, authenticated;
REVOKE ALL ON public.checkin_attempts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.attendance_entries FROM anon, authenticated;

-- ==============================================================================
-- 3. RLS Policies
-- ==============================================================================

-- PROFILES
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_lecturer() AND EXISTS (
        SELECT 1
        FROM public.course_enrollments ce
        JOIN public.course_lecturers cl ON cl.course_id = ce.course_id
        WHERE ce.student_id = profiles.id
          AND cl.lecturer_id = auth.uid()
      )
    )
    OR (
      public.is_student() AND EXISTS (
        SELECT 1
        FROM public.course_lecturers cl
        JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
        WHERE cl.lecturer_id = profiles.id
          AND ce.student_id = auth.uid()
      )
    )
  );

CREATE POLICY profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (id = auth.uid() AND public.is_active_user())
  )
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND is_active = true
    )
  );

-- USER_ROLES (Read own or admin read all; NO direct client writes)
CREATE POLICY user_roles_select_policy ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

-- DEPARTMENTS
CREATE POLICY departments_select_policy ON public.departments
  FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY departments_admin_write ON public.departments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ACADEMIC PERIODS
CREATE POLICY academic_periods_select_policy ON public.academic_periods
  FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY academic_periods_admin_write ON public.academic_periods
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- STUDENTS
CREATE POLICY students_select_policy ON public.students
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_lecturer() AND EXISTS (
        SELECT 1
        FROM public.course_enrollments ce
        JOIN public.course_lecturers cl ON cl.course_id = ce.course_id
        WHERE ce.student_id = students.user_id
          AND cl.lecturer_id = auth.uid()
      )
    )
  );

CREATE POLICY students_admin_write ON public.students
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- LECTURERS
CREATE POLICY lecturers_select_policy ON public.lecturers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_student() AND EXISTS (
        SELECT 1
        FROM public.course_lecturers cl
        JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
        WHERE cl.lecturer_id = lecturers.user_id
          AND ce.student_id = auth.uid()
      )
    )
  );

CREATE POLICY lecturers_admin_write ON public.lecturers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COURSES
CREATE POLICY courses_select_policy ON public.courses
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_assigned_lecturer(id)
    OR public.is_enrolled_student(id)
  );

CREATE POLICY courses_admin_write ON public.courses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COURSE_LECTURERS
CREATE POLICY course_lecturers_select_policy ON public.course_lecturers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR lecturer_id = auth.uid()
    OR public.is_enrolled_student(course_id)
  );

CREATE POLICY course_lecturers_admin_write ON public.course_lecturers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COURSE_ENROLLMENTS
CREATE POLICY course_enrollments_select_policy ON public.course_enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR student_id = auth.uid()
    OR public.is_assigned_lecturer(course_id)
  );

CREATE POLICY course_enrollments_admin_write ON public.course_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- TIMETABLES
CREATE POLICY timetables_select_policy ON public.timetables
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_assigned_lecturer(course_id)
    OR public.is_enrolled_student(course_id)
  );

CREATE POLICY timetables_admin_write ON public.timetables
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ATTENDANCE_SESSIONS
CREATE POLICY attendance_sessions_select_policy ON public.attendance_sessions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_assigned_lecturer(course_id)
    OR public.is_enrolled_student(course_id)
  );

CREATE POLICY attendance_sessions_insert_policy ON public.attendance_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_admin() OR public.is_assigned_lecturer(course_id))
    AND created_by = auth.uid()
  );

CREATE POLICY attendance_sessions_update_policy ON public.attendance_sessions
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (public.is_assigned_lecturer(course_id) AND status <> 'closed')
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_assigned_lecturer(course_id)
  );

-- ATTENDANCE_ENTRIES (Select only; mutations strictly via trusted RPCs)
CREATE POLICY attendance_entries_select_policy ON public.attendance_entries
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (student_id = auth.uid() AND public.is_student())
    OR (
      public.is_lecturer() AND EXISTS (
        SELECT 1
        FROM public.attendance_sessions s
        WHERE s.id = attendance_entries.session_id
          AND public.is_assigned_lecturer(s.course_id)
      )
    )
  );

-- CORRECTION_REQUESTS
CREATE POLICY correction_requests_select_policy ON public.correction_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (student_id = auth.uid() AND public.is_student())
    OR (
      public.is_lecturer() AND EXISTS (
        SELECT 1
        FROM public.attendance_entries ae
        JOIN public.attendance_sessions s ON s.id = ae.session_id
        WHERE ae.id = correction_requests.attendance_entry_id
          AND public.is_assigned_lecturer(s.course_id)
      )
    )
  );

-- NOTIFICATIONS
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() AND public.is_active_user())
  WITH CHECK (recipient_id = auth.uid());

-- AUDIT_LOGS (Admin read-only via Data API)
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- SYSTEM_SETTINGS
CREATE POLICY system_settings_select_policy ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.is_active_user());

CREATE POLICY system_settings_update_admin ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. Private Trusted Database Routines & Narrowly Scoped Public RPC Wrappers
-- ==============================================================================

-- Helper: Evaluate and emit low-attendance notification for a student in a course
CREATE OR REPLACE FUNCTION private_attendance.evaluate_low_attendance_alert(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_threshold NUMERIC(5,2);
  v_course_code TEXT;
  v_course_title TEXT;
  v_eligible_count INTEGER;
  v_attended_count INTEGER;
  v_pct NUMERIC(5,2);
  v_dedupe_key TEXT;
BEGIN
  SELECT low_attendance_threshold INTO v_threshold
  FROM public.system_settings
  WHERE id = 1;

  SELECT code, title INTO v_course_code, v_course_title
  FROM public.courses
  WHERE id = p_course_id;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE ae.status IN ('present', 'late'))::INTEGER
  INTO v_eligible_count, v_attended_count
  FROM public.attendance_sessions s
  JOIN public.course_enrollments ce
    ON ce.course_id = s.course_id
   AND ce.student_id = p_student_id
  LEFT JOIN public.attendance_entries ae
    ON ae.session_id = s.id
   AND ae.student_id = p_student_id
  WHERE s.course_id = p_course_id
    AND s.status = 'closed'
    AND ce.enrolled_at <= COALESCE(s.opened_at, s.scheduled_at)
    AND (ce.unenrolled_at IS NULL OR ce.unenrolled_at >= COALESCE(s.opened_at, s.scheduled_at));

  IF v_eligible_count > 0 THEN
    v_pct := ROUND((100.0 * v_attended_count / v_eligible_count)::NUMERIC, 1);
    IF v_pct < v_threshold THEN
      v_dedupe_key := 'low_att:' || p_student_id::TEXT || ':' || p_course_id::TEXT || ':' || v_eligible_count::TEXT;
      INSERT INTO public.notifications (recipient_id, type, title, body, dedupe_key)
      VALUES (
        p_student_id,
        'low_attendance',
        'Low Attendance Warning — ' || v_course_code,
        'Your attendance in ' || v_course_code || ' (' || v_course_title || ') is currently ' || v_pct::TEXT || '% (' || v_attended_count::TEXT || '/' || v_eligible_count::TEXT || ' classes), which is below the ' || v_threshold::TEXT || '% requirement.',
        v_dedupe_key
      )
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.evaluate_low_attendance_alert(UUID, UUID) FROM PUBLIC;

-- Operation 1: Issue / Rotate Session Credentials (QR + Short Code)
CREATE OR REPLACE FUNCTION private_attendance.issue_session_credentials_impl(
  p_caller_id UUID,
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance, extensions
AS $$
DECLARE
  v_role public.app_role;
  v_session public.attendance_sessions%ROWTYPE;
  v_settings public.system_settings%ROWTYPE;
  v_qr_token TEXT;
  v_short_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes BYTEA;
  i INTEGER;
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: inactive or unauthenticated user';
  END IF;

  SELECT * INTO v_session
  FROM public.attendance_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance session not found';
  END IF;

  IF v_role <> 'admin' AND NOT (v_role = 'lecturer' AND private_attendance.check_lecturer_assigned(p_caller_id, v_session.course_id)) THEN
    RAISE EXCEPTION 'Forbidden: you are not assigned to this course';
  END IF;

  IF v_session.status = 'closed' THEN
    RAISE EXCEPTION 'Cannot issue credentials for a closed session';
  END IF;

  SELECT * INTO v_settings FROM public.system_settings WHERE id = 1;

  -- If session was scheduled, open it now
  IF v_session.status = 'scheduled' THEN
    UPDATE public.attendance_sessions
    SET status = 'open',
        opened_at = COALESCE(opened_at, now()),
        closes_at = COALESCE(closes_at, now() + make_interval(mins => v_settings.checkin_window_minutes))
    WHERE id = p_session_id
    RETURNING * INTO v_session;
  ELSIF v_session.closes_at IS NULL OR v_session.closes_at <= now() THEN
    UPDATE public.attendance_sessions
    SET closes_at = now() + make_interval(mins => v_settings.checkin_window_minutes)
    WHERE id = p_session_id
    RETURNING * INTO v_session;
  END IF;

  v_expires_at := LEAST(v_session.closes_at, now() + interval '15 minutes');

  -- Revoke all previous credentials for this session
  UPDATE public.attendance_credentials
  SET revoked_at = now()
  WHERE session_id = p_session_id
    AND revoked_at IS NULL;

  -- Generate cryptographically random QR token & 6-character unambiguous alphanumeric code
  v_qr_token := encode(gen_random_bytes(24), 'hex');
  v_bytes := gen_random_bytes(6);
  v_short_code := '';
  FOR i IN 0..5 LOOP
    v_short_code := v_short_code || substr(v_chars, (get_byte(v_bytes, i) % length(v_chars)) + 1, 1);
  END LOOP;

  IF v_settings.qr_enabled THEN
    INSERT INTO public.attendance_credentials (session_id, method, credential_hash, expires_at)
    VALUES (
      p_session_id,
      'qr',
      encode(digest(v_qr_token, 'sha256'), 'hex'),
      v_expires_at
    );
  END IF;

  IF v_settings.code_enabled THEN
    INSERT INTO public.attendance_credentials (session_id, method, credential_hash, expires_at)
    VALUES (
      p_session_id,
      'code',
      encode(digest(upper(v_short_code), 'sha256'), 'hex'),
      v_expires_at
    );
  END IF;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'qr_token', CASE WHEN v_settings.qr_enabled THEN v_qr_token ELSE NULL END,
    'checkin_code', CASE WHEN v_settings.code_enabled THEN v_short_code ELSE NULL END,
    'expires_at', v_expires_at,
    'closes_at', v_session.closes_at
  );
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.issue_session_credentials_impl(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.issue_session_credentials_impl(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.issue_attendance_credential(p_session_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.issue_session_credentials_impl(auth.uid(), p_session_id);
$$;

GRANT EXECUTE ON FUNCTION public.issue_attendance_credential(UUID) TO authenticated;

-- Operation 2: Submit Student Self-Check-In (Atomic, Rate-Limited, Idempotent)
CREATE OR REPLACE FUNCTION private_attendance.submit_checkin_impl(
  p_caller_id UUID,
  p_session_id UUID,
  p_credential TEXT,
  p_method public.credential_method
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance, extensions
AS $$
DECLARE
  v_role public.app_role;
  v_recent_failures INTEGER;
  v_clean_cred TEXT;
  v_cred_hash TEXT;
  v_cred_row public.attendance_credentials%ROWTYPE;
  v_session public.attendance_sessions%ROWTYPE;
  v_course public.courses%ROWTYPE;
  v_settings public.system_settings%ROWTYPE;
  v_enrollment public.course_enrollments%ROWTYPE;
  v_existing public.attendance_entries%ROWTYPE;
  v_status public.attendance_status;
  v_entry public.attendance_entries%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL OR v_role <> 'student' THEN
    RAISE EXCEPTION 'CHECKIN_FORBIDDEN: Only active student accounts can check in.';
  END IF;

  -- Check rate-limit: max 5 failed attempts in the last 2 minutes
  SELECT COUNT(*)::INTEGER INTO v_recent_failures
  FROM public.checkin_attempts
  WHERE student_id = p_caller_id
    AND succeeded = false
    AND attempted_at > (v_now - interval '2 minutes');

  IF v_recent_failures >= 5 THEN
    RAISE EXCEPTION 'CHECKIN_RATE_LIMITED: Too many failed attempts. Please wait 2 minutes before trying again.';
  END IF;

  SELECT * INTO v_settings FROM public.system_settings WHERE id = 1;
  IF p_method = 'qr' AND NOT v_settings.qr_enabled THEN
    RAISE EXCEPTION 'CHECKIN_METHOD_DISABLED: QR check-in is currently disabled by institution policy.';
  END IF;
  IF p_method = 'code' AND NOT v_settings.code_enabled THEN
    RAISE EXCEPTION 'CHECKIN_METHOD_DISABLED: Code check-in is currently disabled by institution policy.';
  END IF;

  v_clean_cred := trim(COALESCE(p_credential, ''));
  IF v_clean_cred = '' THEN
    RAISE EXCEPTION 'CHECKIN_INVALID_CODE: Please provide a valid check-in credential.';
  END IF;

  IF p_method = 'code' THEN
    v_cred_hash := encode(digest(upper(v_clean_cred), 'sha256'), 'hex');
  ELSE
    v_cred_hash := encode(digest(v_clean_cred, 'sha256'), 'hex');
  END IF;

  -- Resolve credential & session
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
      INSERT INTO public.checkin_attempts (student_id, succeeded, failure_reason)
      VALUES (p_caller_id, false, 'session_not_found');
      RAISE EXCEPTION 'CHECKIN_SESSION_NOT_FOUND: Attendance session not found.';
    END IF;
  ELSE
    -- When student enters a short code without a session_id, locate the matching active credential
    SELECT ac.* INTO v_cred_row
    FROM public.attendance_credentials ac
    JOIN public.attendance_sessions s ON s.id = ac.session_id
    JOIN public.course_enrollments ce ON ce.course_id = s.course_id AND ce.student_id = p_caller_id
    WHERE ac.method = p_method
      AND ac.credential_hash = v_cred_hash
      AND ac.revoked_at IS NULL
    ORDER BY ac.created_at DESC
    LIMIT 1;

    IF FOUND THEN
      SELECT * INTO v_session FROM public.attendance_sessions WHERE id = v_cred_row.session_id;
    ELSE
      -- Check if code matches any session the student is NOT enrolled in, to give clear feedback
      SELECT ac.* INTO v_cred_row
      FROM public.attendance_credentials ac
      WHERE ac.method = p_method
        AND ac.credential_hash = v_cred_hash
        AND ac.revoked_at IS NULL
      ORDER BY ac.created_at DESC
      LIMIT 1;

      IF FOUND THEN
        SELECT * INTO v_session FROM public.attendance_sessions WHERE id = v_cred_row.session_id;
      ELSE
        INSERT INTO public.checkin_attempts (student_id, succeeded, failure_reason)
        VALUES (p_caller_id, false, 'invalid_code');
        RAISE EXCEPTION 'CHECKIN_INVALID_CODE: Invalid or unrecognized check-in code.';
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = v_session.course_id;

  -- Check student enrollment for the course at session time
  SELECT * INTO v_enrollment
  FROM public.course_enrollments
  WHERE course_id = v_session.course_id
    AND student_id = p_caller_id
    AND is_active = true
    AND enrolled_at <= COALESCE(v_session.opened_at, v_now)
    AND (unenrolled_at IS NULL OR unenrolled_at >= COALESCE(v_session.opened_at, v_now));

  IF NOT FOUND THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'not_enrolled');
    RAISE EXCEPTION 'CHECKIN_NOT_ENROLLED: You are not enrolled in % (%).', v_course.code, v_course.title;
  END IF;

  -- Check if student already checked in (repeat-safe / idempotent check)
  SELECT * INTO v_existing
  FROM public.attendance_entries
  WHERE session_id = v_session.id
    AND student_id = p_caller_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'already_checked_in', true,
      'entry_id', v_existing.id,
      'session_id', v_session.id,
      'session_title', v_session.title,
      'course_id', v_course.id,
      'course_code', v_course.code,
      'course_title', v_course.title,
      'status', v_existing.status,
      'source', v_existing.source,
      'checked_in_at', v_existing.checked_in_at
    );
  END IF;

  -- Verify session is open and within window
  IF v_session.status <> 'open' THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'session_closed');
    RAISE EXCEPTION 'CHECKIN_SESSION_CLOSED: This attendance session is closed.';
  END IF;

  IF v_session.closes_at IS NOT NULL AND v_now > v_session.closes_at THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'window_expired');
    RAISE EXCEPTION 'CHECKIN_SESSION_EXPIRED: The check-in window for this session has expired.';
  END IF;

  -- Validate credential against restricted table
  SELECT * INTO v_cred_row
  FROM public.attendance_credentials
  WHERE session_id = v_session.id
    AND method = p_method
    AND credential_hash = v_cred_hash
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'invalid_credential');
    RAISE EXCEPTION 'CHECKIN_INVALID_CODE: Invalid check-in code or QR token for this session.';
  END IF;

  IF v_cred_row.revoked_at IS NOT NULL THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'credential_revoked');
    RAISE EXCEPTION 'CHECKIN_CODE_SUPERSEDED: This QR/code has been regenerated by the lecturer. Please scan the latest code.';
  END IF;

  IF v_now > v_cred_row.expires_at THEN
    INSERT INTO public.checkin_attempts (student_id, session_id, succeeded, failure_reason)
    VALUES (p_caller_id, v_session.id, false, 'credential_expired');
    RAISE EXCEPTION 'CHECKIN_CODE_EXPIRED: This QR/code has expired. Ask your lecturer to refresh the code.';
  END IF;

  -- Derive Present vs Late on server from opened_at + late_grace_minutes
  IF v_session.opened_at IS NOT NULL
     AND v_now > (v_session.opened_at + make_interval(mins => v_settings.late_grace_minutes)) THEN
    v_status := 'late';
  ELSE
    v_status := 'present';
  END IF;

  -- Atomic insert with conflict handling for concurrent duplicate tabs/devices
  INSERT INTO public.attendance_entries (
    session_id,
    student_id,
    status,
    source,
    checked_in_at,
    marked_by,
    updated_at
  )
  VALUES (
    v_session.id,
    p_caller_id,
    v_status,
    CASE WHEN p_method = 'qr' THEN 'qr'::public.attendance_source ELSE 'code'::public.attendance_source END,
    v_now,
    p_caller_id,
    v_now
  )
  ON CONFLICT (session_id, student_id) DO NOTHING
  RETURNING * INTO v_entry;

  IF NOT FOUND THEN
    SELECT * INTO v_entry
    FROM public.attendance_entries
    WHERE session_id = v_session.id
      AND student_id = p_caller_id;

    RETURN jsonb_build_object(
      'already_checked_in', true,
      'entry_id', v_entry.id,
      'session_id', v_session.id,
      'session_title', v_session.title,
      'course_id', v_course.id,
      'course_code', v_course.code,
      'course_title', v_course.title,
      'status', v_entry.status,
      'source', v_entry.source,
      'checked_in_at', v_entry.checked_in_at
    );
  END IF;

  INSERT INTO public.checkin_attempts (student_id, session_id, succeeded)
  VALUES (p_caller_id, v_session.id, true);

  RETURN jsonb_build_object(
    'already_checked_in', false,
    'entry_id', v_entry.id,
    'session_id', v_session.id,
    'session_title', v_session.title,
    'course_id', v_course.id,
    'course_code', v_course.code,
    'course_title', v_course.title,
    'status', v_entry.status,
    'source', v_entry.source,
    'checked_in_at', v_entry.checked_in_at
  );
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.submit_checkin_impl(UUID, UUID, TEXT, public.credential_method) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.submit_checkin_impl(UUID, UUID, TEXT, public.credential_method) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_checkin(
  p_credential TEXT,
  p_method public.credential_method DEFAULT 'code',
  p_session_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.submit_checkin_impl(auth.uid(), p_session_id, p_credential, p_method);
$$;

GRANT EXECUTE ON FUNCTION public.submit_checkin(TEXT, public.credential_method, UUID) TO authenticated;

-- Operation 3: Manual Attendance Marking / Admin Override (Transactional + Audited)
CREATE OR REPLACE FUNCTION private_attendance.mark_attendance_impl(
  p_caller_id UUID,
  p_session_id UUID,
  p_student_id UUID,
  p_status public.attendance_status,
  p_reason TEXT
)
RETURNS public.attendance_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_role public.app_role;
  v_session public.attendance_sessions%ROWTYPE;
  v_existing public.attendance_entries%ROWTYPE;
  v_has_existing BOOLEAN := false;
  v_result public.attendance_entries%ROWTYPE;
  v_session_ref_time TIMESTAMPTZ;
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL OR v_role NOT IN ('admin', 'lecturer') THEN
    RAISE EXCEPTION 'Unauthorized: only active lecturers or admins can mark attendance';
  END IF;

  SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_role = 'lecturer' THEN
    IF NOT private_attendance.check_lecturer_assigned(p_caller_id, v_session.course_id) THEN
      RAISE EXCEPTION 'Forbidden: you are not assigned to this course';
    END IF;
    IF v_session.status = 'closed' THEN
      RAISE EXCEPTION 'Cannot manually edit a closed session. Use correction review or contact an administrator.';
    END IF;
  END IF;

  v_session_ref_time := COALESCE(v_session.opened_at, v_session.scheduled_at, now());

  -- Verify student was enrolled for the session date
  IF NOT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.course_id = v_session.course_id
      AND ce.student_id = p_student_id
      AND ce.enrolled_at <= v_session_ref_time
      AND (ce.unenrolled_at IS NULL OR ce.unenrolled_at >= v_session_ref_time)
  ) THEN
    RAISE EXCEPTION 'Student was not enrolled in this course at the session time';
  END IF;

  SELECT * INTO v_existing
  FROM public.attendance_entries
  WHERE session_id = p_session_id
    AND student_id = p_student_id
  FOR UPDATE;

  v_has_existing := FOUND;

  -- If overriding an existing entry OR admin editing a closed session, require reason and write audit log
  IF (v_has_existing AND v_existing.status <> p_status) OR v_role = 'admin' THEN
    IF v_has_existing AND v_existing.status <> p_status AND (p_reason IS NULL OR char_length(trim(p_reason)) < 3) THEN
      RAISE EXCEPTION 'An audit reason (at least 3 characters) is required when overriding an existing attendance status';
    END IF;
  END IF;

  INSERT INTO public.attendance_entries (
    session_id,
    student_id,
    status,
    source,
    checked_in_at,
    marked_by,
    updated_at
  )
  VALUES (
    p_session_id,
    p_student_id,
    p_status,
    'manual',
    CASE WHEN p_status IN ('present', 'late') THEN now() ELSE NULL END,
    p_caller_id,
    now()
  )
  ON CONFLICT (session_id, student_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    source = 'manual',
    checked_in_at = CASE
      WHEN EXCLUDED.status IN ('present', 'late') THEN COALESCE(public.attendance_entries.checked_in_at, now())
      ELSE NULL
    END,
    marked_by = p_caller_id,
    updated_at = now()
  RETURNING * INTO v_result;

  IF v_has_existing AND v_existing.status <> p_status THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      reason
    )
    VALUES (
      p_caller_id,
      CASE WHEN v_role = 'admin' THEN 'admin_attendance_override' ELSE 'lecturer_attendance_override' END,
      'attendance_entry',
      v_result.id::TEXT,
      jsonb_build_object('status', v_existing.status, 'source', v_existing.source, 'student_id', p_student_id, 'session_id', p_session_id),
      jsonb_build_object('status', v_result.status, 'source', v_result.source, 'student_id', p_student_id, 'session_id', p_session_id),
      COALESCE(trim(p_reason), 'Manual attendance update')
    );
  END IF;

  IF v_session.status = 'closed' THEN
    PERFORM private_attendance.evaluate_low_attendance_alert(p_student_id, v_session.course_id);
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.mark_attendance_impl(UUID, UUID, UUID, public.attendance_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.mark_attendance_impl(UUID, UUID, UUID, public.attendance_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_attendance(
  p_session_id UUID,
  p_student_id UUID,
  p_status public.attendance_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.attendance_entries
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.mark_attendance_impl(auth.uid(), p_session_id, p_student_id, p_status, p_reason);
$$;

GRANT EXECUTE ON FUNCTION public.mark_attendance(UUID, UUID, public.attendance_status, TEXT) TO authenticated;

-- Operation 4: Finalize / Close Session (Atomic & Idempotent Absent Creation)
CREATE OR REPLACE FUNCTION private_attendance.finalize_session_impl(
  p_caller_id UUID,
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_role public.app_role;
  v_session public.attendance_sessions%ROWTYPE;
  v_session_ref_time TIMESTAMPTZ;
  v_absent_inserted INTEGER := 0;
  v_student_rec RECORD;
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL OR v_role NOT IN ('admin', 'lecturer') THEN
    RAISE EXCEPTION 'Unauthorized: only active lecturers or admins can finalize a session';
  END IF;

  SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_role = 'lecturer' AND NOT private_attendance.check_lecturer_assigned(p_caller_id, v_session.course_id) THEN
    RAISE EXCEPTION 'Forbidden: you are not assigned to this course';
  END IF;

  v_session_ref_time := COALESCE(v_session.opened_at, v_session.scheduled_at, now());

  -- Revoke all active credentials for this session
  UPDATE public.attendance_credentials
  SET revoked_at = now()
  WHERE session_id = p_session_id
    AND revoked_at IS NULL;

  -- Close session idempotently
  UPDATE public.attendance_sessions
  SET status = 'closed',
      opened_at = COALESCE(opened_at, v_session_ref_time),
      closed_at = COALESCE(closed_at, now())
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  -- Atomically insert Absent entries for all eligible enrolled students without an entry
  WITH inserted AS (
    INSERT INTO public.attendance_entries (
      session_id,
      student_id,
      status,
      source,
      checked_in_at,
      marked_by,
      updated_at
    )
    SELECT
      p_session_id,
      ce.student_id,
      'absent'::public.attendance_status,
      'manual'::public.attendance_source,
      NULL,
      p_caller_id,
      now()
    FROM public.course_enrollments ce
    WHERE ce.course_id = v_session.course_id
      AND ce.enrolled_at <= v_session_ref_time
      AND (ce.unenrolled_at IS NULL OR ce.unenrolled_at >= v_session_ref_time)
      AND NOT EXISTS (
        SELECT 1
        FROM public.attendance_entries ae
        WHERE ae.session_id = p_session_id
          AND ae.student_id = ce.student_id
      )
    ON CONFLICT (session_id, student_id) DO NOTHING
    RETURNING student_id
  )
  SELECT COUNT(*)::INTEGER INTO v_absent_inserted FROM inserted;

  -- Audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    reason
  )
  VALUES (
    p_caller_id,
    'finalize_session',
    'attendance_session',
    p_session_id::TEXT,
    jsonb_build_object('previous_status', 'open'),
    jsonb_build_object('status', 'closed', 'absent_auto_created', v_absent_inserted),
    'Session closed and finalized'
  );

  -- Evaluate low-attendance notifications for enrolled students
  FOR v_student_rec IN
    SELECT ce.student_id
    FROM public.course_enrollments ce
    WHERE ce.course_id = v_session.course_id
      AND ce.is_active = true
  LOOP
    PERFORM private_attendance.evaluate_low_attendance_alert(v_student_rec.student_id, v_session.course_id);
  END LOOP;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'status', v_session.status,
    'closed_at', v_session.closed_at,
    'absent_inserted', v_absent_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.finalize_session_impl(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.finalize_session_impl(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.finalize_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.finalize_session_impl(auth.uid(), p_session_id);
$$;

GRANT EXECUTE ON FUNCTION public.finalize_session(UUID) TO authenticated;

-- Operation 5: Submit Attendance Correction Request (Student)
CREATE OR REPLACE FUNCTION private_attendance.submit_correction_impl(
  p_caller_id UUID,
  p_attendance_entry_id UUID,
  p_requested_status public.attendance_status,
  p_reason TEXT
)
RETURNS public.correction_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_role public.app_role;
  v_entry public.attendance_entries%ROWTYPE;
  v_session public.attendance_sessions%ROWTYPE;
  v_course public.courses%ROWTYPE;
  v_student_profile public.profiles%ROWTYPE;
  v_req public.correction_requests%ROWTYPE;
  v_lec RECORD;
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL OR v_role <> 'student' THEN
    RAISE EXCEPTION 'Only active students can submit attendance correction requests';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Please provide a clear reason (at least 3 characters)';
  END IF;

  SELECT * INTO v_entry FROM public.attendance_entries WHERE id = p_attendance_entry_id;
  IF NOT FOUND OR v_entry.student_id <> p_caller_id THEN
    RAISE EXCEPTION 'Attendance entry not found or does not belong to you';
  END IF;

  SELECT * INTO v_session FROM public.attendance_sessions WHERE id = v_entry.session_id;
  IF v_session.status <> 'closed' THEN
    RAISE EXCEPTION 'Correction requests can only be submitted for finalized (closed) sessions';
  END IF;

  IF v_entry.status = p_requested_status THEN
    RAISE EXCEPTION 'Requested status is already your recorded status';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.correction_requests
    WHERE attendance_entry_id = p_attendance_entry_id
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending correction request already exists for this attendance entry';
  END IF;

  INSERT INTO public.correction_requests (
    attendance_entry_id,
    student_id,
    requested_status,
    reason,
    status
  )
  VALUES (
    p_attendance_entry_id,
    p_caller_id,
    p_requested_status,
    trim(p_reason),
    'pending'
  )
  RETURNING * INTO v_req;

  SELECT * INTO v_course FROM public.courses WHERE id = v_session.course_id;
  SELECT * INTO v_student_profile FROM public.profiles WHERE id = p_caller_id;

  -- Notify assigned lecturers
  FOR v_lec IN
    SELECT lecturer_id FROM public.course_lecturers WHERE course_id = v_session.course_id
  LOOP
    INSERT INTO public.notifications (recipient_id, type, title, body, dedupe_key)
    VALUES (
      v_lec.lecturer_id,
      'correction_submitted',
      'New Correction Request — ' || v_course.code,
      v_student_profile.full_name || ' requested a change from ' || v_entry.status || ' to ' || p_requested_status || ' for ' || v_session.title || '.',
      'corr_sub:' || v_req.id::TEXT || ':' || v_lec.lecturer_id::TEXT
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;

  RETURN v_req;
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.submit_correction_impl(UUID, UUID, public.attendance_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.submit_correction_impl(UUID, UUID, public.attendance_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_correction_request(
  p_attendance_entry_id UUID,
  p_requested_status public.attendance_status,
  p_reason TEXT
)
RETURNS public.correction_requests
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.submit_correction_impl(auth.uid(), p_attendance_entry_id, p_requested_status, p_reason);
$$;

GRANT EXECUTE ON FUNCTION public.submit_correction_request(UUID, public.attendance_status, TEXT) TO authenticated;

-- Operation 6: Review Correction Request (Lecturer / Admin)
CREATE OR REPLACE FUNCTION private_attendance.review_correction_impl(
  p_caller_id UUID,
  p_request_id UUID,
  p_decision public.correction_status,
  p_decision_note TEXT
)
RETURNS public.correction_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_role public.app_role;
  v_req public.correction_requests%ROWTYPE;
  v_entry public.attendance_entries%ROWTYPE;
  v_session public.attendance_sessions%ROWTYPE;
  v_course public.courses%ROWTYPE;
  v_updated_req public.correction_requests%ROWTYPE;
BEGIN
  v_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_role IS NULL OR v_role NOT IN ('admin', 'lecturer') THEN
    RAISE EXCEPTION 'Unauthorized: only active lecturers or admins can review correction requests';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO v_req FROM public.correction_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction request not found';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'This correction request has already been reviewed';
  END IF;

  SELECT * INTO v_entry FROM public.attendance_entries WHERE id = v_req.attendance_entry_id FOR UPDATE;
  SELECT * INTO v_session FROM public.attendance_sessions WHERE id = v_entry.session_id;
  SELECT * INTO v_course FROM public.courses WHERE id = v_session.course_id;

  IF v_role = 'lecturer' AND NOT private_attendance.check_lecturer_assigned(p_caller_id, v_session.course_id) THEN
    RAISE EXCEPTION 'Forbidden: you are not assigned to this course';
  END IF;

  UPDATE public.correction_requests
  SET status = p_decision,
      reviewer_id = p_caller_id,
      decision_note = NULLIF(trim(COALESCE(p_decision_note, '')), ''),
      reviewed_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_updated_req;

  IF p_decision = 'approved' THEN
    UPDATE public.attendance_entries
    SET status = v_req.requested_status,
        source = 'correction',
        marked_by = p_caller_id,
        updated_at = now()
    WHERE id = v_entry.id;

    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      reason
    )
    VALUES (
      p_caller_id,
      'approve_correction_request',
      'attendance_entry',
      v_entry.id::TEXT,
      jsonb_build_object('status', v_entry.status, 'source', v_entry.source, 'request_id', v_req.id),
      jsonb_build_object('status', v_req.requested_status, 'source', 'correction', 'request_id', v_req.id),
      COALESCE(p_decision_note, v_req.reason)
    );
  ELSE
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      reason
    )
    VALUES (
      p_caller_id,
      'reject_correction_request',
      'correction_request',
      v_req.id::TEXT,
      jsonb_build_object('status', 'pending'),
      jsonb_build_object('status', 'rejected'),
      COALESCE(p_decision_note, 'Correction rejected')
    );
  END IF;

  INSERT INTO public.notifications (recipient_id, type, title, body, dedupe_key)
  VALUES (
    v_req.student_id,
    'correction_' || p_decision::TEXT,
    'Correction Request ' || initcap(p_decision::TEXT) || ' — ' || v_course.code,
    'Your attendance correction request for ' || v_course.code || ' (' || v_session.title || ') was ' || p_decision::TEXT ||
    CASE WHEN p_decision_note IS NOT NULL AND char_length(trim(p_decision_note)) > 0
      THEN '. Note: ' || trim(p_decision_note)
      ELSE '.'
    END,
    'corr_rev:' || v_req.id::TEXT
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  PERFORM private_attendance.evaluate_low_attendance_alert(v_req.student_id, v_session.course_id);

  RETURN v_updated_req;
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.review_correction_impl(UUID, UUID, public.correction_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.review_correction_impl(UUID, UUID, public.correction_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_correction(
  p_request_id UUID,
  p_decision public.correction_status,
  p_decision_note TEXT DEFAULT NULL
)
RETURNS public.correction_requests
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.review_correction_impl(auth.uid(), p_request_id, p_decision, p_decision_note);
$$;

GRANT EXECUTE ON FUNCTION public.review_correction(UUID, public.correction_status, TEXT) TO authenticated;

-- Operation 7: Admin User Role & Access Update RPC (Server-side audited, used by Edge Function or Admin)
CREATE OR REPLACE FUNCTION private_attendance.admin_update_user_access_impl(
  p_caller_id UUID,
  p_target_user_id UUID,
  p_is_active BOOLEAN,
  p_new_role public.app_role,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private_attendance
AS $$
DECLARE
  v_caller_role public.app_role;
  v_old_profile public.profiles%ROWTYPE;
  v_old_role public.app_role;
BEGIN
  v_caller_role := private_attendance.get_active_user_role(p_caller_id);
  IF v_caller_role IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: only active administrators can modify user access or roles';
  END IF;

  SELECT * INTO v_old_profile FROM public.profiles WHERE id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found';
  END IF;

  SELECT role INTO v_old_role FROM public.user_roles WHERE user_id = p_target_user_id;

  IF p_is_active IS NOT NULL AND p_is_active <> v_old_profile.is_active THEN
    UPDATE public.profiles
    SET is_active = p_is_active,
        updated_at = now()
    WHERE id = p_target_user_id;
  END IF;

  IF p_new_role IS NOT NULL AND p_new_role <> v_old_role THEN
    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES (p_target_user_id, p_new_role, now())
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = now();
  END IF;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    reason
  )
  VALUES (
    p_caller_id,
    'admin_update_user_access',
    'profile',
    p_target_user_id::TEXT,
    jsonb_build_object('is_active', v_old_profile.is_active, 'role', v_old_role),
    jsonb_build_object('is_active', COALESCE(p_is_active, v_old_profile.is_active), 'role', COALESCE(p_new_role, v_old_role)),
    COALESCE(NULLIF(trim(COALESCE(p_reason, '')), ''), 'Administrative access update')
  );

  RETURN jsonb_build_object(
    'user_id', p_target_user_id,
    'is_active', COALESCE(p_is_active, v_old_profile.is_active),
    'role', COALESCE(p_new_role, v_old_role)
  );
END;
$$;

REVOKE ALL ON FUNCTION private_attendance.admin_update_user_access_impl(UUID, UUID, BOOLEAN, public.app_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private_attendance.admin_update_user_access_impl(UUID, UUID, BOOLEAN, public.app_role, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_update_user_access(
  p_target_user_id UUID,
  p_is_active BOOLEAN DEFAULT NULL,
  p_new_role public.app_role DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private_attendance
AS $$
  SELECT private_attendance.admin_update_user_access_impl(auth.uid(), p_target_user_id, p_is_active, p_new_role, p_reason);
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_access(UUID, BOOLEAN, public.app_role, TEXT) TO authenticated;

-- Enable Supabase Realtime on live attendance tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_entries;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
