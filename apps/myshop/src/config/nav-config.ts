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
        title: "Lot Management",
        url: "#",
        icon: "product",
        isActive: false,
        items: [
          {
            title: "Arrival Entry - Factory",
            url: "/dashboard/lot",
            icon: "product",
            isActive: false,
            items: [],
          },
        ],
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
        title: "Distribution",
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
            title: "Factories",
            url: "/dashboard/master/factories",
            icon: "product",
          },
          {
            title: "Tea Grades",
            url: "/dashboard/master/tea-grades",
            icon: "product",
          },
          {
            title: "Warehouses",
            url: "/dashboard/master/warehouses",
            icon: "product",
          },
          {
            title: "Brands",
            url: "/dashboard/master/brands",
            icon: "product",
          },

          {
            title: "Buyers",
            url: "/dashboard/master/buyers",
            icon: "teams",
          },
          {
            title: "Brokers",
            url: "/dashboard/master/brokers",
            icon: "teams",
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
