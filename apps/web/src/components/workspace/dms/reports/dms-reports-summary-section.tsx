import { BarChart3 } from 'lucide-react';
import {
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDashboardSummary,
} from '@/lib/api/dms';
import {
  DataTable,
  LoadingState,
  SectionCard,
  StatCard,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

type DmsReportsSummarySectionProps = {
  summary: DmsDashboardSummary | null;
  loading: boolean;
};

export function DmsReportsSummarySection({
  summary,
  loading,
}: DmsReportsSummarySectionProps) {
  if (loading && !summary) {
    return <LoadingState label="Memuat laporan DMS" />;
  }

  const byStatus = summary?.byStatus ?? [];
  const byCategory = summary?.byCategory ?? [];

  return (
    <>
      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Total Dokumen"
          value={summary?.total ?? 0}
          tone="info"
        />
        <StatCard
          icon={BarChart3}
          label="Sah / Arsip"
          value={summary?.verifiedOrArchived ?? 0}
          description="Dokumen VERIFIED dan ARCHIVED"
          tone="success"
        />
        <StatCard
          icon={BarChart3}
          label="Menunggu Verifikasi"
          value={summary?.waitingVerification ?? 0}
          description="Dokumen SUBMITTED"
          tone="warning"
        />
        <StatCard
          icon={BarChart3}
          label="Ditolak"
          value={summary?.rejected ?? 0}
          description="Dokumen perlu perbaikan"
          tone={(summary?.rejected ?? 0) > 0 ? 'danger' : 'neutral'}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Rekap Berdasarkan Status"
          description="Jumlah dokumen per status workflow DMS."
        >
          {loading ? (
            <LoadingState label="Memuat rekap status" />
          ) : (
            <DataTable
              items={byStatus}
              rowKey={(item) => item.status}
              empty="Belum ada rekap status"
              columns={[
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => <DmsStatusBadge status={item.status} />,
                },
                {
                  key: 'label',
                  header: 'Label',
                  render: (item) => dmsStatusLabel(item.status),
                },
                {
                  key: 'total',
                  header: 'Jumlah',
                  render: (item) => (
                    <span className="font-semibold text-zinc-950">{item.total}</span>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Rekap Berdasarkan Kategori"
          description="Jumlah dokumen per kategori dokumen DMS."
        >
          {loading ? (
            <LoadingState label="Memuat rekap kategori" />
          ) : (
            <DataTable
              items={byCategory}
              rowKey={(item) => item.category}
              empty="Belum ada rekap kategori"
              columns={[
                {
                  key: 'category',
                  header: 'Kategori',
                  render: (item) => <DmsCategoryBadge category={item.category} />,
                },
                {
                  key: 'label',
                  header: 'Label',
                  render: (item) => dmsCategoryLabel(item.category),
                },
                {
                  key: 'total',
                  header: 'Jumlah',
                  render: (item) => (
                    <span className="font-semibold text-zinc-950">{item.total}</span>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>
      </div>
    </>
  );
}
