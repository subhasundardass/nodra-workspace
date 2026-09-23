import { describe, expect, it } from "vitest";

import { DuplicateError, NotFoundError } from "../errors.js";
import type { DocTypeDefinition } from "../doctype/schema.js";
import { DocTypeRegistry } from "../doctype/registry.js";

import { createDefaultView } from "./defaults.js";
import { ViewRegistry } from "./registry.js";
import { ViewResolver } from "./resolver.js";
import { ViewService } from "./service.js";
import type { ViewDefinition } from "./schema.js";
import { validateView } from "./validator.js";

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
      in_list_view: true,
    },
    {
      fieldname: "mobile",
      fieldtype: "Data",
      label: "Mobile",
      in_list_view: true,
    },
    {
      fieldname: "branch",
      fieldtype: "Link",
      label: "Branch",
      options: "Branch",
    },
    {
      fieldname: "status",
      fieldtype: "Select",
      label: "Status",
      hidden: true,
    },
    {
      fieldname: "notes",
      fieldtype: "Text",
      label: "Notes",
    },
  ],

  permissions: [],
};

function createRegistry(): DocTypeRegistry {
  const registry = new DocTypeRegistry();
  registry.register(memberDocType);
  return registry;
}

describe("ViewRegistry", () => {
  it("registers and retrieves a view", () => {
    const registry = new ViewRegistry();

    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      default: true,
      config: {
        fields: ["name", "member_name", "mobile"],
      },
    };

    registry.register(view);

    expect(registry.get("Member", "list", "Member List")).toEqual(view);
  });

  it("rejects duplicate views", () => {
    const registry = new ViewRegistry();

    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    };

    registry.register(view);

    expect(() => registry.register(view)).toThrow(DuplicateError);
    expect(() => registry.register(view)).toThrow(
      'Member "Member List" already exists',
    );
  });

  it("returns all views for a doctype", () => {
    const registry = new ViewRegistry();

    const listView: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    };

    const formView: ViewDefinition = {
      name: "Member Form",
      doctype: "Member",
      type: "form",
      config: {
        fields: ["name", "member_name"],
      },
    };

    registry.register(listView);
    registry.register(formView);

    expect(registry.getAll("Member")).toHaveLength(2);
  });

  it("filters views by type", () => {
    const registry = new ViewRegistry();

    registry.register({
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    });

    registry.register({
      name: "Member Form",
      doctype: "Member",
      type: "form",
      config: {
        fields: ["name"],
      },
    });

    expect(registry.getAll("Member", "list")).toHaveLength(1);
    expect(registry.getAll("Member", "form")).toHaveLength(1);
  });

  it("returns views for all doctypes when doctype is omitted", () => {
    const registry = new ViewRegistry();

    registry.register({
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    });

    registry.register({
      name: "Branch List",
      doctype: "Branch",
      type: "list",
      config: {
        fields: ["name"],
      },
    });

    expect(registry.getAll()).toHaveLength(2);
  });

  it("unregisters a view", () => {
    const registry = new ViewRegistry();

    registry.register({
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    });

    expect(registry.unregister("Member", "list", "Member List")).toBe(true);
    expect(registry.get("Member", "list", "Member List")).toBeUndefined();
  });

  it("returns false when unregistering a missing view", () => {
    const registry = new ViewRegistry();

    expect(registry.unregister("Member", "list", "Missing")).toBe(false);
  });

  it("clears all registered views", () => {
    const registry = new ViewRegistry();

    registry.register({
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    });

    registry.clear();

    expect(registry.getAll()).toHaveLength(0);
  });
});

