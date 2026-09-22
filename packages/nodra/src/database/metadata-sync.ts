/**
 * Nodra Metadata Sync
 *
 * Synchronizes DocType definitions into Nodra's metadata tables:
 *
 *   tab_doc_type
 *   tab_doc_field
 *   tab_doc_perm
 */

import type { Pool } from "pg";
import type {
  DocTypeDefinition,
  FieldDefinition,
  PermissionRule,
} from "../core/doctype/schema.js";

export class MetadataSync {
  constructor(private readonly pool: Pool) {}

  /**
   * Sync one DocType definition into metadata tables.
   */
  async sync(doctype: DocTypeDefinition): Promise<void> {
    console.log(` Metadata: syncing DocType ${doctype.name}`);
    await this.syncDocType(doctype);
    console.log(` Metadata: syncing fields for ${doctype.name}`);
    await this.syncFields(doctype);
    console.log(` Metadata: syncing permissions for ${doctype.name}`);
    await this.syncPermissions(doctype);
    console.log(` Metadata: completed ${doctype.name}`);
  }

  /**
   * Sync the parent DocType metadata.
   */
  private async syncDocType(doctype: DocTypeDefinition): Promise<void> {
    await this.pool.query(
      `
			INSERT INTO tab_doc_type (
				name,
				owner,
				creation,
				modified,
				modified_by,
				docstatus,
				idx,
				module,
				naming_rule,
				is_submittable,
				is_child,
				is_single,
				is_tree,
				is_virtual,
				title_field,
				sort_field,
				sort_order
			)
			VALUES (
				$1,
				$2,
				NOW(),
				NOW(),
				$2,
				0,
				0,
				$3,
				$4,
				$5,
				$6,
				$7,
				$8,
				$9,
				$10,
				$11,
				$12
			)
			ON CONFLICT (name)
			DO UPDATE SET
				modified = NOW(),
				modified_by = EXCLUDED.modified_by,
				module = EXCLUDED.module,
				naming_rule = EXCLUDED.naming_rule,
				is_submittable = EXCLUDED.is_submittable,
				is_child = EXCLUDED.is_child,
				is_single = EXCLUDED.is_single,
				is_tree = EXCLUDED.is_tree,
				is_virtual = EXCLUDED.is_virtual,
				title_field = EXCLUDED.title_field,
				sort_field = EXCLUDED.sort_field,
				sort_order = EXCLUDED.sort_order
			`,
      [
        doctype.name,
        "Administrator",
        doctype.module,
        doctype.naming_rule,
        doctype.is_submittable,
        doctype.is_child,
        doctype.is_single,
        doctype.is_tree,
        doctype.is_virtual,
        doctype.title_field ?? null,
        doctype.sort_field ?? null,
        doctype.sort_order ?? null,
      ],
    );
  }

  /**
   * Sync all fields belonging to the DocType.
   */
  private async syncFields(doctype: DocTypeDefinition): Promise<void> {
    for (let idx = 0; idx < doctype.fields.length; idx++) {
      const field = doctype.fields[idx];
      if (!field) {
        continue;
      }
      await this.syncField(doctype, field, idx + 1);
    }
  }

