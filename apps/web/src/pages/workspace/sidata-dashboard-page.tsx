import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sidataApi, type SidataAsnQualityDashboard } from '@/lib/api/sidata';
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
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';

type DashboardIssue = {
  key: string;
  label: string;
  count: number;
  path: string;
};

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function getQualityTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}

function getIssueTone(value: number): 'success' | 'warning' | 'danger' {
  return value === 0 ? 'success' : 'warning';
}

function DashboardTile({
  icon: Icon,
  label,
  tone = 'neutral',
  value,
}: {
  icon: typeof Database;
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
      <div className="flex items-center gap-2 text-xs font-medium text-current/70">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function buildIssues(quality: SidataAsnQualityDashboard | null): DashboardIssue[] {
  if (!quality) return [];

  return [
    {
      key: 'withoutUnitKerja',
      label: 'Unit kerja kosong',
      count: quality.completeness.withoutUnitKerja,
      path: '/sidata/asn',
    },
    {
      key: 'withoutJabatan',
      label: 'Jabatan kosong',
      count: quality.completeness.withoutJabatan,
      path: '/sidata/asn',
    },
    {
      key: 'withoutGolongan',
      label: 'Golongan kosong',
      count: quality.completeness.withoutGolongan,
      path: '/sidata/asn',
    },
    {
      key: 'withoutNik',
      label: 'NIK kosong',
      count: quality.completeness.withoutNik,
      path: '/sidata/asn',
    },
    {
      key: 'withoutTmtPensiun',
      label: 'TMT pensiun kosong',
      count: quality.completeness.withoutTmtPensiun,
      path: '/sidata/import/siasn',
    },
    {
      key: 'withoutSiasnProfile',
      label: 'Profil SIASN belum ada',
      count: quality.completeness.withoutSiasnProfile,
      path: '/sidata/import/siasn',
    },
  ].sort((left, right) => right.count - left.count);
}

export function SidataDashboardPage() {
  const navigate = useNavigate();

  const [qualityDashboard, setQualityDashboard] = useState<SidataAsnQualityDashboard | null>(null);
  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);
  const recentBatches = useMemo(() => batches.slice(0, 6), [batches]);
  const issues = useMemo(() => buildIssues(qualityDashboard), [qualityDashboard]);
  const openIssues = issues.filter((item) => item.count > 0);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const [qualityResponse, asnBatchResponse, referenceBatchResponse] = await Promise.all([
        sidataApi.getAsnQualityDashboard(),
        sidataImportApi.listAsnBatches(),
        sidataImportApi.listReferenceBatches(),
      ]);

      setQualityDashboard(qualityResponse);
      setBatches(mergeImportBatches(asnBatchResponse, referenceBatchResponse));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat dashboard SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function openBatchWorkspace(batch: SidataImportBatchWithKind) {
    navigate(
      batch.kind === 'ASN' ? '/sidata/import/siasn' : '/sidata/import/referensi',
    );
  }

  if (loading) {
    return <LoadingState label="Memuat dashboard SIDATA" />;
  }

  const totalAsn = qualityDashboard?.totals.totalAsn ?? 0;
  const qualityScore = qualityDashboard?.quality.qualityScore ?? 0;
  const issueRows = qualityDashboard?.quality.issueRows ?? 0;
  const bupNext12Months = qualityDashboard?.retirement.bupNext12Months ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard SIDATA"
        description="Ringkasan cepat kualitas Master ASN dan status import SIASN."
        meta={
          <>
            <StatusBadge value="SIDATA" tone="dark" />
            <StatusBadge value={`${formatPercent(qualityScore)} Kualitas`} tone={getQualityTone(qualityScore)} />
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

      <div className="grid gap-3 md:grid-cols-4">
        <DashboardTile icon={Database} label="Total ASN" value={formatCount(totalAsn)} tone="info" />
        <DashboardTile icon={CheckCircle2} label="Skor Kualitas" value={formatPercent(qualityScore)} tone={getQualityTone(qualityScore)} />
        <DashboardTile icon={AlertTriangle} label="Data Bermasalah" value={formatCount(issueRows)} tone={getIssueTone(issueRows)} />
        <DashboardTile icon={CalendarClock} label="BUP 12 Bulan" value={formatCount(bupNext12Months)} tone={bupNext12Months > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Prioritas Data"
          description="Field inti yang masih perlu dibersihkan."
          actions={
            <ActionButton
              icon={ShieldCheck}
              onClick={() => navigate('/sidata/validasi')}
              variant="secondary"
            >
              Buka Validasi
            </ActionButton>
          }
        >
          {openIssues.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Data inti sudah lengkap"
              description="Tidak ada field inti kosong pada dashboard kualitas saat ini."
            />
          ) : (
            <DataTable
              empty="Tidak ada prioritas perbaikan"
              items={openIssues}
              rowKey={(item) => item.key}
              columns={[
                {
                  key: 'issue',
                  header: 'Masalah',
                  render: (item) => (
                    <div className="font-semibold text-zinc-900">{item.label}</div>
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
                  key: 'action',
                  header: '',
                  className: 'w-[150px]',
                  render: (item) => (
                    <ActionButton
                      icon={item.path.includes('import') ? FileSpreadsheet : Database}
                      onClick={() => navigate(item.path)}
                      variant="secondary"
                    >
                      Perbaiki
                    </ActionButton>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aksi Cepat"
          description="Menu kerja SIDATA yang paling sering dipakai."
        >
          <div className="grid gap-3">
            <ActionButton icon={Database} onClick={() => navigate('/sidata/asn')} variant="secondary">
              Master ASN
            </ActionButton>
            <ActionButton icon={FileSpreadsheet} onClick={() => navigate('/sidata/import/siasn')} variant="secondary">
              Import SIASN
            </ActionButton>
            <ActionButton icon={ShieldCheck} onClick={() => navigate('/sidata/rekonsiliasi')} variant="secondary">
              Rekonsiliasi
            </ActionButton>
            <ActionButton icon={FolderSync} onClick={() => navigate('/sidata/import/riwayat')} variant="secondary">
              Riwayat Import
            </ActionButton>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Status Import"
        description="Ringkasan batch import ASN dan referensi."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${formatCount(stats.totalBatch)} Batch`} tone="info" />
            <StatusBadge value={`${formatCount(stats.invalidRows)} Tidak Valid`} tone={stats.invalidRows > 0 ? 'warning' : 'success'} />
            <StatusBadge value={`${formatCount(stats.unmappedRows)} Belum Terpetakan`} tone={stats.unmappedRows > 0 ? 'warning' : 'success'} />
          </div>
        }
      >
        {recentBatches.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Belum ada batch import"
            description="Upload data SIASN atau referensi untuk mulai mengisi riwayat import."
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
                className: 'w-[110px]',
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
                key: 'status',
                header: 'Status',
                className: 'w-[130px]',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'rows',
                header: 'Ringkasan',
                className: 'w-[190px]',
                render: (item) => (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span>Total: <b>{toNumber(item.totalRows)}</b></span>
                    <span>Valid: <b className="text-emerald-700">{toNumber(item.validRows)}</b></span>
                    <span>Tidak valid: <b className="text-rose-700">{toNumber(item.invalidRows)}</b></span>
                    <span>Warning: <b className="text-amber-700">{toNumber(item.warningRows)}</b></span>
                  </div>
                ),
              },
              {
                key: 'createdAt',
                header: 'Tanggal',
                className: 'w-[150px]',
                render: (item) => (
                  <span className="text-xs">{formatDateTime(item.createdAt)}</span>
                ),
              },
              {
                key: 'action',
                header: '',
                className: 'w-[100px]',
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
