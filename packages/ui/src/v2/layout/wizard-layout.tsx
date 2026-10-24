import * as React from "react";
import { Check, X } from "lucide-react";

import { cn } from "@attendance/utils";
import { Button } from "../button";

export interface WizardStep {
  id: string;
  label: string;
}

export interface WizardLayoutProps {
  title: React.ReactNode;
  steps: WizardStep[];
  current: number;
  onStepChange?: (index: number) => void;
  onClose?: () => void;
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  footerMeta?: React.ReactNode;
  children: React.ReactNode;
}

function WizardLayout({
  title,
  steps,
  current,
  onStepChange,
  onClose,
  onBack,
  backLabel = "Back",
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  footerMeta,
  children,
}: WizardLayoutProps) {
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div data-v2 className="font-v2 flex h-full flex-col bg-v2-canvas text-v2-ink">
      <header className="z-v2-sticky shrink-0 bg-v2-canvas">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-v2-md font-semibold leading-[22px]">{title}</p>
          {onClose && (
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
              <X />
            </Button>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
          aria-label={`Step ${current + 1} of ${steps.length}`}
          className="h-0.5 bg-v2-line"
        >
          <div className="h-full bg-v2-primary transition-[width] duration-v2-slow ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl gap-16 px-4 py-8 sm:px-8 sm:py-10">
          <nav aria-label="Steps" className="sticky top-0 hidden w-60 shrink-0 self-start lg:block">
            <ol className="flex flex-col">
              {steps.map((step, index) => {
                const done = index < current;
                const active = index === current;
                const clickable = done && onStepChange;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      disabled={!clickable}
                      aria-current={active ? "step" : undefined}
                      onClick={() => clickable && onStepChange(index)}
                      className={cn(
                        "relative flex w-full items-center gap-2 bg-transparent py-2 pl-5 text-left text-v2-base leading-[20px] transition-colors duration-v2-fast disabled:cursor-default",
                        "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-v2-line",
                        active && "font-semibold text-v2-ink before:bg-v2-primary",
                        done && "text-v2-ink-tertiary hover:text-v2-ink",
                        !active && !done && "text-v2-ink-disabled",
                      )}
                    >
                      {step.label}
                      {done && <Check className="size-4 text-v2-primary" strokeWidth={2.5} />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <main className="min-w-0 max-w-3xl flex-1">
            <p className="mb-2 text-v2-sm font-medium text-v2-ink-tertiary lg:hidden">
              Step {current + 1} of {steps.length} · {steps[current]?.label}
            </p>
            {children}
          </main>
        </div>
      </div>

      {(onBack || onNext) && (
        <footer className="shrink-0 border-t border-v2-line bg-v2-canvas">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {onBack && (
              <Button variant="secondary" onClick={onBack}>
                {backLabel}
              </Button>
            )}
            <span className="ml-auto flex items-center gap-3">
              {footerMeta}
              {onNext && (
                <Button onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
                  {nextLabel}
                </Button>
              )}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export { WizardLayout };
