import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { TeaTestingForm } from "@/features/tea-testing/form";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type RouteData = {
  doctype: DocTypeDefinition;
  lot: DocumentRecord;
  document: DocumentRecord | null;
};

export const Route = createFileRoute("/dashboard/tea-testing/$name")({
  loader: async ({ params }): Promise<RouteData> => {
    const [doctypeResult, lotResult, testingResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "TeaTesting",
      }),

      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),

      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "TeaTesting",
        filters: { lot: params.name },
        fields: ["name", "lot"],
        limit: 2,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "TeaTesting" is not registered.');
    }

    const lot = lotResult.document;

    if (!lot) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    if (lot.docstatus !== 51) {
      throw new Error("Only confirmed Lots can be tested.");
    }

    const tests = testingResult.documents ?? [];

    if (tests.length > 1) {
      throw new Error(
        "Multiple testing records exist for this Lot. Please resolve them before continuing.",
      );
    }

    const testName = tests[0]?.name;

    const document =
      typeof testName === "string"
        ? (
            await callMethod<{ document: DocumentRecord }>("document.get", {
              doctype: "TeaTesting",
              name: testName,
            })
          ).document
        : null;

    return {
      doctype: doctypeResult.doctype,
      lot,
      document,
    };
  },

  component: TeaTestingRoute,
});

function TeaTestingRoute() {
  const { doctype, lot, document } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const initialValues: FormValues = document
    ? {
        ...document,
        tested_grade: document.tested_grade ?? document.incoming_grade ?? "",
      }
    : {
        lot: lot.name,
        incoming_grade: lot.grade ?? "",
        tested_grade: lot.grade ?? "",
        sample_date: new Date().toLocaleDateString("en-CA"),
        quality_score: 0,
      };

  async function handleSubmit(values: FormValues) {
    setSaving(true);

    try {
      if (document?.name) {
        await callMethod("document.update", {
          doctype: "TeaTesting",
          name: String(document.name),
          doc: values,
        });

        toast.success("Testing record updated.");
      } else {
        await callMethod("document.create", {
          doctype: "TeaTesting",
          doc: {
            ...values,
            lot: lot.name,
            incoming_grade: lot.grade ?? "",
          },
        });

        toast.success("Testing record created.");
      }

      // Reload so the route resolves the saved testing document.
      await router.invalidate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Tea Testing"
      doctype={doctype}
      mode={document ? "edit" : "create"}
      initialValues={initialValues}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/tea-testing" })}
      // onWorkflowAction={(action) => {
      //   if (action === "Complete Testing") {
      //     // Handle this action here.
      //     console.log("Clicked workflow action:", action);
      //     return true;
      //   }

      //   return false;
      // }}
    >
      {(form) => <TeaTestingForm form={form} lot={lot} />}
    </DocTypeFormTemplate>
  );
}
