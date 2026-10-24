import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarClock,
  History,
  Home,
  QrCode,
  User,
} from "lucide-react";
import { Button, MobileAppShell, type MobileTabItem } from "@attendance/ui";
import {
  queryNotificationsPage,
  subscribeToAttendanceChanges,
  useAuth,
} from "@attendance/supabase";

export function StudentLayout() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const loadBadges = React.useCallback(async () => {
    if (!user) return;
    const notifRes = await queryNotificationsPage({
      page: 1,
      pageSize: 1,
      recipientId: user.id,
      unreadOnly: true,
    });
    setUnreadCount(notifRes.total);
  }, [user]);

  React.useEffect(() => {
    void loadBadges();
    return subscribeToAttendanceChanges(() => void loadBadges());
  }, [loadBadges]);

  const activeKey = React.useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/courses") || p.startsWith("/timetable")) return "courses";
    if (p.startsWith("/check-in")) return "check-in";
    if (p.startsWith("/history") || p.startsWith("/corrections")) return "history";
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
      key: "check-in",
      label: "Check In",
      icon: <QrCode className="h-5 w-5" />,
      prominent: true,
      onClick: () => navigate("/check-in"),
    },
    {
      key: "history",
      label: "History",
      icon: <History className="h-5 w-5" />,
      onClick: () => navigate("/history"),
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
      title="Student Portal"
      subtitle={profile?.full_name ?? ""}
      activeTab={activeKey}
      tabs={tabs}
      headerRight={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Timetable"
            onClick={() => navigate("/timetable")}
          >
            <CalendarClock className="h-4 w-4" />
          </Button>
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
        </div>
      }
    >
      <Outlet />
    </MobileAppShell>
  );
}
