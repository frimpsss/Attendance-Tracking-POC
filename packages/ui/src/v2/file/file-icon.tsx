import { cn } from "@attendance/utils";
import { extensionOf, kindOf } from "./utils";

export interface FileIconProps {
  name: string;
  type?: string;
  size?: "sm" | "md";
  className?: string;
}

function FileIcon({ name, type, size = "md", className }: FileIconProps) {
  const kind = kindOf(name, type);
  const label = (extensionOf(name) || "file").slice(0, 4).toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-v2-xs pb-1",
        size === "md" ? "h-10 w-8" : "h-8 w-6",
        kind === "pdf" ? "bg-v2-primary text-v2-on-primary" : "bg-v2-primary-soft text-v2-primary",
        className,
      )}
    >
      <span
        className={cn(
          "absolute right-0 top-0 rounded-bl-[3px]",
          size === "md" ? "size-2.5" : "size-2",
          kind === "pdf" ? "bg-white/30" : "bg-v2-primary/20",
        )}
      />
      <span className={cn("font-bold leading-none", size === "md" ? "text-[8.5px]" : "text-[7px]")}>{label}</span>
    </span>
  );
}

export { FileIcon };
