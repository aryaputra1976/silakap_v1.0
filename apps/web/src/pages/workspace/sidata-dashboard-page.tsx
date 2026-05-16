import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  IdCard,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  sidataApi,
  type SidataAsnQualityBreakdownItem,
  type SidataAsnQualityDashboard,
} from '@/lib/api/sidata';
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

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function getQualityTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}

function getIssueTone(value: number): 'success' | 'warning' | 'danger' {
  if (value === 0) return 'success';
  return 'warning';
}

function formatDateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function mapBreakdownRow(item: SidataAsnQualityBreakdownItem) {
  return {
    ...item,
    displayPercentage: formatPercent(item.percentage),
  };
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
  const recentBatches = useMemo(() => batches.slice(0, 8), [batches]);

  const statusBreakdown = useMemo(
    () => (qualityDashboard?.breakdown.byStatusAsn ?? []).map(mapBreakdownRow),
    [qualityDashboard],
  );

  const jenisAsnBreakdown = useMemo(
    () => (qualityDashboard?.breakdown.byJenisAsn ?? []).map(mapBreakdownRow),
    [qualityDashboard],
  );

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
      batch.kind === 'ASN' ? '/sidata/import/mapping-referensi' : '/sidata/import/referensi',
    );
  }

  if (loading) {
    return <LoadingState label="Memuat dashboard SIDATA" />;
  }

  const totalAsn = qualityDashboard?.totals.totalAsn ?? 0;
  const activeAsn = qualityDashboard?.totals.activeAsn ?? 0;
  const inactiveAsn = qualityDashboard?.totals.inactiveAsn ?? 0;
  const qualityScore = qualityDashboard?.quality.qualityScore ?? 0;
  const issueRows = qualityDashboard?.quality.issueRows ?? 0;
  const completeCoreRows = qualityDashboard?.quality.completeCoreRows ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard SIDATA"
        description="Ringkasan kualitas master ASN, status import SIASN, dan kesiapan data referensi SIDATA."
        meta={
          <>
            <StatusBadge value="Data ASN" tone="info" />
            <StatusBadge value="Import Monitor" tone="dark" />
            <StatusBadge value="Quality Control" tone={getQualityTone(qualityScore)} />
            {qualityDashboard ? (
              <StatusBadge
                value={qualityDashboard.scope.type === 'ALL' ? 'Scope Semua Data' : 'Scope Unit Kerja'}
                tone="neutral"
              />
            ) : null}
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
          value={totalAsn}
          tone="info"
          description="Jumlah data ASN pada master SIDATA."
        />
        <StatCard
          icon={UserCheck}
          label="ASN Aktif"
          value={activeAsn}
          tone="success"
          description="Data ASN dengan status aktif."
        />
        <StatCard
          icon={UserRoundX}
          label="ASN Nonaktif"
          value={inactiveAsn}
          tone={inactiveAsn > 0 ? 'warning' : 'success'}
          description="Data ASN nonaktif/berhenti/pensiun/meninggal."
        />
        <StatCard
          icon={BarChart3}
          label="Quality Score"
          value={formatPercent(qualityScore)}
          tone={getQualityTone(qualityScore)}
          description="Persentase ASN yang lengkap pada field inti."
        />
        <StatCard
          icon={CheckCircle2}
          label="Data Inti Lengkap"
          value={completeCoreRows}
          tone="success"
          description="ASN dengan unit, jabatan, golongan, NIK, tanggal lahir, TMT pensiun, dan profil SIASN."
        />
        <StatCard
          icon={ShieldAlert}
          label="Issue Rows"
          value={issueRows}
          tone={getIssueTone(issueRows)}
          description="ASN yang masih memiliki kekurangan field inti."
        />
        <StatCard
          icon={CalendarClock}
          label={`BUP ${qualityDashboard?.period.bupWindowMonths ?? 12} Bulan`}
          value={qualityDashboard?.retirement.bupNext12Months ?? 0}
          tone="warning"
          description="ASN aktif yang mencapai BUP dalam periode pemantauan."
        />
        <StatCard
          icon={AlertTriangle}
          label="BUP Overdue Aktif"
          value={qualityDashboard?.retirement.bupOverdueActive ?? 0}
          tone={(qualityDashboard?.retirement.bupOverdueActive ?? 0) > 0 ? 'danger' : 'success'}
          description="ASN aktif yang melewati TMT pensiun."
        />
      </div>

      {qualityDashboard ? (
        <SectionCard
          title="Kualitas Master ASN"
          description={`Data dihitung dari backend pada ${formatDateTime(qualityDashboard.generatedAt)}. Periode BUP: ${formatDateOnly(
            qualityDashboard.period.today,
          )} sampai ${formatDateOnly(qualityDashboard.period.bupUntil)}.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={`${formatPercent(qualityScore)} Quality`} tone={getQualityTone(qualityScore)} />
              <StatusBadge value={`${issueRows} Issue`} tone={getIssueTone(issueRows)} />
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Database}
              label="PNS"
              value={qualityDashboard.totals.pns}
              tone="info"
              description="ASN dengan jenis PNS."
            />
            <StatCard
              icon={Database}
              label="PPPK"
              value={qualityDashboard.totals.pppk}
              tone="info"
              description="ASN dengan jenis PPPK."
            />
            <StatCard
              icon={Database}
              label="PPPK Paruh Waktu"
              value={qualityDashboard.totals.pppkParuhWaktu}
              tone="info"
              description="ASN dengan jenis PPPK Paruh Waktu."
            />
            <StatCard
              icon={ShieldCheck}
              label="Core Complete"
              value={completeCoreRows}
              tone="success"
              description="Baris ASN yang memenuhi kelengkapan inti."
            />

            <StatCard
              icon={AlertTriangle}
              label="Tanpa Unit Kerja"
              value={qualityDashboard.completeness.withoutUnitKerja}
              tone={getIssueTone(qualityDashboard.completeness.withoutUnitKerja)}
              description="ASN yang belum memiliki unit kerja."
            />
            <StatCard
              icon={AlertTriangle}
              label="Tanpa Jabatan"
              value={qualityDashboard.completeness.withoutJabatan}
              tone={getIssueTone(qualityDashboard.completeness.withoutJabatan)}
              description="ASN yang belum memiliki jabatan."
            />
            <StatCard
              icon={AlertTriangle}
              label="Tanpa Golongan"
              value={qualityDashboard.completeness.withoutGolongan}
              tone={getIssueTone(qualityDashboard.completeness.withoutGolongan)}
              description="ASN yang belum memiliki golongan."
            />
            <StatCard
              icon={IdCard}
              label="Tanpa NIK"
              value={qualityDashboard.completeness.withoutNik}
              tone={getIssueTone(qualityDashboard.completeness.withoutNik)}
              description="ASN yang belum memiliki NIK."
            />
            <StatCard
              icon={CalendarClock}
              label="Tanpa Tanggal Lahir"
              value={qualityDashboard.completeness.withoutTanggalLahir}
              tone={getIssueTone(qualityDashboard.completeness.withoutTanggalLahir)}
              description="ASN tanpa tanggal lahir pada profil SIASN."
            />
            <StatCard
              icon={CalendarClock}
              label="Tanpa TMT Pensiun"
              value={qualityDashboard.completeness.withoutTmtPensiun}
              tone={getIssueTone(qualityDashboard.completeness.withoutTmtPensiun)}
              description="ASN yang belum memiliki TMT pensiun."
            />
            <StatCard
              icon={Database}
              label="Tanpa Profil SIASN"
              value={qualityDashboard.completeness.withoutSiasnProfile}
              tone={getIssueTone(qualityDashboard.completeness.withoutSiasnProfile)}
              description="ASN yang belum memiliki profil SIASN."
            />
            <StatCard
              icon={ShieldAlert}
              label="Total Issue"
              value={issueRows}
              tone={getIssueTone(issueRows)}
              description="Jumlah ASN yang belum lengkap pada field inti."
            />
          </div>
        </SectionCard>
      ) : null}

      {qualityDashboard ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard
            title="Breakdown Status ASN"
            description="Komposisi data ASN berdasarkan status kepegawaian."
          >
            {statusBreakdown.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Belum ada breakdown status"
                description="Data breakdown status ASN belum tersedia."
              />
            ) : (
              <DataTable
                empty="Belum ada data status ASN"
                items={statusBreakdown}
                rowKey={(item) => item.key}
                columns={[
                  {
                    key: 'label',
                    header: 'Status',
                    render: (item) => <StatusBadge value={item.label} tone="info" />,
                  },
                  {
                    key: 'total',
                    header: 'Total',
                    render: (item) => (
                      <span className="font-mono text-sm font-semibold">{item.total}</span>
                    ),
                  },
                  {
                    key: 'percentage',
                    header: 'Persentase',
                    render: (item) => (
                      <span className="text-sm text-muted-foreground">
                        {item.displayPercentage}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Breakdown Jenis ASN"
            description="Komposisi data ASN berdasarkan jenis pegawai."
          >
            {jenisAsnBreakdown.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Belum ada breakdown jenis ASN"
                description="Data breakdown jenis ASN belum tersedia."
              />
            ) : (
              <DataTable
                empty="Belum ada data jenis ASN"
                items={jenisAsnBreakdown}
                rowKey={(item) => item.key}
                columns={[
                  {
                    key: 'label',
                    header: 'Jenis ASN',
                    render: (item) => <StatusBadge value={item.label} tone="dark" />,
                  },
                  {
                    key: 'total',
                    header: 'Total',
                    render: (item) => (
                      <span className="font-mono text-sm font-semibold">{item.total}</span>
                    ),
                  },
                  {
                    key: 'percentage',
                    header: 'Persentase',
                    render: (item) => (
                      <span className="text-sm text-muted-foreground">
                        {item.displayPercentage}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </SectionCard>
        </div>
      ) : null}

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
