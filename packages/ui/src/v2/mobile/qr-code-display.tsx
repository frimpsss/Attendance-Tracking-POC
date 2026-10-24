import * as React from "react";
import QRCode from "qrcode";
import { Clock, Copy, RefreshCw } from "lucide-react";
import { cn, formatCountdown } from "@attendance/utils";
import { Button } from "../button";
import { toast } from "../toast";

export interface QRCodeDisplayProps {
  value?: string;
  payload?: string;
  shortCode?: string;
  expiresAt?: string;
  courseLabel?: string;
  rotating?: boolean;
  onRotate?: () => void;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  value,
  payload,
  shortCode,
  expiresAt,
  courseLabel,
  rotating,
  onRotate,
  size = 240,
  className,
}: QRCodeDisplayProps) {
  const qrText = value ?? payload ?? "";
  const [svgMarkup, setSvgMarkup] = React.useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    let active = true;
    if (!qrText) {
      setSvgMarkup("");
      return;
    }
    QRCode.toString(qrText, {
      type: "svg",
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {
        if (active) setSvgMarkup("");
      });
    return () => {
      active = false;
    };
  }, [qrText, size]);

  React.useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(diff);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!shortCode && !expiresAt && !onRotate) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-v2-md bg-white p-4",
          className,
        )}
        style={{ width: size + 32, height: size + 32 }}
      >
        {svgMarkup ? (
          <div
            className="size-full [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-v2-surface text-v2-xs text-v2-ink-tertiary">
            Generating QR…
          </div>
        )}
      </div>
    );
  }

  const isExpired = expiresAt ? secondsRemaining <= 0 : false;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-v2-lg bg-v2-surface p-6 text-center",
        className,
      )}
    >
      {courseLabel && (
        <p className="text-v2-xs font-semibold uppercase tracking-wider text-v2-ink-tertiary">
          {courseLabel}
        </p>
      )}

      <div
        className="inline-flex items-center justify-center rounded-v2-md bg-white p-4"
        style={{ width: size + 32, height: size + 32 }}
      >
        {svgMarkup ? (
          <div
            className="size-full [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-v2-surface text-v2-xs text-v2-ink-tertiary">
            Generating QR…
          </div>
        )}
      </div>

      {shortCode && (
        <div className="flex w-full flex-col items-center gap-1 rounded-v2-md bg-v2-canvas px-4 py-3.5">
          <span className="text-v2-2xs font-semibold uppercase tracking-wider text-v2-ink-tertiary">
            6-Character Check-In Code
          </span>
          <div className="flex items-center gap-2">
            <span className="font-v2-mono text-v2-3xl font-bold tracking-[0.25em] text-v2-primary">
              {shortCode}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Copy code"
              onClick={() => {
                void navigator.clipboard?.writeText(shortCode);
                toast.success("Check-in code copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex w-full flex-wrap items-center justify-between gap-2 pt-1">
        {expiresAt && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-v2-xs font-semibold tabular-nums",
              isExpired ? "text-v2-danger" : "text-v2-ink-secondary",
            )}
          >
            <Clock className="h-4 w-4" />
            {isExpired
              ? "Credential Expired — Rotate Now"
              : `Expires in ${formatCountdown(secondsRemaining)}`}
          </div>
        )}
        {onRotate && (
          <Button
            variant="secondary"
            size="sm"
            loading={rotating}
            leadingIcon={<RefreshCw />}
            onClick={onRotate}
          >
            Rotate QR / Code
          </Button>
        )}
      </div>
    </div>
  );
}
