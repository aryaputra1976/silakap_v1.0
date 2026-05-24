import { useEffect, useMemo, useState } from 'react';
import { Search, UserCog, Users } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { AdminUserRecord } from '@/lib/admin/types';
import {
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  RoleBadge,
  SectionCard,
  StatCard,
  StatusBadge,
  inputClass,
} from '@/components/workspace/ui';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    apiClient
      .get<AdminUserRecord[]>('/admin/users')
      .then((result) => {
        if (active) {
          setUsers(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat pengguna',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const statusMatch = status === 'ALL' || user.status === status;
      const queryMatch =
        !normalizedQuery ||
        [user.name, user.username, user.email, user.nip, user.unitKerja?.nama]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return statusMatch && queryMatch;
    });
  }, [query, status, users]);

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const adminUsers = users.filter((user) =>
    user.roles.some((role) =>
      ['SUPER_ADMIN', 'ADMIN_BKPSDM'].includes(role.code),
    ),
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengguna"
        description="Daftar akun, status, role, dan unit kerja yang tersambung ke autentikasi SILAKAP."
        meta={
          <>
            <StatusBadge value="ADMIN ONLY" tone="dark" />
            <StatusBadge value="READ ONLY" tone="info" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total User"
          value={users.length}
          description="Tidak termasuk soft delete"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="User Aktif"
          value={activeUsers}
          description="Status ACTIVE"
          icon={UserCog}
          tone="success"
        />
        <StatCard
          label="Admin"
          value={adminUsers}
          description="SUPER_ADMIN atau ADMIN_BKPSDM"
          icon={UserCog}
          tone="dark"
        />
      </section>

      <SectionCard
        title="Daftar Pengguna"
        description="Gunakan pencarian untuk mengecek akun berdasarkan nama, username, email, NIP, atau unit kerja."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6d7e68]" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Cari pengguna"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {loading ? (
          <LoadingState label="Memuat pengguna" />
        ) : filteredUsers.length > 0 ? (
          <DataTable
            items={filteredUsers}
            empty="Belum ada pengguna"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'identity',
                header: 'Pengguna',
                className: 'w-[260px]',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#18343a]">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-[#6d7e68]">
                      @{item.username}
                    </div>
                    {item.email ? (
                      <div className="mt-1 text-xs text-[#6d7e68]">
                        {item.email}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'unit',
                header: 'Unit Kerja',
                render: (item) => item.unitKerja?.nama ?? '-',
              },
              {
                key: 'roles',
                header: 'Role',
                className: 'w-[260px]',
                render: (item) => (
                  <div className="flex flex-wrap gap-1.5">
                    {item.roles.length > 0 ? (
                      item.roles.map((role) => (
                        <RoleBadge key={role.code} role={role.code} />
                      ))
                    ) : (
                      <StatusBadge value="NO ROLE" tone="warning" />
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={item.status}
                    tone={item.status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                ),
              },
              {
                key: 'lastLogin',
                header: 'Login Terakhir',
                render: (item) => formatDateTime(item.lastLoginAt),
              },
            ]}
          />
        ) : (
          <EmptyState
            title="Pengguna tidak ditemukan"
            description="Coba ubah kata kunci atau filter status."
            icon={Search}
          />
        )}
      </SectionCard>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
