import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  AdminPermissionRecord,
  AdminRoleRecord,
} from '@/lib/admin/types';
import {
  APP_MODULE_KEYS,
  ROLE_MODULE_POLICIES,
  type AppModuleKey,
  type AppPermission,
} from '@/lib/rbac/policies';
import {
  ACTIVE_APP_ROLES,
  ROLE_LABELS,
  type AppRole,
} from '@/lib/rbac/roles';
import {
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';

const PERMISSION_LABELS: Record<AppPermission, string> = {
  read: 'Baca',
  input: 'Input',
  upload: 'Upload',
  verify: 'Verifikasi',
  review: 'Review',
  approve: 'Setujui',
  monitor: 'Monitor',
  report: 'Laporan',
  admin: 'Admin',
};

const MODULE_LABELS: Record<AppModuleKey, string> = {
  DASHBOARD: 'Dashboard',
  KINERJA_BIDANG: 'Kinerja Bidang',
  SIAP: 'Inti SIAP',
  DMS: 'DMS',
  SIPENSIUN: 'SIPENSIUN',
  LAYANAN_KEPEGAWAIAN: 'Layanan Kepegawaian',
  REKONSILIASI_BPKAD: 'Rekonsiliasi BPKAD',
  SIDATA: 'SIDATA',
  SIANALITIK: 'SIANALITIK',
  SIARSIP: 'SIARSIP',
  WORKING_CALENDAR: 'Kalender Kerja',
  ADMIN: 'Admin Control',
};

export function AdminRbacPage() {
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      apiClient.get<AdminRoleRecord[]>('/admin/roles'),
      apiClient.get<AdminPermissionRecord[]>('/admin/permissions'),
    ])
      .then(([roleResult, permissionResult]) => {
        if (active) {
          setRoles(roleResult);
          setPermissions(permissionResult);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat data RBAC',
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

  const activeRoleCount = roles.filter((role) => role.isActive).length;
  const activePermissionCount = permissions.filter(
    (permission) => permission.isActive,
  ).length;

  const resourceGroups = useMemo(() => {
    const groups = new Map<string, number>();

    for (const permission of permissions) {
      groups.set(permission.resource, (groups.get(permission.resource) ?? 0) + 1);
    }

    return Array.from(groups.entries()).map(([resource, total]) => ({
      resource,
      total,
    }));
  }, [permissions]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="RBAC"
        description="Matrix role, module, dan permission yang dipakai sidebar serta route guard SILAKAP."
        meta={
          <>
            <StatusBadge value="ADMIN ONLY" tone="dark" />
            <StatusBadge value="Route guard aktif" tone="success" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Role Aktif"
          value={activeRoleCount}
          description={`${roles.length} role terdaftar di database`}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Permission Aktif"
          value={activePermissionCount}
          description={`${permissions.length} permission terdaftar`}
          icon={KeyRound}
          tone="info"
        />
        <StatCard
          label="Role Aplikasi"
          value={ACTIVE_APP_ROLES.length}
          description="Dipakai policy frontend"
          icon={Users}
          tone="neutral"
        />
        <StatCard
          label="Module Guarded"
          value={APP_MODULE_KEYS.length}
          description="Termasuk Admin Control"
          icon={LockKeyhole}
          tone="dark"
        />
      </section>

      {loading ? (
        <LoadingState label="Memuat RBAC" />
      ) : (
        <>
          <SectionCard
            title="Matrix Role x Module"
            description="Centang berarti role punya minimal akses baca atau permission modul terkait."
          >
            <div className="grid min-w-0 gap-3">
              {ACTIVE_APP_ROLES.map((role) => (
                <div
                  key={role}
                  className="grid min-w-0 gap-3 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4 xl:grid-cols-[220px_minmax(0,1fr)]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#173c36]">
                      {ROLE_LABELS[role]}
                    </div>
                    <div className="mt-1 break-words text-xs text-[#6d7e68]">
                      {role}
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {APP_MODULE_KEYS.map((moduleKey) => (
                      <ModuleAccessCard
                        key={moduleKey}
                        role={role}
                        moduleKey={moduleKey}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Role Database" description="Role dan assignment aktif">
              <DataTable
                items={roles}
                empty="Belum ada role"
                rowKey={(item) => item.id}
                columns={[
                  {
                    key: 'role',
                    header: 'Role',
                    render: (item) => (
                      <div>
                        <div className="font-semibold text-[#173c36]">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-[#6d7e68]">
                          {item.code}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          value={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                          tone={item.isActive ? 'success' : 'warning'}
                        />
                        {item.isSystem ? (
                          <StatusBadge value="SYSTEM" tone="dark" />
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'counts',
                    header: 'Assignment',
                    render: (item) => (
                      <span>
                        {item.userCount} user / {item.permissionCount} permission
                      </span>
                    ),
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Permission Resource"
              description="Jumlah permission per resource backend"
            >
              {resourceGroups.length > 0 ? (
                <div className="grid gap-2">
                  {resourceGroups.map((item) => (
                    <div
                      key={item.resource}
                      className="flex items-center justify-between rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] px-4 py-3"
                    >
                      <span className="font-semibold text-[#173c36]">
                        {item.resource}
                      </span>
                      <StatusBadge value={`${item.total} permission`} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Permission belum tersedia"
                  description="Jalankan seed RBAC untuk mengisi permission database."
                  icon={KeyRound}
                />
              )}
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}

function ModuleAccessCard({
  role,
  moduleKey,
}: {
  role: AppRole;
  moduleKey: AppModuleKey;
}) {
  const permissions = ROLE_MODULE_POLICIES[role]?.[moduleKey] ?? [];

  if (permissions.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-dashed border-[#d8e5d3] bg-[#f4f8ef] p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase text-[#60735b]">
            {MODULE_LABELS[moduleKey]}
          </span>
          <LockKeyhole className="size-4 shrink-0 text-[#9aa694]" />
        </div>
        <div className="mt-2 text-xs text-[#7b8976]">Tidak ada akses</div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-[#d8e5d3] bg-white p-3 shadow-sm shadow-[#bfd0bb]/30">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase text-[#173c36]">
          {MODULE_LABELS[moduleKey]}
        </span>
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap gap-1">
        {permissions.map((permission) => (
          <span
            key={permission}
            className="max-w-full truncate rounded-md border border-[#d8e5d3] bg-[#f4f8ef] px-1.5 py-0.5 text-[11px] font-semibold text-[#51614c]"
          >
            {PERMISSION_LABELS[permission]}
          </span>
        ))}
      </div>
    </div>
  );
}
