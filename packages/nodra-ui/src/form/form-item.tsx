import * as React from 'react';

export interface NodraFormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function NodraFormItem({ className, ...props }: NodraFormItemProps) {
  return <div data-slot="form-item" className={className} {...props} />;
}

export const FormItem = NodraFormItem;
