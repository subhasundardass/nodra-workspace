import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { hasPermission } from "../permissions/permission";
import { PermissionError, ValidationError } from "../core/errors";

type LinkDocument = {
  name: string;
  get(fieldname: string): unknown;
};

export interface LinkMethodApp {
  registry: {
    get(name: string): DocTypeDefinition;
  };
  orm: {
    getList(
      doctype: string,
      options?: {
        orFilters?: Array<[string, "like", unknown]>;
        orderBy?: string;
        limit?: number;
      },
    ): Promise<LinkDocument[]>;
    getDoc(doctype: string, name: string): Promise<LinkDocument>;
  };
}

export function registerLinkMethods(
  registry: MethodRegistry,
  getApp: () => Promise<LinkMethodApp>,
): void {
  registry.register(
    "links.search",
    async (ctx) => {
      const doctype = String(ctx.args.doctype ?? "").trim();
      const query = String(ctx.args.query ?? "").trim();
      const selectedName = String(ctx.args.selectedName ?? "").trim();

      if (!doctype) {
        throw new ValidationError('"doctype" is required');
      }

      const app = await getApp();
      const meta = app.registry.get(doctype);

      if (!ctx.user || !hasPermission(meta, "read", ctx.user)) {
        throw new PermissionError(
          doctype,
          "read",
          `You do not have permission to read ${doctype}`,
        );
      }

      const requestedLimit = Number(ctx.args.limit ?? 20);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(50, Math.trunc(requestedLimit)))
        : 20;

      const titleField = String(
        ctx.args.titleField ?? meta.title_field ?? "name",
      );

      const validFields = new Set([
        "name",
        ...meta.fields.map((field) => field.fieldname),
      ]);

      if (!validFields.has(titleField)) {
        throw new ValidationError(
          `Invalid title field "${titleField}" for ${doctype}`,
        );
      }

      const searchFields = (
        meta.search_fields?.length ? meta.search_fields : [titleField, "name"]
      ).filter(
        (field, index, fields) =>
          validFields.has(field) && fields.indexOf(field) === index,
      );

      let docs: LinkDocument[] = [];

      if (selectedName) {
        try {
          docs = [await app.orm.getDoc(doctype, selectedName)];
        } catch {
          // Missing or inaccessible selected documents return no result.
          docs = [];
        }
      } else {
        docs = await app.orm.getList(doctype, {
          ...(query
            ? {
                orFilters: searchFields.map(
                  (field) =>
                    [field, "like", `%${query}%`] as [string, "like", unknown],
                ),
              }
            : {}),
          orderBy: titleField === "name" ? "name asc" : `${titleField} asc`,
          limit,
        });
      }

      return {
        items: docs.map((doc) => ({
          name: doc.name,
          label: String(doc.get(titleField) ?? doc.name),
        })),
      };
    },
    { requireAuth: true },
  );
}
