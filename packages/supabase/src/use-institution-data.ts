import * as React from "react";
import { useAuth } from "./auth-context";
import {
  fetchInstitutionSnapshot,
  subscribeToAttendanceChanges,
  type InstitutionSnapshot,
} from "./service";

const EMPTY_SNAPSHOT: InstitutionSnapshot = {
  profiles: [],
  userRoles: [],
  departments: [],
  academicPeriods: [],
  students: [],
  lecturers: [],
  courses: [],
  courseLecturers: [],
  courseEnrollments: [],
  timetables: [],
  sessions: [],
  entries: [],
  corrections: [],
  notifications: [],
  auditLogs: [],
  settings: {
    id: 1,
    low_attendance_threshold: 75,
    late_grace_minutes: 10,
    checkin_window_minutes: 30,
    qr_enabled: true,
    code_enabled: true,
    manual_enabled: true,
    timezone: "Africa/Accra",
    updated_at: new Date().toISOString(),
  },
};

export function useInstitutionData() {
  const { user } = useAuth();
  const [data, setData] = React.useState<InstitutionSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const refetch = React.useCallback(
    async (silent = false) => {
      if (!user) {
        setData(EMPTY_SNAPSHOT);
        setLoading(false);
        return;
      }
      if (!silent) setRefreshing(true);
      try {
        const snapshot = await fetchInstitutionSnapshot(user.id);
        setData(snapshot);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  React.useEffect(() => {
    void refetch();
    const unsubscribe = subscribeToAttendanceChanges(() => {
      void refetch(true);
    });
    return unsubscribe;
  }, [refetch]);

  return {
    ...data,
    loading,
    refreshing,
    refetch: () => refetch(false),
  };
}