describe("createDefaultView", () => {
  it("creates a default list view using list fields", () => {
    const view = createDefaultView(memberDocType, "list");

    expect(view).toMatchObject({
      name: "Member List",
      doctype: "Member",
      module: "MFI",
      type: "list",
      default: true,
    });

    expect(view.type).toBe("list");

    if (view.type === "list") {
      expect(view.config.fields).toEqual(["member_name", "mobile"]);
    }
  });

  it("falls back to visible fields when no list fields are configured", () => {
    const doctype: DocTypeDefinition = {
      ...memberDocType,
      fields: memberDocType.fields.map((field) => ({
        ...field,
        in_list_view: false,
      })),
    };

    const view = createDefaultView(doctype, "list");

    expect(view.type).toBe("list");

    if (view.type === "list") {
      expect(view.config.fields).toEqual([
        "name",
        "member_name",
        "mobile",
        "branch",
        "notes",
      ]);
    }
  });

  it("excludes hidden fields from list fallback", () => {
    const doctype: DocTypeDefinition = {
      ...memberDocType,
      fields: [
        {
          fieldname: "name",
          fieldtype: "Data",
          label: "Name",
        },
        {
          fieldname: "visible_field",
          fieldtype: "Data",
          label: "Visible Field",
        },
        {
          fieldname: "hidden_field",
          fieldtype: "Data",
          label: "Hidden Field",
          hidden: true,
        },
      ],
    };

    const view = createDefaultView(doctype, "list");

    expect(view.type).toBe("list");

    if (view.type === "list") {
      expect(view.config.fields).not.toContain("hidden_field");
    }
  });

  it("creates a form view with visible fields", () => {
    const view = createDefaultView(memberDocType, "form");

    expect(view.type).toBe("form");

    if (view.type === "form") {
      expect(view.config.fields).toEqual([
        "name",
        "member_name",
        "mobile",
        "branch",
        "notes",
      ]);
    }
  });

  it("creates a detail view with visible fields", () => {
    const view = createDefaultView(memberDocType, "detail");

    expect(view.type).toBe("detail");

    if (view.type === "detail") {
      expect(view.config.fields).toEqual([
        "name",
        "member_name",
        "mobile",
        "branch",
        "notes",
      ]);
    }
  });

  it("creates a search view from configured search fields", () => {
    const doctype: DocTypeDefinition = {
      ...memberDocType,
      search_fields: ["member_name", "mobile"],
    };

    const view = createDefaultView(doctype, "search");

    expect(view.type).toBe("search");

    if (view.type === "search") {
      expect(view.config.search_fields).toEqual(["member_name", "mobile"]);
    }
  });

  it("derives search fields when none are configured", () => {
    const view = createDefaultView(memberDocType, "search");

    expect(view.type).toBe("search");

    if (view.type === "search") {
      expect(view.config.search_fields).toEqual([
        "name",
        "member_name",
        "mobile",
        "branch",
        "notes",
      ]);
    }
  });

  it("uses configured sort field and order", () => {
    const doctype: DocTypeDefinition = {
      ...memberDocType,
      sort_field: "member_name",
      sort_order: "asc",
    };

    const view = createDefaultView(doctype, "list");

    expect(view.type).toBe("list");

    if (view.type === "list") {
      expect(view.config.sort).toEqual({
        field: "member_name",
        order: "asc",
      });
    }
  });

  it("uses modified desc as the default list sort", () => {
    const view = createDefaultView(memberDocType, "list");

    expect(view.type).toBe("list");

    if (view.type === "list") {
      expect(view.config.sort).toEqual({
        field: "modified",
        order: "desc",
      });
    }
  });

  it("creates a kanban view using title_field", () => {
    const doctype: DocTypeDefinition = {
      ...memberDocType,
      title_field: "member_name",
    };

    const view = createDefaultView(doctype, "kanban");

    expect(view.type).toBe("kanban");

    if (view.type === "kanban") {
      expect(view.config.title_field).toBe("member_name");
    }
  });

  it("defaults kanban title_field to name", () => {
    const view = createDefaultView(memberDocType, "kanban");

    expect(view.type).toBe("kanban");

    if (view.type === "kanban") {
      expect(view.config.title_field).toBe("name");
    }
  });
});

describe("ViewResolver", () => {
  it("resolves a registered default view", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const customView: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      default: true,
      config: {
        fields: ["member_name"],
      },
    };

    viewRegistry.register(customView);

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);
    const resolved = resolver.resolve("Member", "list");

    expect(resolved).toEqual(customView);
  });

  it("resolves the first registered view when no default exists", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const customView: ViewDefinition = {
      name: "Member Compact List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
      },
    };

    viewRegistry.register(customView);

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);

    expect(resolver.resolve("Member", "list")).toEqual(customView);
  });

  it("generates a default view when no custom view exists", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);

    const view = resolver.resolve("Member", "list");

    expect(view.name).toBe("Member List");
    expect(view.type).toBe("list");
    expect(view.default).toBe(true);
  });

  it("resolves a named view", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const customView: ViewDefinition = {
      name: "Member Compact List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name", "member_name"],
      },
    };

    viewRegistry.register(customView);

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);

    expect(
      resolver.resolveNamed("Member", "list", "Member Compact List"),
    ).toEqual(customView);
  });

  it("returns undefined for an unknown named view", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);

    expect(resolver.resolveNamed("Member", "list", "Missing")).toBeUndefined();
  });

  it("throws when resolving an unknown doctype", () => {
    const viewRegistry = new ViewRegistry();
    const doctypeRegistry = createRegistry();

    const resolver = new ViewResolver(viewRegistry, doctypeRegistry);

    expect(() => resolver.resolve("Unknown", "list")).toThrow(NotFoundError);
  });
});

