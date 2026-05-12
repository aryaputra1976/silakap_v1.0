import { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCcw } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsApi,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocument,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

export function DmsReportsPage() {
  const [data, setData] = useState<DmsDocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReports() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.listDocuments({
        page: 1,
        limit: 100,
      });

      setData(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat laporan DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  const documents = data?.items ?? [];

  const byStatus = useMemo(
    () =>
      DMS_DOCUMENT_STATUSES.map((status) => ({
        id: status,
        status,
        label: dmsStatusLabel(status),
        total: documents.filter((item) => item.status === status).length,
      })),
    [documents],
  );

  const byCategory = useMemo(
    () =>
      DMS_DOCUMENT_CATEGORIES.map((category) => ({
        id: category,
        category,
        label: dmsCategoryLabel(category),
        total: documents.filter((item) => item.category === category).length,
      })).filter((item) => item.total > 0),
    [documents],
  );

  const verifiedCount = documents.filter(
    (item) => item.status === 'VERIFIED' || item.status === 'ARCHIVED',
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan DMS"
        description="Rekapitulasi dokumen bukti dukung berdasarkan status, kategori, dan kesiapan arsip."
        meta={<StatusBadge value={`${data?.total ?? 0} DOKUMEN`} tone="info" />}
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadReports()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={BarChart3}
          label="Total Dokumen"
          value={data?.total ?? 0}
          tone="info"
        />
        <StatCard
          icon={BarChart3}
          label="Sah / Arsip"
          value={verifiedCount}
          description="Dokumen VERIFIED dan ARCHIVED"
          tone="success"
        />
        <StatCard
          icon={BarChart3}
          label="Belum Final"
          value={Math.max((data?.total ?? 0) - verifiedCount, 0)}
          description="Draft, uploaded, submitted, atau rejected"
          tone="warning"
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
              rowKey={(item) => item.id}
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
                  render: (item) => item.label,
                },
                {
                  key: 'total',
                  header: 'Jumlah',
                  render: (item) => (
                    <span className="font-semibold text-zinc-950">
                      {item.total}
                    </span>
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
              rowKey={(item) => item.id}
              empty="Belum ada rekap kategori"
              columns={[
                {
                  key: 'category',
                  header: 'Kategori',
                  render: (item) => (
                    <DmsCategoryBadge category={item.category} />
                  ),
                },
                {
                  key: 'label',
                  header: 'Label',
                  render: (item) => item.label,
                },
                {
                  key: 'total',
                  header: 'Jumlah',
                  render: (item) => (
                    <span className="font-semibold text-zinc-950">
                      {item.total}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}