import {
  Archive,
  ClipboardList,
  Database,
  FileText,
  Home,
  Landmark,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth/session';
import { RoleBadge, StatusBadge } from './ui';

type MenuItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const menuGroups: Array<{ label: string; items: MenuItem[] }> = [
  {
    label: 'Utama',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: Home }],
  },
  {
    label: 'Layanan',
    items: [
      { to: '/sidata/asn', label: 'SIDATA ASN', icon: Database },
      { to: '/sipensiun', label: 'SIPENSIUN', icon: FileText },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/siap/tasks', label: 'SIAP Tasks', icon: ClipboardList },
      { to: '/siarsip', label: 'SIARSIP', icon: Archive },
    ],
  },
];

const mobileMenu = menuGroups.flatMap((group) => group.items);

export function WorkspaceLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Landmark className="size-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-950">SILAKAP</div>
              <div className="text-xs font-medium text-muted-foreground">BKPSDM Command Workspace</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 text-xs font-semibold uppercase tracking-normal text-zinc-400">{group.label}</div>
                <div className="mt-2 grid gap-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.to} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-lg border border-border bg-zinc-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <ShieldCheck className="size-4 text-emerald-600" />
              RBAC Active
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Akses halaman mengikuti token dan role backend.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Landmark className="size-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-950">SILAKAP</div>
                <div className="text-xs text-muted-foreground">Workspace</div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="text-sm font-semibold text-zinc-900">BKPSDM Kabupaten Tolitoli</div>
              <div className="text-xs text-muted-foreground">Layanan ASN, workflow, dan arsip digital</div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden min-w-0 text-right text-sm md:block">
                  <div className="font-semibold text-zinc-900">{user.name}</div>
                  <div className="mt-1 flex max-w-96 flex-wrap justify-end gap-1.5">
                    {user.roles.slice(0, 2).map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-white text-zinc-700 transition-colors hover:bg-zinc-50"
                onClick={logout}
                type="button"
                title="Logout"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {mobileMenu.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                      isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                    }`
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ item }: { item: MenuItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group flex min-h-11 items-center justify-between rounded-md px-3 text-sm font-semibold transition-colors ${
          isActive ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon className="size-4" />
            {item.label}
          </span>
          {isActive ? <StatusBadge value="ACTIVE" tone="success" /> : null}
        </>
      )}
    </NavLink>
  );
}
