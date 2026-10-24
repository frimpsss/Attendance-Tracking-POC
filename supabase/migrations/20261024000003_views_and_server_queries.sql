-- Ensure optional detail columns exist even if Migration 001 was already applied
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT '100';

ALTER TABLE public.attendance_entries
  ADD COLUMN IF NOT EXISTS override_reason TEXT;

ALTER TABLE public.correction_requests
  ADD COLUMN IF NOT EXISTS supporting_note TEXT;

CREATE OR REPLACE VIEW public.v_students_summary
WITH (security_invoker = true)
AS
SELECT
  s.user_id,
  s.student_number,
  s.department_id,
  s.academic_level,
  s.created_at,
  p.full_name,
  p.email,
  p.phone,
  p.is_active,
  d.code AS department_code,
  d.name AS department_name,
  COALESCE(enr.enrolled_courses_count, 0)::INTEGER AS enrolled_courses_count,
  COALESCE(enr.enrolled_courses_count, 0)::INTEGER AS active_course_count,
  COALESCE(att.eligible_sessions_count, 0)::INTEGER AS eligible_sessions_count,
  COALESCE(att.eligible_sessions_count, 0)::INTEGER AS eligible_sessions,
  COALESCE(att.present_count, 0)::INTEGER AS present_count,
  COALESCE(att.late_count, 0)::INTEGER AS late_count,
  COALESCE(att.attended_count, 0)::INTEGER AS attended_count,
  COALESCE(att.absent_count, 0)::INTEGER AS absent_count,
  CASE
    WHEN COALESCE(att.eligible_sessions_count, 0) = 0 THEN 100
    ELSE ROUND((100.0 * COALESCE(att.attended_count, 0) / att.eligible_sessions_count)::NUMERIC, 1)
  END AS attendance_percentage,
  CASE
    WHEN COALESCE(att.eligible_sessions_count, 0) = 0 THEN false
    ELSE ROUND((100.0 * COALESCE(att.attended_count, 0) / att.eligible_sessions_count)::NUMERIC, 1) < (SELECT low_attendance_threshold FROM public.system_settings WHERE id = 1)
  END AS is_below_threshold
FROM public.students s
JOIN public.profiles p ON p.id = s.user_id
JOIN public.departments d ON d.id = s.department_id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS enrolled_courses_count
  FROM public.course_enrollments ce
  WHERE ce.student_id = s.user_id
    AND ce.is_active = true
) enr ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(sess.id)::INTEGER AS eligible_sessions_count,
    COUNT(sess.id) FILTER (WHERE ae.status = 'present')::INTEGER AS present_count,
    COUNT(sess.id) FILTER (WHERE ae.status = 'late')::INTEGER AS late_count,
    COUNT(sess.id) FILTER (WHERE ae.status IN ('present', 'late'))::INTEGER AS attended_count,
    COUNT(sess.id) FILTER (WHERE ae.status = 'absent' OR ae.id IS NULL)::INTEGER AS absent_count
  FROM public.course_enrollments ce
  JOIN public.attendance_sessions sess
    ON sess.course_id = ce.course_id
   AND sess.status = 'closed'
   AND ce.enrolled_at <= COALESCE(sess.opened_at, sess.scheduled_at)
   AND (ce.unenrolled_at IS NULL OR ce.unenrolled_at >= COALESCE(sess.opened_at, sess.scheduled_at))
  LEFT JOIN public.attendance_entries ae
    ON ae.session_id = sess.id
   AND ae.student_id = s.user_id
  WHERE ce.student_id = s.user_id
) att ON true;

CREATE OR REPLACE VIEW public.v_lecturers_summary
WITH (security_invoker = true)
AS
SELECT
  l.user_id,
  l.staff_number,
  l.department_id,
  l.created_at,
  p.full_name,
  p.email,
  p.phone,
  p.is_active,
  d.code AS department_code,
  d.name AS department_name,
  COALESCE(cl_agg.assigned_courses_count, 0)::INTEGER AS assigned_courses_count,
  COALESCE(cl_agg.assigned_courses_count, 0)::INTEGER AS course_count,
  COALESCE(cl_agg.course_codes, ARRAY[]::TEXT[]) AS course_codes,
  COALESCE(cl_agg.course_ids, ARRAY[]::UUID[]) AS course_ids
