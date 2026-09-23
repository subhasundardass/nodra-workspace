import { describe, expect, it } from "vitest";
import type { DocTypeDefinition } from "../doctype/schema.js";
import { DocTypeRegistry } from "../doctype/registry.js";
import { ValidationError } from "../errors.js";
import { ViewRegistry } from "./registry.js";
import { ViewService } from "./service.js";

const memberDocType: DocTypeDefinition = {
  name: "Member",
  module: "MFI",
  naming_rule: "hash",

  is_submittable: false,
  is_child: false,
  is_single: false,
  is_tree: false,
  is_virtual: false,

  fields: [
    {
      fieldname: "name",
      fieldtype: "Data",
      label: "Name",
    },
    {
      fieldname: "member_name",
      fieldtype: "Data",
      label: "Member Name",
    },
    {
      fieldname: "mobile",
      fieldtype: "Data",
      label: "Mobile",
    },
  ],

  permissions: [],
};

describe("ViewService", () => {
  function createService() {
    const doctypeRegistry = new DocTypeRegistry();
    doctypeRegistry.register(memberDocType);

    const viewRegistry = new ViewRegistry();

    return new ViewService(doctypeRegistry, viewRegistry);
  }

  it("registers a valid custom view", () => {
    const service = createService();

    service.registerView({
      name: "Member Compact List",
      doctype: "Member",
      type: "list",
      default: true,
      config: {
        fields: ["name", "member_name", "mobile"],
      },
    });

    const view = service.getListView("Member");

    expect(view.name).toBe("Member Compact List");
  });

  it("rejects a view containing an unknown field", () => {
    const service = createService();

    expect(() =>
      service.registerView({
        name: "Invalid Member List",
        doctype: "Member",
        type: "list",
        config: {
          fields: ["name", "unknown_field"],
        },
      }),
    ).toThrow(ValidationError);
  });

  it("rejects a view belonging to another DocType", () => {
    const service = createService();

    expect(() =>
      service.registerView({
        name: "Wrong View",
        doctype: "Loan",
        type: "list",
        config: {
          fields: ["name"],
        },
      }),
    ).toThrow();
  });

  it("returns the generated default view when no custom view exists", () => {
    const service = createService();

    const view = service.getListView("Member");

    expect(view.doctype).toBe("Member");
    expect(view.type).toBe("list");
    expect(view.default).toBe(true);
  });

  it("can unregister a custom view", () => {
    const service = createService();

    service.registerView({
      name: "Member Compact List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name", "member_name"],
      },
    });

    expect(
      service.unregisterView("Member", "list", "Member Compact List"),
    ).toBe(true);

    expect(
      service.getNamedView("Member", "list", "Member Compact List"),
    ).toBeUndefined();
  });
});
