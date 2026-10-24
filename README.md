# Student Attendance Management System (POC)

A complete **Student Attendance Management System** built as a `pnpm` monorepo with **three independent React + TypeScript + Vite + Tailwind CSS applications** sharing **one Supabase backend** (Supabase Auth, Postgres, Row-Level Security, SQL Views, Realtime, and Edge Functions).

---

## 1. Architecture Overview

```text
apps/admin       ──┐  (Desktop-first responsive web dashboard — port 5173)
apps/lecturer    ──┼──> @attendance/supabase ──> ONE Shared Supabase Project
apps/student     ──┘  (Mobile-first installable PWAs — ports 5174 & 5175)
                        ├── Supabase Auth (email/password)
                        ├── Postgres + Row-Level Security (RLS)
                        ├── Security-Invoker Views (server-side joins, search & pagination)
                        ├── Transactional RPC Functions (private_attendance schema)
                        ├── Edge Functions (admin-create-user, admin-update-user-access)
                        └── Reproducible SQL Migrations + Seed Data
```

### Applications

| Application | Directory | Dev URL | Form Factor | PWA |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal** | `apps/admin` | `http://localhost:5173` | Desktop-first responsive web dashboard | Standard web app |
| **Lecturer PWA** | `apps/lecturer` | `http://localhost:5174` | Mobile-first touch interface + bottom tabs | Installable PWA (`id: "/lecturer/"`) |
| **Student PWA** | `apps/student` | `http://localhost:5175` | Mobile-first touch interface + bottom tabs | Installable PWA (`id: "/student/"`) |

---

## 2. Where to Find Your Supabase Credentials

You need **3 values** from Supabase to connect all three apps and run the user seeder:
1. **Project URL** (`VITE_SUPABASE_URL` / `SUPABASE_URL`)
2. **Anon / Publishable Key** (`VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`) — safe for browser/PWA apps
3. **Service Role Secret Key** (`SUPABASE_SERVICE_ROLE_KEY`) — **server/CLI only**, used by `pnpm seed:users` and Edge Functions

### Option A: Supabase Cloud Project (Hosted at `supabase.com`)

1. Sign in to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project (or click **New Project**).
2. In the left sidebar, go to **Project Settings** (gear icon at the bottom) → **API** (or **Data API** / **API Keys**).
3. Copy the following values:
   - **Project URL**: Under **Project URL**, copy `https://<your-project-ref>.supabase.co` → paste into `VITE_SUPABASE_URL` and `SUPABASE_URL`.
   - **Anon / Publishable Key**: Under **Project API Keys**, copy the `anon` `public` (or `publishable`) key → paste into `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - **Service Role Key**: Under **Project API Keys**, click **Reveal** next to `service_role` (`secret`) → paste into `SUPABASE_SERVICE_ROLE_KEY` (never put this in a `VITE_*` variable).
4. **Project Reference ID** (if linking via CLI): Go to **Project Settings** → **General** → copy **Reference ID** (the 20-character string in `https://<project-ref>.supabase.co`).

### Option B: Local Supabase Stack (Docker + Supabase CLI)

If you want to run Supabase 100% locally on your machine using Docker:

1. Start Docker Desktop.
2. Run:
   ```bash
   npx supabase start
   ```
3. Anytime you need to view your local credentials, run:
   ```bash
   npx supabase status
   ```
   This prints:
   ```text
            API URL: http://127.0.0.1:54321
        GraphQL URL: http://127.0.0.1:54321/graphql/v1
     S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
             DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
         Studio URL: http://127.0.0.1:54323
           anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Copy `API URL`, `anon key`, and `service_role key` into your root `.env` file.

---

## 3. Agentic Local Setup Guide (End-to-End Playbook)

This section is structured so **both human developers and AI coding agents** can execute a deterministic, zero-touch local setup from migrations to running apps.

### Step 1: Install Workspace Dependencies

```bash
pnpm install
```

### Step 2: Create & Populate Root `.env`

All three Vite apps (`apps/admin`, `apps/lecturer`, `apps/student`) and `scripts/seed-demo-users.mjs` automatically read the single `.env` file in the repository root (`envDir: "../.."`).

```bash
cp .env.example .env
```

#### If using Local Supabase (`npx supabase start`):

```bash
# Automatically extract credentials from `supabase status -o env` into `.env`
eval "$(npx supabase status -o env)"
cat <<EOF > .env
VITE_SUPABASE_URL=${API_URL}
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}

