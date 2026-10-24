import type { ReactNode } from "react";

import { Button } from "../button";
import { Tooltip } from "../tooltip";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  tone?: "primary" | "secondary" | "danger" | "default";
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const VARIANT = {
  primary: "primary",
  secondary: "secondary",
  default: "secondary",
  danger: "danger-ghost",
} as const;
const ICON_VARIANT = {
  primary: "ghost",
  secondary: "ghost",
  default: "ghost",
  danger: "danger-ghost",
} as const;

function RowActions({ actions }: { actions: RowAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="flex justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
      {actions.map((action) =>
        action.iconOnly ? (
          <Tooltip key={action.label} content={action.label}>
            <Button
              size="icon-sm"
              variant={ICON_VARIANT[action.tone ?? "secondary"]}
              aria-label={action.label}
              loading={action.loading}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.icon}
            </Button>
          </Tooltip>
        ) : (
          <Button
            key={action.label}
            size="sm"
            variant={VARIANT[action.tone ?? "secondary"]}
            leadingIcon={action.icon}
            loading={action.loading}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ),
      )}
    </div>
  );
}

export { RowActions };
