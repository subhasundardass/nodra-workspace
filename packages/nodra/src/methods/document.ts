import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { hasPermission } from "../permissions/permission";
import { PermissionError, ValidationError } from "../core/errors";

export interface DocumentMethodApp {
  registry: {
    get(name: string): DocTypeDefinition;
  };
  orm: {
    getDoc(
      doctype: string,
      name: string,
    ): Promise<{
      getData(): Record<string, unknown>;
    }>;
    getList(
      doctype: string,
      options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
      },
    ): Promise<Array<{ getData(): Record<string, unknown> }>>;
  };
}

function assertReadPermission(
  meta: DocTypeDefinition,
  user: { email: string; roles: string[] } | null,
): void {
  if (!user || !hasPermission(meta, "read", user)) {
    throw new PermissionError(
      meta.name,
      "read",
      `You do not have permission to read ${meta.name}`,
    );
  }
}

export function registerDocumentMethods(
  registry: MethodRegistry,
  getApp: () => Promise<DocumentMethodApp>,
): void {
  registry.register(
    "document.get",
    async (ctx) => {
      const doctype = String(ctx.args.doctype ?? "").trim();
      const name = String(ctx.args.name ?? "").trim();

      if (!doctype || !name) {
        throw new ValidationError('"doctype" and "name" are required');
      }

      const app = await getApp();
      const meta = app.registry.get(doctype);

      assertReadPermission(meta, ctx.user);

      const doc = await app.orm.getDoc(doctype, name);

      return { document: doc.getData() };
    },
    { requireAuth: true },
  );

  registry.register(
    "document.list",
    async (ctx) => {
      const doctype = String(ctx.args.doctype ?? "").trim();

      if (!doctype) {
        throw new ValidationError('"doctype" is required');
      }

      const app = await getApp();
      const meta = app.registry.get(doctype);

      assertReadPermission(meta, ctx.user);

      const requestedLimit = Number(ctx.args.limit ?? 20);
      const requestedOffset = Number(ctx.args.offset ?? 0);

      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(100, Math.trunc(requestedLimit)))
        : 20;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      const orderBy = meta.sort_field
        ? `${meta.sort_field} ${meta.sort_order ?? "asc"}`
        : "modified desc";

      const docs = await app.orm.getList(doctype, {
        limit,
        offset,
        orderBy,
      });

      return {
        documents: docs.map((doc) => doc.getData()),
        limit,
        offset,
      };
    },
    { requireAuth: true },
  );
}
