import * as React from "react";

import { cn } from "@attendance/utils";
import { Breadcrumb, type BreadcrumbItem } from "../breadcrumb";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("font-v2 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-2" />}
        <h1 className="text-v2-4xl font-semibold leading-[32px] text-v2-ink">{title}</h1>
        {description && <p className="mt-1 text-v2-base leading-[22px] text-v2-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
