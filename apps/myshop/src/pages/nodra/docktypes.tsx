type DocType = {
  name: string;
  module?: string;
  is_child?: boolean;
  is_submittable?: boolean;
  fields?: Array<{
    fieldname: string;
    fieldtype: string;
    label: string;
  }>;
};

type Props = {
  doctypes?: DocType[];
};

export default function NodraDocTypes({ doctypes = [] }: Props) {
  return (
    <div className="space-y-3">
      {doctypes.map((doctype) => (
        <div key={doctype.name} className="rounded-lg border p-4">
          <h3 className="font-semibold">{doctype.name}</h3>

          <p className="text-sm text-muted-foreground">
            Module: {doctype.module ?? "—"}
          </p>

          <p className="text-sm">
            Fields: {doctype.fields?.length ?? 0}
            {" · "}
            {doctype.is_child ? "Child DocType" : "Standard DocType"}
            {" · "}
            {doctype.is_submittable ? "Submittable" : "Not submittable"}
          </p>
        </div>
      ))}
    </div>
  );
}
