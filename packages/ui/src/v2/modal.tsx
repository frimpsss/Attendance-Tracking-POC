import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@attendance/utils";
import { useCloseGuard } from "./shared/close-guard";
import { focusRing, overlay } from "./shared/styles";

const sizes = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
  xl: "max-w-[880px]",
} as const;

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof sizes;
  hideClose?: boolean;
  dismissible?: boolean;
  confirmClose?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  size = "md",
  hideClose = false,
  dismissible = true,
  confirmClose = false,
  className,
  bodyClassName,
  children,
}: ModalProps) {
  const guard = useCloseGuard(confirmClose, onOpenChange);
  const block = (event: Event) => {
    if (!dismissible) event.preventDefault();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={guard.handleOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
          className={cn(
            "font-v2 fixed left-1/2 top-1/2 z-v2-overlay flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-v2-lg bg-v2-canvas text-v2-ink outline-none duration-v2-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
            sizes[size],
            className,
          )}
        >
          {(title || !hideClose) && (
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
              <div className="min-w-0">
                {title && (
                  <DialogPrimitive.Title className="text-v2-lg font-semibold leading-[24px]">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-v2-ui leading-[20px] text-v2-ink-secondary">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {!hideClose && (
                <DialogPrimitive.Close
                  data-v2
                  aria-label="Close"
                  className={cn(
                    "-mr-2 -mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-tertiary transition-colors hover:bg-v2-surface-hover hover:text-v2-ink",
                    focusRing,
                  )}
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              )}
            </div>
          )}
          {children && (
            <div className={cn("min-h-0 flex-auto overflow-y-auto px-6 py-3", bodyClassName)}>{children}</div>
          )}
          {footer && <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-3">{footer}</div>}
          {guard.dialog}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const ModalClose = DialogPrimitive.Close;

export { Modal, ModalClose };
