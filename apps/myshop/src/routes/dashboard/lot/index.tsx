import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: DocumentRecord[];
};

export const Route = createFileRoute("/dashboard/lot/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "Lots",
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: Array.isArray(listResult.documents) ? listResult.documents : [],
    };
  },

  component: LotListRoute,
});

function LotListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={records}
      onCreate={() => navigate({ to: "/dashboard/lot/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/lot/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
    />
  );
}
