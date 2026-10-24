import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "@attendance/utils";
import { overlay } from "../shared/styles";
import { SidebarAction } from "./sidebar-action";

export interface CommandMenuItem {
  label: string;
  group?: string;
  icon?: React.ReactNode;
  href?: string;
  keywords?: string[];
  shortcut?: string;
  onSelect?: () => void;
}

export interface CommandMenuProps {
  items: CommandMenuItem[];
  groupIcons?: Record<string, React.ReactNode>;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "sidebar" | "pill";
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);
const hotkeyLabel = isMac ? "⌘K" : "Ctrl K";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-v2-xs border border-v2-line-strong bg-v2-canvas px-1 font-mono text-v2-2xs font-medium text-v2-ink-tertiary">
      {children}
    </kbd>
  );
}

function matches(item: CommandMenuItem, query: string) {
  const haystack = [item.label, item.group, ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

function CommandMenu({
  items,
  groupIcons,
  placeholder = "Search pages and actions",
  open: openProp,
  onOpenChange,
  variant = "sidebar",
}: CommandMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange],
  );
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = React.useMemo(
    () =>
      query.trim()
        ? items.filter((item) => matches(item, query.trim()))
        : items,
    [items, query],
  );
  const groups = React.useMemo(() => {
    const map = new Map<string, { item: CommandMenuItem; index: number }[]>();
    results.forEach((item, index) => {
      const key = item.group ?? "";
      map.set(key, [...(map.get(key) ?? []), { item, index }]);
    });
    return [...map.entries()];
  }, [results]);

  React.useEffect(() => setCursor(0), [query]);
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const run = (item: CommandMenuItem) => {
    setOpen(false);
    item.onSelect?.();
    if (item.href) window.location.assign(item.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setCursor((value) => (value + step + results.length) % results.length);
    } else if (event.key === "Enter" && results[cursor]) {
      event.preventDefault();
      run(results[cursor]);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        {variant === "pill" ? (
          <button
            type="button"
            data-v2
            aria-label="Search"
            aria-keyshortcuts="Meta+K Control+K"
            className="flex h-8 items-center gap-2 rounded-full bg-transparent pl-3 pr-1.5 text-v2-ui text-v2-ink-tertiary transition-colors duration-v2-fast hover:bg-v2-surface-hover hover:text-v2-ink sm:w-60"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden flex-1 text-left sm:block">Search</span>
            <span className="hidden sm:inline-flex">
              <Kbd>{hotkeyLabel}</Kbd>
            </span>
          </button>
        ) : (
          <SidebarAction
            icon={<Search />}
            label="Search"
            aria-keyshortcuts="Meta+K Control+K"
            trailing={<Kbd>{hotkeyLabel}</Kbd>}
          />
        )}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="font-v2 fixed left-1/2 top-[12vh] z-v2-overlay flex max-h-[min(560px,76vh)] w-[calc(100vw-2rem)] max-w-[600px] -translate-x-1/2 flex-col overflow-hidden rounded-v2-lg bg-v2-canvas text-v2-ink outline-none duration-v2-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]"
        >
          <DialogPrimitive.Title className="sr-only">
            Search
          </DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-v2-line px-4">
            <Search className="size-[18px] shrink-0 text-v2-ink-tertiary" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder}
              role="combobox"
              aria-expanded
              aria-controls="v2-command-list"
              aria-activedescendant={
                results[cursor] ? `v2-command-${cursor}` : undefined
              }
              className="h-14 min-w-0 flex-1 bg-transparent text-v2-md text-v2-ink outline-none placeholder:text-v2-ink-tertiary"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div
            ref={listRef}
            id="v2-command-list"
            role="listbox"
            className="flex-1 overflow-y-auto p-1.5"
          >
            {results.length === 0 ? (
              <p className="px-3 py-10 text-center text-v2-base text-v2-ink-tertiary">
                No results for “{query}”
              </p>
            ) : (
              groups.map(([group, entries]) => (
                <div key={group} className="py-1">
                  {group && (
                    <p className="flex items-center gap-3 px-2.5 pb-1 pt-2 text-v2-xs font-medium text-v2-ink-tertiary/80">
                      {groupIcons?.[group] && (
                        <span className="flex size-5 items-center justify-center [&_svg]:size-3.5 [&_svg]:shrink-0">
                          {groupIcons[group]}
                        </span>
                      )}
                      {group}
                    </p>
                  )}
                  {entries.map(({ item, index }) => (
                    <div
                      key={`${group}-${item.label}`}
                      id={`v2-command-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={index === cursor}
                      onMouseMove={() => setCursor(index)}
                      onClick={() => run(item)}
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-3 rounded-v2-sm px-2.5 py-2 text-v2-base text-v2-ink transition-colors duration-v2-fast [&_svg]:size-4 [&_svg]:shrink-0",
                        index === cursor && "bg-v2-surface-hover",
                        !item.icon && groupIcons?.[group] && "pl-[42px]",
                      )}
                    >
                      {item.icon && (
                        <span className="flex size-5 items-center justify-center text-v2-ink-tertiary">
                          {item.icon}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                      {index === cursor && (
                        <CornerDownLeft className="text-v2-ink-tertiary" />
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { CommandMenu };
