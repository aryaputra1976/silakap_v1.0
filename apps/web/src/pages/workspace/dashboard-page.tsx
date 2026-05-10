import { useEffect, useState } from 'react';
import { Archive, ClipboardList, Database, FileSearch, FileText, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { AsnRecord, DocumentRecord, PaginatedResult, SiapTask, SipensiunCaseListItem } from '@/lib/api/types';
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  RoleBadge,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';

type DashboardCounts = {
  asn: number;
  sipensiun: number;
  pendingTask: number;
  documents: number;
};

const quickLinks = [
  { to: '/sidata/asn', label: 'Cari ASN', description: 'Temukan data ASN dan mulai layanan', icon: Database },
  { to: '/sipensiun', label: 'Buat Usulan Pensiun', description: 'Kelola pilot SIPENSIUN', icon: FileText },
  { to: '/siap/tasks', label: 'Lihat Task SIAP', description: 'Kerjakan task workflow aktif', icon: ClipboardList },
  { to: '/siarsip', label: 'Arsip Dokumen', description: 'Cari dan unduh dokumen case', icon: Archive },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      apiClient.get<PaginatedResult<AsnRecord>>('/sidata/asn', { page: 1, limit: 1 }),
      apiClient.get<PaginatedResult<SipensiunCaseListItem>>('/sipensiun/cases', { page: 1, limit: 1 }),
      apiClient.get<PaginatedResult<SiapTask>>('/siap/tasks', { status: 'ASSIGNED', page: 1, limit: 1 }),
      apiClient.get<PaginatedResult<DocumentRecord>>('/siarsip/documents', { page: 1, limit: 1 }),
    ])
      .then(([asn, sipensiun, tasks, documents]) => {
        if (active) {
          setCounts({
            asn: asn.total,
            sipensiun: sipensiun.total,
            pendingTask: tasks.total,
            documents: documents.total,
          });
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : 'Gagal memuat dashboard');
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional SILAKAP berdasarkan data backend yang aktif."
        meta={<StatusBadge value="API BACKEND" tone="success" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat ringkasan dashboard" />
      ) : counts ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Database} label="Total ASN" value={counts.asn} description="Data master SIDATA" tone="info" />
          <StatCard icon={FileText} label="Total SIPENSIUN" value={counts.sipensiun} description="Usulan pensiun tercatat" tone="warning" />
          <StatCard icon={ClipboardList} label="Pending Task" value={counts.pendingTask} description="Task ASSIGNED untuk role/user" tone="warning" />
          <StatCard icon={Archive} label="Uploaded Documents" value={counts.documents} description="Dokumen tersimpan di SIARSIP" tone="success" />
        </div>
      ) : (
        <EmptyState title="Dashboard belum tersedia" />
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Profil Sesi" description="User aktif dari token login backend.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <UserRound className="size-5 text-zinc-500" />
              <div className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Current User</div>
              <div className="mt-1 font-semibold text-zinc-950">{user?.name ?? '-'}</div>
              <div className="mt-1 text-sm text-muted-foreground">{user?.username ?? '-'}</div>
            </div>
            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <Database className="size-5 text-zinc-500" />
              <div className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Unit Kerja</div>
              <div className="mt-1 font-semibold text-zinc-950">{user?.unitKerja?.nama ?? '-'}</div>
            </div>
            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Platform Status</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge value="API CONNECTED" tone="success" />
                <StatusBadge value="RBAC ACTIVE" tone="success" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {user?.roles.map((role) => <RoleBadge key={role} role={role} />)}
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions" description="Akses cepat untuk alur kerja harian.">
          <div className="grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-zinc-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-zinc-950">{item.label}</span>
                      <span className="block truncate text-sm text-muted-foreground">{item.description}</span>
                    </span>
                  </span>
                  <FileSearch className="size-4 shrink-0 text-zinc-400" />
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
