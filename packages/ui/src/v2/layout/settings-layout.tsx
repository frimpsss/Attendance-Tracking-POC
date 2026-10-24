import * as React from "react";

import { cn } from "@attendance/utils";
import { focusRing } from "../shared/styles";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsLayoutProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  nav: SettingsNavItem[];
  active: string;
  onChange: (id: string) => void;
  fill?: boolean;
  className?: string;
  children: React.ReactNode;
}

function SettingsLayout({ title, description, nav, active, onChange, fill = false, className, children }: SettingsLayoutProps) {
  return (
    <div className={cn("font-v2", fill && "flex h-full min-h-0 flex-col", className)}>
      <div className={cn("mb-8", fill && "mb-0 shrink-0 px-4 pb-6 pt-6 sm:px-8 sm:pt-8")}>
        <h1 className="text-v2-4xl font-semibold leading-[32px] text-v2-ink">{title}</h1>
        {description && <p className="mt-1 text-v2-base text-v2-ink-secondary">{description}</p>}
      </div>
      <div className={cn("flex flex-col gap-8 lg:flex-row lg:gap-12", fill && "min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-8")}>
        <nav aria-label="Settings" className={cn("shrink-0 lg:sticky lg:w-56 lg:self-start", fill ? "lg:top-0" : "lg:top-24")}>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {nav.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-v2
                  aria-current={item.id === active ? "page" : undefined}
                  onClick={() => onChange(item.id)}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 whitespace-nowrap rounded-v2-sm px-3 text-left text-v2-base transition-colors duration-v2-fast [&_svg]:size-[18px]",
                    item.id === active
                      ? "bg-v2-primary-soft font-semibold text-v2-primary"
                      : "bg-transparent text-v2-ink-secondary hover:bg-v2-surface-hover hover:text-v2-ink",
                    focusRing,
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export interface FormSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section
      className={cn(
        "font-v2 grid grid-cols-1 gap-5 border-b border-v2-line py-8 first:pt-0 last:border-b-0 md:grid-cols-[240px_1fr] md:gap-10",
        className,
      )}
    >
      <div>
        <h2 className="text-v2-md font-semibold leading-[22px] text-v2-ink">{title}</h2>
        {description && <p className="mt-1 text-v2-ui leading-[20px] text-v2-ink-secondary">{description}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}

export { FormSection, SettingsLayout };
