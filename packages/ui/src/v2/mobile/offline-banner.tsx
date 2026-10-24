import * as React from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@attendance/utils";

export function OfflineBanner({ className }: { className?: string }) {
  const [online, setOnline] = React.useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "font-v2 flex items-center gap-2.5 border-b border-v2-line bg-amber-500/15 px-4 py-2.5 text-v2-sm font-medium text-amber-900",
        className,
      )}
    >
      <WifiOff className="size-4 shrink-0 text-amber-700" />
      <span>
        Offline mode — You can browse loaded screens, but attendance check-in and mutations require an internet connection.
      </span>
    </div>
  );
}
