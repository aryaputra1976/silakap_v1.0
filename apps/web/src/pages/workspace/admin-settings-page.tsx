import { useEffect, useState } from 'react';
import {
  Database,
  KeyRound,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { AdminSettingsSummary } from '@/lib/admin/types';
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  Switch,
  SwitchIndicator,
  SwitchWrapper,
} from '@/components/ui/switch';

const runtimeSettings = [
  {
    label: 'JWT Auth',
    description: 'Login menggunakan access token dan endpoint /auth/me.',
    enabled: true,
    icon: LockKeyhole,
  },
  {
    label: 'Route Guard',
    description: 'ProtectedRoute menolak route yang tidak sesuai role.',
    enabled: true,
    icon: ShieldCheck,
  },
  {
    label: 'RBAC Sidebar',
    description: 'Menu difilter dari policy role dan module.',
    enabled: true,
    icon: KeyRound,
  },
  {
    label: 'Soft Delete User',
    description: 'User dengan deletedAt tidak ditampilkan di admin.',
    enabled: true,
    icon: Users,
  },
];

export function AdminSettingsPage() {
  const [summary, setSummary] = useState<AdminSettingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    apiClient
      .get<AdminSettingsSummary>('/admin/settings/summary')
      .then((result) => {
        if (active) {
          setSummary(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat pengaturan',
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan"
        description="Ringkasan konfigurasi runtime, autentikasi, dan data admin SILAKAP."
        meta={
          <>
            <StatusBadge value="ADMIN ONLY" tone="dark" />
            <StatusBadge value="SYSTEM CONFIG" tone="info" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat pengaturan" />
      ) : summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="User"
              value={summary.users.total}
              description={`${summary.users.active} aktif, ${summary.users.inactive} inactive, ${summary.users.suspended} suspended`}
              icon={Users}
              tone="info"
            />
            <StatCard
              label="Role"
              value={summary.roles.total}
              description={`${summary.roles.active} aktif, ${summary.roles.system} system role`}
              icon={ShieldCheck}
              tone="success"
            />
            <StatCard
              label="Permission"
              value={summary.permissions.total}
              description={`${summary.permissions.active} permission aktif`}
              icon={KeyRound}
              tone="neutral"
            />
            <StatCard
              label="Admin API"
              value="ON"
              description="/api/v1/admin terproteksi RBAC"
              icon={Database}
              tone="dark"
            />
          </section>

          <SectionCard
            title="Runtime Control"
            description="Status ini dibaca dari implementasi aktif dan database. Perubahan switch belum dibuka untuk RC ini."
            actions={<StatusBadge value="READ ONLY" tone="warning" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {runtimeSettings.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-w-0 items-start justify-between gap-4 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#d8e5d3] bg-[#eef7ec] text-[#173c36]">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#173c36]">
                          {item.label}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[#6d7e68]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <SwitchWrapper>
                      <Switch checked={item.enabled} disabled size="md" />
                      <SwitchIndicator state="on">On</SwitchIndicator>
                      <SwitchIndicator state="off">Off</SwitchIndicator>
                    </SwitchWrapper>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Admin Scope"
            description="Batas akses yang dipakai halaman Control."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <ScopeItem
                label="RBAC"
                value="SUPER_ADMIN, ADMIN_BKPSDM"
                tone="dark"
              />
              <ScopeItem
                label="Pengguna"
                value="Read-only account list"
                tone="info"
              />
              <ScopeItem
                label="Pengaturan"
                value="Runtime summary"
                tone="success"
              />
            </div>
          </SectionCard>
        </>
      ) : (
        <EmptyState
          title="Pengaturan belum tersedia"
          description="Endpoint admin belum mengembalikan ringkasan sistem."
          icon={Settings}
        />
      )}
    </div>
  );
}

function ScopeItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'dark' | 'info' | 'success';
}) {
  return (
    <div className="rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
      <StatusBadge value={label} tone={tone} />
      <div className="mt-3 text-sm font-semibold text-[#173c36]">{value}</div>
    </div>
  );
}