VITE_ADMIN_APP_URL=http://localhost:5173
VITE_LECTURER_APP_URL=http://localhost:5174
VITE_STUDENT_APP_URL=http://localhost:5175
VITE_DEFAULT_TIMEZONE=Africa/Accra

SUPABASE_URL=${API_URL}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
DEMO_DEFAULT_PASSWORD=ChangeMe123!
EOF
```

#### If using Supabase Cloud:

Edit `.env` and fill in your cloud project credentials from **Supabase Dashboard → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_ANON_KEY=your-anon-public-key

VITE_ADMIN_APP_URL=http://localhost:5173
VITE_LECTURER_APP_URL=http://localhost:5174
VITE_STUDENT_APP_URL=http://localhost:5175
VITE_DEFAULT_TIMEZONE=Africa/Accra

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
DEMO_DEFAULT_PASSWORD=ChangeMe123!
```

### Step 3: Apply Database Migrations & SQL Views

The database migrations in `supabase/migrations/` must be applied in order:
1. `20261024000001_initial_schema.sql` — Tables, enums, constraints, triggers, and `private_attendance` transactional RPCs (`issue_session_credential`, `student_check_in`, `finalize_attendance_session`, `review_correction_request`, `admin_override_attendance`).
2. `20261024000002_rls_and_security.sql` — Row-Level Security (RLS) policies for `admin`, `lecturer`, and `student` roles + active account enforcement.
3. `20261024000003_views_and_server_queries.sql` — Pre-joined `security_invoker` SQL views (`v_students_summary`, `v_lecturers_summary`, `v_courses_summary`, `v_sessions_summary`, `v_attendance_entries_detailed`, `v_correction_requests_detailed`, `v_timetables_detailed`, `v_audit_logs_detailed`, `v_users_access`, `v_student_course_stats`, `v_session_roster`) used for server-side pagination, search, filtering, and joins.

#### Option 3A — Local Supabase CLI:

```bash
# Applies all 3 migrations + runs supabase/seed.sql automatically
npx supabase db reset
```

#### Option 3B — Linked Supabase Cloud Project via CLI:

```bash
# 1. Authenticate CLI (if not already logged in)
npx supabase login

# 2. Link to your cloud project ref
npx supabase link --project-ref <your-project-ref>

# 3. Push all migrations to the remote Postgres database
npx supabase db push
```

#### Option 3C — Supabase Cloud SQL Editor (No CLI Required):

If you do not have the Supabase CLI installed, open **Supabase Dashboard → SQL Editor → New Query** and paste/run these files in order:
1. `supabase/migrations/20261024000001_initial_schema.sql`
2. `supabase/migrations/20261024000002_rls_and_security.sql`
3. `supabase/migrations/20261024000003_views_and_server_queries.sql`
4. `supabase/seed.sql`

### Step 4: Provision Demo Auth Users & Relational Demo Data

Because Supabase Auth owns `auth.users`, demo users (`admin@university.edu.gh`, 2 lecturers, and 10 students) are provisioned via the official `supabase.auth.admin` API using `scripts/seed-demo-users.mjs`. This script reads `.env` automatically and is idempotent (safe to re-run at any time):

```bash
pnpm seed:users
```

### Step 5: Serve or Deploy Privileged Edge Functions

