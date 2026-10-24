import * as React from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "../button";
import { Alert } from "../alert";

export interface QRScannerProps {
  onScan: (decodedValue: string) => void;
  onFallbackToCode?: () => void;
  disabled?: boolean;
}

export function QRScanner({ onScan, onFallbackToCode, disabled }: QRScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = React.useState<
    "idle" | "requesting" | "active" | "denied" | "unsupported"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    if (disabled) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      setErrorMessage(
        "Camera access is not supported in this browser or requires an HTTPS origin. Please use Manual Code Entry.",
      );
      return;
    }

    setCameraState("requesting");
    setErrorMessage(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch (err) {
      stopCamera();
      setCameraState("denied");
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings or enter the 6-character session code manually."
          : "Could not access device camera. You can enter the 6-character session code manually instead.";
      setErrorMessage(msg);
    }
  }, [disabled, stopCamera]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  React.useEffect(() => {
    if (cameraState !== "active" || disabled) return;

    let animationFrameId: number;
    let active = true;

    const scanFrame = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code?.data) {
              stopCamera();
              setCameraState("idle");
              onScan(code.data);
              return;
            }
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(scanFrame);
    };

    animationFrameId = window.requestAnimationFrame(scanFrame);
    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [cameraState, disabled, onScan, stopCamera]);

  return (
    <div className="flex flex-col gap-4">
      {cameraState === "idle" && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-v2-md bg-v2-surface px-6 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-v2-primary-soft text-v2-primary">
            <Camera className="size-7" />
          </div>
          <div className="max-w-xs">
            <p className="text-v2-lg font-semibold text-v2-ink">Scan Classroom QR Code</p>
            <p className="mt-1 text-v2-sm text-v2-ink-secondary">
              Point your phone camera at the QR code projected by your lecturer.
            </p>
          </div>
          <Button
            size="lg"
            leadingIcon={<Camera />}
            onClick={() => void startCamera()}
            disabled={disabled}
            className="min-w-[220px]"
          >
            Open Camera Scanner
          </Button>
        </div>
      )}

      {cameraState === "requesting" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-v2-md bg-v2-surface px-6 py-12 text-center">
          <RefreshCw className="size-6 animate-spin text-v2-primary" />
          <p className="text-v2-base font-medium text-v2-ink">
            Requesting camera permission…
          </p>
        </div>
      )}

      {cameraState === "active" && (
        <div className="relative overflow-hidden rounded-v2-md bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
            <div className="relative size-56 rounded-v2-md border-2 border-white/80">
              <div className="v2-scan-line absolute inset-x-2 h-0.5 bg-v2-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-v2-surface px-4 py-3">
            <span className="text-v2-sm font-medium text-v2-ink-secondary">
              Align QR code within frame
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                stopCamera();
                setCameraState("idle");
              }}
            >
              Stop Camera
            </Button>
          </div>
        </div>
      )}

      {(cameraState === "denied" || cameraState === "unsupported") && (
        <div className="flex flex-col gap-3 rounded-v2-md bg-v2-surface p-5">
          <div className="flex items-center gap-2.5 text-v2-danger">
            <CameraOff className="size-5 shrink-0" />
            <span className="text-v2-md font-semibold">Camera Unavailable</span>
          </div>
          {errorMessage && (
            <Alert tone="warning" title="Fallback available">
              {errorMessage}
            </Alert>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => void startCamera()}>
              Try Camera Again
            </Button>
            {onFallbackToCode && (
              <Button variant="primary" size="sm" onClick={onFallbackToCode}>
                Enter 6-Character Code Instead
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
