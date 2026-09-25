import * as React from 'react';
import { useNodraFormField } from './form-field';

export interface NodraFormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function NodraFormMessage({
  className,
  children,
  ...props
}: NodraFormMessageProps) {
  const { field } = useNodraFormField();
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

export const FormMessage = NodraFormMessage;
