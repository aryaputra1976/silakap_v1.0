import { useEffect, useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/workspace/layout';
import { RoleBadge } from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { user, logout } = useAuth();

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header no-print fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-white/95 backdrop-blur end-0 pe-[var(--removed-body-scroll-bar-size,0px)] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[#0e7c86]',
        headerSticky && 'border-b border-[#cfe1da] shadow-sm shadow-[#9fbfb7]/20',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link to="/dashboard" className="shrink-0 text-base font-semibold text-[#075e66]">
            SILAKAP
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0" />
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {!mobileMode && (
          <nav className="flex items-center gap-5 text-sm font-medium text-[#4c625c]">
            <Link to="/dashboard" className="hover:text-[#0e7c86]">Workspace</Link>
            <Link to="/siap/tasks" className="hover:text-[#0e7c86]">SIAP</Link>
            <Link to="/sidata/asn" className="hover:text-[#0e7c86]">SIDATA</Link>
            <Link to="/sipensiun" className="hover:text-[#0e7c86]">SIPENSIUN</Link>
            <Link to="/dashboard" className="hover:text-[#0e7c86]">Analytics</Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <NotificationBell />

          {user ? (
            <div className="hidden min-w-0 text-right text-sm md:block">
              <div className="font-semibold text-[#18343a]">{user.name}</div>
              <div className="mt-1 flex max-w-96 flex-wrap justify-end gap-1.5">
                {user.roles.slice(0, 2).map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>
          ) : null}

          <Button
            variant="outline"
            mode="icon"
            className="size-9"
            onClick={logout}
            title="Logout"
            type="button"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