describe("ViewService", () => {
  it("resolves a generic view", () => {
    const service = new ViewService(createRegistry());

    const view = service.getView("Member", "list");

    expect(view.type).toBe("list");
    expect(view.doctype).toBe("Member");
  });

  it("provides list view convenience method", () => {
    const service = new ViewService(createRegistry());

    expect(service.getListView("Member").type).toBe("list");
  });

  it("provides form view convenience method", () => {
    const service = new ViewService(createRegistry());

    expect(service.getFormView("Member").type).toBe("form");
  });

  it("provides detail view convenience method", () => {
    const service = new ViewService(createRegistry());

    expect(service.getDetailView("Member").type).toBe("detail");
  });

  it("provides search view convenience method", () => {
    const service = new ViewService(createRegistry());

    expect(service.getSearchView("Member").type).toBe("search");
  });
});

//--validator
describe("validateView", () => {
  it("accepts a valid list view", () => {
    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name", "member_name", "mobile"],
        sort: {
          field: "member_name",
          order: "asc",
        },
      },
    };

    expect(() => validateView(view, memberDocType)).not.toThrow();
  });

  it("rejects a view for another doctype", () => {
    const view: ViewDefinition = {
      name: "Branch List",
      doctype: "Branch",
      type: "list",
      config: {
        fields: ["name"],
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'View "Branch List" belongs to "Branch", not "Member"',
    );
  });

  it("rejects an unknown list field", () => {
    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name", "unknown_field"],
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });

  it("rejects duplicate list fields", () => {
    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name", "member_name", "name"],
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'duplicate field "name"',
    );
  });

  it("rejects an unknown sort field", () => {
    const view: ViewDefinition = {
      name: "Member List",
      doctype: "Member",
      type: "list",
      config: {
        fields: ["name"],
        sort: {
          field: "unknown_field",
          order: "asc",
        },
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });

  it("accepts a valid form view", () => {
    const view: ViewDefinition = {
      name: "Member Form",
      doctype: "Member",
      type: "form",
      config: {
        fields: ["name", "member_name", "mobile"],
        sections: [
          {
            label: "Basic Information",
            fields: ["member_name", "mobile"],
          },
        ],
      },
    };

    expect(() => validateView(view, memberDocType)).not.toThrow();
  });

  it("rejects an unknown form section field", () => {
    const view: ViewDefinition = {
      name: "Member Form",
      doctype: "Member",
      type: "form",
      config: {
        fields: ["name"],
        sections: [
          {
            label: "Basic Information",
            fields: ["unknown_field"],
          },
        ],
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });

  it("accepts a valid detail view", () => {
    const view: ViewDefinition = {
      name: "Member Detail",
      doctype: "Member",
      type: "detail",
      config: {
        fields: ["name", "member_name", "mobile"],
      },
    };

    expect(() => validateView(view, memberDocType)).not.toThrow();
  });

  it("accepts a valid search view", () => {
    const view: ViewDefinition = {
      name: "Member Search",
      doctype: "Member",
      type: "search",
      config: {
        fields: ["name", "member_name", "mobile"],
        search_fields: ["name", "member_name"],
      },
    };

    expect(() => validateView(view, memberDocType)).not.toThrow();
  });

  it("rejects an unknown search field", () => {
    const view: ViewDefinition = {
      name: "Member Search",
      doctype: "Member",
      type: "search",
      config: {
        fields: ["name", "member_name"],
        search_fields: ["unknown_field"],
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });

  it("accepts a valid kanban view", () => {
    const view: ViewDefinition = {
      name: "Member Kanban",
      doctype: "Member",
      type: "kanban",
      config: {
        title_field: "member_name",
        group_by: "branch",
      },
    };

    expect(() => validateView(view, memberDocType)).not.toThrow();
  });

  it("rejects an unknown kanban title field", () => {
    const view: ViewDefinition = {
      name: "Member Kanban",
      doctype: "Member",
      type: "kanban",
      config: {
        title_field: "unknown_field",
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });

  it("rejects an unknown kanban group field", () => {
    const view: ViewDefinition = {
      name: "Member Kanban",
      doctype: "Member",
      type: "kanban",
      config: {
        title_field: "member_name",
        group_by: "unknown_field",
      },
    };

    expect(() => validateView(view, memberDocType)).toThrow(
      'field "unknown_field" does not exist',
    );
  });
});
