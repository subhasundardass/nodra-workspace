import { NavGroup } from "@/types";

/**
 * Navigation configuration
 *
 * Application: Tea Trading Management System
 * Framework: Nodra development tools
 *
 * Pending development routes use "#".
 * Icons must match keys available in Icons.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Application",
    items: [
      // Dashboard
      {
        title: "Dashboard",
        url: "/dashboard/overview",
        icon: "dashboard",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },

      // 1. Lot Management
      {
        title: "Lot Management",
        url: "#",
        icon: "product",
        isActive: false,
        items: [
          {
            title: "Lot Registration",
            url: "/dashboard/lot",
            icon: "product",
            isActive: false,
            items: [],
          },
        ],
      },

      // 2. Quality & Valuation
      {
        title: "Quality & Valuation",
        url: "#",
        icon: "flask",
        isActive: false,
        items: [
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
        ],
      },

      // 3. Offers & Sales
      {
        title: "Offers & Sales",
        url: "#",
        icon: "kanban",
        isActive: false,
        items: [
          {
            title: "Offer Sheet",
            url: "/dashboard/offers",
            icon: "post",
            isActive: false,
            items: [],
          },
          {
            title: "Offer Sheet List",
            url: "/dashboard/offers",
            icon: "page",
            isActive: false,
            items: [],
          },
          {
            title: "SaleBook",
            url: "/dashboard/salebook",
            icon: "product",
            isActive: false,
            items: [],
          },
          {
            title: "Pending Sale",
            url: "/dashboard/salebook/pending-sale",
            icon: "clock",
            isActive: false,
            items: [],
          },
        ],
      },

      // 4. Dispatch Management
      {
        title: "Dispatch Management",
        url: "#",
        icon: "product",
        isActive: false,
        items: [
          {
            title: "Pending Dispatch",
            url: "/dashboard/dispatch/pending-dispatch",
            icon: "clock",
            isActive: false,
            items: [],
          },
          {
            title: "Dispatch Entry",
            url: "/dashboard/dispatch",
            icon: "add",
            isActive: false,
            items: [],
          },
          {
            title: "Dispatch Book",
            url: "/dashboard/dispatch",
            icon: "page",
            isActive: false,
            items: [],
          },
        ],
      },

      // 5. Reports
      {
        title: "Reports",
        url: "#",
        icon: "trendingUp",
        isActive: false,
        items: [
          // Lot Reports
          {
            title: "Lot Reports",
            url: "#",
            icon: "product",
            isActive: false,
            items: [
              {
                title: "Lot Registration",
                url: "/dashboard/reports/lots",
                icon: "page",
                isActive: false,
                items: [],
              },
              {
                title: "Lot Arrival Report",
                url: "#",
                icon: "calendar",
                isActive: false,
                items: [],
              },
              {
                title: "Mark / Grade-wise Lots",
                url: "#",
                icon: "forms",
                isActive: false,
                items: [],
              },
            ],
          },

          // Quality & Valuation Reports
          {
            title: "Quality & Valuation Reports",
            url: "#",
            icon: "flask",
            isActive: false,
            items: [
              {
                title: "Tea Testing",
                url: "/dashboard/reports/tea-testing",
                icon: "flask",
                isActive: false,
                items: [],
              },
              {
                title: "Tea Valuation",
                url: "/dashboard/reports/tea-valuation",
                icon: "scale",
                isActive: false,
                items: [],
              },
            ],
          },

          // Offer Reports
          {
            title: "Offer Reports",
            url: "#",
            icon: "post",
            isActive: false,
            items: [
              {
                title: "Offer Register",
                url: "#",
                icon: "page",
                isActive: false,
                items: [],
              },
              {
                title: "Offered Lots",
                url: "#",
                icon: "product",
                isActive: false,
                items: [],
              },
              {
                title: "Unoffered Lots",
                url: "#",
                icon: "product",
                isActive: false,
                items: [],
              },
              {
                title: "Asking Rate Report",
                url: "#",
                icon: "scale",
                isActive: false,
                items: [],
              },
            ],
          },

          // Sales Reports
          {
            title: "Sales Reports",
            url: "#",
            icon: "creditCard",
            isActive: false,
            items: [
              {
                title: "Daily Sales Register",
                url: "#",
                icon: "calendar",
                isActive: false,
                items: [],
              },
              {
                title: "Broker-wise Sales",
                url: "#",
                icon: "user",
                isActive: false,
                items: [],
              },
              {
                title: "Buyer-wise Sales",
                url: "#",
                icon: "user",
                isActive: false,
                items: [],
              },
              {
                title: "Lot-wise Sales History",
                url: "#",
                icon: "product",
                isActive: false,
                items: [],
              },
              {
                title: "Asking Rate vs Sale Rate",
                url: "#",
                icon: "trendingUp",
                isActive: false,
                items: [],
              },
            ],
          },

          // Dispatch Reports
          {
            title: "Dispatch Reports",
            url: "#",
            icon: "product",
            isActive: false,
            items: [
              {
                title: "Dispatch Register",
                url: "/dashboard/reports/dispatches",
                icon: "page",
                isActive: false,
                items: [],
              },
              {
                title: "Pending Dispatch Report",
                url: "#",
                icon: "clock",
                isActive: false,
                items: [],
              },
              {
                title: "Buyer-wise Dispatch",
                url: "#",
                icon: "user",
                isActive: false,
                items: [],
              },
              {
                title: "Transporter-wise Dispatch",
                url: "#",
                icon: "product",
                isActive: false,
                items: [],
              },
            ],
          },

          // Stock Reports
          {
            title: "Stock Reports",
            url: "#",
            icon: "product",
            isActive: false,
            items: [
              {
                title: "Current Stock Position",
                url: "/dashboard/reports/warehouse-stock",
                icon: "product",
                isActive: false,
                items: [],
              },
              {
                title: "Available Stock",
                url: "#",
                icon: "checks",
                isActive: false,
                items: [],
              },
              {
                title: "Lot-wise Stock Ledger",
                url: "#",
                icon: "page",
                isActive: false,
                items: [],
              },
              {
                title: "Sold but Not Dispatched",
                url: "#",
                icon: "clock",
                isActive: false,
                items: [],
              },
              {
                title: "Dispatched Quantity",
                url: "#",
                icon: "trendingUp",
                isActive: false,
                items: [],
              },
              {
                title: "Stock Movements",
                url: "/dashboard/reports/stock-movements",
                icon: "adjustments",
                isActive: false,
                items: [],
              },
            ],
          },

          // Business Reports
          {
            title: "Business Reports",
            url: "#",
            icon: "trendingUp",
            isActive: false,
            items: [
              {
                title: "Monthly Business Summary",
                url: "#",
                icon: "calendar",
                isActive: false,
                items: [],
              },
              {
                title: "Broker Performance",
                url: "#",
                icon: "user",
                isActive: false,
                items: [],
              },
              {
                title: "Buyer Performance",
                url: "#",
                icon: "user",
                isActive: false,
                items: [],
              },
            ],
          },
        ],
      },

      // 6. Masters
      {
        title: "Masters",
        url: "#",
        icon: "palette",
        isActive: false,
        items: [
          {
            title: "Party",
            url: "/dashboard/party",
            icon: "user",
            isActive: false,
            items: [],
          },
          {
            title: "Broker",
            url: "/dashboard/broker",
            icon: "user",
            isActive: false,
            items: [],
          },
          {
            title: "Transporter",
            url: "/dashboard/master/transporter",
            icon: "product",
            isActive: false,
            items: [],
          },
          {
            title: "Factories",
            url: "/dashboard/master/factories",
            icon: "workspace",
            isActive: false,
            items: [],
          },
          {
            title: "Tea Grades",
            url: "/dashboard/master/tea-grades",
            icon: "forms",
            isActive: false,
            items: [],
          },
          {
            title: "Brands",
            url: "/dashboard/master/brands",
            icon: "badgeCheck",
            isActive: false,
            items: [],
          },
          {
            title: "Warehouses",
            url: "/dashboard/master/warehouses",
            icon: "workspace",
            isActive: false,
            items: [],
          },
        ],
      },

      // Users
      {
        title: "Users",
        url: "/dashboard/user",
        icon: "user",
        isActive: false,
        items: [],
      },

      // Settings
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: "settings",
        isActive: false,
        items: [],
      },
    ],
  },

  // Framework
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
