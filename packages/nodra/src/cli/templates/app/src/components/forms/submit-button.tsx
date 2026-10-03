import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "@/components/ui/button";

type SubmitForm = {
  Subscribe: React.ComponentType<{
    selector: (state: {
      canSubmit: boolean;
      isSubmitting: boolean;
    }) => [boolean, boolean];
    children: (value: [boolean, boolean]) => React.ReactNode;
  }>;
};

type SubmitButtonProps = Omit<React.ComponentProps<"button">, "form"> &
  VariantProps<typeof buttonVariants> & {
    form: SubmitForm;
  };

export function SubmitButton({ form, children, ...props }: SubmitButtonProps) {
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button
          {...props}
          type="submit"
          disabled={props.disabled || !canSubmit || isSubmitting}
        >
          {isSubmitting ? "Saving..." : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
