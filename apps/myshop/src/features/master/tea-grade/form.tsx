import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface TeaGradeFormValues {
  title: string;
  grade_code: string;
  description?: string;
  is_active: boolean;
}

interface GradeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeaGradeFormValues) => Promise<void> | void;
}

export default function GradeFormSheet({
  open,
  onOpenChange,
  onSubmit,
}: GradeFormSheetProps) {
  const [title, setTitle] = React.useState("");
  const [gradeCode, setGradeCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setGradeCode("");
      setDescription("");
      setIsActive(true);
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedGradeCode = gradeCode.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Grade title is required.");
      return;
    }

    if (!trimmedGradeCode) {
      setError("Grade code is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({
        title: trimmedTitle,
        grade_code: trimmedGradeCode,
        description: trimmedDescription || undefined,
        is_active: isActive,
      });

      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create tea grade.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Tea Grade</SheetTitle>
          <SheetDescription>
            Add a grade for tea testing and valuation.
          </SheetDescription>
        </SheetHeader>

        <form
          id="grade-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6"
        >
          <div className="space-y-2">
            <Label htmlFor="grade-title">
              Grade Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grade-title"
              name="title"
              placeholder="e.g. Broken Orange Pekoe"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
              maxLength={140}
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade-code">
              Grade Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grade-code"
              name="grade_code"
              placeholder="e.g. BOP, OF, Dust"
              value={gradeCode}
              onChange={(event) => {
                setGradeCode(event.target.value);
                setError("");
              }}
              maxLength={50}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade-description">Description</Label>
            <Textarea
              id="grade-description"
              name="description"
              placeholder="Optional details about this tea grade"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="grade-is-active"
              name="is_active"
              type="checkbox"
              className="size-4 accent-primary"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="grade-is-active">Active</Label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <SheetFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="grade-form"
            disabled={isSubmitting || !title.trim() || !gradeCode.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Grade
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
