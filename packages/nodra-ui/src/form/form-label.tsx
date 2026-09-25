import * as React from 'react';
import { useNodraFormField } from './form-field';

export interface NodraFormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function NodraFormLabel({ className, children, ...props }: NodraFormLabelProps) {
  const { field } = useNodraFormField();
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

export const FormLabel = NodraFormLabel;
