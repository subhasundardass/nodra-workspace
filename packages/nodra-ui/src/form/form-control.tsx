import * as React from 'react';
import { useFormField } from './form-field';

export interface FormControlProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  children?: React.ReactNode;
}

export function FormControl({
  className,
  type = 'text',
  ...props
}: FormControlProps) {
  const { field } = useFormField();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <input
      data-slot="form-control"
      data-error={hasError}
      type={type}
      value={field.state.value ?? ''}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${field.name}-error` : undefined}
      className={className}
      {...props}
    />
  );
}
