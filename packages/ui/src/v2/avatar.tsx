import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@attendance/utils";

const sizes = {
  xs: "size-6 text-v2-3xs",
  sm: "size-7 text-v2-2xs",
  md: "size-8 text-v2-xs",
  lg: "size-10 text-v2-base",
  xl: "size-12 text-v2-lg",
} as const;

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: keyof typeof sizes;
  src?: string;
  name?: string;
  shape?: "circle" | "square";
}

const initials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = "md", src, name, shape = "circle", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "font-v2 relative inline-flex shrink-0 select-none overflow-hidden",
      shape === "circle" ? "rounded-full" : "rounded-v2-sm",
      sizes[size],
      className,
    )}
    {...props}
  >
    {src && (
      <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />
    )}
    <AvatarPrimitive.Fallback
      delayMs={src ? 400 : 0}
      className="flex size-full items-center justify-center bg-v2-primary-soft font-semibold text-v2-primary"
    >
      {initials(name)}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
));
Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  users: { name: string; src?: string }[];
  max?: number;
  size?: keyof typeof sizes;
}

function AvatarGroup({ users, max = 4, size = "md", className, ...props }: AvatarGroupProps) {
  const overflow = users.length - max;
  return (
    <div className={cn("flex items-center", size === "xs" || size === "sm" ? "-space-x-1" : "-space-x-2", className)} {...props}>
      {users.slice(0, max).map((user, index) => (
        <Avatar
          key={`${user.name}-${index}`}
          name={user.name}
          src={user.src}
          size={size}
          className="ring-2 ring-v2-canvas"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "font-v2 relative inline-flex items-center justify-center rounded-full bg-v2-surface-hover font-medium text-v2-ink-secondary ring-2 ring-v2-canvas",
            sizes[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
