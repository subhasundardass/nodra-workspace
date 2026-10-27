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
        icon: "flask",
        isActive: false,
        items: [],
      },
      {
        title: "Valuation",
        url: "/dashboard/tea-valuation",
        icon: "scale",
        isActive: false,
        items: [],
      },

      {
        title: "Distribution",
        url: "/dashboard/sales-orders",
        icon: "product",
        isActive: false,
        items: [
          {
            title: "Sales Orders",
            url: "/dashboard/sales-orders",
          },
          {
            title: "Stock Movements",
            url: "/dashboard/stock-movements",
          },
          {
            title: "Dispatches",
            url: "/dashboard/dispatches",
          },
          {
            title: "Sales Invoices",
            url: "/dashboard/sales-invoices",
          },
          {
            title: "Payment Receipts",
            url: "/dashboard/payment-receipts",
          },
          {
            title: "Sales Returns",
            url: "/dashboard/sales-returns",
          },
        ],
      },

      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: "kanban",
        isActive: false,
        items: [
          {
            title: "Lot Registration",
            url: "/dashboard/reports/lots",
          },
          {
            title: "Tea Testing",
            url: "/dashboard/reports/tea-testing",
          },
          {
            title: "Tea Valuation",
            url: "/dashboard/reports/tea-valuation",
          },
          {
            title: "Warehouse Stock",
            url: "/dashboard/reports/warehouse-stock",
          },
          {
            title: "Stock Movements",
            url: "/dashboard/reports/stock-movements",
          },
          {
            title: "Sales Orders",
            url: "/dashboard/reports/sales-orders",
          },
          {
            title: "Dispatches",
            url: "/dashboard/reports/dispatches",
          },
          {
            title: "Sales Invoices",
            url: "/dashboard/reports/sales-invoices",
          },
          {
            title: "Payment Receipts",
            url: "/dashboard/reports/payment-receipts",
          },
          {
            title: "Sales Returns",
            url: "/dashboard/reports/sales-returns",
          },
        ],
      },

      {
        title: "Masters",
        url: "#",
        icon: "palette",
        isActive: false,
        items: [
          {
            title: "Party",
            url: "/dashboard/party",
            icon: "product",
          },
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
        title: "Users",
        url: "/dashboard/user",
        icon: "user",
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
