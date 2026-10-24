import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CalendarRange,
  BookOpen,
  Clock,
  ClipboardCheck,
  FileBarChart2,
  Bell,
  Settings,
  History,
  LogOut,
} from "lucide-react";
import {
  AppShell,
  Avatar,
  Button,
  OfflineBanner,
  type SidebarSection,
} from "@attendance/ui";
import { useAuth, useInstitutionData } from "@attendance/supabase";

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isDemoMode } = useAuth();
  const { notifications, corrections } = useInstitutionData();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pendingCorrectionsCount = corrections.filter((c) => c.status === "pending").length;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const sections: SidebarSection[] = [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: <LayoutDashboard />,
          href: "/",
          active: isActive("/"),
        },
      ],
    },
    {
      label: "Academic Directory",
      items: [
        {
          label: "Students",
          icon: <GraduationCap />,
          href: "/students",
          active: isActive("/students"),
        },
        {
          label: "Lecturers",
          icon: <Users />,
          href: "/lecturers",
          active: isActive("/lecturers"),
        },
        {
          label: "Departments",
          icon: <Building2 />,
          href: "/departments",
          active: isActive("/departments"),
        },
        {
          label: "Academic Periods",
          icon: <CalendarRange />,
          href: "/periods",
          active: isActive("/periods"),
        },
        {
          label: "Courses & Enrollments",
          icon: <BookOpen />,
          href: "/courses",
          active: isActive("/courses"),
        },
        {
          label: "Timetable",
          icon: <Clock />,
          href: "/timetable",
          active: isActive("/timetable"),
        },
      ],
    },
    {
      label: "Attendance & Insights",
      items: [
        {
          label: "Attendance Monitor",
          icon: <ClipboardCheck />,
          href: "/attendance",
          active: isActive("/attendance"),
          badge: pendingCorrectionsCount > 0 ? pendingCorrectionsCount : undefined,
        },
        {
          label: "Reports & Exports",
          icon: <FileBarChart2 />,
          href: "/reports",
          active: isActive("/reports"),
        },
        {
          label: "Notifications",
          icon: <Bell />,
          href: "/notifications",
          active: isActive("/notifications"),
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
      ],
    },
    {
      label: "Governance",
      items: [
        {
          label: "Settings & Access",
          icon: <Settings />,
          href: "/settings",
          active: isActive("/settings"),
        },
        {
          label: "Audit Logs",
          icon: <History />,
          href: "/audit-logs",
          active: isActive("/audit-logs"),
        },
      ],
    },
  ];

  const logo = (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-v2-sm bg-v2-primary text-v2-base font-bold text-v2-on-primary">
        A
      </div>
      <div className="min-w-0">
        <p className="truncate text-v2-base font-semibold leading-tight text-v2-ink">
          Attendance OS
        </p>
        <p className="truncate text-v2-2xs text-v2-ink-tertiary">Institution Admin</p>
      </div>
    </div>
  );

  const collapsedLogo = (
    <div className="flex size-8 items-center justify-center rounded-v2-sm bg-v2-primary text-v2-base font-bold text-v2-on-primary">
      A
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-v2-canvas">
      <OfflineBanner />
      <div className="min-h-0 flex-1">
        <AppShell
          sidebar={{
            logo,
            collapsedLogo,
            sections,
            onNavigate: (href) => navigate(href),
          }}
          topbar={{
            leading: isDemoMode ? (
              <div className="flex items-center gap-2">
                <span className="rounded-v2-xs bg-v2-surface px-2 py-0.5 text-v2-2xs font-medium text-v2-ink-secondary">
                  Local Demo Mode
                </span>
              </div>
            ) : undefined,
            actions: (
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2.5 sm:flex">
                  <Avatar name={user?.profile.full_name || "Admin"} size="sm" />
                  <div className="text-right">
                    <p className="text-v2-sm font-semibold leading-none text-v2-ink">
                      {user?.profile.full_name}
                    </p>
                    <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<LogOut />}
                  onClick={() => void signOut()}
                >
                  Sign out
                </Button>
              </div>
            ),
          }}
        >
          {children ?? <Outlet />}
        </AppShell>
      </div>
    </div>
  );
}
