import { cn } from "@attendance/utils";

const sizes = { sm: "size-3.5", md: "size-4", lg: "size-6" } as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}

function Spinner({ size = "md", className, label = "Loading" }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin", sizes[size], className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { Spinner };
