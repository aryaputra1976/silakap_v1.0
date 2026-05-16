import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sidataApi } from '@/lib/api/sidata';
import { sidataImportApi } from '@/lib/api/sidata-import';
import {
  buildImportAggregate,
  getBatchFileName,
  getBatchTypeLabel,
  getErrorMessage,
  mergeImportBatches,
  shortId,
  toNumber,
  type SidataImportBatchWithKind,
} from '@/lib/sidata';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';

export function SidataDashboardPage() {
  const navigate = useNavigate();

  const [asnTotal, setAsnTotal] = useState(0);
  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);

  const recentBatches = useMemo(() => batches.slice(0, 8), [batches]);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const [asnResponse, asnBatchResponse, referenceBatchResponse] = await Promise.all([
        sidataApi.getAsnList({ page: 1, limit: 1 }),
        sidataImportApi.listAsnBatches(),
        sidataImportApi.listReferenceBatches(),
      ]);

      setAsnTotal(asnResponse.total);
      setBatches(mergeImportBatches(asnBatchResponse, referenceBatchResponse));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat dashboard SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function openBatchWorkspace(batch: SidataImportBatchWithKind) {
    navigate(
      batch.kind === 'ASN' ? '/sidata/import/mapping-referensi' : '/sidata/import/referensi',
    );
  }

  if (loading) {
    return <LoadingState label="Memuat dashboard SIDATA" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard SIDATA"
        description="Ringkasan kualitas data ASN, status import SIASN, dan kesiapan master referensi SIDATA."
        meta={
          <>
            <StatusBadge value="Data ASN" tone="info" />
            <StatusBadge value="Import Monitor" tone="dark" />
            <StatusBadge value="Quality Control" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadDashboard()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total ASN"
          value={asnTotal}
          tone="info"
          description="Jumlah data ASN pada master SIDATA."
        />
        <StatCard
          icon={FolderSync}
          label="Total Batch"
          value={stats.totalBatch}
          description="Seluruh batch import ASN dan referensi."
        />
        <StatCard
          icon={Database}
          label="Batch ASN"
          value={stats.asnBatch}
          tone="info"
          description="Batch import data ASN SIASN."
        />
        <StatCard
          icon={Layers3}
          label="Batch Referensi"
          value={stats.referenceBatch}
          tone="dark"
          description="Batch import master referensi."
        />
        <StatCard
          icon={CheckCircle2}
          label="Committed Batch"
          value={stats.committedBatch}
          tone="success"
          description="Batch yang sudah masuk data utama."
        />
        <StatCard
          icon={ShieldAlert}
          label="Butuh Review"
          value={stats.problemBatch}
          tone="warning"
          description="Batch dengan invalid, warning, needs review, atau unmapped."
        />
        <StatCard
          icon={AlertTriangle}
          label="Failed Batch"
          value={stats.failedBatch}
          tone="danger"
          description="Batch dengan status gagal."
        />
        <StatCard
          icon={BarChart3}
          label="Quality Score"
          value={`${stats.qualityScore}%`}
          tone={stats.qualityScore >= 90 ? 'success' : 'warning'}
          description="Estimasi kualitas data berdasarkan total issue rows."
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
        <SectionCard
          title="Kualitas Import SIDATA"
          description="Akumulasi kualitas seluruh batch import ASN dan referensi."
        >
          {batches.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Belum ada batch import"
              description="Upload referensi atau data SIASN untuk mulai membangun kualitas data SIDATA."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={FileSpreadsheet}
                label="Total Rows"
                value={stats.totalRows}
                description="Akumulasi seluruh baris import."
              />
              <StatCard
                icon={CheckCircle2}
                label="Valid Rows"
                value={stats.validRows}
                tone="success"
                description="Baris yang lolos validasi."
              />
              <StatCard
                icon={AlertTriangle}
                label="Invalid Rows"
                value={stats.invalidRows}
                tone="danger"
                description="Baris yang tidak dapat diproses."
              />
              <StatCard
                icon={ShieldCheck}
                label="Warning Rows"
                value={stats.warningRows}
                tone="warning"
                description="Baris dengan catatan validasi."
              />
              <StatCard
                icon={Layers3}
                label="Mapped Rows"
                value={stats.mappedRows}
                tone="info"
                description="Baris yang sudah termapping."
              />
              <StatCard
                icon={ShieldAlert}
                label="Needs Review"
                value={stats.needsReviewRows}
                tone="warning"
                description="Baris yang perlu review manual."
              />
              <StatCard
                icon={RefreshCcw}
                label="Unmapped"
                value={stats.unmappedRows}
                description="Baris yang belum punya referensi."
              />
              <StatCard
                icon={CheckCircle2}
                label="Committed Rows"
                value={stats.committedRows}
                tone="success"
                description="Baris yang sudah masuk data utama."
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Aksi Cepat SIDATA"
          description="Shortcut operasional untuk admin data BKPSDM."
        >
          <div className="grid gap-3">
            <ActionButton
              icon={Database}
              onClick={() => navigate('/sidata/asn')}
              variant="secondary"
            >
              Buka Profil ASN
            </ActionButton>
            <ActionButton
              icon={FileSpreadsheet}
              onClick={() => navigate('/sidata/import/siasn')}
              variant="secondary"
            >
              Import Data SIASN
            </ActionButton>
            <ActionButton
              icon={Layers3}
              onClick={() => navigate('/sidata/import/referensi')}
              variant="secondary"
            >
              Import Referensi
            </ActionButton>
            <ActionButton
              icon={ShieldCheck}
              onClick={() => navigate('/sidata/import/mapping-referensi')}
              variant="secondary"
            >
              Review Mapping
            </ActionButton>
            <ActionButton
              icon={FolderSync}
              onClick={() => navigate('/sidata/import/riwayat')}
              variant="secondary"
            >
              Riwayat Import
            </ActionButton>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Batch Import Terbaru"
        description="Daftar batch import terakhir untuk pemantauan cepat."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${recentBatches.length} Ditampilkan`} tone="info" />
            <StatusBadge value={`${batches.length} Total`} tone="neutral" />
          </div>
        }
      >
        {recentBatches.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Belum ada batch import"
            description="Belum ada riwayat import ASN atau referensi."
          />
        ) : (
          <DataTable
            empty="Belum ada batch import"
            items={recentBatches}
            rowKey={(item) => `${item.kind}-${item.id}`}
            columns={[
              {
                key: 'batch',
                header: 'Batch',
                render: (item) => (
                  <span className="font-mono text-xs font-semibold text-zinc-900">
                    {shortId(item.id)}
                  </span>
                ),
              },
              {
                key: 'kind',
                header: 'Jenis',
                render: (item) => (
                  <StatusBadge
                    value={item.kind === 'ASN' ? 'ASN' : 'Referensi'}
                    tone={item.kind === 'ASN' ? 'info' : 'dark'}
                  />
                ),
              },
              {
                key: 'file',
                header: 'File',
                render: (item) => (
                  <div className="max-w-[300px]">
                    <div className="truncate font-semibold text-zinc-900">
                      {getBatchFileName(item)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {getBatchTypeLabel(item)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'rows',
                header: 'Rows',
                render: (item) => (
                  <div className="grid gap-1 text-xs">
                    <span>Total: {toNumber(item.totalRows)}</span>
                    <span className="text-emerald-700">Valid: {toNumber(item.validRows)}</span>
                    <span className="text-rose-700">Invalid: {toNumber(item.invalidRows)}</span>
                    <span className="text-amber-700">Warning: {toNumber(item.warningRows)}</span>
                  </div>
                ),
              },
              {
                key: 'createdAt',
                header: 'Tanggal',
                render: (item) => (
                  <span className="text-xs">{formatDateTime(item.createdAt)}</span>
                ),
              },
              {
                key: 'action',
                header: 'Aksi',
                render: (item) => (
                  <ActionButton onClick={() => openBatchWorkspace(item)} variant="secondary">
                    Buka
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}