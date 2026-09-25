import * as React from 'react';
import { FormApi } from '@tanstack/react-form';

export interface NodraFormProps<TFormData extends Record<string, any>>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: FormApi<TFormData>;
  onSubmit?: (data: TFormData) => void | Promise<void>;
  children: React.ReactNode;
}

export function NodraForm<TFormData extends Record<string, any>>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: NodraFormProps<TFormData>) {
  return (
    <form
      data-slot="form"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      {...props}
    >
      {children}
    </form>
  );
}

export const Form = NodraForm;
