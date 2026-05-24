import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSearch,
  FileText,
  FolderKanban,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  AnalyticsDashboard,
  AnalyticsGroup,
  AnalyticsRecentTimeline,
  PaginatedResult,
  SiapTask,
} from '@/lib/api/types';
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
import { getPrimaryRole } from '@/lib/rbac/roles';
import { SopChecklistDashboardPanel } from '@/components/workspace/sop/sop-checklist-dashboard-panel';

const quickLinks = [
  {
    to: '/sidata/asn',
    label: 'Cari ASN',
    description: 'Temukan data ASN dan mulai layanan',
    icon: Database,
  },
  {
    to: '/sipensiun',
    label: 'Buat Usulan Pensiun',
    description: 'Kelola pilot SIPENSIUN',
    icon: FileText,
  },
  {
    to: '/siap/tasks',
    label: 'Lihat Task SIAP',
    description: 'Kerjakan task workflow aktif',
    icon: ClipboardList,
  },
  {
    to: '/siarsip',
    label: 'Arsip Dokumen',
    description: 'Cari dan unduh dokumen case',
    icon: Archive,
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const userRole = getPrimaryRole(user?.roles);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [slaOverdueFallback, setSlaOverdueFallback] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      apiClient.get<AnalyticsDashboard>('/analytics/dashboard'),
      apiClient.get<PaginatedResult<SiapTask>>('/siap/tasks', {
        status: 'OVERDUE',
        page: 1,
        limit: 1,
      }),
    ])
      .then(([result, overdueTasks]) => {
        if (active) {
          setAnalytics(result);
          setSlaOverdueFallback(overdueTasks.total);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat analytics dashboard',
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

  const slaOverdue = analytics?.summary.slaOverdue ?? slaOverdueFallback;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard SILAKAP"
        description="Control room awal untuk memantau ASN, layanan, task, dokumen, dan SLA."
        meta={
          <div className="flex flex-wrap gap-2">
            {user?.roles.map((role) => <RoleBadge key={role} role={role} />)}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat control room" />
      ) : analytics ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              label="Total ASN"
              value={formatNumber(analytics.summary.totalAsn)}
              description="Master data SIDATA"
              icon={UserRound}
              tone="info"
            />
            <StatCard
              label="SIPENSIUN"
              value={formatNumber(analytics.summary.totalSipensiun)}
              description="Total usulan pensiun"
              icon={FileText}
              tone="neutral"
            />
            <StatCard
              label="Active Cases"
              value={formatNumber(analytics.activeCases.totalActive)}
              description={`${analytics.activeCases.draft} draft / ${analytics.activeCases.submitted} submitted`}
              icon={FolderKanban}
              tone="warning"
            />
            <StatCard
              label="Pending Task"
              value={formatNumber(analytics.summary.pendingTasks)}
              description="Menunggu tindak lanjut"
              icon={ClipboardList}
              tone="warning"
            />
            <StatCard
              label="Dokumen"
              value={formatNumber(analytics.summary.uploadedDocuments)}
              description="Metadata/file terunggah"
              icon={Archive}
              tone="success"
            />
            <Link to="/siap/tasks?status=OVERDUE">
              <StatCard
                label="SLA Overdue"
                value={formatNumber(slaOverdue)}
                description={slaOverdue > 0 ? 'Klik untuk lihat task' : 'Terkendali'}
                icon={AlertTriangle}
                tone={slaOverdue > 0 ? 'danger' : 'success'}
              />
            </Link>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <SectionCard title="Current User" description="Sesi aktif">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-[#cfe1da] bg-[linear-gradient(135deg,#f6fbfa_0%,#ffffff_100%)] p-4 shadow-sm shadow-[#9fbfb7]/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#0e7c86] bg-[#0e7c86] text-white shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#18343a]">
                      {user?.name ?? '-'}
                    </p>
                    <p className="text-sm text-[#62766f]">
                      @{user?.username ?? '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[#8b9a95]">
                    Unit Kerja
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#18343a]">
                    {user?.unitKerja?.nama ?? 'Belum terhubung unit kerja'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user?.roles.map((role) => <RoleBadge key={role} role={role} />)}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Quick Actions"
              description="Akses cepat workflow utama"
              className="xl:col-span-2"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="group rounded-lg border border-[#cfe1da] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfa_100%)] p-4 shadow-sm shadow-[#9fbfb7]/20 transition duration-200 hover:-translate-y-0.5 hover:border-[#9accc7] hover:shadow-[0_14px_28px_rgba(14,124,134,0.12)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dceae5] bg-[#eef8f6] text-[#0e7c86] transition group-hover:border-[#f2cf5a] group-hover:bg-[#fff3c4] group-hover:text-[#745300]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#18343a]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm text-[#62766f]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DistributionCard
              title="Case by State"
              description="Distribusi posisi workflow SIAP"
              items={analytics.casesByState}
              icon={FolderKanban}
            />
            <DistributionCard
              title="Task by Status"
              description="Distribusi pekerjaan aktif"
              items={analytics.tasksByStatus}
              icon={ClipboardList}
            />
            <DistributionCard
              title="SIPENSIUN by Jenis"
              description="Komposisi jenis pensiun"
              items={analytics.sipensiunByJenis}
              icon={FileText}
            />
            <DistributionCard
              title="SLA Summary"
              description="Kondisi pengendalian waktu"
              items={analytics.slaSummary}
              icon={Activity}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Document Completeness"
              description="Ketersediaan dokumen pada case"
            >
              <div className="grid gap-3">
                <CompactMetric
                  label="Total Dokumen"
                  value={analytics.documentCompleteness.totalDocuments}
                  tone="neutral"
                />
                <CompactMetric
                  label="Case dengan Dokumen"
                  value={analytics.documentCompleteness.casesWithDocuments}
                  tone="success"
                />
                <CompactMetric
                  label="Case tanpa Dokumen"
                  value={analytics.documentCompleteness.casesWithoutDocuments}
                  tone={
                    analytics.documentCompleteness.casesWithoutDocuments > 0
                      ? 'warning'
                      : 'success'
                  }
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Document by Type"
              description="Jenis dokumen yang sudah masuk"
              className="xl:col-span-2"
            >
              <SimpleGroupList
                items={analytics.documentsByType}
                empty="Belum ada dokumen terunggah"
              />
            </SectionCard>
          </section>

          <SectionCard
            title="Recent Activity"
            description="10 aktivitas workflow terakhir"
            actions={<StatusBadge value="LIVE" tone="success" />}
          >
            <RecentTimeline items={analytics.recentTimeline} />
          </SectionCard>

          <SopChecklistDashboardPanel userRole={userRole} />
        </>
      ) : (
        <EmptyState
          title="Dashboard belum tersedia"
          description="Data analytics belum dapat dimuat."
          icon={BarChart3}
        />
      )}
    </div>
  );
}

function DistributionCard({
  title,
  description,
  items,
  icon: Icon,
}: {
  title: string;
  description: string;
  items: AnalyticsGroup[];
  icon: typeof BarChart3;
}) {
  const max = Math.max(...items.map((item) => item.total), 0);

  return (
    <SectionCard
      title={title}
      description={description}
      actions={<Icon className="h-5 w-5 text-[#0e7c86]" />}
    >
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => {
            const width = max > 0 ? Math.max((item.total / max) * 100, 6) : 0;

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={item.label} />
                  <span className="text-sm font-semibold text-[#18343a]">
                    {formatNumber(item.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef8f6]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0e7c86_0%,#f2b705_100%)]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum ada data"
          description="Distribusi akan tampil setelah data tersedia."
          icon={FileSearch}
        />
      )}
    </SectionCard>
  );
}

function SimpleGroupList({
  items,
  empty,
}: {
  items: AnalyticsGroup[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={empty}
        description="Data akan muncul otomatis dari database."
        icon={FileSearch}
      />
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between rounded-lg border border-[#cfe1da] bg-[#f8fbfa] px-4 py-3"
        >
          <span className="text-sm font-medium text-[#4c625c]">
            {item.label}
          </span>
          <span className="rounded-md border border-[#dceae5] bg-white px-3 py-1 text-sm font-semibold text-[#18343a] shadow-sm">
            {formatNumber(item.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentTimeline({ items }: { items: AnalyticsRecentTimeline[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada aktivitas"
        description="Timeline akan terisi dari aktivitas case dan task."
        icon={Activity}
      />
    );
  }

  return (
    <div className="divide-y divide-[#dceae5]">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#cfe1da] bg-[#eef8f6] text-[#0e7c86]">
            <Activity className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[#18343a]">{item.title}</p>
              <StatusBadge value={item.eventType} />
              <StatusBadge value={item.currentState} />
            </div>

            <p className="mt-1 text-sm text-[#62766f]">
              {item.caseNumber} / {item.serviceType}
              {item.actorName ? ` / oleh ${item.actorName}` : ''}
            </p>

            {item.description ? (
              <p className="mt-2 text-sm text-[#4c625c]">{item.description}</p>
            ) : null}
          </div>

          <div className="hidden text-right text-xs text-[#8b9a95] md:block">
            {formatDateTime(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning';
}) {
  const toneClass = {
    neutral: 'border-[#cfe1da] bg-[#f8fbfa] text-[#18343a]',
    success: 'border-[#91d9bf] bg-[#e4f8ef] text-[#12815f]',
    warning: 'border-[#f2cf5a] bg-[#fff3c4] text-[#745300]',
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {tone === 'success' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : tone === 'warning' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold">{formatNumber(value)}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
