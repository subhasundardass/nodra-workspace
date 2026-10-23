import { format, isValid, parse } from "date-fns";

import { DatePicker } from "@/components/date-picker";
import { cn } from "@/lib/utils";

export interface DateFieldProps {
  id?: string;
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  inputClassName?: string;
}

function parseStoredDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const date = parse(value, "yyyy-MM-dd", new Date());

  if (!isValid(date) || format(date, "yyyy-MM-dd") !== value) {
    return undefined;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
  );
}

export function DateField({
  id,
  name,
  value = "",
  onChange,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  readOnly = false,
  clearable = true,
  minDate,
  maxDate,
  className,
  inputClassName,
}: DateFieldProps) {
  const selectedDate = parseStoredDate(value);

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {label && (
        <label htmlFor={id ?? name} className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <DatePicker
        id={id ?? name}
        name={name}
        value={selectedDate}
        onChange={(date) => {
          onChange(date && isValid(date) ? format(date, "yyyy-MM-dd") : "");
        }}
        format="dd/MM/yyyy"
        placeholder={placeholder ?? "dd/mm/yyyy"}
        disabled={disabled || readOnly}
        minDate={minDate}
        maxDate={maxDate}
        clearable={clearable}
        showIcon
        inputClassName={cn("bg-card shadow-none", inputClassName)}
      />

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default DateField;
