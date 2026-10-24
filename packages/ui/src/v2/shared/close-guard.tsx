import * as React from "react";

import { ConfirmDialog } from "../confirm-dialog";

export function useCloseGuard(confirmClose: boolean, onOpenChange?: (open: boolean) => void) {
  const [confirming, setConfirming] = React.useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open && confirmClose) setConfirming(true);
    else onOpenChange?.(open);
  };

  const dialog = (
    <ConfirmDialog
      open={confirming}
      onOpenChange={setConfirming}
      title="Discard changes?"
      description="Anything you've entered here will be lost."
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      tone="danger"
      onConfirm={() => {
        setConfirming(false);
        onOpenChange?.(false);
      }}
    />
  );

  return { handleOpenChange, dialog };
}
