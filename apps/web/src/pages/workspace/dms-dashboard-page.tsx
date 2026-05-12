import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCcw,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDashboardLatestDocument,
  type DmsDashboardSummary,
  type DmsDocumentStatus,
} from '@/lib/api/dms';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

export function DmsDashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DmsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.getDashboardSummary();
      setSummary(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dashboard DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statusMap = useMemo(() => {
    const map = new Map<DmsDocumentStatus, number>();

    for (const item of summary?.byStatus ?? []) {
      map.set(item.status, item.total);
    }

    return map;
  }, [summary]);

  const latestDocuments = summary?.latestDocuments ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard DMS"
        description="Ringkasan dokumen bukti dukung, laporan, dan arsip digital pada Document Management System SILAKAP."
        meta={<StatusBadge value="DMS BUKTI DUKUNG" tone="dark" />}
        actions={
          <>
            <ActionButton icon={Plus} onClick={() => navigate('/dms/upload')}>
              Upload Dokumen
            </ActionButton>
            <ActionButton
              disabled={loading}
              icon={RefreshCcw}
              onClick={() => void loadDashboard()}
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading && !summary ? (
        <LoadingState label="Memuat dashboard DMS" />
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              icon={FileText}
              label="Total Dokumen"
              value={summary?.total ?? 0}
              tone="info"
            />
            <StatCard
              icon={FileText}
              label="Draft"
              value={statusMap.get('DRAFT') ?? 0}
              tone="warning"
            />
            <StatCard
              icon={UploadCloud}
              label="Uploaded"
              value={statusMap.get('UPLOADED') ?? 0}
              tone="info"
            />
            <StatCard
              icon={BarChart3}
              label="Submitted"
              value={summary?.waitingVerification ?? 0}
              description="Menunggu verifikasi"
              tone="info"
            />
            <StatCard
              icon={CheckCircle2}
              label="Verified / Archived"
              value={summary?.verifiedOrArchived ?? 0}
              tone="success"
            />
            <StatCard
              icon={Archive}
              label="Tanpa File"
              value={summary?.withoutFile ?? 0}
              tone={(summary?.withoutFile ?? 0) > 0 ? 'warning' : 'success'}
            />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <StatCard
              icon={UploadCloud}
              label="Menunggu Verifikasi"
              value={summary?.waitingVerification ?? 0}
              description="Dokumen SUBMITTED yang perlu ditinjau."
              tone="info"
            />
            <StatCard
              icon={FileText}
              label="Belum Ada File"
              value={summary?.withoutFile ?? 0}
              description="Metadata sudah dibuat, file belum diunggah."
              tone={(summary?.withoutFile ?? 0) > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={Archive}
              label="Ditolak"
              value={summary?.rejected ?? 0}
              description="Dokumen yang perlu diperbaiki."
              tone={(summary?.rejected ?? 0) > 0 ? 'danger' : 'neutral'}
            />
          </section>

          <SectionCard
            title="Dokumen Terbaru"
            description="Sepuluh dokumen terbaru yang dapat diakses oleh pengguna saat ini."
            actions={
              <ActionButton
                icon={BarChart3}
                onClick={() => navigate('/dms/documents')}
                variant="secondary"
              >
                Lihat Semua
              </ActionButton>
            }
          >
            {loading ? (
              <LoadingState label="Memuat dokumen terbaru" />
            ) : (
              <LatestDocumentsTable
                documents={latestDocuments}
                onOpen={(id) => navigate(`/dms/documents/${id}`)}
              />
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function LatestDocumentsTable({
  documents,
  onOpen,
}: {
  documents: DmsDashboardLatestDocument[];
  onOpen: (id: string) => void;
}) {
  return (
    <DataTable
      items={documents}
      rowKey={(item) => item.id}
      empty="Belum ada dokumen terbaru"
      columns={[
        {
          key: 'title',
          header: 'Dokumen',
          render: (item) => (
            <div className="max-w-md">
              <div className="font-semibold text-zinc-950">{item.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <DmsCategoryBadge category={item.category} />
                <DmsStatusBadge status={item.status} />
              </div>
            </div>
          ),
        },
        {
          key: 'unit',
          header: 'Unit Kerja',
          render: (item) => (
            <div>
              <div className="font-medium text-zinc-900">
                {item.unitKerja?.nama ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.unitKerja?.kode ?? ''}
              </div>
            </div>
          ),
        },
        {
          key: 'period',
          header: 'Periode',
          render: (item) => formatPeriod(item),
        },
        {
          key: 'created',
          header: 'Dibuat',
          render: (item) => (
            <div>
              <div className="font-medium text-zinc-900">
                {item.createdBy?.name ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </div>
            </div>
          ),
        },
        {
          key: 'actions',
          header: 'Aksi',
          render: (item) => (
            <ActionButton onClick={() => onOpen(item.id)} variant="secondary">
              Buka
            </ActionButton>
          ),
        },
      ]}
    />
  );
}

function formatPeriod(item: DmsDashboardLatestDocument) {
  if (!item.periodYear && !item.periodMonth) {
    return '-';
  }

  if (item.periodMonth && item.periodYear) {
    return `${item.periodMonth}/${item.periodYear}`;
  }

  return String(item.periodYear ?? '-');
}