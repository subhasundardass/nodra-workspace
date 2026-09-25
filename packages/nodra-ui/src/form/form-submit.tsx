import * as React from 'react';

export interface FormSubmitProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function FormSubmit({
  className,
  type = 'submit',
  disabled,
  isLoading = false,
  children,
  ...props
}: FormSubmitProps) {
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