FROM public.lecturers l
JOIN public.profiles p ON p.id = l.user_id
JOIN public.departments d ON d.id = l.department_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS assigned_courses_count,
    ARRAY_AGG(c.code ORDER BY c.code) AS course_codes,
    ARRAY_AGG(c.id ORDER BY c.code) AS course_ids
  FROM public.course_lecturers cl
  JOIN public.courses c ON c.id = cl.course_id
  WHERE cl.lecturer_id = l.user_id
) cl_agg ON true;

CREATE OR REPLACE VIEW public.v_courses_summary
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.code,
  c.title,
  c.department_id,
  c.academic_period_id,
  c.level,
  c.is_active,
  c.created_at,
  d.code AS department_code,
  d.name AS department_name,
  ap.name AS academic_period_name,
  COALESCE(lec_agg.lecturer_names, ARRAY[]::TEXT[]) AS lecturer_names,
  COALESCE(lec_agg.lecturer_ids, ARRAY[]::UUID[]) AS lecturer_ids,
  COALESCE(enr_agg.enrolled_students_count, 0)::INTEGER AS enrolled_students_count,
  COALESCE(enr_agg.enrolled_students_count, 0)::INTEGER AS enrolled_count,
  COALESCE(sess_agg.total_sessions_count, 0)::INTEGER AS total_sessions_count,
  COALESCE(sess_agg.closed_sessions_count, 0)::INTEGER AS closed_sessions_count,
  COALESCE(sess_agg.closed_sessions_count, 0)::INTEGER AS closed_session_count,
  COALESCE(sess_agg.open_sessions_count, 0)::INTEGER AS open_sessions_count,
  COALESCE(sess_agg.open_sessions_count, 0)::INTEGER AS open_session_count,
  sess_agg.attendance_percentage
FROM public.courses c
JOIN public.departments d ON d.id = c.department_id
JOIN public.academic_periods ap ON ap.id = c.academic_period_id
LEFT JOIN LATERAL (
  SELECT
    ARRAY_AGG(p.full_name ORDER BY p.full_name) AS lecturer_names,
    ARRAY_AGG(cl.lecturer_id ORDER BY p.full_name) AS lecturer_ids
  FROM public.course_lecturers cl
  JOIN public.profiles p ON p.id = cl.lecturer_id
  WHERE cl.course_id = c.id
) lec_agg ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS enrolled_students_count
  FROM public.course_enrollments ce
  WHERE ce.course_id = c.id
    AND ce.is_active = true
) enr_agg ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT s.id)::INTEGER AS total_sessions_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'closed')::INTEGER AS closed_sessions_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'open')::INTEGER AS open_sessions_count,
    CASE
      WHEN COUNT(ae.id) FILTER (WHERE s.status = 'closed') = 0 THEN NULL
      ELSE ROUND(
        (100.0 * COUNT(ae.id) FILTER (WHERE s.status = 'closed' AND ae.status IN ('present', 'late'))
        / COUNT(ae.id) FILTER (WHERE s.status = 'closed'))::NUMERIC,
        1
      )
    END AS attendance_percentage
  FROM public.attendance_sessions s
  LEFT JOIN public.attendance_entries ae ON ae.session_id = s.id
  WHERE s.course_id = c.id
) sess_agg ON true;

CREATE OR REPLACE VIEW public.v_sessions_summary
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.course_id,
  s.created_by,
  s.title,
  s.scheduled_at,
  s.opened_at,
  s.closes_at,
  s.closed_at,
  s.status,
  s.created_at,
  c.code AS course_code,
  c.title AS course_title,
  c.department_id,
  d.code AS department_code,
  d.name AS department_name,
  creator.full_name AS created_by_name,
  COALESCE(enr.enrolled_count, 0)::INTEGER AS enrolled_count,
  COALESCE(ent.present_count, 0)::INTEGER AS present_count,
  COALESCE(ent.late_count, 0)::INTEGER AS late_count,
  COALESCE(ent.absent_count, 0)::INTEGER AS absent_count,
  COALESCE(ent.checked_in_count, 0)::INTEGER AS checked_in_count
FROM public.attendance_sessions s
JOIN public.courses c ON c.id = s.course_id
JOIN public.departments d ON d.id = c.department_id
LEFT JOIN public.profiles creator ON creator.id = s.created_by
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS enrolled_count
  FROM public.course_enrollments ce
  WHERE ce.course_id = s.course_id
    AND ce.is_active = true
) enr ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE ae.status = 'present')::INTEGER AS present_count,
    COUNT(*) FILTER (WHERE ae.status = 'late')::INTEGER AS late_count,
    COUNT(*) FILTER (WHERE ae.status = 'absent')::INTEGER AS absent_count,
    COUNT(*) FILTER (WHERE ae.status IN ('present', 'late'))::INTEGER AS checked_in_count
  FROM public.attendance_entries ae
  WHERE ae.session_id = s.id
) ent ON true;

