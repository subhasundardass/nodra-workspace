import * as React from 'react';
import { useFormField } from './form-field';

export interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormMessage({
  className,
  children,
  ...props
}: FormMessageProps) {
  const { field } = useFormField();
  const errors = field.state.meta.errors;
  const body = errors.length > 0 ? errors[0] : children;

  if (!body) {
    return null;
  }

  return (
    <p
      id={`${field.name}-error`}
      data-slot="form-message"
      data-error={errors.length > 0}
      className={className}
      {...props}
    >
      {body}
    </p>
  );
}
