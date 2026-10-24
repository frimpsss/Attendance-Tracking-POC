import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";

import { Button } from "./button";
import { overlay } from "./shared/styles";

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlay} />
        <AlertDialogPrimitive.Content className="font-v2 fixed left-1/2 top-1/2 z-v2-overlay w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-v2-lg bg-v2-canvas p-6 text-v2-ink outline-none duration-v2-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]">
          {tone === "danger" && (
            <div className="mb-4 flex size-9 items-center justify-center rounded-v2-md bg-v2-danger-soft text-v2-danger">
              <AlertTriangle className="size-[18px]" />
            </div>
          )}
          <AlertDialogPrimitive.Title className="text-v2-lg font-semibold leading-[24px]">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="mt-1.5 text-v2-ui leading-[20px] text-v2-ink-secondary">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={loading}
              onClick={() => void onConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { ConfirmDialog };
