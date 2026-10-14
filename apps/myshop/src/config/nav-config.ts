import { NavGroup } from "@/types";

/**
 * Navigation configuration
 *
 * Used for sidebar navigation and Cmd+K bar.
 * Application contains Tea Factory Workflow modules.
 * Framework contains Nodra development tools.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Application",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/overview",
        icon: "dashboard",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },
      {
        title: "Production",
        url: "/dashboard/production",
        icon: "product",
        isActive: false,
        items: [],
      },
      {
        title: "Tea Testing",
        url: "/dashboard/tea-testing",
        icon: "forms",
        isActive: false,
        items: [],
      },
      {
        title: "Valuation",
        url: "/dashboard/valuation",
        icon: "kanban",
        isActive: false,
        items: [],
      },
      {
        title: "Warehouse",
        url: "/dashboard/warehouse",
        icon: "product",
        isActive: false,
        items: [],
      },
      {
        title: "Sales",
        url: "/dashboard/sales",
        icon: "product",
        isActive: false,
        items: [],
      },
      {
        title: "Invoicing",
        url: "/dashboard/invoicing",
        icon: "forms",
        isActive: false,
        items: [],
      },
      {
        title: "Masters",
        url: "#",
        icon: "palette",
        isActive: false,
        items: [
          {
            title: "Tea Grades",
            url: "/dashboard/masters/tea-grades",
            icon: "product",
          },
          {
            title: "Buyers",
            url: "/dashboard/masters/buyers",
            icon: "teams",
          },
          {
            title: "Brokers",
            url: "/dashboard/masters/brokers",
            icon: "teams",
          },
          {
            title: "Warehouses",
            url: "/dashboard/masters/warehouses",
            icon: "product",
          },
          {
            title: "Bag Types",
            url: "/dashboard/masters/bag-types",
            icon: "product",
          },
        ],
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: "kanban",
        isActive: false,
        items: [],
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: "palette",
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: "Framework",
    items: [
      {
        title: "DocTypes",
        url: "/dashboard/nodra/doctypes",
        icon: "forms",
        isActive: false,
        items: [],
      },
      {
        title: "Methods",
        url: "/dashboard/nodra/methods",
        icon: "kanban",
        isActive: false,
        items: [],
      },
    ],
  },
];
