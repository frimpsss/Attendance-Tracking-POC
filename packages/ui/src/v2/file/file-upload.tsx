import * as React from "react";
import { UploadCloud } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "../shared/field";
import { DocumentPreview } from "./document-preview";
import { FileCard } from "./file-card";
import { acceptToInputAttr, formatBytes, matchesAccept, type Accept } from "./utils";

export interface UploadItem {
  id: string;
  file: File;
  progress?: number;
  error?: string;
}

export interface FileUploadProps extends FieldControlProps {
  value: UploadItem[];
  onChange: (items: UploadItem[]) => void;
  accept?: Accept;
  maxSize?: number;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  onPreview?: (item: UploadItem) => void;
}

const describeAccept = (accept?: Accept) =>
  accept
    ? Object.values(accept)
        .flat()
        .map((ext) => ext.replace(".", "").toUpperCase())
        .join(", ")
    : null;

function FileUpload({
  value,
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  required,
  disabled,
  description,
  onPreview,
  label,
  hint,
  error,
  optional,
  containerClassName,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleFiles = (rawFiles: FileList | File[]) => {
    const list = Array.from(rawFiles);
    const added: UploadItem[] = list.map((file) => {
      const id = `${file.name}-${file.lastModified}-${Math.random()}`;
      if (!matchesAccept(file, accept)) {
        return { id, file, error: "Unsupported file type" };
      }
      if (file.size > maxSize) {
        return { id, file, error: `Larger than ${formatBytes(maxSize)}` };
      }
      return { id, file };
    });
    onChange(multiple ? [...value, ...added] : added.slice(0, 1));
  };

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const types = describeAccept(accept);
  const [previewing, setPreviewing] = React.useState<UploadItem | null>(null);
  const [urls, setUrls] = React.useState<Map<string, string>>(() => new Map());

  React.useEffect(() => {
    const next = new Map(
      value.filter((item) => !item.error).map((item) => [item.id, URL.createObjectURL(item.file)]),
    );
    setUrls(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [value]);

  const preview = (item: UploadItem) => (onPreview ? onPreview(item) : setPreviewing(item));
  const previewUrl = previewing ? urls.get(previewing.id) : undefined;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={containerClassName}
    >
      <div className="flex flex-col gap-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            if (!disabled && e.dataTransfer?.files?.length) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={open}
          className={cn(
            "font-v2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-v2-md border border-dashed px-6 py-7 text-center transition-colors duration-v2-fast",
            isDragActive
              ? "border-v2-primary bg-v2-primary-soft"
              : "border-v2-line-strong bg-v2-field hover:border-v2-primary/50",
            disabled && "pointer-events-none opacity-60",
            error && "border-v2-danger",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={acceptToInputAttr(accept)}
            multiple={multiple}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <span className="flex size-11 items-center justify-center rounded-full bg-v2-canvas text-v2-primary">
            <UploadCloud className="size-5" />
          </span>
          <div>
            <p className="text-v2-base text-v2-ink">
              <button
                type="button"
                data-v2
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="bg-transparent font-semibold text-v2-primary underline decoration-[1.5px] underline-offset-4"
              >
                Choose files
              </button>{" "}
              or drag them here
            </p>
            <p className="mt-1 text-v2-meta text-v2-ink-tertiary">
              {description ?? [types, `up to ${formatBytes(maxSize)}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        {value.map((item) => (
          <FileCard
            key={item.id}
            name={item.file.name}
            size={item.file.size}
            type={item.file.type}
            thumbnail={item.file.type.startsWith("image/") ? urls.get(item.id) : undefined}
            progress={item.progress}
            error={item.error}
            onPreview={!item.error && urls.has(item.id) ? () => preview(item) : undefined}
            onRemove={() => onChange(value.filter((entry) => entry.id !== item.id))}
          />
        ))}
      </div>
      {previewing && previewUrl && (
        <DocumentPreview
          key={previewing.id}
          open
          onOpenChange={(openState) => !openState && setPreviewing(null)}
          title={previewing.file.name}
          subtitle={formatBytes(previewing.file.size)}
          src={previewUrl}
          type={previewing.file.type}
        />
      )}
    </Field>
  );
}

export { FileUpload };
