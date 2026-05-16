import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Filter,
  FolderSync,
  Layers3,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sidataImportApi } from '@/lib/api/sidata-import';
import {
  buildImportAggregate,
  getBatchFileName,
  getBatchTypeLabel,
  getErrorMessage,
  mergeImportBatches,
  shortId,
  toNumber,
  type SidataBatchKind,
  type SidataBatchListResponse,
  type SidataImportBatchWithKind,
  type SidataImportSummary,
} from '@/lib/sidata';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
  formatDateTime,
} from '@/components/workspace/ui';

type StatusFilter = '' | 'UPLOADED' | 'PROCESSING' | 'VALIDATED' | 'MAPPED' | 'COMMITTED' | 'FAILED' | 'CANCELLED';
type KindFilter = '' | SidataBatchKind;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'Semua status' },
  { value: 'UPLOADED', label: 'UPLOADED' },
  { value: 'PROCESSING', label: 'PROCESSING' },
  { value: 'VALIDATED', label: 'VALIDATED' },
  { value: 'MAPPED', label: 'MAPPED' },
  { value: 'COMMITTED', label: 'COMMITTED' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: '', label: 'Semua jenis batch' },
  { value: 'ASN', label: 'ASN' },
  { value: 'REFERENCE', label: 'Referensi' },
];

function matchesSearch(batch: SidataImportBatchWithKind, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const searchable = [
    batch.id,
    batch.fileName,
    batch.originalFileName,
    batch.importType,
    batch.referenceType,
    batch.jenisJabatan,
    batch.source,
    batch.status,
    batch.kind,
  ]
    .map((v) => (v ?? '').toLowerCase())
    .join(' ');
  return searchable.includes(q);
}

