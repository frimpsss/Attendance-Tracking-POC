-- ==============================================================================
-- Repeatable Non-Secret Demo Data (supabase/seed.sql)
-- Note: Auth users (1 Admin, 2 Lecturers, 10 Students) are provisioned via the
-- official Supabase Auth Admin API in `pnpm seed:users` (scripts/seed-demo-users.mjs),
-- which then links their auth.users UUIDs to profiles, user_roles, courses, and sessions.
-- This SQL file seeds the base academic entities and system settings idempotently.
-- ==============================================================================

-- 1. System Settings
INSERT INTO public.system_settings (
  id,
  low_attendance_threshold,
  late_grace_minutes,
  checkin_window_minutes,
  qr_enabled,
  code_enabled,
  manual_enabled,
  timezone
)
VALUES (1, 75.00, 10, 30, true, true, true, 'Africa/Accra')
ON CONFLICT (id) DO UPDATE SET
  low_attendance_threshold = EXCLUDED.low_attendance_threshold,
  late_grace_minutes = EXCLUDED.late_grace_minutes,
  checkin_window_minutes = EXCLUDED.checkin_window_minutes,
  qr_enabled = EXCLUDED.qr_enabled,
  code_enabled = EXCLUDED.code_enabled,
  manual_enabled = EXCLUDED.manual_enabled,
  timezone = EXCLUDED.timezone;

-- 2. Departments (2 departments)
INSERT INTO public.departments (id, code, name, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'CS', 'Computer Science & Engineering', true),
  ('11111111-1111-4111-8111-111111111102', 'BUS', 'Business Administration & Analytics', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- 3. Academic Period (1 active semester)
INSERT INTO public.academic_periods (id, name, start_date, end_date, is_active)
VALUES
  ('22222222-2222-4222-8222-222222222201', '2026/2027 — Semester 1', '2026-09-01', '2027-01-31', true)
ON CONFLICT (name) DO UPDATE SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active;

-- 4. Courses (4 courses across 2 departments)
INSERT INTO public.courses (id, code, title, department_id, academic_period_id, is_active)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    'CS301',
    'Software Engineering & Architecture',
    '11111111-1111-4111-8111-111111111101',
    '22222222-2222-4222-8222-222222222201',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'CS304',
    'Database Systems & Security',
    '11111111-1111-4111-8111-111111111101',
    '22222222-2222-4222-8222-222222222201',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'CS402',
    'Distributed Cloud Systems',
    '11111111-1111-4111-8111-111111111101',
    '22222222-2222-4222-8222-222222222201',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'BUS205',
    'Operations & Quantitative Methods',
    '11111111-1111-4111-8111-111111111102',
    '22222222-2222-4222-8222-222222222201',
    true
  )
ON CONFLICT (code, academic_period_id) DO UPDATE SET
  title = EXCLUDED.title,
  department_id = EXCLUDED.department_id,
  is_active = EXCLUDED.is_active;

-- 5. Course Timetables
INSERT INTO public.timetables (id, course_id, weekday, start_time, end_time, venue, effective_from, effective_to)
VALUES
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 1, '09:00', '11:00', 'Engineering Block — Lecture Hall A', '2026-09-01', '2027-01-31'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 3, '14:00', '16:00', 'Software Lab 2', '2026-09-01', '2027-01-31'),
  ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333302', 2, '10:00', '12:00', 'Engineering Block — Room 204', '2026-09-01', '2027-01-31'),
  ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333303', 4, '13:00', '15:00', 'Innovation Auditorium', '2026-09-01', '2027-01-31'),
  ('44444444-4444-4444-8444-444444444405', '33333333-3333-4333-8333-333333333304', 5, '08:30', '10:30', 'Business School — Hall B', '2026-09-01', '2027-01-31')
ON CONFLICT (id) DO NOTHING;
