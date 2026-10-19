import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { callMethod } from "@/lib/call-method";
import { cn } from "@/lib/utils";

type LinkItem = {
  name: string;
  label: string;
};

type LinkSearchResponse = {
  items: LinkItem[];
};

export interface LinkFieldProps {
  doctype: string;
  value?: string;
  onChange: (value: string) => void;
  titleField?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  filters?: Record<string, unknown>;
  pageSize?: number;
  allowCreate?: boolean;
  className?: string;
}

export function LinkField({
  doctype,
  value,
  onChange,
  titleField,
  label,
  placeholder = "Select a record...",
  description,
  required = false,
  disabled = false,
  readOnly = false,
  clearable = true,
  filters,
  pageSize = 20,
  className,
}: LinkFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LinkItem | null>(null);
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters ?? {});

  // Load the selected record's display label when editing an existing form.
  useEffect(() => {
    let cancelled = false;

    if (!value) {
      setSelected(null);
      return;
    }

    if (selected?.name === value) {
      return;
    }

    callMethod<LinkSearchResponse>("links.search", {
      doctype,
      selectedName: value,
      titleField,
      filters: JSON.parse(filtersKey) as Record<string, unknown>,
      limit: 1,
    })
      .then((result) => {
        if (cancelled) return;

        setSelected(result.items[0] ?? { name: value, label: value });
      })
      .catch(() => {
        if (!cancelled) {
          setSelected({ name: value, label: value });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, doctype, titleField, filtersKey, selected?.name]);

  // Search existing records as the user types.
  useEffect(() => {
    let cancelled = false;

    if (!open || !query.trim()) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      callMethod<LinkSearchResponse>("links.search", {
        doctype,
        query: query.trim(),
        titleField,
        filters: JSON.parse(filtersKey) as Record<string, unknown>,
        limit: pageSize,
      })
        .then((result) => {
          if (!cancelled) {
            setItems(result.items);
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setItems([]);
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to search records",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, doctype, titleField, filtersKey, pageSize]);

  function selectItem(item: LinkItem) {
    setSelected(item);
    onChange(item.name);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    setSelected(null);
    onChange("");
    setQuery("");
  }

  const isDisabled = disabled || readOnly;

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <div className="flex min-w-0 gap-1">
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (!isDisabled) {
              setOpen(nextOpen);
              if (!nextOpen) setQuery("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={isDisabled}
              className="w-full min-w-0 justify-between font-normal"
            >
              <span className="truncate">{selected?.label || placeholder}</span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) p-0"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={`Search ${doctype}...`}
                value={query}
                onValueChange={setQuery}
              />

              <CommandList>
                {loading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}

                {!loading && error && (
                  <div className="px-3 py-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {!loading && !error && query.trim() && items.length === 0 && (
                  <CommandEmpty>No records found.</CommandEmpty>
                )}

                {!loading &&
                  !error &&
                  items.map((item) => (
                    <CommandItem
                      key={item.name}
                      value={item.name}
                      onSelect={() => selectItem(item)}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          value === item.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </CommandItem>
                  ))}

                {!query.trim() && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type to search records.
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {clearable && value && !isDisabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear selection"
            onClick={clearSelection}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
