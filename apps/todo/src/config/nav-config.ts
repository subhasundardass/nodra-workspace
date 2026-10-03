import { NavGroup } from "@/types";

/**
 * Navigation configuration
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: "dashboard",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },
      {
        title: "Product",
        url: "/dashboard",
        icon: "product",
        shortcut: ["p", "p"],
        isActive: false,
        items: [],
      },
      {
        title: "Users",
        url: "/dashboard",
        icon: "teams",
        shortcut: ["u", "u"],
        isActive: false,
        items: [],
      },
      {
        title: "Kanban",
        url: "/dashboard",
        icon: "kanban",
        shortcut: ["k", "k"],
        isActive: false,
        items: [],
      },
      {
        title: "Chat",
        url: "/dashboard",
        icon: "chat",
        shortcut: ["c", "c"],
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: "Elements",
    items: [
      {
        title: "Forms",
        url: "#",
        icon: "forms",
        isActive: true,
        items: [
          {
            title: "Basic Form",
            url: "/dashboard",
            icon: "forms",
            shortcut: ["f", "f"],
          },
          {
            title: "Multi-Step Form",
            url: "/dashboard",
            icon: "forms",
          },
          {
            title: "Sheet & Dialog",
            url: "/dashboard",
            icon: "forms",
          },
          {
            title: "Advanced Patterns",
            url: "/dashboard/forms/advanced",
            icon: "forms",
          },
        ],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        title: "Account",
        url: "#",
        icon: "account",
        isActive: true,
        items: [
          {
            title: "Notifications",
            url: "/dashboard",
            icon: "notification",
            shortcut: ["n", "n"],
          },
        ],
      },
    ],
  },
];
