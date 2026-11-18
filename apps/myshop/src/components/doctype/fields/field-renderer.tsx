import * as React from "react";
import type { FieldDefinition } from "nodra";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LinkField } from "@/components/doctype/fields/link-field";
import { Label } from "@/components/ui/label";

type FieldValue = unknown;

interface DocTypeFieldRendererProps {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
  error?: string;
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function isChecked(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "yes"
  );
}

function getSelectOptions(options: string | string[] | undefined): string[] {
  if (Array.isArray(options)) return options;

  if (typeof options === "string") {
    return options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
}

export function DocTypeFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: DocTypeFieldRendererProps) {
  const id = React.useId();

  if (field.hidden) return null;

  const readOnly = disabled || Boolean(field.read_only);
  const currentValue = value ?? field.default ?? "";
  const inputValue = toInputValue(currentValue);

  const common = {
    id,
    name: field.fieldname,
    disabled: readOnly,
    required: Boolean(field.reqd),
    maxLength: field.max_length,
    "aria-invalid": Boolean(error),
    "aria-describedby": error
      ? `${id}-error`
      : field.description
        ? `${id}-description`
        : undefined,
  };

  let control: React.ReactNode;

  switch (field.fieldtype) {
    case "Data":
    case "DynamicLink":
      control = (
        <Input
          {...common}
          value={inputValue}
          placeholder={field.label}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "Link":
      control = (
        <LinkField
          field={field}
          value={currentValue}
          onChange={onChange}
          disabled={readOnly}
        />
      );
      break;
    // Keep all your other cases unchanged...
  }

  return (
    <div className="grid gap-2">
      {field.fieldtype !== "Check" && (
        <Label htmlFor={id}>
          {field.label}
          {field.reqd && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}

      {control}

      {field.description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {field.description}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
