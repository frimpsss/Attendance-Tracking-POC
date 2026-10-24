import * as React from "react";
import { Paperclip, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Field, type FieldControlProps } from "../shared/field";
import { fieldShell, focusRing } from "../shared/styles";
import { FileIcon } from "./file-icon";
import { acceptToInputAttr, formatBytes, matchesAccept, type Accept } from "./utils";

export interface FileInputProps extends FieldControlProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: Accept;
  maxSize?: number;
  multiple?: boolean;
  variant?: "filled" | "inline";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onReject?: (message: string) => void;
}

function FileChip({
  file,
  onRemove,
  compact,
}: {
  file: File;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-v2-xs bg-v2-canvas pr-1 text-v2-sm text-v2-ink",
        compact ? "h-7 pl-1.5" : "h-8 pl-1.5",
      )}
    >
      <FileIcon name={file.name} type={file.type} size="sm" className="!h-6 !w-5" />
      <span className="min-w-0 truncate font-medium">{file.name}</span>
      {!compact && (
        <span className="shrink-0 text-v2-xs text-v2-ink-tertiary">{formatBytes(file.size)}</span>
      )}
      <button
        type="button"
        data-v2
        aria-label={`Remove ${file.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-v2-xs bg-transparent text-v2-ink-tertiary transition-colors duration-v2-fast hover:bg-v2-surface-hover hover:text-v2-ink",
          focusRing,
        )}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function FileInput({
  value,
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  variant = "filled",
  placeholder,
  required,
  disabled,
  onReject,
  label,
  hint,
  error,
  optional,
  containerClassName,
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [rejection, setRejection] = React.useState<string | null>(null);

  const handleFiles = (rawFiles: FileList | File[]) => {
    const list = Array.from(rawFiles);
    const accepted: File[] = [];
    let firstError: string | null = null;

    for (const file of list) {
      if (!matchesAccept(file, accept)) {
        if (!firstError) firstError = `${file.name} isn’t an accepted file type`;
        continue;
      }
      if (file.size > maxSize) {
        if (!firstError) firstError = `${file.name} is larger than ${formatBytes(maxSize)}`;
        continue;
      }
      accepted.push(file);
    }

    setRejection(firstError);
    if (firstError) onReject?.(firstError);
    if (accepted.length) {
      onChange(multiple ? [...value, ...accepted] : accepted.slice(0, 1));
    }
  };

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const remove = (index: number) => onChange(value.filter((_, position) => position !== index));
  const inline = variant === "inline";

  return (
    <Field
      label={label}
      hint={hint}
      error={error ?? rejection ?? undefined}
      required={required}
      optional={optional}
      className={containerClassName}
    >
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
        className={cn(
          inline
            ? "font-v2 flex min-h-v2-control-sm w-full flex-wrap items-center gap-1.5 rounded-v2-xs border border-dashed border-transparent px-1 py-1 transition-colors duration-v2-fast hover:border-v2-line-strong"
            : cn(
                fieldShell,
                "min-h-v2-control-md flex-wrap gap-1.5 border border-dashed border-v2-line-strong py-1.5 pl-2 pr-1.5",
              ),
          isDragActive && "!border-v2-primary !bg-v2-primary-soft",
          (error || rejection) && !inline && "!border-v2-danger",
          disabled && "pointer-events-none opacity-v2-disabled",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={acceptToInputAttr(accept)}
          multiple={multiple}
          disabled={disabled}
          aria-label={typeof label === "string" ? label : "Attach file"}
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        {value.map((file, index) => (
          <FileChip
            key={`${file.name}-${index}`}
            file={file}
            compact={inline}
            onRemove={() => remove(index)}
          />
        ))}
        {(multiple || value.length === 0) && (
          <button
            type="button"
            data-v2
            onClick={open}
            className={cn(
              "inline-flex items-center gap-2 rounded-v2-xs bg-transparent text-left transition-colors duration-v2-fast",
              inline
                ? "h-7 px-1.5 text-v2-sm text-v2-primary hover:bg-v2-primary-soft"
                : "h-8 flex-1 px-2 text-v2-md text-v2-ink-tertiary",
              focusRing,
            )}
          >
            <Paperclip className={cn("shrink-0", inline ? "size-3.5" : "size-[18px]")} />
            <span className="truncate">
              {isDragActive
                ? "Drop to attach"
                : (placeholder ??
                  (inline
                    ? value.length
                      ? "Add"
                      : "Attach"
                    : multiple && value.length
                      ? "Add more files"
                      : "Choose a file or drop it here"))}
            </span>
          </button>
        )}
        {!inline && value.length > 0 && !multiple && (
          <button
            type="button"
            data-v2
            onClick={open}
            className={cn(
              "ml-auto h-8 rounded-v2-xs bg-v2-canvas px-3 text-v2-sm font-semibold text-v2-ink hover:bg-v2-surface-hover",
              focusRing,
            )}
          >
            Replace
          </button>
        )}
      </div>
    </Field>
  );
}

export { FileInput };
