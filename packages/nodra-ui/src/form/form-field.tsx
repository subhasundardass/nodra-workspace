import * as React from 'react';
import { FieldApi } from '@tanstack/react-form';
import { createContext, useContext } from 'react';

export interface NodraFormFieldContextValue {
  field: FieldApi<any, any, any, any>;
}

const NodraFormFieldContext = createContext<NodraFormFieldContextValue | null>(null);

export function useNodraFormField() {
  const context = useContext(NodraFormFieldContext);
  if (!context) {
    throw new Error('useNodraFormField must be used within a NodraFormField component.');
  }
  return context;
}

export const useFormField = useNodraFormField;

export interface NodraFormFieldProps {
  field: FieldApi<any, any, any, any>;
  children: React.ReactNode;
}

export function NodraFormField({ field, children }: NodraFormFieldProps) {
  return (
    <NodraFormFieldContext.Provider value={{ field }}>
      <div data-slot="form-field" data-error={field.state.meta.errors.length > 0}>
        {children}
      </div>
    </NodraFormFieldContext.Provider>
  );
}

export const FormField = NodraFormField;