CREATE OR REPLACE VIEW public.v_attendance_entries_detailed
WITH (security_invoker = true)
AS
SELECT
  ae.id,
  ae.session_id,
  ae.student_id,
  ae.status,
  ae.source,
  ae.checked_in_at,
  ae.marked_by,
  ae.override_reason,
  ae.updated_at,
  ae.created_at,
  s.course_id,
  s.title AS session_title,
  s.scheduled_at AS session_scheduled_at,
  s.opened_at AS session_opened_at,
  s.status AS session_status,
  c.code AS course_code,
  c.title AS course_title,
  c.department_id,
  d.code AS department_code,
  d.name AS department_name,
  stu.student_number,
  stu.academic_level,
  p.full_name AS student_name,
  p.email AS student_email
FROM public.attendance_entries ae
JOIN public.attendance_sessions s ON s.id = ae.session_id
JOIN public.courses c ON c.id = s.course_id
JOIN public.departments d ON d.id = c.department_id
JOIN public.students stu ON stu.user_id = ae.student_id
JOIN public.profiles p ON p.id = ae.student_id;

CREATE OR REPLACE VIEW public.v_correction_requests_detailed
WITH (security_invoker = true)
AS
SELECT
  cr.id,
  cr.attendance_entry_id,
  cr.student_id,
  cr.requested_status,
  cr.reason,
  cr.supporting_note,
  cr.status,
  cr.reviewer_id,
  cr.decision_note,
  cr.reviewed_at,
  cr.created_at,
  ae.session_id,
  ae.status AS current_entry_status,
  ae.source AS current_entry_source,
  s.course_id,
  s.title AS session_title,
  s.scheduled_at AS session_scheduled_at,
  c.code AS course_code,
  c.title AS course_title,
  stu.student_number,
  p.full_name AS student_name,
  p.email AS student_email,
  rev.full_name AS reviewer_name
FROM public.correction_requests cr
JOIN public.attendance_entries ae ON ae.id = cr.attendance_entry_id
JOIN public.attendance_sessions s ON s.id = ae.session_id
JOIN public.courses c ON c.id = s.course_id
JOIN public.students stu ON stu.user_id = cr.student_id
JOIN public.profiles p ON p.id = cr.student_id
LEFT JOIN public.profiles rev ON rev.id = cr.reviewer_id;

CREATE OR REPLACE VIEW public.v_timetables_detailed
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.course_id,
  t.weekday,
  t.start_time,
  t.end_time,
  t.venue,
  t.effective_from,
  t.effective_to,
  t.created_at,
  c.code AS course_code,
  c.title AS course_title,
  c.department_id,
  d.code AS department_code,
  d.name AS department_name,
  COALESCE(lec.lecturer_names, ARRAY[]::TEXT[]) AS lecturer_names,
  COALESCE(lec.lecturer_ids, ARRAY[]::UUID[]) AS lecturer_ids
FROM public.timetables t
JOIN public.courses c ON c.id = t.course_id
JOIN public.departments d ON d.id = c.department_id
LEFT JOIN LATERAL (
  SELECT
    ARRAY_AGG(p.full_name ORDER BY p.full_name) AS lecturer_names,
    ARRAY_AGG(cl.lecturer_id ORDER BY p.full_name) AS lecturer_ids
  FROM public.course_lecturers cl
  JOIN public.profiles p ON p.id = cl.lecturer_id
  WHERE cl.course_id = c.id
) lec ON true;

CREATE OR REPLACE VIEW public.v_audit_logs_detailed
WITH (security_invoker = true)
AS
SELECT
  al.id,
  al.actor_id,
  al.action,
  al.entity_type,
  al.entity_id,
  al.old_data,
  al.new_data,
  al.reason,
  al.created_at,
  p.full_name AS actor_name,
  p.email AS actor_email
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.actor_id;

CREATE OR REPLACE VIEW public.v_users_access
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.is_active,
  p.created_at,
  p.updated_at,
  COALESCE(ur.role, 'student'::public.app_role) AS role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;

