import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@attendance/utils";
import { focusRing } from "./shared/styles";

export interface AccordionItem {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultValue?: string[];
  className?: string;
}

function Accordion({ items, multiple = false, defaultValue, className }: AccordionProps) {
  const rootProps = multiple
    ? ({ type: "multiple", defaultValue } as const)
    : ({ type: "single", collapsible: true, defaultValue: defaultValue?.[0] } as const);

  return (
    <AccordionPrimitive.Root {...rootProps} className={cn("font-v2", className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className="border-b border-v2-line last:border-b-0"
        >
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              data-v2
              className={cn(
                "flex flex-1 items-center justify-between gap-4 rounded-v2-xs bg-transparent py-3.5 text-left text-v2-base font-medium text-v2-ink disabled:opacity-v2-disabled [&[data-state=open]>svg]:rotate-180",
                focusRing,
              )}
            >
              {item.title}
              <ChevronDown className="size-4 shrink-0 text-v2-ink-tertiary transition-transform duration-v2-base" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-v2-ui leading-[22px] text-v2-ink-secondary data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pb-4">{item.content}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

export { Accordion };
