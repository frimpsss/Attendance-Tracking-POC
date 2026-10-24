import { beforeEach, describe, expect, it } from "vitest";
import {
  adminSetUserAccess,
  createAttendanceSession,
  DEMO_IDS,
  finalizeAttendanceSession,
  getDemoState,
  issueSessionCredential,
  resetDemoState,
  reviewCorrectionRequest,
  submitStudentCheckin,
  submitStudentCorrectionRequest,
} from "../src";

describe("Attendance Backend Service & Security Rules", () => {
  beforeEach(() => {
    resetDemoState();
  });

  it("allows enrolled student to check in via active short code and prevents duplicate check-ins", async () => {
    const first = await submitStudentCheckin({
      studentId: DEMO_IDS.students.student2,
      sessionId: DEMO_IDS.sessions.cs401Open,
      shortCode: "CS401A",
      source: "code",
    });

    expect(first.ok).toBe(true);
    expect(["present", "late"]).toContain(first.status);

    const duplicate = await submitStudentCheckin({
      studentId: DEMO_IDS.students.student2,
      sessionId: DEMO_IDS.sessions.cs401Open,
      shortCode: "CS401A",
      source: "code",
    });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.code).toBe("ALREADY_CHECKED_IN");
  });

  it("rejects check-in when credential is superseded by rotation", async () => {
    await issueSessionCredential({
      lecturerId: DEMO_IDS.lecturers.mensah,
      sessionId: DEMO_IDS.sessions.cs401Open,
      windowMinutes: 30,
    });

    const oldAttempt = await submitStudentCheckin({
      studentId: DEMO_IDS.students.student2,
      sessionId: DEMO_IDS.sessions.cs401Open,
      shortCode: "CS401A",
      source: "code",
    });

    expect(oldAttempt.ok).toBe(false);
    expect(oldAttempt.code).toBe("CREDENTIAL_SUPERSEDED");
  });

  it("rejects check-in from a student not enrolled in the course", async () => {
    const { session, credential } = await createAttendanceSession({
      courseId: DEMO_IDS.courses.it305,
      lecturerId: DEMO_IDS.lecturers.osei,
      title: "IT305 Lab",
      scheduledAt: new Date().toISOString(),
      openImmediately: true,
      windowMinutes: 30,
    });

    const attempt = await submitStudentCheckin({
      studentId: DEMO_IDS.students.student2,
      sessionId: session.id,
      shortCode: credential?.short_code ?? "",
      source: "code",
    });

    expect(attempt.ok).toBe(false);
    expect(attempt.code).toBe("NOT_ENROLLED");
  });

  it("blocks deactivated accounts from performing check-ins", async () => {
    await adminSetUserAccess({
      actorId: DEMO_IDS.admin,
      targetUserId: DEMO_IDS.students.student2,
      isActive: false,
      reason: "Test deactivation",
    });

    const attempt = await submitStudentCheckin({
      studentId: DEMO_IDS.students.student2,
      sessionId: DEMO_IDS.sessions.cs401Open,
      shortCode: "CS401A",
      source: "code",
    });

    expect(attempt.ok).toBe(false);
    expect(attempt.code).toBe("ACCOUNT_DISABLED");
  });

  it("atomically finalizes an open session and marks remaining enrolled students as absent", async () => {
    const res = await finalizeAttendanceSession({
      callerId: DEMO_IDS.lecturers.mensah,
      sessionId: DEMO_IDS.sessions.cs401Open,
    });

    expect(res.ok).toBe(true);
    expect(res.absent_inserted).toBeGreaterThan(0);

    const db = getDemoState();
    const closedSession = db.attendance_sessions.find(
      (s) => s.id === DEMO_IDS.sessions.cs401Open,
    );
    expect(closedSession?.status).toBe("closed");

    const activeCreds = db.attendance_credentials.filter(
      (c) => c.session_id === DEMO_IDS.sessions.cs401Open && c.is_active,
    );
    expect(activeCreds.length).toBe(0);
  });

  it("enforces one pending correction request per entry and updates attendance on approval", async () => {
    await expect(
      submitStudentCorrectionRequest({
        studentId: DEMO_IDS.students.student3,
        entryId: DEMO_IDS.entries.pendingEntry1,
        requestedStatus: "present",
        reason: "Duplicate pending request",
      }),
    ).rejects.toThrow(/already pending/i);

    await reviewCorrectionRequest({
      reviewerId: DEMO_IDS.lecturers.mensah,
      requestId: DEMO_IDS.corrections.pending1,
      decision: "approved",
      decisionNote: "Approved medical note",
    });

    const db = getDemoState();
    const updatedEntry = db.attendance_entries.find(
      (e) => e.id === DEMO_IDS.entries.pendingEntry1,
    );
    expect(updatedEntry?.status).toBe("late");
    expect(updatedEntry?.source).toBe("correction");
  });
});
