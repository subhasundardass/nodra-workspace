import * as React from 'react';

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormItem({ className, ...props }: FormItemProps) {
  return (
    <div data-slot="form-item" className={className} {...props} />
  );
}