CREATE OR REPLACE VIEW public.v_student_course_stats
WITH (security_invoker = true)
AS
SELECT
  ce.student_id,
  ce.course_id,
  ce.enrolled_at,
  ce.is_active AS enrollment_active,
  c.code AS course_code,
  c.title AS course_title,
  c.department_id,
  c.academic_period_id,
  c.level AS course_level,
  c.is_active AS course_active,
  d.code AS department_code,
  d.name AS department_name,
  s.student_number,
  s.academic_level,
  p.full_name AS student_name,
  p.email AS student_email,
  p.is_active AS student_active,
  COALESCE(lec.lecturer_names, ARRAY[]::TEXT[]) AS lecturer_names,
  COALESCE(stats.eligible_sessions, 0)::INT AS eligible_sessions,
  COALESCE(stats.present_count, 0)::INT AS present_count,
  COALESCE(stats.late_count, 0)::INT AS late_count,
  COALESCE(stats.absent_count, 0)::INT AS absent_count,
  COALESCE(stats.attended_count, 0)::INT AS attended_count,
  CASE
    WHEN COALESCE(stats.eligible_sessions, 0) = 0 THEN 100
    ELSE ROUND((COALESCE(stats.attended_count, 0)::NUMERIC / stats.eligible_sessions::NUMERIC) * 100)::INT
  END AS attendance_percentage
FROM public.course_enrollments ce
JOIN public.courses c ON c.id = ce.course_id
JOIN public.departments d ON d.id = c.department_id
JOIN public.students s ON s.user_id = ce.student_id
JOIN public.profiles p ON p.id = ce.student_id
LEFT JOIN LATERAL (
  SELECT ARRAY_AGG(lp.full_name ORDER BY lp.full_name) AS lecturer_names
  FROM public.course_lecturers cl
  JOIN public.profiles lp ON lp.id = cl.lecturer_id
  WHERE cl.course_id = c.id
) lec ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(sess.id) AS eligible_sessions,
    COUNT(sess.id) FILTER (WHERE ae.status = 'present') AS present_count,
    COUNT(sess.id) FILTER (WHERE ae.status = 'late') AS late_count,
    COUNT(sess.id) FILTER (WHERE ae.status = 'absent' OR ae.id IS NULL) AS absent_count,
    COUNT(sess.id) FILTER (WHERE ae.status IN ('present', 'late')) AS attended_count
  FROM public.attendance_sessions sess
  LEFT JOIN public.attendance_entries ae
    ON ae.session_id = sess.id
    AND ae.student_id = ce.student_id
  WHERE sess.course_id = ce.course_id
    AND sess.status = 'closed'
    AND ce.enrolled_at <= COALESCE(sess.opened_at, sess.scheduled_at)
) stats ON true;

CREATE OR REPLACE VIEW public.v_session_roster
WITH (security_invoker = true)
AS
SELECT
  sess.id AS session_id,
  sess.course_id,
  sess.status AS session_status,
  ce.student_id,
  ce.enrolled_at,
  s.student_number,
  s.academic_level,
  p.full_name AS student_name,
  p.email AS student_email,
  ae.id AS entry_id,
  ae.status AS entry_status,
  ae.source AS entry_source,
  ae.checked_in_at,
  ae.marked_by,
  ae.override_reason
FROM public.attendance_sessions sess
JOIN public.course_enrollments ce
  ON ce.course_id = sess.course_id
  AND ce.is_active = true
  AND ce.enrolled_at <= COALESCE(sess.opened_at, sess.scheduled_at)
JOIN public.students s ON s.user_id = ce.student_id
JOIN public.profiles p ON p.id = ce.student_id
LEFT JOIN public.attendance_entries ae
  ON ae.session_id = sess.id
  AND ae.student_id = ce.student_id;

GRANT SELECT ON public.v_students_summary TO authenticated;
GRANT SELECT ON public.v_lecturers_summary TO authenticated;
GRANT SELECT ON public.v_courses_summary TO authenticated;
GRANT SELECT ON public.v_sessions_summary TO authenticated;
GRANT SELECT ON public.v_attendance_entries_detailed TO authenticated;
GRANT SELECT ON public.v_correction_requests_detailed TO authenticated;
GRANT SELECT ON public.v_timetables_detailed TO authenticated;
GRANT SELECT ON public.v_audit_logs_detailed TO authenticated;
GRANT SELECT ON public.v_users_access TO authenticated;
GRANT SELECT ON public.v_student_course_stats TO authenticated;
GRANT SELECT ON public.v_session_roster TO authenticated;
