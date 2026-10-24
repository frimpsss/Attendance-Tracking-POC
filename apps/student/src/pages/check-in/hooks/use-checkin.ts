import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  querySessionsPage,
  submitStudentCheckin,
  useAuth,
  type SessionSummaryRow,
} from "@attendance/supabase";
import type { CheckinResponse } from "@attendance/types";

export function parseScannedQrPayload(raw: string): {
  sessionId?: string;
  qrToken?: string;
  shortCode?: string;
} {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const session = url.searchParams.get("session") ?? undefined;
    const token = url.searchParams.get("token") ?? undefined;
    const code = url.searchParams.get("code") ?? undefined;
    if (token || code) {
      return { sessionId: session, qrToken: token, shortCode: code };
    }
  } catch {
    // Not a full URL
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, string>;
    if (parsed.token || parsed.qr_token || parsed.short_code) {
      return {
        sessionId: parsed.session_id || parsed.session,
        qrToken: parsed.token || parsed.qr_token,
        shortCode: parsed.short_code || parsed.code,
      };
    }
  } catch {
    // Plain string
  }

  if (trimmed.length === 6 && /^[A-Z0-9]+$/i.test(trimmed)) {
    return { shortCode: trimmed.toUpperCase() };
  }

  return { qrToken: trimmed };
}

export function useCheckin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<CheckinResponse | null>(null);
  const [openSessions, setOpenSessions] = React.useState<SessionSummaryRow[]>([]);
  const deepLinkProcessedRef = React.useRef(false);

  React.useEffect(() => {
    if (!user) return;
    void querySessionsPage({
      page: 1,
      pageSize: 10,
      studentId: user.id,
      statuses: ["open"],
    }).then((res) => setOpenSessions(res.items));
  }, [user]);

  const submitQrToken = React.useCallback(
    async (qrToken: string, sessionId?: string) => {
      if (!user) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setResult({
          ok: false,
          code: "OFFLINE",
          message:
            "You are currently offline. Live internet connectivity is required to validate classroom check-ins.",
        });
        return;
      }
      setSubmitting(true);
      try {
        const res = await submitStudentCheckin({
          studentId: user.id,
          sessionId: sessionId ?? null,
          qrToken,
          source: "qr",
        });
        setResult(res);
      } catch (err) {
        setResult({
          ok: false,
          code: "CHECKIN_ERROR",
          message: err instanceof Error ? err.message : "Check-in failed",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [user],
  );

  const submitShortCode = React.useCallback(
    async (shortCode: string, sessionId?: string) => {
      if (!user) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setResult({
          ok: false,
          code: "OFFLINE",
          message:
            "You are currently offline. Live internet connectivity is required to validate classroom check-ins.",
        });
        return;
      }
      setSubmitting(true);
      try {
        const res = await submitStudentCheckin({
          studentId: user.id,
          sessionId: sessionId ?? null,
          shortCode: shortCode.trim().toUpperCase(),
          source: "code",
        });
        setResult(res);
      } catch (err) {
        setResult({
          ok: false,
          code: "CHECKIN_ERROR",
          message: err instanceof Error ? err.message : "Check-in failed",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [user],
  );

  React.useEffect(() => {
    if (!user || deepLinkProcessedRef.current) return;
    const tokenParam = searchParams.get("token");
    const sessionParam = searchParams.get("session") ?? undefined;
    const codeParam = searchParams.get("code");

    if (tokenParam || codeParam) {
      deepLinkProcessedRef.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      if (tokenParam) {
        void submitQrToken(tokenParam, sessionParam);
      } else if (codeParam) {
        void submitShortCode(codeParam, sessionParam);
      }
    }
  }, [user, searchParams, submitQrToken, submitShortCode]);

  return {
    submitting,
    result,
    setResult,
    openSessions,
    submitQrToken,
    submitShortCode,
  };
}
