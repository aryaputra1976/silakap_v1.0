import type { MenuConfig, MenuItem } from '@/config/types';
import { canAccessModule, type AppPermission } from './policies';
import { getPrimaryRole, normalizeAppRole, type AppRole } from './roles';
import { OPD_MENU_SIDEBAR, shouldUseOpdMenu } from './opd-menu';

export function canAccessMenu(
  role: AppRole | string | null | undefined,
  menuItem: MenuItem,
): boolean {
  if (menuItem.heading || menuItem.separator) {
    return true;
  }

  const appRole = normalizeAppRole(role);

  if (
    menuItem.allowedRoles?.length &&
    !menuItem.allowedRoles.includes(appRole)
  ) {
    return false;
  }

  if (menuItem.moduleKey) {
    return canAccessModule(
      appRole,
      menuItem.moduleKey,
      (menuItem.requiredPermission as AppPermission | undefined) ?? 'read',
    );
  }

  return true;
}

export function getAccessibleMenuConfig(
  menu: MenuConfig,
  roles: readonly string[] | null | undefined,
): MenuConfig {
  const primaryRole = getPrimaryRole(roles);

  if (shouldUseOpdMenu(primaryRole)) {
    return removeEmptyHeadings(filterMenuForRole(OPD_MENU_SIDEBAR, primaryRole));
  }

  return removeEmptyHeadings(filterMenuForRole(menu, primaryRole));
}

function filterMenuForRole(menu: MenuConfig, role: AppRole): MenuConfig {
  return menu
    .map((item) => {
      const children = item.children
        ? filterMenuForRole(item.children, role)
        : undefined;
      const nextItem = children ? { ...item, children } : item;

      if (!canAccessMenu(role, nextItem)) {
        return null;
      }

      if (item.children && (!children || children.length === 0)) {
        return null;
      }

      return nextItem;
    })
    .filter(Boolean) as MenuConfig;
}

function removeEmptyHeadings(menu: MenuConfig): MenuConfig {
  return menu.filter((item, index) => {
    if (!item.heading) {
      return true;
    }

    const nextHeadingIndex = menu.findIndex(
      (nextItem, nextIndex) => nextIndex > index && Boolean(nextItem.heading),
    );
    const segment =
      nextHeadingIndex === -1
        ? menu.slice(index + 1)
        : menu.slice(index + 1, nextHeadingIndex);

    return segment.length > 0;
  });
}
