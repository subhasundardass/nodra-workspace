import DocTypeListTemplate from "@/components/doctype/templates/doctype-list-template";
import { createColumns, TableColumns } from "@/features/master/user/columns";
import { useDataTable } from "@/hooks/use-data-table";
import { callMethod } from "@/lib/call-method";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

type DocumentRecord = Record<string, unknown>;

type UserData = {
  doctype: DocTypeDefinition;
  documents: DocumentRecord[];
};

export const Route = createFileRoute("/dashboard/user/")({
  loader: async (): Promise<UserData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "User",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "User",
        fields: [
          "name",
          "full_name",
          "email",
          "enabled",
          "last_login",
          "last_ip",
          "user_type",
        ],
      }),
    ]);

    return {
      doctype: doctypeResult.doctype,
      documents: listResult.documents,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, documents } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const users = documents as unknown as TableColumns[];
  const { table } = useDataTable({
    data: users,
    columns: createColumns((user) =>
      navigate({
        to: "/dashboard/user/$name",
        params: { name: user.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={users}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/user/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/user/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
    ></DocTypeListTemplate>
  );
}
