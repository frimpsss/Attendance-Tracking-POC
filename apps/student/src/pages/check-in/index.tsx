import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Hash,
  History,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  QRScanner,
  Status,
  Tabs,
} from "@attendance/ui";
import { cn, formatDateTime } from "@attendance/utils";
import { parseScannedQrPayload, useCheckin } from "./hooks/use-checkin";

export default function StudentCheckinPage() {
  const navigate = useNavigate();
  const {
    submitting,
    result,
    setResult,
    openSessions,
    submitQrToken,
    submitShortCode,
  } = useCheckin();

  const [mode, setMode] = React.useState("code");
  const [shortCode, setShortCode] = React.useState("");

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortCode.trim()) return;
    await submitShortCode(shortCode.trim());
  };

  const handleScanSuccess = async (decoded: string) => {
    const parsed = parseScannedQrPayload(decoded);
    if (parsed.qrToken) {
      await submitQrToken(parsed.qrToken, parsed.sessionId);
    } else if (parsed.shortCode) {
      await submitShortCode(parsed.shortCode, parsed.sessionId);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <h1 className="text-v2-xl font-bold tracking-tight text-v2-ink">Classroom Check-In</h1>
        <p className="mt-1 text-v2-sm text-v2-ink-secondary">
          Scan the classroom QR code or enter the 6-character code displayed by your lecturer.
        </p>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-v2-lg p-5",
            result.ok ? "bg-v2-primary-soft" : "bg-v2-danger-soft",
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              {result.ok ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-v2-primary" />
              ) : (
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-v2-danger" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-v2-base font-bold text-v2-ink">
                    {result.ok ? "Check-In Confirmed!" : "Check-In Rejected"}
                  </h2>
                  {result.status && <Status value={result.status} size="sm" />}
                </div>
                <p className="mt-1 text-v2-sm text-v2-ink">{result.message}</p>
                {result.ok && (
                  <div className="mt-3 flex flex-col gap-1 border-t border-v2-line pt-2.5 text-v2-xs text-v2-ink-secondary">
                    {result.course_code && (
                      <span>
                        Course: <strong>{result.course_code}</strong> — {result.course_title}
                      </span>
                    )}
                    {result.session_title && <span>Session: {result.session_title}</span>}
                    {result.checked_in_at && (
                      <span>Recorded at: {formatDateTime(result.checked_in_at)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<RotateCcw />}
                onClick={() => {
                  setResult(null);
                  setShortCode("");
                }}
              >
                Check In Again
              </Button>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<History />}
                onClick={() => navigate("/history")}
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <Tabs
          value={mode}
          onValueChange={setMode}
          items={[
            {
              value: "code",
              label: "Enter 6-Char Code",
              content: (
                <div className="mt-4 rounded-v2-lg bg-v2-surface p-5">
                  <div className="mb-4">
                    <h2 className="text-v2-base font-semibold text-v2-ink">
                      Manual Session Code
                    </h2>
                    <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                      Enter the 6-character alphanumeric code shown on the projector.
                    </p>
                  </div>
                  <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                    <Input
                      label="6-Character Code"
                      required
                      maxLength={8}
                      placeholder="CS401A"
                      value={shortCode}
                      onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                      className="font-v2-mono text-center text-v2-xl font-bold uppercase tracking-[0.25em]"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      loading={submitting}
                      leadingIcon={<Hash />}
                    >
                      Submit Check-In Code
                    </Button>
                  </form>
                </div>
              ),
            },
            {
              value: "qr",
              label: "Scan QR Code",
              content: (
                <div className="mt-4">
                  <QRScanner
                    disabled={submitting}
                    onScan={(decoded) => void handleScanSuccess(decoded)}
                    onFallbackToCode={() => setMode("code")}
                  />
                </div>
              ),
            },
          ]}
        />
      )}

      {openSessions.length > 0 && (
        <Card
          variant="plain"
          title="Currently Open Sessions in Your Courses"
          description="Active sessions currently accepting check-ins."
        >
          <div className="flex flex-col divide-y divide-v2-line rounded-v2-lg bg-v2-surface px-4">
            {openSessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div>
                  <p className="font-semibold text-v2-ink">
                    {sess.course_code} — {sess.title}
                  </p>
                  <p className="mt-0.5 text-v2-xs text-v2-ink-secondary">
                    Opened {formatDateTime(sess.opened_at ?? sess.scheduled_at)}
                  </p>
                </div>
                <Status value="open" size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
