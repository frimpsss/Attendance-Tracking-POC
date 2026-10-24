import * as React from "react";
import { Download, Eye, Share2, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";
import { Progress } from "../progress";
import { FileIcon } from "./file-icon";
import { formatBytes } from "./utils";

export interface FileCardProps {
  name: string;
  size?: number;
  type?: string;
  thumbnail?: string;
  progress?: number;
  error?: string;
  onPreview?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onRemove?: () => void;
  className?: string;
}

function FileCard({
  name,
  size,
  type,
  thumbnail,
  progress,
  error,
  onPreview,
  onDownload,
  onShare,
  onRemove,
  className,
}: FileCardProps) {
  const uploading = progress !== undefined && progress < 100;
  return (
    <div className={cn("font-v2 flex items-center gap-3 rounded-v2-md bg-v2-field px-3 py-2.5", className)}>
      {thumbnail ? (
        <button
          type="button"
          data-v2
          aria-label={`Preview ${name}`}
          disabled={!onPreview}
          onClick={onPreview}
          className="size-10 shrink-0 overflow-hidden rounded-v2-sm bg-v2-canvas disabled:cursor-default"
        >
          <img src={thumbnail} alt="" className="size-full object-cover" />
        </button>
      ) : (
        <FileIcon name={name} type={type} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-v2-base font-medium text-v2-ink">{name}</p>
        {error ? (
          <p className="text-v2-meta text-v2-danger">{error}</p>
        ) : uploading ? (
          <Progress value={progress ?? 0} size="sm" className="mt-1.5 max-w-[240px]" />
        ) : (
          size !== undefined && <p className="text-v2-meta text-v2-ink-tertiary">{formatBytes(size)}</p>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {onPreview && !uploading && (
          <Button variant="ghost" size="icon-sm" aria-label={`Preview ${name}`} onClick={onPreview}>
            <Eye />
          </Button>
        )}
        {onDownload && !uploading && (
          <Button variant="ghost" size="icon-sm" aria-label={`Download ${name}`} onClick={onDownload}>
            <Download />
          </Button>
        )}
        {onShare && !uploading && (
          <Button variant="ghost" size="icon-sm" aria-label={`Share ${name}`} onClick={onShare}>
            <Share2 />
          </Button>
        )}
        {onRemove && (
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={onRemove}>
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

export { FileCard };
