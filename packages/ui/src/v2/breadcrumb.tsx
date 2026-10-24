import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link, useInRouterContext } from "react-router-dom";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const crumbClass = "cursor-pointer text-v2-ink-tertiary transition-colors hover:text-v2-ink";

function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  const routed = useInRouterContext();
  return (
    <nav aria-label="Breadcrumb" className={className} {...props}>
      <ol className="font-v2 flex flex-wrap items-center gap-1 text-v2-sm leading-[20px]">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="font-medium text-v2-ink">
                  {item.label}
                </span>
              ) : routed && item.href ? (
                <Link to={item.href} onClick={item.onClick} className={crumbClass}>
                  {item.label}
                </Link>
              ) : (
                <a href={item.href} onClick={item.onClick} className={crumbClass}>
                  {item.label}
                </a>
              )}
              {!last && <ChevronRight className="size-3.5 text-v2-ink-disabled" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
