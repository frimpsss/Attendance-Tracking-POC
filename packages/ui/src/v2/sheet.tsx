import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@attendance/utils";
import { useCloseGuard } from "./shared/close-guard";
import { LayerProvider } from "./shared/layer";
import { focusRing, overlay } from "./shared/styles";

const sides = {
  right:
    "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  left: "inset-y-0 left-0 h-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
} as const;

const sizes = {
  sm: "w-full sm:max-w-[380px]",
  md: "w-full sm:max-w-[480px]",
  lg: "w-full sm:max-w-[640px]",
  xl: "w-full sm:max-w-[860px]",
} as const;

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  side?: keyof typeof sides;
  size?: keyof typeof sizes;
  confirmClose?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function Sheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  actions,
  side = "right",
  size = "md",
  confirmClose = false,
  className,
  children,
}: SheetProps) {
  const guard = useCloseGuard(confirmClose, onOpenChange);
  const [layer, setLayer] = React.useState<HTMLDivElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={guard.handleOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          ref={setLayer}
          className={cn(
            "font-v2 fixed z-v2-overlay flex flex-col border-v2-line bg-v2-canvas text-v2-ink outline-none transition ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-v2-base data-[state=open]:duration-v2-slow",
            sides[side],
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-v2-line px-6 py-4">
            <div className="min-w-0">
              {title && (
                <DialogPrimitive.Title className="text-v2-lg font-semibold leading-[24px]">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-v2-sm leading-[20px] text-v2-ink-secondary">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {actions && <div className="ml-auto flex shrink-0 items-center gap-2 self-center">{actions}</div>}
            <DialogPrimitive.Close
              data-v2
              aria-label="Close"
              className={cn(
                "-mr-2 flex size-8 shrink-0 items-center justify-center rounded-v2-sm bg-transparent text-v2-ink-tertiary transition-colors hover:bg-v2-surface-hover hover:text-v2-ink",
                focusRing,
              )}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <LayerProvider value={layer}>{children}</LayerProvider>
          </div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-v2-line px-6 py-3.5">
              {footer}
            </div>
          )}
          {guard.dialog}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const SheetClose = DialogPrimitive.Close;

export { Sheet, SheetClose };
