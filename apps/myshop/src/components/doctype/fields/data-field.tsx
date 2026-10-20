import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DataFieldProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
}

export function DataField({
  value = "",
  onChange,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  readOnly = false,
  className,
  inputClassName,
  id,
  name,
}: DataFieldProps) {
  const inputId = id ?? name;

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Input
        id={inputId}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={cn("bg-background shadow-none", inputClassName)}
      />

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default DataField;