export function SidataImportRiwayatPage() {
  const navigate = useNavigate();

  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SidataImportBatchWithKind | null>(null);
  const [summary, setSummary] = useState<SidataImportSummary | null>(null);

  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setSummary(null);
      setSummaryError('');
      return;
    }
    void loadSummary(selectedBatch);
  }, [selectedBatch]);

  const filteredBatches = useMemo(
    () =>
      batches
        .filter((item) => matchesSearch(item, q))
        .filter((item) => !kindFilter || item.kind === kindFilter)
        .filter(
          (item) => !statusFilter || (item.status ?? '').toUpperCase() === statusFilter,
        ),
    [batches, kindFilter, q, statusFilter],
  );

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);

  async function loadBatches() {
    setLoading(true);
    setError('');

    try {
      const [asnResponse, referenceResponse] = await Promise.all([
        sidataImportApi.listAsnBatches(),
        sidataImportApi.listReferenceBatches(),
      ]);

      const merged = mergeImportBatches(asnResponse, referenceResponse);
      setBatches(merged);

      if (selectedBatch) {
        const updated = merged.find(
          (item) => item.id === selectedBatch.id && item.kind === selectedBatch.kind,
        );
        setSelectedBatch(updated ?? null);
      }
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat riwayat import SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary(batch: SidataImportBatchWithKind) {
    setLoadingSummary(true);
    setSummaryError('');

    try {
      const result =
        batch.kind === 'ASN'
          ? await sidataImportApi.getAsnBatchSummary(batch.id)
          : await sidataImportApi.getReferenceBatchSummary(batch.id);

      setSummary(result);
    } catch (caught) {
      setSummary(null);
      setSummaryError(getErrorMessage(caught, 'Gagal memuat summary batch'));
    } finally {
      setLoadingSummary(false);
    }
  }

  function toggleSelectedBatch(batch: SidataImportBatchWithKind) {
    if (selectedBatch?.id === batch.id && selectedBatch.kind === batch.kind) {
      setSelectedBatch(null);
    } else {
      setSelectedBatch(batch);
    }
  }

  function openWorkspace(batch: SidataImportBatchWithKind) {
    navigate(batch.kind === 'ASN' ? '/sidata/import/siasn' : '/sidata/import/referensi');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat Import SIDATA"
        description="Monitoring seluruh batch import ASN dan referensi sebagai kontrol sinkronisasi data SIDATA."
        meta={
          <>
            <StatusBadge value="SIDATA Import" tone="info" />
            <StatusBadge value="ASN" tone="dark" />
            <StatusBadge value="Referensi" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Committed"
          value={stats.committedBatch}
          tone="success"
          description="Batch yang sudah masuk data utama."
        />
        <StatCard
          icon={RotateCcw}
          label="Belum Commit"
          value={stats.notCommittedBatch}
          tone="warning"
          description="Batch yang masih perlu tindak lanjut."
        />
        <StatCard
          icon={AlertTriangle}
          label="Invalid Rows"
          value={stats.invalidRows}
          tone="danger"
          description="Total baris invalid dari seluruh batch."
        />
        <StatCard
          icon={ShieldCheck}
          label="Warning Rows"
          value={stats.warningRows}
          tone="warning"
          description="Total baris dengan catatan validasi."
        />
        <StatCard
          icon={FileSpreadsheet}
          label="Total Rows"
          value={stats.totalRows}
          description="Akumulasi baris semua batch import."
        />
      </div>

      <Toolbar>
        <FilterBar>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari batch, file, tipe, source…"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <select
            className={inputClass}
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as KindFilter)}
          >
            {KIND_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FilterBar>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionButton
            icon={Filter}
            onClick={() => {
              setQ('');
              setKindFilter('');
              setStatusFilter('');
            }}
            variant="secondary"
          >
            Reset
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Muat Ulang
          </ActionButton>
        </div>
      </Toolbar>

      <SectionCard
        title="Tabel Riwayat Import"
        description="Daftar terpadu seluruh batch import ASN dan referensi."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${filteredBatches.length} Ditampilkan`} tone="info" />
            <StatusBadge value={`${batches.length} Total`} tone="neutral" />
          </div>
        }
      >
        {loading ? (
          <LoadingState label="Memuat riwayat import SIDATA" />
        ) : (
          <DataTable
            empty="Belum ada batch import yang sesuai filter"
            items={filteredBatches}
            rowKey={(item) => `${item.kind}-${item.id}`}
            columns={[
              {
                key: 'batch',
                header: 'Batch',
                render: (item) => (
                  <button
                    className="font-mono text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
                    type="button"
                    onClick={() => toggleSelectedBatch(item)}
                  >
                    {shortId(item.id)}
                  </button>
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
                  <div className="max-w-[280px]">
                    <div className="truncate font-semibold text-zinc-900">
                      {getBatchFileName(item)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.importType ??
                        (item.kind === 'ASN' ? 'ASN_IMPORT' : 'REFERENCE_IMPORT')}
                    </div>
                  </div>
                ),
              },
              {
                key: 'type',
                header: 'Tipe / Source',
                render: (item) => (
                  <div className="space-y-1">
                    <StatusBadge value={getBatchTypeLabel(item)} tone="neutral" />
                    <div className="text-xs text-muted-foreground">
                      {item.kind === 'ASN' ? 'Sumber ASN' : 'Master Referensi'}
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
                render: (item) => {
                  const selected =
                    selectedBatch?.id === item.id && selectedBatch.kind === item.kind;
                  return (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => toggleSelectedBatch(item)}
                        variant={selected ? 'primary' : 'secondary'}
                      >
                        {selected ? 'Tutup' : 'Detail'}
                      </ActionButton>
                      <ActionButton
                        icon={ArrowRight}
                        onClick={() => openWorkspace(item)}
                        variant="secondary"
                      >
                        Workspace
                      </ActionButton>
                    </div>
                  );
                },
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Detail Batch Import"
        description="Summary batch terpilih untuk melihat kualitas data import sebelum tindak lanjut."
      >
        {!selectedBatch ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Pilih batch import"
            description="Klik batch pada tabel riwayat untuk melihat summary lengkap dan membuka workspace asal."
          />
        ) : loadingSummary ? (
          <LoadingState label="Memuat summary batch import" />
        ) : summaryError ? (
          <ErrorAlert message={summaryError} />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Batch Terpilih
                  </div>
                  <div className="mt-1 truncate font-mono text-sm font-semibold text-zinc-900">
                    {selectedBatch.id}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {getBatchFileName(selectedBatch)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    value={selectedBatch.kind === 'ASN' ? 'ASN' : 'Referensi'}
                    tone={selectedBatch.kind === 'ASN' ? 'info' : 'dark'}
                  />
                  <StatusBadge value={selectedBatch.status} />
                  <StatusBadge value={getBatchTypeLabel(selectedBatch)} tone="neutral" />
                  <ActionButton
                    icon={ArrowRight}
                    onClick={() => openWorkspace(selectedBatch)}
                    variant="secondary"
                  >
                    Buka Workspace
                  </ActionButton>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Database}
                label="Total Rows"
                value={toNumber(summary?.totalRows)}
                description="Jumlah seluruh baris pada file import."
              />
              <StatCard
                icon={CheckCircle2}
                label="Valid"
                value={toNumber(summary?.validRows)}
                tone="success"
                description="Baris yang lolos validasi."
              />
              <StatCard
                icon={AlertTriangle}
                label="Invalid"
                value={toNumber(summary?.invalidRows)}
                tone="danger"
                description="Baris yang tidak dapat diproses."
              />
              <StatCard
                icon={ShieldCheck}
                label="Warning"
                value={toNumber(summary?.warningRows)}
                tone="warning"
                description="Baris dengan catatan validasi."
              />
              <StatCard
                icon={Layers3}
                label="Mapped"
                value={toNumber(summary?.mappedRows)}
                tone="info"
                description="Baris yang berhasil dimapping."
              />
              <StatCard
                icon={RefreshCcw}
                label="Needs Review"
                value={toNumber(summary?.needsReviewRows)}
                tone="warning"
                description="Baris yang perlu pemeriksaan lanjutan."
              />
              <StatCard
                icon={RotateCcw}
                label="Unmapped"
                value={toNumber(summary?.unmappedRows)}
                description="Baris yang belum memiliki pasangan referensi."
              />
              <StatCard
                icon={CheckCircle2}
                label="Committed"
                value={toNumber(summary?.committedRows)}
                tone="success"
                description="Baris yang sudah masuk data utama."
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
