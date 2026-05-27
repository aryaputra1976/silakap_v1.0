import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { sidataApi, type SidataAsnQualityDashboard } from '@/lib/api/sidata';
import {
  buildImportAggregate,
  getBatchFileName,
  getBatchTypeLabel,
  getErrorMessage,
  isProblemBatch,
  mergeImportBatches,
  shortId,
  toNumber,
  type SidataBatchListResponse,
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
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';

type QualityIssue = {
  key: string;
  label: string;
  count: number;
  actionLabel: string;
  actionPath: string;
};

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}

function scoreTextClass(score: number) {
  if (score >= 90) return 'text-emerald-700';
  if (score >= 70) return 'text-amber-700';
  return 'text-rose-700';
}

function SummaryTile({
  label,
  tone = 'neutral',
  value,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  value: string | number;
}) {
  const toneClass = {
    neutral: 'border-[#cfe1da] bg-white text-[#18343a]',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
      <div className="text-xs font-medium text-current/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function buildQualityIssues(quality: SidataAsnQualityDashboard | null): QualityIssue[] {
  if (!quality) return [];

  const items: QualityIssue[] = [
    {
      key: 'withoutUnitKerja',
      label: 'Unit kerja kosong',
      count: quality.completeness.withoutUnitKerja,
      actionLabel: 'Buka Master ASN',
      actionPath: '/sidata/asn',
    },
    {
      key: 'withoutJabatan',
      label: 'Jabatan kosong',
      count: quality.completeness.withoutJabatan,
      actionLabel: 'Buka Master ASN',
      actionPath: '/sidata/asn',
    },
    {
      key: 'withoutGolongan',
      label: 'Golongan kosong',
      count: quality.completeness.withoutGolongan,
      actionLabel: 'Buka Master ASN',
      actionPath: '/sidata/asn',
    },
    {
      key: 'withoutNik',
      label: 'NIK kosong',
      count: quality.completeness.withoutNik,
      actionLabel: 'Buka Master ASN',
      actionPath: '/sidata/asn',
    },
    {
      key: 'withoutTanggalLahir',
      label: 'Tanggal lahir kosong',
      count: quality.completeness.withoutTanggalLahir,
      actionLabel: 'Buka Master ASN',
      actionPath: '/sidata/asn',
    },
    {
      key: 'withoutTmtPensiun',
      label: 'TMT pensiun kosong',
      count: quality.completeness.withoutTmtPensiun,
      actionLabel: 'Import SIASN',
      actionPath: '/sidata/import/siasn',
    },
    {
      key: 'withoutSiasnProfile',
      label: 'Profil SIASN belum ada',
      count: quality.completeness.withoutSiasnProfile,
      actionLabel: 'Import SIASN',
      actionPath: '/sidata/import/siasn',
    },
  ];

  return items.sort((left, right) => right.count - left.count);
}

export function SidataValidasiPage() {
  const navigate = useNavigate();

  const [quality, setQuality] = useState<SidataAsnQualityDashboard | null>(null);
  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadValidationDashboard();
  }, []);

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);
  const problemBatches = useMemo(() => batches.filter(isProblemBatch), [batches]);
  const issues = useMemo(() => buildQualityIssues(quality), [quality]);
  const openIssues = issues.filter((item) => item.count > 0);
  const qualityScore = quality?.quality.qualityScore ?? 0;
  const hasOpenIssue = openIssues.length > 0 || problemBatches.length > 0;

  async function loadValidationDashboard() {
    setLoading(true);
    setError('');

    try {
      const [qualityResponse, asnBatchResponse, referenceBatchResponse] =
        await Promise.all([
          sidataApi.getAsnQualityDashboard(),
          apiClient.get<SidataBatchListResponse>('/sidata/import/asn-batches'),
          apiClient.get<SidataBatchListResponse>('/sidata/import/reference-batches'),
        ]);

      setQuality(qualityResponse);
      setBatches(mergeImportBatches(asnBatchResponse, referenceBatchResponse));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat validasi data SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function openBatchAction(batch: SidataImportBatchWithKind) {
    if (batch.kind === 'ASN') {
      navigate('/sidata/import/mapping-referensi');
      return;
    }

    navigate('/sidata/import/referensi');
  }

  if (loading) {
    return <LoadingState label="Memuat validasi data SIDATA" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Validasi Data SIDATA"
        description="Cek field kosong, kualitas master ASN, dan batch import yang perlu ditindaklanjuti."
        meta={
          <>
            <StatusBadge value="SIDATA" tone="dark" />
            <StatusBadge value={hasOpenIssue ? 'Perlu Tindak Lanjut' : 'Data Aman'} tone={hasOpenIssue ? 'warning' : 'success'} />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadValidationDashboard()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryTile
          label="Skor Kualitas"
          tone={scoreTone(qualityScore)}
          value={`${qualityScore}%`}
        />
        <SummaryTile
          label="Total ASN"
          tone="info"
          value={formatCount(quality?.totals.totalAsn ?? 0)}
        />
        <SummaryTile
          label="Data Perlu Diperbaiki"
          tone={(quality?.quality.issueRows ?? 0) > 0 ? 'warning' : 'success'}
          value={formatCount(quality?.quality.issueRows ?? 0)}
        />
        <SummaryTile
          label="Batch Bermasalah"
          tone={problemBatches.length > 0 ? 'warning' : 'success'}
          value={formatCount(problemBatches.length)}
        />
      </div>

      <SectionCard
        title="Prioritas Perbaikan Data"
        description="Daftar field inti yang masih kosong pada master ASN."
        actions={<StatusBadge value={`${formatCount(openIssues.length)} Jenis Masalah`} tone={openIssues.length > 0 ? 'warning' : 'success'} />}
      >
        <div className="mb-4 rounded-lg border border-[#cfe1da] bg-[#f7fbf8] p-4 text-sm text-[#4c625c]">
          <div className={`text-lg font-semibold ${scoreTextClass(qualityScore)}`}>
            {qualityScore >= 90 ? 'Kualitas data baik' : qualityScore >= 70 ? 'Kualitas data perlu dirapikan' : 'Kualitas data perlu perhatian'}
          </div>
          <p className="mt-1 leading-6">
            {quality?.quality.completeCoreRows
              ? `${formatCount(quality.quality.completeCoreRows)} ASN sudah lengkap dari ${formatCount(quality.totals.totalAsn)} total ASN.`
              : 'Belum ada data lengkap yang dapat dihitung.'}
          </p>
        </div>

        {openIssues.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tidak ada field inti yang kosong"
            description="Data master ASN sudah memenuhi validasi inti saat ini."
          />
        ) : (
          <DataTable
            empty="Tidak ada masalah data"
            items={openIssues}
            rowKey={(item) => item.key}
            columns={[
              {
                key: 'issue',
                header: 'Masalah',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                    <span className="font-semibold text-zinc-900">{item.label}</span>
                  </div>
                ),
              },
              {
                key: 'count',
                header: 'Jumlah',
                className: 'w-[120px]',
                render: (item) => (
                  <span className="font-semibold text-amber-700">
                    {formatCount(item.count)}
                  </span>
                ),
              },
              {
                key: 'priority',
                header: 'Prioritas',
                className: 'w-[140px]',
                render: (item) => (
                  <StatusBadge
                    value={item.count > 100 ? 'Tinggi' : item.count > 0 ? 'Normal' : 'Aman'}
                    tone={item.count > 100 ? 'danger' : item.count > 0 ? 'warning' : 'success'}
                  />
                ),
              },
              {
                key: 'action',
                header: '',
                className: 'w-[170px]',
                render: (item) => (
                  <ActionButton
                    icon={item.actionPath.includes('import') ? FileSpreadsheet : Database}
                    onClick={() => navigate(item.actionPath)}
                    variant="secondary"
                  >
                    {item.actionLabel}
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Batch Import Perlu Tindak Lanjut"
        description="Batch dengan invalid, warning, review, unmapped, atau status gagal."
        actions={
          <ActionButton
            icon={FolderSync}
            onClick={() => navigate('/sidata/import/riwayat')}
            variant="secondary"
          >
            Riwayat Import
          </ActionButton>
        }
      >
        {problemBatches.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tidak ada batch bermasalah"
            description="Semua batch import saat ini tidak memiliki masalah validasi."
          />
        ) : (
          <DataTable
            empty="Tidak ada batch bermasalah"
            items={problemBatches}
            rowKey={(item) => `${item.kind}-${item.id}`}
            columns={[
              {
                key: 'batch',
                header: 'Batch',
                className: 'w-[120px]',
                render: (item) => (
                  <span className="font-mono text-xs font-semibold text-zinc-900">
                    {shortId(item.id)}
                  </span>
                ),
              },
              {
                key: 'file',
                header: 'File',
                render: (item) => (
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-900">
                      {getBatchFileName(item)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge
                        value={item.kind === 'ASN' ? 'ASN' : 'Referensi'}
                        tone={item.kind === 'ASN' ? 'info' : 'dark'}
                      />
                      <span>{getBatchTypeLabel(item)}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'issue',
                header: 'Issue',
                className: 'w-[210px]',
                render: (item) => (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span>Invalid: <b className="text-rose-700">{toNumber(item.invalidRows)}</b></span>
                    <span>Warning: <b className="text-amber-700">{toNumber(item.warningRows)}</b></span>
                    <span>Review: <b className="text-amber-700">{toNumber(item.needsReviewRows)}</b></span>
                    <span>Unmapped: <b>{toNumber(item.unmappedRows)}</b></span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                className: 'w-[130px]',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'createdAt',
                header: 'Tanggal',
                className: 'w-[150px]',
                render: (item) => formatDateTime(item.createdAt),
              },
              {
                key: 'action',
                header: '',
                className: 'w-[150px]',
                render: (item) => (
                  <ActionButton
                    icon={ShieldCheck}
                    onClick={() => openBatchAction(item)}
                    variant="secondary"
                  >
                    Tindak Lanjut
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Aksi Cepat"
        description="Pilih langkah perbaikan sesuai sumber masalah."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <ActionButton
            icon={Database}
            onClick={() => navigate('/sidata/asn')}
            variant="secondary"
          >
            Master ASN
          </ActionButton>
          <ActionButton
            icon={FileSpreadsheet}
            onClick={() => navigate('/sidata/import/siasn')}
            variant="secondary"
          >
            Import SIASN
          </ActionButton>
          <ActionButton
            icon={ShieldAlert}
            onClick={() => navigate('/sidata/rekonsiliasi')}
            variant="secondary"
          >
            Rekonsiliasi
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
  );
}
