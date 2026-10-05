import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "@/lib/form-context";
import { SubmitButton } from "@/components/form/submit-button";

/**
 * App-wide form hook — TanStack's createFormHook with the field components
 * registered. Fields render inside `form.AppField`:
 *
 * ```tsx
 * const form = useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit });
 *
 * <form.AppField name='email'
 *   children={(field) => <field.TextField label='Email' type='email' />} />
 * ```
 *
 * Every component's markup is the shadcn TanStack Form doc anatomy — for
 * one-off custom fields, drop down to the raw `form.Field` render prop and
 * compose the `Field` primitives directly (see docs/forms.md).
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // TextField,
  },
  formComponents: {
    SubmitButton,
  },
});
