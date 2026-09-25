import * as React from 'react';
import { useNodraFormField } from './form-field';

export interface NodraFormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function NodraFormDescription({
  className,
  children,
  ...props
}: NodraFormDescriptionProps) {
  const { field } = useNodraFormField();

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

export const FormDescription = NodraFormDescription;
