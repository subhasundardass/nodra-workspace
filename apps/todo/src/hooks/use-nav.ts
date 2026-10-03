import { getRouteApi } from "@tanstack/react-router";
import { canVisitDashboard } from "@/auth/dashboard-access";
import { useMemo } from "react";
import type { NavItem, NavGroup } from "@/types";

/**
 * Hook to filter navigation items
 * Hide destinations outside the current account permissions and scope.
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { currentUser, permissions } =
    getRouteApi("/dashboard").useRouteContext();
  return useMemo(() => {
    const filter = (entries: NavItem[]): NavItem[] =>
      entries.flatMap((item) => {
        if (item.items?.length) {
          const children = filter(item.items);
          return children.length ? [{ ...item, items: children }] : [];
        }
        return item.url &&
          item.url !== "#" &&
          canVisitDashboard(item.url, currentUser, permissions)
          ? [item]
          : [];
      });
    return filter(items);
  }, [items, currentUser, permissions]);
}

/**
 * Hook to filter navigation groups
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some(
            (gi) => gi.title === item.title && filteredSet.has(gi.title),
          ),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
