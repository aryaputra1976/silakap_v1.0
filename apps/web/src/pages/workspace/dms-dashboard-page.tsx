import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  FileText,
  Plus,
  RefreshCcw,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsDocumentTable } from '@/components/workspace/dms/dms-document-table';
import { DmsStatCards, type DmsStatSummary } from '@/components/workspace/dms/dms-stat-cards';

export function DmsDashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<DmsDocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.listDocuments({
        page: 1,
        limit: 10,
      });

      setData(result);
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

  const documents = data?.items ?? [];

  const summary = useMemo(() => buildSummary(documents, data?.total ?? 0), [
    documents,
    data?.total,
  ]);

  const readyForVerification = documents.filter(
    (item) => item.status === 'SUBMITTED',
  ).length;

  const withoutFile = documents.filter((item) => !item.fileName).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard DMS"
        description="Ringkasan dokumen bukti dukung, laporan, dan arsip digital yang masuk ke Document Management System SILAKAP."
        meta={<StatusBadge value="DMS BUKTI DUKUNG" tone="dark" />}
        actions={
          <>
            <ActionButton
              icon={Plus}
              onClick={() => navigate('/dms/upload')}
            >
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

      <DmsStatCards summary={summary} />

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={UploadCloud}
          label="Menunggu Verifikasi"
          value={readyForVerification}
          description="Dokumen SUBMITTED yang perlu ditinjau oleh pejabat/verifikator berwenang."
          tone="info"
        />
        <StatCard
          icon={FileText}
          label="Belum Ada File"
          value={withoutFile}
          description="Metadata sudah dibuat tetapi file pendukung belum diunggah."
          tone={withoutFile > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={Archive}
          label="Siap Arsip"
          value={summary.verified + summary.archived}
          description="Dokumen terverifikasi dan/atau sudah masuk arsip final."
          tone="success"
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
          <DmsDocumentTable
            documents={documents}
            onOpenDocument={(id) => navigate(`/dms/documents/${id}`)}
          />
        )}
      </SectionCard>
    </div>
  );
}

function buildSummary(
  documents: DmsDocument[],
  total: number,
): DmsStatSummary {
  return {
    total,
    draft: documents.filter((item) => item.status === 'DRAFT').length,
    uploaded: documents.filter((item) => item.status === 'UPLOADED').length,
    submitted: documents.filter((item) => item.status === 'SUBMITTED').length,
    verified: documents.filter((item) => item.status === 'VERIFIED').length,
    rejected: documents.filter((item) => item.status === 'REJECTED').length,
    archived: documents.filter((item) => item.status === 'ARCHIVED').length,
  };
}