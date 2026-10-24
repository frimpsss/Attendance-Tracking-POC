import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, Minus, Plus, Printer, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { overlay } from "../shared/styles";
import { Spinner } from "../spinner";
import { FileIcon } from "./file-icon";
import { kindOf } from "./utils";

export interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  src?: string;
  fetchDocument?: () => Promise<Blob>;
  type?: string;
  actions?: React.ReactNode;
}

function DocumentPreview({
  open,
  onOpenChange,
  title,
  subtitle,
  src,
  fetchDocument,
  type,
  actions,
}: DocumentPreviewProps) {
  const [url, setUrl] = React.useState<string | null>(src ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const kind = kindOf(title, type);

  React.useEffect(() => {
    if (!open) return;
    setZoom(1);
    setError(null);
    if (src || !fetchDocument) {
      setUrl(src ?? null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    fetchDocument()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(
        (reason: unknown) =>
          !cancelled &&
          setError(reason instanceof Error ? reason.message : "Couldn’t load document"),
      );
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, src, fetchDocument]);

  const print = () => {
    if (kind === "pdf") {
      frameRef.current?.contentWindow?.print();
    } else if (url) {
      const win = window.open(url, "_blank");
      win?.print();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="font-v2 fixed inset-3 z-v2-overlay mx-auto flex max-w-5xl flex-col overflow-hidden rounded-v2-lg bg-v2-canvas outline-none duration-v2-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] sm:inset-6"
        >
          <div className="flex items-center gap-3 border-b border-v2-line px-4 py-3">
            <FileIcon name={title} type={type} />
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-v2-md font-semibold text-v2-ink">
                {title}
              </DialogPrimitive.Title>
              {subtitle && <p className="truncate text-v2-meta text-v2-ink-tertiary">{subtitle}</p>}
            </div>
            {kind === "image" && (
              <div className="hidden items-center gap-1 rounded-v2-sm bg-v2-field p-0.5 sm:flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                >
                  <Minus />
                </Button>
                <span className="w-12 text-center text-v2-sm font-medium tabular-nums text-v2-ink-secondary">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <Plus />
                </Button>
              </div>
            )}
            {actions}
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Printer />}
              onClick={print}
              disabled={!url}
            >
              Print
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Download />}
              disabled={!url}
              asChild={Boolean(url)}
            >
              {url ? (
                <a href={url} download={title}>
                  <Download />
                  Download
                </a>
              ) : (
                "Download"
              )}
            </Button>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="relative flex flex-1 items-start justify-center overflow-auto bg-v2-field">
            {error ? (
              <p className="m-auto text-v2-base text-v2-ink-secondary">{error}</p>
            ) : !url ? (
              <Spinner size="lg" className="m-auto text-v2-ink-tertiary" />
            ) : kind === "image" ? (
              <img
                src={url}
                alt={title}
                className="my-6 max-w-none rounded-v2-sm bg-v2-canvas transition-[width] duration-v2-fast"
                style={{
                  width: `${zoom * 100}%`,
                  maxWidth: zoom === 1 ? "min(100%, 900px)" : undefined,
                }}
              />
            ) : kind === "pdf" ? (
              <iframe
                ref={frameRef}
                src={url}
                title={title}
                className={cn("h-full w-full border-0")}
              />
            ) : (
              <p className="m-auto text-v2-base text-v2-ink-secondary">
                This file type can’t be previewed. Download it instead.
              </p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { DocumentPreview };
