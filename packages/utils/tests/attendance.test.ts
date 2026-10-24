import { describe, expect, it } from "vitest";
import { calculateAttendanceStats, isStudentEligibleForSession } from "../src/index";

describe("calculateAttendanceStats", () => {
  it("returns N/A and null percentage when there are 0 closed eligible sessions", () => {
    const stats = calculateAttendanceStats({
      sessions: [
        {
          id: "s1",
          course_id: "c1",
          opened_at: "2026-10-10T09:00:00Z",
          scheduled_at: "2026-10-10T09:00:00Z",
          status: "open",
        },
      ],
      entries: [],
      studentId: "stu-1",
    });

    expect(stats.eligibleSessionsCount).toBe(0);
    expect(stats.percentage).toBeNull();
    expect(stats.formattedPercentage).toBe("N/A");
    expect(stats.isBelowThreshold).toBe(false);
  });

  it("counts both present and late as attended and flags below threshold", () => {
    const sessions = [
      { id: "s1", course_id: "c1", opened_at: "2026-10-01T09:00:00Z", scheduled_at: "2026-10-01T09:00:00Z", status: "closed" as const },
      { id: "s2", course_id: "c1", opened_at: "2026-10-08T09:00:00Z", scheduled_at: "2026-10-08T09:00:00Z", status: "closed" as const },
      { id: "s3", course_id: "c1", opened_at: "2026-10-15T09:00:00Z", scheduled_at: "2026-10-15T09:00:00Z", status: "closed" as const },
      { id: "s4", course_id: "c1", opened_at: "2026-10-22T09:00:00Z", scheduled_at: "2026-10-22T09:00:00Z", status: "closed" as const },
    ];
    const entries = [
      { session_id: "s1", student_id: "stu-1", status: "present" as const },
      { session_id: "s2", student_id: "stu-1", status: "late" as const },
      { session_id: "s3", student_id: "stu-1", status: "absent" as const },
      { session_id: "s4", student_id: "stu-1", status: "absent" as const },
    ];

    const stats = calculateAttendanceStats({
      sessions,
      entries,
      studentId: "stu-1",
      threshold: 75,
    });

    expect(stats.eligibleSessionsCount).toBe(4);
    expect(stats.presentCount).toBe(1);
    expect(stats.lateCount).toBe(1);
    expect(stats.attendedCount).toBe(2);
    expect(stats.absentCount).toBe(2);
    expect(stats.percentage).toBe(50);
    expect(stats.formattedPercentage).toBe("50%");
    expect(stats.isBelowThreshold).toBe(true);
  });

  it("excludes sessions held before student enrolled or after student unenrolled", () => {
    const sessionBefore = {
      opened_at: "2026-09-01T09:00:00Z",
      scheduled_at: "2026-09-01T09:00:00Z",
      status: "closed" as const,
    };
    const enrollment = {
      enrolled_at: "2026-09-15T00:00:00Z",
      unenrolled_at: "2026-10-15T00:00:00Z",
    };

    expect(isStudentEligibleForSession(sessionBefore, enrollment)).toBe(false);
    expect(
      isStudentEligibleForSession(
        {
          opened_at: "2026-10-01T09:00:00Z",
          scheduled_at: "2026-10-01T09:00:00Z",
          status: "closed",
        },
        enrollment,
      ),
    ).toBe(true);
    expect(
      isStudentEligibleForSession(
        {
          opened_at: "2026-10-20T09:00:00Z",
          scheduled_at: "2026-10-20T09:00:00Z",
          status: "closed",
        },
        enrollment,
      ),
    ).toBe(false);
  });
});
