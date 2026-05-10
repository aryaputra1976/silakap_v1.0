import { useEffect, useState } from 'react';
import { Archive, BarChart3, ClipboardList, Database, FileSearch, FileText, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { AnalyticsDashboard, AnalyticsGroup } from '@/lib/api/types';
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

const quickLinks = [
  { to: '/sidata/asn', label: 'Cari ASN', description: 'Temukan data ASN dan mulai layanan', icon: Database },
  { to: '/sipensiun', label: 'Buat Usulan Pensiun', description: 'Kelola pilot SIPENSIUN', icon: FileText },
  { to: '/siap/tasks', label: 'Lihat Task SIAP', description: 'Kerjakan task workflow aktif', icon: ClipboardList },
  { to: '/siarsip', label: 'Arsip Dokumen', description: 'Cari dan unduh dokumen case', icon: Archive },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<AnalyticsDashboard>('/analytics/dashboard')
      .then((result) => {
        if (active) {
          setAnalytics(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : 'Gagal memuat analytics dashboard');
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
        description="Control room awal SILAKAP berdasarkan endpoint analytics dan data database nyata."
        meta={<StatusBadge value="ANALYTICS LIVE" tone="success" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat analytics dashboard" />
      ) : analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard icon={Database} label="Total ASN" value={analytics.summary.totalAsn} description="Data master SIDATA" tone="info" />
            <StatCard icon={FileText} label="SIPENSIUN" value={analytics.summary.totalSipensiun} description="Usulan pensiun" tone="warning" />
            <StatCard icon={BarChart3} label="SIAP Case" value={analytics.summary.totalSiapCases} description="Seluruh case workflow" tone="neutral" />
            <StatCard icon={ClipboardList} label="Pending Task" value={analytics.summary.pendingTasks} description="Task belum selesai" tone="warning" />
            <StatCard icon={ShieldCheck} label="Completed Task" value={analytics.summary.completedTasks} description="Task selesai" tone="success" />
            <StatCard icon={Archive} label="Documents" value={analytics.summary.uploadedDocuments} description="Dokumen terunggah" tone="success" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DistributionCard title="Case By State" description="Distribusi case berdasarkan currentState." items={analytics.casesByState} />
            <DistributionCard title="Task By Status" description="Distribusi task SIAP berdasarkan status." items={analytics.tasksByStatus} />
            <DistributionCard title="Case By Service Type" description="Sebaran case per jenis layanan." items={analytics.casesByServiceType} />
            <DistributionCard title="Dokumen By Type" description="Dokumen yang tersimpan di SIARSIP berdasarkan tipe." items={analytics.documentsByType} />
          </div>
        </>
      ) : (
        <EmptyState title="Analytics belum tersedia" />
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

function DistributionCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: AnalyticsGroup[];
}) {
  const max = Math.max(...items.map((item) => item.total), 0);

  return (
    <SectionCard title={title} description={description}>
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const width = max > 0 ? Math.max((item.total / max) * 100, 6) : 0;
            return (
              <div key={item.key} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-zinc-900">{item.label}</span>
                  <StatusBadge value={String(item.total)} tone="neutral" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Belum ada data distribusi" />
      )}
    </SectionCard>
  );
}