  /**
   * Sync one DocField.
   *
   * Nodra currently stores fields using the parent DocType name.
   */
  private async syncField(
    doctype: DocTypeDefinition,
    field: FieldDefinition,
    idx: number,
  ): Promise<void> {
    await this.pool.query(
      ` INSERT INTO tab_doc_field ( name, owner, creation, modified, modified_by, docstatus, idx, parent, parenttype, parentfield, fieldname, fieldtype, label, options, reqd, "unique", "default", max_length, precision, hidden, read_only, in_list_view, in_standard_filter, search_index, description, depends_on ) VALUES ( $1, $2, NOW(), NOW(), $2, 0, $3, $4, 'DocType', 'fields', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20 ) ON CONFLICT (name) DO UPDATE SET modified = NOW(), modified_by = EXCLUDED.modified_by, idx = EXCLUDED.idx, parent = EXCLUDED.parent, parenttype = EXCLUDED.parenttype, parentfield = EXCLUDED.parentfield, fieldname = EXCLUDED.fieldname, fieldtype = EXCLUDED.fieldtype, label = EXCLUDED.label, options = EXCLUDED.options, reqd = EXCLUDED.reqd, "unique" = EXCLUDED."unique", "default" = EXCLUDED."default", max_length = EXCLUDED.max_length, precision = EXCLUDED.precision, hidden = EXCLUDED.hidden, read_only = EXCLUDED.read_only, in_list_view = EXCLUDED.in_list_view, in_standard_filter = EXCLUDED.in_standard_filter, search_index = EXCLUDED.search_index, description = EXCLUDED.description, depends_on = EXCLUDED.depends_on `,
      [
        `${doctype.name}-${field.fieldname}`,
        "Administrator",
        idx,
        doctype.name,
        field.fieldname,
        field.fieldtype,
        field.label,
        this.serializeOptions(field.options),
        field.reqd ?? false,
        field.unique ?? false,
        field.default != null ? String(field.default) : null,
        field.max_length ?? null,
        field.precision ?? null,
        field.hidden ?? false,
        field.read_only ?? false,
        field.in_list_view ?? false,
        field.in_standard_filter ?? false,
        field.search_index ?? false,
        field.description ?? null,
        field.depends_on ?? null,
      ],
    );
  }

  /**
   * Sync DocType permissions.
   */
  private async syncPermissions(doctype: DocTypeDefinition): Promise<void> {
    for (let idx = 0; idx < doctype.permissions.length; idx++) {
      const permission = doctype.permissions[idx];
      if (!permission) {
        continue;
      }
      await this.syncPermission(doctype, permission, idx + 1);
    }
  }

  private async syncPermission(
    doctype: DocTypeDefinition,
    permission: PermissionRule,
    idx: number,
  ): Promise<void> {
    await this.pool.query(
      `
    INSERT INTO tab_doc_perm (
      name,
      owner,
      creation,
      modified,
      modified_by,
      docstatus,
      idx,
      parent,
      parenttype,
      parentfield,
      role,
      "read",
      "write",
      "create",
      "delete",
      "submit",
      "cancel",
      "amend",
      "if_owner"
    )
    VALUES (
      $1,
      $2,
      NOW(),
      NOW(),
      $2,
      0,
      $3,
      $4,
      'DocType',
      'permissions',
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13
    )
    ON CONFLICT (name)
    DO UPDATE SET
      modified = NOW(),
      modified_by = EXCLUDED.modified_by,
      idx = EXCLUDED.idx,
      parent = EXCLUDED.parent,
      parenttype = EXCLUDED.parenttype,
      parentfield = EXCLUDED.parentfield,
      role = EXCLUDED.role,
      "read" = EXCLUDED."read",
      "write" = EXCLUDED."write",
      "create" = EXCLUDED."create",
      "delete" = EXCLUDED."delete",
      "submit" = EXCLUDED."submit",
      "cancel" = EXCLUDED."cancel",
      "amend" = EXCLUDED."amend",
      "if_owner" = EXCLUDED."if_owner"
    `,
      [
        `${doctype.name}-perm-${permission.role}`, // $1
        "Administrator", // $2
        idx, // $3
        doctype.name, // $4
        permission.role, // $5
        permission.read, // $6
        permission.write, // $7
        permission.create, // $8
        permission.delete, // $9
        permission.submit, // $10
        permission.cancel, // $11
        permission.amend, // $12
        permission.if_owner, // $13
      ],
    );
  }

  private serializeOptions(
    options: string | string[] | undefined,
  ): string | null {
    if (options === undefined) {
      return null;
    }

    if (Array.isArray(options)) {
      return options.join("\n");
    }

    return options;
  }
}
