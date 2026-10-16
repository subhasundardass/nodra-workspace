import * as React from "react";
import type { FieldDefinition } from "nodra";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    case "Link":
    case "DynamicLink":
      control = (
        <Input
          {...common}
          value={inputValue}
          placeholder={
            field.fieldtype === "Link"
              ? `Enter ${String(field.options ?? "linked document")} name`
              : field.label
          }
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "Password":
      control = (
        <Input
          {...common}
          type="password"
          value={inputValue}
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "Int":
    case "Float":
    case "Currency":
      control = (
        <Input
          {...common}
          type="number"
          step={
            field.fieldtype === "Int"
              ? 1
              : field.precision !== undefined
                ? 1 / 10 ** field.precision
                : "any"
          }
          value={inputValue}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
        />
      );
      break;

    case "Date":
    case "Datetime":
    case "Time": {
      const type =
        field.fieldtype === "Date"
          ? "date"
          : field.fieldtype === "Datetime"
            ? "datetime-local"
            : "time";

      const dateValue =
        field.fieldtype === "Datetime"
          ? inputValue.slice(0, 16)
          : inputValue.slice(0, 10);

      control = (
        <Input
          {...common}
          type={type}
          value={dateValue}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    }

    case "Check":
      control = (
        <div className="flex h-9 items-center">
          <input
            id={id}
            name={field.fieldname}
            type="checkbox"
            checked={isChecked(currentValue)}
            disabled={readOnly}
            required={Boolean(field.reqd)}
            aria-invalid={Boolean(error)}
            className="size-4 rounded border-input accent-primary"
            onChange={(event) => onChange(event.target.checked)}
          />
        </div>
      );
      break;

    case "Select":
      control = (
        <select
          {...common}
          value={inputValue}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select {field.label}</option>
          {getSelectOptions(field.options).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
      break;

    case "Text":
    case "SmallText":
    case "LongText":
      control = (
        <Textarea
          {...common}
          value={inputValue}
          rows={field.fieldtype === "SmallText" ? 3 : 5}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "Color":
      control = (
        <Input
          {...common}
          type="color"
          value={inputValue || "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "Attach":
    case "AttachImage":
      control = (
        <div className="space-y-2">
          {typeof currentValue === "string" && currentValue && (
            <p className="break-all text-sm text-muted-foreground">
              Current attachment: {currentValue}
            </p>
          )}
          <Input
            id={id}
            name={field.fieldname}
            type="file"
            accept={field.fieldtype === "AttachImage" ? "image/*" : undefined}
            disabled={readOnly}
            required={Boolean(field.reqd) && !currentValue}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
        </div>
      );
      break;

    case "ReadOnly":
      control = (
        <div className="flex min-h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
          {inputValue || "—"}
        </div>
      );
      break;

    case "JSON":
      control = (
        <Textarea
          {...common}
          value={inputValue}
          rows={5}
          className="font-mono text-sm"
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "HTML":
      control = (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          HTML fields are not editable in the basic renderer.
        </div>
      );
      break;

    case "Table":
      control = (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Child table editor for {String(field.options ?? field.label)} is not
          implemented yet.
        </div>
      );
      break;

    default:
      control = (
        <Input
          {...common}
          value={inputValue}
          onChange={(event) => onChange(event.target.value)}
        />
      );
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
