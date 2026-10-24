import * as React from "react";
import { DocumentPreview } from "./document-preview";
import { FileCard } from "./file-card";
import type { UploadItem } from "./file-upload";
import { formatBytes } from "./utils";

export interface SerializedEvidenceFile {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface SerializedEvidencePayload {
  __v2_evidence: true;
  note?: string;
  files: SerializedEvidenceFile[];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function serializeSupportingEvidence(
  note: string,
  uploadItems: UploadItem[],
): Promise<string | null> {
  const validItems = uploadItems.filter((item) => !item.error);
  const trimmedNote = note.trim();

  if (validItems.length === 0) {
    return trimmedNote || null;
  }

  const files: SerializedEvidenceFile[] = await Promise.all(
    validItems.map(async (item) => {
      const includeDataUrl = item.file.size <= 2 * 1024 * 1024;
      const dataUrl = includeDataUrl ? await fileToDataUrl(item.file) : undefined;
      return {
        name: item.file.name,
        size: item.file.size,
        type: item.file.type || "application/octet-stream",
        dataUrl,
      };
    }),
  );

  const payload: SerializedEvidencePayload = {
    __v2_evidence: true,
    note: trimmedNote || undefined,
    files,
  };

  return JSON.stringify(payload);
}

export function parseSupportingEvidence(raw?: string | null): {
  note: string | null;
  files: SerializedEvidenceFile[];
} {
  if (!raw) return { note: null, files: [] };
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.includes('"__v2_evidence"')) {
    try {
      const parsed = JSON.parse(trimmed) as SerializedEvidencePayload;
      if (parsed && parsed.__v2_evidence) {
        return {
          note: parsed.note ?? null,
          files: Array.isArray(parsed.files) ? parsed.files : [],
        };
      }
    } catch {
      // Fallback to plain text note
    }
  }
  return { note: trimmed, files: [] };
}

export function SupportingEvidenceView({
  value,
  compact = false,
}: {
  value?: string | null;
  compact?: boolean;
}) {
  const { note, files } = React.useMemo(() => parseSupportingEvidence(value), [value]);
  const [previewFile, setPreviewFile] = React.useState<SerializedEvidenceFile | null>(null);

  if (!note && files.length === 0) return null;

  const handleDownload = (f: SerializedEvidenceFile) => {
    if (!f.dataUrl) return;
    const a = document.createElement("a");
    a.href = f.dataUrl;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-2">
      {note && <p className="text-v2-sm text-v2-ink">{note}</p>}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f, idx) => (
            <FileCard
              key={`${f.name}-${idx}`}
              name={f.name}
              size={compact ? undefined : f.size}
              type={f.type}
              thumbnail={f.type.startsWith("image/") ? f.dataUrl : undefined}
              onPreview={f.dataUrl ? () => setPreviewFile(f) : undefined}
              onDownload={f.dataUrl ? () => handleDownload(f) : undefined}
            />
          ))}
        </div>
      )}
      {previewFile && previewFile.dataUrl && (
        <DocumentPreview
          open
          onOpenChange={(open) => !open && setPreviewFile(null)}
          title={previewFile.name}
          subtitle={formatBytes(previewFile.size)}
          src={previewFile.dataUrl}
          type={previewFile.type}
        />
      )}
    </div>
  );
}
