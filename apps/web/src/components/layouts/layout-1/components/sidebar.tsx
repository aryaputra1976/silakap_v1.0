import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLayout } from './context';
import { SidebarHeader } from './sidebar-header';
import { SidebarMenu } from './sidebar-menu';

export function Sidebar() {
  const { sidebarTheme } = useLayout();
  const { pathname } = useLocation();

  return (
    <div
      className={cn(
        'sidebar no-print bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfa_62%,#eff8f6_100%)] lg:border-e lg:border-[#cfe1da] lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
        (sidebarTheme === 'dark' || pathname.includes('dark-sidebar')) &&
          'dark',
      )}
    >
      <SidebarHeader />
      <div className="overflow-hidden">
        <div className="w-(--sidebar-default-width)">
          <SidebarMenu />
        </div>
      </div>
    </div>
  );
}
