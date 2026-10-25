import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";

import { callMethod } from "@/lib/call-method";
import { TeaValuationForm } from "@/features/tea-valuation/form";

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type RouteData = {
  doctype: DocTypeDefinition;
  lot: DocumentRecord;
  testing: DocumentRecord;
  document: DocumentRecord | null;
};

function today(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const Route = createFileRoute("/dashboard/tea-valuation/$name")({
  loader: async ({ params }): Promise<RouteData> => {
    const [doctypeResult, lotResult, testingResult, valuationResult] =
      await Promise.all([
        callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
          name: "TeaValuation",
        }),

        callMethod<{ document: DocumentRecord }>("document.get", {
          doctype: "Lots",
          name: params.name,
        }),

        callMethod<{ documents: DocumentRecord[] }>("document.list", {
          doctype: "TeaTesting",
          filters: {
            lot: params.name,
            workflow_state: "Completed",
          },
          fields: ["name", "lot", "workflow_state"],
          limit: 2,
          offset: 0,
        }),

        callMethod<{ documents: DocumentRecord[] }>("document.list", {
          doctype: "TeaValuation",
          filters: { lot: params.name },
          fields: ["name", "lot", "workflow_state"],
          limit: 2,
          offset: 0,
        }),
      ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "TeaValuation" is not registered.');
    }

    const lot = lotResult.document;

    if (!lot) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    if (lot.docstatus !== 51) {
      throw new Error("Only confirmed Lots can be valued.");
    }

    const tests = testingResult.documents ?? [];

    if (tests.length === 0) {
      throw new Error(
        "Complete Tea Testing for this Lot before starting valuation.",
      );
    }

    if (tests.length > 1) {
      throw new Error(
        "Multiple completed testing records exist for this Lot. Resolve them before continuing.",
      );
    }

    const testingName = tests[0]?.name;

    if (typeof testingName !== "string" || !testingName) {
      throw new Error("The completed testing record has no document name.");
    }

    const testingResultFull = await callMethod<{
      document: DocumentRecord;
    }>("document.get", {
      doctype: "TeaTesting",
      name: testingName,
    });

    const testing = testingResultFull.document;

    if (!testing) {
      throw new Error("The completed testing record could not be loaded.");
    }

    const valuations = valuationResult.documents ?? [];

    if (valuations.length > 1) {
      throw new Error(
        "Multiple valuation records exist for this Lot. Resolve them before continuing.",
      );
    }

    const valuationName = valuations[0]?.name;

    const document =
      typeof valuationName === "string" && valuationName
        ? (
            await callMethod<{ document: DocumentRecord }>("document.get", {
              doctype: "TeaValuation",
              name: valuationName,
            })
          ).document
        : null;

    return {
      doctype: doctypeResult.doctype,
      lot,
      testing,
      document,
    };
  },

  component: TeaValuationRoute,
});

function TeaValuationRoute() {
  const { doctype, lot, testing, document } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const totalWeight = Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0);

  const initialValues: FormValues = document
    ? {
        ...document,
        reference_rate: Number(document.reference_rate ?? 0),
        final_rate: Number(document.final_rate ?? 0),
        valuation_weight: Number(document.valuation_weight ?? totalWeight),
        estimated_value: Number(document.estimated_value ?? 0),
      }
    : {
        lot: lot.name,
        tea_testing: testing.name,
        valuation_date: today(),
        valuation_basis: "Both",
        reference_rate: 0,
        reference_details: "",
        final_grade: testing.tested_grade ?? lot.grade ?? "",
        final_rate: 0,
        valuation_weight: totalWeight,
        estimated_value: 0,
        remarks: "",
        workflow_state: "Draft",
      };

  async function handleSubmit(values: FormValues) {
    setSaving(true);

    try {
      // Keep linked records and calculated weight tied to the loader data.
      const doc: FormValues = {
        ...values,
        lot: lot.name,
        tea_testing: testing.name,
        reference_rate: Number(values.reference_rate),
        final_rate: Number(values.final_rate),
        valuation_weight: totalWeight,
        estimated_value: totalWeight * Number(values.final_rate),
      };

      if (document?.name) {
        await callMethod("document.update", {
          doctype: "TeaValuation",
          name: String(document.name),
          doc,
        });

        toast.success("Valuation updated.");
      } else {
        await callMethod("document.create", {
          doctype: "TeaValuation",
          doc,
        });

        toast.success("Valuation created.");
      }

      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save valuation.",
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Tea Valuation"
      doctype={doctype}
      mode={document ? "edit" : "create"}
      initialValues={initialValues}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/tea-valuation" })}
    >
      {(form) => <TeaValuationForm form={form} lot={lot} testing={testing} />}
    </DocTypeFormTemplate>
  );
}
