import * as React from "react";
import { Check, ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "./button";
import { DropdownMenu } from "./dropdown-menu";

export type ExportFormat = "pdf" | "excel" | "csv";

const formatMeta: Record<ExportFormat, { label: string; short: string; icon: React.ReactNode }> = {
  pdf: { label: "Export as PDF", short: "PDF", icon: <FileText /> },
  excel: { label: "Export as Excel", short: "Excel", icon: <FileSpreadsheet /> },
  csv: { label: "Export as CSV", short: "CSV", icon: <FileSpreadsheet /> },
};

export interface ExportButtonProps {
  onExport: (format: ExportFormat) => unknown;
  formats?: ExportFormat[];
  variant?: "menu" | "buttons";
  size?: "sm" | "md";
  label?: string;
}

function ExportButton({ onExport, formats = ["pdf", "csv"], variant = "menu", size = "md", label = "Export" }: ExportButtonProps) {
  const [working, setWorking] = React.useState<ExportFormat | null>(null);
  const [done, setDone] = React.useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setWorking(format);
    try {
      await onExport(format);
      setDone(format);
      window.setTimeout(() => setDone(null), 1600);
    } finally {
      setWorking(null);
    }
  };

  if (variant === "buttons" || formats.length === 1) {
    return (
      <div className="flex items-center gap-2">
        {formats.map((format) => (
          <Button
            key={format}
            variant="secondary"
            size={size}
            loading={working === format}
            leadingIcon={done === format ? <Check /> : formatMeta[format].icon}
            onClick={() => void run(format)}
          >
            {formats.length === 1 ? formatMeta[format].label : formatMeta[format].short}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button
          variant="secondary"
          size={size}
          loading={working !== null}
          leadingIcon={done ? <Check /> : <Download />}
          trailingIcon={<ChevronDown className="text-v2-ink-tertiary" />}
        >
          {label}
        </Button>
      }
      items={formats.map((format) => ({
        label: formatMeta[format].label,
        icon: formatMeta[format].icon,
        onSelect: () => void run(format),
      }))}
    />
  );
}

export { ExportButton };
