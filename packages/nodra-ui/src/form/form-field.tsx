import * as React from 'react';
import { FieldApi } from '@tanstack/react-form';
import { createContext, useContext } from 'react';

export interface FormFieldContextValue {
  field: FieldApi<any, any, any, any>;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField component.');
  }
  return context;
}

export interface FormFieldProps {
  field: FieldApi<any, any, any, any>;
  children: React.ReactNode;
}

export function FormField({ field, children }: FormFieldProps) {
  return (
    <FormFieldContext.Provider value={{ field }}>
      <div data-slot="form-field" data-error={field.state.meta.errors.length > 0}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}
