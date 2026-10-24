import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Home,
  QrCode,
  User,
} from "lucide-react";
import { Button, MobileAppShell, type MobileTabItem } from "@attendance/ui";
import {
  queryCorrectionsPage,
  queryNotificationsPage,
  subscribeToAttendanceChanges,
  useAuth,
} from "@attendance/supabase";

export function LecturerLayout() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [pendingCorrectionsCount, setPendingCorrectionsCount] = React.useState(0);

  const loadBadges = React.useCallback(async () => {
    if (!user) return;
    const [notifRes, corrRes] = await Promise.all([
      queryNotificationsPage({
        page: 1,
        pageSize: 1,
        recipientId: user.id,
        unreadOnly: true,
      }),
      queryCorrectionsPage({
        page: 1,
        pageSize: 1,
        lecturerId: user.id,
        statuses: ["pending"],
      }),
    ]);
    setUnreadCount(notifRes.total);
    setPendingCorrectionsCount(corrRes.total);
  }, [user]);

  React.useEffect(() => {
    void loadBadges();
    return subscribeToAttendanceChanges(() => void loadBadges());
  }, [loadBadges]);

  const activeKey = React.useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/courses")) return "courses";
    if (p.startsWith("/sessions")) return "sessions";
    if (p.startsWith("/corrections")) return "corrections";
    if (p.startsWith("/notifications")) return "notifications";
    if (p.startsWith("/profile")) return "profile";
    return "home";
  }, [location.pathname]);

  const tabs: MobileTabItem[] = [
    {
      key: "home",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
      onClick: () => navigate("/home"),
    },
    {
      key: "courses",
      label: "Courses",
      icon: <BookOpen className="h-5 w-5" />,
      onClick: () => navigate("/courses"),
    },
    {
      key: "sessions",
      label: "Sessions",
      icon: <QrCode className="h-5 w-5" />,
      prominent: true,
      onClick: () => navigate("/sessions"),
    },
    {
      key: "corrections",
      label: "Corrections",
      icon: <ClipboardCheck className="h-5 w-5" />,
      badgeCount: pendingCorrectionsCount,
      onClick: () => navigate("/corrections"),
    },
    {
      key: "profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <MobileAppShell
      title="Lecturer Portal"
      subtitle={profile?.full_name ?? ""}
      activeTab={activeKey}
      tabs={tabs}
      headerRight={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-v2-pill bg-v2-danger px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      }
    >
      <Outlet />
    </MobileAppShell>
  );
}