Admin user creation (`admin-create-user`) and account activation/deactivation/role changes (`admin-update-user-access`) run inside Supabase Edge Functions so the `service_role` key never touches the browser.

#### Local development:

```bash
npx supabase functions serve
```

#### Cloud deployment:

```bash
npx supabase functions deploy admin-create-user
npx supabase functions deploy admin-update-user-access
```

### Step 6: Verify Typecheck, Tests & Production Build

```bash
# 1. Type-check all shared packages and all 3 apps
pnpm typecheck

# 2. Run unit & business-rule/RLS tests
pnpm test

# 3. Run SQL pgTAP / business-rule test script (when local Supabase is running)
# npx supabase test db

# 4. Build all packages and apps (verifies PWA manifest & service worker generation)
pnpm build
```

### Step 7: Run All 3 Applications Locally

Start all three applications in parallel with a single command:

```bash
pnpm dev
```

Or start each application individually in separate terminals:

```bash
pnpm dev:admin      # Admin Portal  -> http://localhost:5173
pnpm dev:lecturer   # Lecturer PWA  -> http://localhost:5174
pnpm dev:student    # Student PWA   -> http://localhost:5175
```

> **Zero-Config Local Demo Fallback:** If `VITE_SUPABASE_URL` is not yet configured in `.env`, all three apps automatically fall back to a built-in, cross-tab synchronized local demo store (`packages/supabase/src/demo-store.ts`) pre-loaded with the seeded dataset so you can test the full workflow immediately.

---

## 4. Demo Accounts

All seeded accounts share the default password: **`ChangeMe123!`** (and can also be signed into with one click on each app's login screen):

| Role | Name | Email | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@university.edu.gh` | Full institutional access |
| **Lecturer** | Dr. Kwame Mensah | `lecturer1@university.edu.gh` | Assigned to `CS301`, `CS304`, `CS402` |
| **Lecturer** | Prof. Ama Osei | `lecturer2@university.edu.gh` | Assigned to `BUS205` |
| **Student** | Kofi Boateng (`UG2026001`) | `student1@university.edu.gh` | Enrolled in `CS301`, `CS304`, `CS402`, `BUS205` |
| **Student** | Abena Asante (`UG2026002`) | `student2@university.edu.gh` | Enrolled in `CS301`, `CS304` |
| **Student** | Yaw Owusu (`UG2026003`) | `student3@university.edu.gh` | Below 75% threshold + pending correction request |

---

## 5. End-to-End Demo Walkthrough

1. **Admin Portal (`http://localhost:5173`)**:
   - Sign in as `admin@university.edu.gh`.
   - Manage **Departments**, **Academic Periods**, **Courses**, **Lecturers**, **Students**, and **Timetables**.
   - Open a course detail page to assign lecturers and bulk-enroll students.
2. **Lecturer PWA (`http://localhost:5174`)**:
   - Sign in as `lecturer1@university.edu.gh`.
   - Tap **Start Attendance Session** (or open an active session).
   - Project the **QR Code** and **6-Character Check-In Code**, or click **Rotate QR / Code** to supersede old credentials.
3. **Student PWA (`http://localhost:5175`)**:
   - Sign in as `student2@university.edu.gh`.
   - Tap **Check In**, scan the QR code with your camera (or open `/check-in?session=...&token=...` via a native phone camera), or enter the 6-character code.
   - Receive immediate confirmation (`Present` or `Late`), and watch the Lecturer's live roster increment in real time.
4. **Finalize & Request Correction**:
   - In the **Lecturer PWA**, click **Close & Finalize Session** — remaining unmarked enrolled students are atomically marked `Absent`.
   - In the **Student PWA**, open **History** → **Request Correction** on a finalized entry.
   - In the **Lecturer PWA**, open **Corrections**, review the request, and click **Approve & Update**.
   - In the **Admin Portal**, inspect **Reports**, export CSV/PDF, and verify the immutable **Audit Logs**.
