import * as React from 'react';

export interface NodraFormSubmitProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function NodraFormSubmit({
  className,
  type = 'submit',
  disabled,
  isLoading = false,
  children,
  ...props
}: NodraFormSubmitProps) {
  return (
    <button
      type={type}
      data-slot="form-submit"
      data-loading={isLoading}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export const FormSubmit = NodraFormSubmit;
