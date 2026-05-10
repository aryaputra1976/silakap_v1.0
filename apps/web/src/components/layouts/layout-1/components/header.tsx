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
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link to="/dashboard" className="shrink-0 text-base font-semibold text-mono">
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
          <nav className="flex items-center gap-5 text-sm font-medium text-secondary-foreground">
            <Link to="/dashboard" className="hover:text-primary">Workspace</Link>
            <Link to="/siap/tasks" className="hover:text-primary">SIAP</Link>
            <Link to="/sidata/asn" className="hover:text-primary">SIDATA</Link>
            <Link to="/sipensiun" className="hover:text-primary">SIPENSIUN</Link>
            <Link to="/dashboard" className="hover:text-primary">Analytics</Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <NotificationBell />

          {user ? (
            <div className="hidden min-w-0 text-right text-sm md:block">
              <div className="font-semibold text-mono">{user.name}</div>
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
