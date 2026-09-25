import * as React from 'react';
import { useFormField } from './form-field';

export interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function FormDescription({
  className,
  children,
  ...props
}: FormDescriptionProps) {
  const { field } = useFormField();

  return (
    <p
      id={`${field.name}-description`}
      data-slot="form-description"
      className={className}
      {...props}
    >
      {children}
    </p>
  );
}
