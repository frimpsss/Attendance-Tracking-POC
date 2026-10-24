import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardCheck,
  FileBarChart2,
  Lock,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  QRCodeDisplay,
  SearchInput,
  Skeleton,
  StatCards,
  Status,
  toast,
} from "@attendance/ui";
import {
  finalizeAttendanceSession,
  issueSessionCredential,
  useAuth,
} from "@attendance/supabase";
import { formatDateTime } from "@attendance/utils";
import { useLecturerSessionDetail } from "./hooks/use-lecturer-sessions";

const STUDENT_APP_URL = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_STUDENT_APP_URL ?? "http://localhost:5175"
).replace(/\/$/, "");

export default function LecturerSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session,
    credential,
    setCredential,
    roster,
    totalRoster,
    settings,
    loading,
    searchInput,
    setSearchInput,
    refetch,
  } = useLecturerSessionDetail(id);

  const [rotating, setRotating] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);

  if (loading && !session) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-28 w-full rounded-v2-lg" />
        <Skeleton className="h-72 w-full rounded-v2-lg" />
        <Skeleton className="h-48 w-full rounded-v2-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        title="Session not found"
        action={<Button onClick={() => navigate("/sessions")}>Back to Sessions</Button>}
      />
    );
  }

  const handleIssueOrRotate = async () => {
    if (!user) return;
    setRotating(true);
    try {
      const nextCred = await issueSessionCredential({
        lecturerId: user.id,
        sessionId: session.id,
        windowMinutes: settings?.checkin_window_minutes ?? 30,
      });
      setCredential(nextCred);
      toast.success("New QR & 6-character code issued", {
        description: "Previous session credentials have been deactivated.",
      });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rotate credential");
    } finally {
      setRotating(false);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;
    setFinalizing(true);
    try {
      const res = await finalizeAttendanceSession({
        callerId: user.id,
        sessionId: session.id,
      });
      toast.success("Session closed & finalized", {
        description: `${res.absent_inserted} unmarked students recorded as Absent.`,
      });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize session");
    } finally {
      setFinalizing(false);
    }
  };

  const qrUrl = credential
    ? `${STUDENT_APP_URL}/check-in?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(credential.qr_token)}`
    : "";

  const checkedInCount = session.present_count + session.late_count;

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<ArrowLeft />}
          onClick={() => navigate("/sessions")}
        >
          Sessions
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<ClipboardCheck />}
            onClick={() => navigate(`/sessions/${session.id}/mark`)}
          >
            Manual Mark
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<FileBarChart2 />}
            onClick={() => navigate(`/sessions/${session.id}/report`)}
          >
            Report
          </Button>
        </div>
      </div>

      <div className="rounded-v2-lg bg-v2-surface p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-v2-mono text-v2-sm font-semibold text-v2-ink">
              {session.course_code}
            </span>
            <Status value={session.status} size="sm" />
          </div>
          <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">{session.title}</h1>
          <p className="text-v2-xs text-v2-ink-secondary">
            {session.course_title} · Scheduled {formatDateTime(session.scheduled_at)}
          </p>
        </div>
      </div>

      {session.status === "scheduled" && (
        <div className="rounded-v2-lg bg-v2-surface p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-v2-sm text-v2-ink-secondary">
              This session is currently scheduled. Open it now to issue a live QR code and
              check-in code.
            </p>
            <Button
              size="lg"
              fullWidth
              loading={rotating}
              leadingIcon={<Play />}
              onClick={() => void handleIssueOrRotate()}
            >
              Open Session & Generate QR Code
            </Button>
          </div>
        </div>
      )}

      {session.status === "open" && credential && (
        <QRCodeDisplay
          payload={qrUrl}
          shortCode={credential.short_code}
          expiresAt={credential.expires_at}
          courseLabel={`${session.course_code} — ${session.title}`}
          rotating={rotating}
          onRotate={() => void handleIssueOrRotate()}
        />
      )}

      {session.status === "open" && !credential && (
        <div className="rounded-v2-lg bg-v2-surface p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-v2-sm text-v2-ink-secondary">
              No active credential found for this open session.
            </p>
            <Button
              loading={rotating}
              leadingIcon={<RefreshCw />}
              onClick={() => void handleIssueOrRotate()}
            >
              Issue Active QR & Code
            </Button>
          </div>
        </div>
      )}

      <StatCards
        columns={2}
        items={[
          {
            label: "Checked In",
            value: `${checkedInCount} / ${session.enrolled_count}`,
            caption: `${session.present_count} Present · ${session.late_count} Late`,
          },
          {
            label: "Absent / Unmarked",
            value: String(
              session.status === "closed"
                ? session.absent_count
                : Math.max(0, session.enrolled_count - checkedInCount),
            ),
            caption: session.status === "closed" ? "Finalized absences" : "Awaiting check-in",
          },
        ]}
      />

      {session.status !== "closed" && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={finalizing}
          leadingIcon={<Lock />}
          onClick={() => void handleFinalize()}
        >
          Close & Finalize Session
        </Button>
      )}

      <Card
        variant="plain"
        title={`Live Class Roster (${totalRoster})`}
        description="Updates automatically in real time as students scan or enter the code."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/sessions/${session.id}/mark`)}
          >
            Mark Roster
          </Button>
        }
      >
        <div className="mb-4">
          <SearchInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder="Search student name or ID…"
          />
        </div>

        <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
          {roster.map((row) => (
            <div
              key={row.student_id}
              className="flex items-center justify-between gap-3 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-semibold text-v2-ink">{row.student_name}</p>
                <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                  {row.student_number}
                  {row.checked_in_at ? ` · ${formatDateTime(row.checked_in_at)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {row.entry_source && (
                  <Badge tone="neutral" size="sm">
                    {row.entry_source.toUpperCase()}
                  </Badge>
                )}
                {row.entry_status ? (
                  <Status value={row.entry_status} size="sm" />
                ) : (
                  <Status value="pending" label="Waiting" size="sm" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
