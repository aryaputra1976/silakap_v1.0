import { Fragment, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router';
import { MENU_SIDEBAR } from '@/config/layout-1.config';
import { MenuItem } from '@/config/types';
import { useAuth } from '@/lib/auth/session';
import { getAccessibleMenuConfig } from '@/lib/rbac/menu-access';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const menu = useMemo(
    () => getAccessibleMenuConfig(MENU_SIDEBAR, user?.roles),
    [user?.roles],
  );
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(menu);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        return (
          <Fragment key={`root-${index}`}>
            <span
              className={cn(active ? 'text-mono' : 'text-secondary-foreground')}
              key={`item-${index}`}
            >
              {item.title}
            </span>
            {!last && (
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                key={`separator-${index}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
