import { format as formatDate, isValid } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  /**
   * Selected date. Only the calendar day matters; time is ignored.
   */
  value?: Date;

  /**
   * Called with a Date set to 12:00 local time, so converting it to UTC
   * (toISOString / JSON.stringify) never shifts the calendar day.
   */
  onChange?: (date: Date | undefined) => void;

  /**
   * Date format used in the input.
   * Default: dd/MM/yyyy
   *
   * Examples:
   * dd/MM/yyyy  -> 09/09/2026
   * dd-MM-yyyy  -> 09-09-2026
   * MM/dd/yyyy  -> 09/09/2026
   * yyyy-MM-dd  -> 2026-09-09
   */
  format?: string;

  placeholder?: string;
  disabled?: boolean;

  minDate?: Date;
  maxDate?: Date;

  /** Input styling. */
  className?: string;
  inputClassName?: string;

  /** Calendar icon styling. */
  iconClassName?: string;

  /** Clear button styling. */
  clearButtonClassName?: string;

  /** Popover styling. */
  popoverClassName?: string;

  /** Calendar styling. */
  calendarClassName?: string;

  /** Error styling. */
  errorClassName?: string;

  /** Show clear button. */
  clearable?: boolean;

  /** Show calendar icon. */
  showIcon?: boolean;

  id?: string;
  name?: string;
};

/**
 * Returns a copy of the date set to 12:00 local time.
 *
 * Local midnight is the cause of the "one day before" bug: in UTC+ zones
 * (e.g. India, UTC+5:30) midnight local is the previous day in UTC. Noon is
 * safely mid-day for every timezone from UTC-11 to UTC+11.
 */
function toNoon(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
  );
}

function startOfDayTime(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function isDateInRange(date: Date, minDate?: Date, maxDate?: Date) {
  const current = startOfDayTime(date);

  if (minDate && current < startOfDayTime(minDate)) return false;
  if (maxDate && current > startOfDayTime(maxDate)) return false;

  return true;
}

function parseDate(value: string, dateFormat: string): Date | undefined {
  /*
   * Manual parsing for the common numeric date formats
   * used by this component.
   */
  const separator = dateFormat.includes("/")
    ? "/"
    : dateFormat.includes("-")
      ? "-"
      : dateFormat.includes(".")
        ? "."
        : null;

  if (!separator) return undefined;

  const parts = value.split(separator);

  if (parts.length !== 3) return undefined;

  const formatParts = dateFormat.split(separator);

  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;

  formatParts.forEach((part, index) => {
    const number = Number(parts[index]);

    if (part === "dd" || part === "d") day = number;
    if (part === "MM" || part === "M") month = number;

    if (part === "yyyy" || part === "yy") {
      year = part === "yy" ? number + 2000 : number;
    }
  });

  if (day === undefined || month === undefined || year === undefined) {
    return undefined;
  }

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return undefined;
  }

  // Built at noon so the result is already timezone-safe.
  const date = new Date(year, month - 1, day, 12, 0, 0);

  // Reject overflow dates such as 31/02/2026.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

export function DatePicker({
  value,
  onChange,

  format = "dd/MM/yyyy",

  placeholder,
  disabled = false,

  minDate,
  maxDate,

  className,
  inputClassName,
  iconClassName,
  clearButtonClassName,
  popoverClassName,
  calendarClassName,
  errorClassName,

  clearable = true,
  showIcon = true,

  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const [inputValue, setInputValue] = useState(
    value && isValid(value) ? formatDate(value, format) : "",
  );

  const [error, setError] = useState(false);

  /*
   * Synchronize with external value changes.
   */
  useEffect(() => {
    setInputValue(value && isValid(value) ? formatDate(value, format) : "");
    setError(false);
  }, [value, format]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;

    setInputValue(text);
    setError(false);

    if (!text) {
      onChange?.(undefined);
      return;
    }

    const date = parseDate(text, format);

    // Don't show an error while the user is still typing.
    if (!date) return;

    if (!isDateInRange(date, minDate, maxDate)) {
      setError(true);
      return;
    }

    onChange?.(toNoon(date));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue("");
      setError(false);
      onChange?.(undefined);
      return;
    }

    if (!isDateInRange(date, minDate, maxDate)) return;

    setInputValue(formatDate(date, format));
    setError(false);

    onChange?.(toNoon(date));

    setOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    setError(false);
    onChange?.(undefined);
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            id={id}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (!disabled) setOpen(true);
            }}
            placeholder={placeholder ?? format.toLowerCase()}
            disabled={disabled}
            autoComplete="off"
            inputMode="numeric"
            aria-invalid={error}
            className={cn(
              "w-full bg-primary-foreground",
              showIcon && "pr-16",
              error && "border-destructive focus-visible:ring-destructive",
              inputClassName,
            )}
          />

          <div className="absolute inset-y-0 right-1 flex items-center">
            {clearable && inputValue && !disabled && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleClear}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  "text-muted-foreground",
                  "hover:bg-accent hover:text-foreground",
                  clearButtonClassName,
                )}
                aria-label="Clear date"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {showIcon && (
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className="mr-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Open calendar"
                >
                  <CalendarIcon className={cn("h-4 w-4", iconClassName)} />
                </button>
              </PopoverTrigger>
            )}
          </div>
        </div>

        <PopoverContent
          align="start"
          className={cn("w-auto p-0", popoverClassName)}
        >
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value}
            onSelect={handleCalendarSelect}
            disabled={(date) => !isDateInRange(date, minDate, maxDate)}
            className={calendarClassName}
          />
        </PopoverContent>
      </Popover>

      {error && (
        <p className={cn("mt-1 text-xs text-destructive", errorClassName)}>
          Invalid date.
        </p>
      )}
    </div>
  );
}
