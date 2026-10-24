import type { ToastClassnames } from "sonner";

export const toastClassNames: ToastClassnames = {
  toast:
    "font-v2 flex w-[356px] items-center gap-3 !rounded-v2-md !border-0 !bg-v2-field px-4 py-3 text-v2-ui text-v2-ink !shadow-none",
  title: "font-medium leading-[20px]",
  description: "mt-0.5 text-v2-meta leading-[18px] text-v2-ink-secondary",
  icon: "!hidden",
  actionButton:
    "ml-auto shrink-0 [button&]:!rounded-v2-sm bg-v2-primary px-2.5 py-1 text-v2-meta font-medium text-v2-on-primary",
  cancelButton:
    "shrink-0 [button&]:!rounded-v2-sm bg-v2-canvas px-2.5 py-1 text-v2-meta font-medium text-v2-ink",
};
