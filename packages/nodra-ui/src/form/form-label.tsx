import * as React from 'react';
import { useFormField } from './form-field';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  const { field } = useFormField();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <label
      data-slot="form-label"
      data-error={hasError}
      className={className}
      {...props}
    >
      {children}
    </label>
  );
}
