import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Bell,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Home,
  Landmark,
  Loader2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  NotificationMarkAllResult,
  NotificationRecord,
  NotificationUnreadCount,
  PaginatedResult,
} from '@/lib/api/types';
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
              <div className="text-lg font-semibold text-zinc-950">
                SILAKAP
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                BKPSDM Command Workspace
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 text-xs font-semibold uppercase tracking-normal text-zinc-400">
                  {group.label}
                </div>
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
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Akses halaman mengikuti token dan role backend.
            </p>
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
              <div className="text-sm font-semibold text-zinc-900">
                BKPSDM Kabupaten Tolitoli
              </div>
              <div className="text-xs text-muted-foreground">
                Layanan ASN, workflow, dan arsip digital
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />

              {user ? (
                <div className="hidden min-w-0 text-right text-sm md:block">
                  <div className="font-semibold text-zinc-900">
                    {user.name}
                  </div>
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
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-700 hover:bg-zinc-100'
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
          isActive
            ? 'bg-zinc-900 text-white shadow-sm'
            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
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

export function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');

  const hasUnread = unread > 0;

  async function loadNotifications(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    setError('');

    try {
      const [list, count] = await Promise.all([
        apiClient.get<PaginatedResult<NotificationRecord>>('/notifications', {
          limit: 8,
        }),
        apiClient.get<NotificationUnreadCount>('/notifications/unread-count'),
      ]);

      setItems(list.items);
      setUnread(count.unread);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat notifikasi',
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadLabel = useMemo(() => {
    if (unread > 99) {
      return '99+';
    }

    return String(unread);
  }, [unread]);

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications(true);
    }
  }

  async function markAsRead(notification: NotificationRecord) {
    setWorkingId(notification.id);
    setError('');

    try {
      if (!notification.readAt) {
        await apiClient.post(`/notifications/${notification.id}/read`);
      }

      await loadNotifications();

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        setOpen(false);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal membuka notifikasi',
      );
    } finally {
      setWorkingId('');
    }
  }

  async function markAllAsRead() {
    setWorkingId('all');
    setError('');

    try {
      await apiClient.post<NotificationMarkAllResult>(
        '/notifications/read-all',
      );
      await loadNotifications();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menandai semua notifikasi',
      );
    } finally {
      setWorkingId('');
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        className="relative inline-flex size-10 items-center justify-center rounded-md border border-border bg-white text-zinc-700 transition-colors hover:bg-zinc-50"
        onClick={() => void toggleOpen()}
        type="button"
        title="Notifikasi"
      >
        <Bell className="size-4" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Notifikasi</p>
              <p className="text-xs text-zinc-500">{unread} belum dibaca</p>
            </div>

            <div className="flex items-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}

              <button
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                disabled={workingId === 'all' || unread === 0}
                onClick={() => void markAllAsRead()}
                type="button"
              >
                <CheckCircle2 className="size-3.5" />
                Read all
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-y-auto">
            {items.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    className="grid w-full gap-1 px-4 py-3 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60"
                    disabled={workingId === notification.id}
                    onClick={() => void markAsRead(notification)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
                        {notification.title}
                      </p>

                      {!notification.readAt ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-red-600" />
                      ) : null}
                    </div>

                    {notification.body ? (
                      <p className="line-clamp-2 text-xs leading-5 text-zinc-500">
                        {notification.body}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        {notification.type}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDateTimeShort(notification.createdAt)}
                      </span>
                    </div>

                    {notification.case ? (
                      <div className="mt-1 rounded-md bg-zinc-50 px-2.5 py-2 text-xs text-zinc-600">
                        {notification.case.caseNumber} -{' '}
                        {notification.case.currentState}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid place-items-center px-4 py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Bell className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">
                  Belum ada notifikasi
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Event workflow akan muncul di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDateTimeShort(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
