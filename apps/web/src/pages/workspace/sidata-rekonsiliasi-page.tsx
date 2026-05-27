import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  GitCompareArrows,
  Loader2,
  RefreshCcw,
  Search,
} from 'lucide-react';
import {
  sidataImportApi,
  type ReconciliationResponse,
  type ReconciliationRow,
  type ReconciliationType,
  type SiasnImportBatch,
} from '@/lib/api/sidata-import';
import { ApiError } from '@/lib/api/client';
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
  StatusBadge,
  Toolbar,
  formatDateTime,
} from '@/components/workspace/ui';

type TypeFilter = '' | ReconciliationType;

const LIMIT = 20;

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: '', label: 'Semua yang perlu dicek' },
  { value: 'ONLY_IN_BATCH', label: 'Data baru' },
  { value: 'DIFFERENT', label: 'Berubah' },
  { value: 'ONLY_IN_MASTER', label: 'Tidak ada di file' },
  { value: 'SAME', label: 'Sama' },
];

function shortId(id: string) {
  return id.slice(0, 8);
}

function getBatchLabel(batch: SiasnImportBatch) {
  return batch.fileName ?? batch.importType ?? shortId(batch.id);
}

function getErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

function typeLabel(type: ReconciliationType) {
  if (type === 'ONLY_IN_BATCH') return 'Data Baru';
  if (type === 'ONLY_IN_MASTER') return 'Tidak Ada di File';
  if (type === 'DIFFERENT') return 'Berubah';
  return 'Sama';
}

function typeTone(type: ReconciliationType): 'warning' | 'danger' | 'info' | 'success' {
  if (type === 'ONLY_IN_BATCH') return 'warning';
  if (type === 'ONLY_IN_MASTER') return 'danger';
  if (type === 'DIFFERENT') return 'info';
  return 'success';
}

function ValuePair({
  label,
  master,
  batch,
}: {
  label: string;
  master: string | null | undefined;
  batch: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 text-xs">
      <div className="font-semibold text-zinc-700">{label}</div>
      <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
        <span className="text-muted-foreground">Master saat ini:</span>{' '}
        <span className="font-medium text-zinc-900">{master ?? '-'}</span>
      </div>
      <div className="rounded border border-sky-200 bg-sky-50 px-2 py-1">
        <span className="text-sky-700">Data file:</span>{' '}
        <span className="font-medium text-zinc-900">{batch ?? '-'}</span>
      </div>
    </div>
  );
}

function DiffList({ row }: { row: ReconciliationRow }) {
  if (row.type === 'ONLY_IN_BATCH') {
    return <span className="text-sm text-amber-700">ASN belum ada di Master ASN dan akan dibuat baru.</span>;
  }

  if (row.type === 'ONLY_IN_MASTER') {
    return <span className="text-sm text-rose-700">ASN ada di Master ASN, tetapi tidak ada di file import ini.</span>;
  }

  if (row.diffs.length === 0) {
    return <span className="text-sm text-emerald-700">Data master dan file import sama.</span>;
  }

  return (
    <div className="grid gap-2">
      {row.diffs.map((diff) => (
        <ValuePair
          key={diff.field}
          label={diff.label}
          master={diff.master}
          batch={diff.batch}
        />
      ))}
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  tone = 'neutral',
  value,
}: {
  icon: typeof Database;
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  value: number;
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

export function SidataRekonsiliasiPage() {
  const [batches, setBatches] = useState<SiasnImportBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [response, setResponse] = useState<ReconciliationResponse | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('');
  const [page, setPage] = useState(1);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setResponse(null);
      return;
    }
    void loadReconciliation(selectedBatchId, page, q, type);
     
  }, [selectedBatchId, page, q, type]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );

  const total = response?.total ?? 0;
  const canPrev = page > 1;
  const canNext = response ? page * response.limit < response.total : false;

  async function loadBatches() {
    setLoadingBatches(true);
    setError('');
    try {
      const result = await sidataImportApi.listAsnBatches();
      setBatches(result);
      setSelectedBatchId((current) => current || result[0]?.id || '');
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat batch ASN'));
    } finally {
      setLoadingBatches(false);
    }
  }

  async function loadReconciliation(
    batchId: string,
    nextPage: number,
    nextQ: string,
    nextType: TypeFilter,
  ) {
    setLoadingReconciliation(true);
    setError('');
    try {
      const result = await sidataImportApi.getAsnReconciliation(batchId, {
        page: nextPage,
        limit: LIMIT,
        q: nextQ || undefined,
        type: nextType,
      });
      setResponse(result);
    } catch (caught) {
      setResponse(null);
      setError(getErrorMessage(caught, 'Gagal memuat rekonsiliasi ASN'));
    } finally {
      setLoadingReconciliation(false);
    }
  }

  function submitSearch() {
    setPage(1);
    setQ(queryInput);
  }

  function resetFilters() {
    setQueryInput('');
    setQ('');
    setType('');
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekonsiliasi Data SIDATA"
        description="Preview perubahan data sebelum batch SIASN disimpan ke Master ASN."
        meta={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value="SIDATA" tone="info" />
            <StatusBadge value="Preview Import" tone="dark" />
          </div>
        }
        actions={
          <ActionButton
            disabled={loadingBatches || loadingReconciliation}
            icon={loadingBatches ? Loader2 : RefreshCcw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <select
            className={inputClass}
            disabled={loadingBatches}
            value={selectedBatchId}
            onChange={(event) => {
              setSelectedBatchId(event.target.value);
              setPage(1);
            }}
          >
            {batches.length === 0 ? <option value="">Belum ada batch ASN</option> : null}
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {getBatchLabel(batch)}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={type}
            onChange={(event) => {
              setType(event.target.value as TypeFilter);
              setPage(1);
            }}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value || 'attention'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari NIP, nama, unit, jabatan..."
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch();
              }}
            />
          </div>
        </FilterBar>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionButton icon={Search} onClick={submitSearch} variant="secondary">
            Cari
          </ActionButton>
          <ActionButton icon={RefreshCcw} onClick={resetFilters} variant="secondary">
            Reset
          </ActionButton>
        </div>
      </Toolbar>

      {selectedBatch ? (
        <SectionCard
          title="Batch yang Dicek"
          description="File import yang sedang dibandingkan dengan Master ASN."
          actions={
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={selectedBatch.status} />
              <StatusBadge value={`${selectedBatch.totalRows} baris`} tone="info" />
            </div>
          }
        >
          <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">File</div>
              <div className="mt-1 font-semibold text-zinc-900">{getBatchLabel(selectedBatch)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Jenis Import</div>
              <div className="mt-1 font-semibold text-zinc-900">{selectedBatch.importType}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Dibuat</div>
              <div className="mt-1 font-semibold text-zinc-900">{formatDateTime(selectedBatch.createdAt)}</div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {response ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryTile icon={GitCompareArrows} label="Perlu Dicek" value={response.summary.attentionRows} tone="warning" />
          <SummaryTile icon={FileSpreadsheet} label="Data Baru" value={response.summary.onlyInBatch} tone="warning" />
          <SummaryTile icon={GitCompareArrows} label="Berubah" value={response.summary.different} tone="info" />
          <SummaryTile icon={Database} label="Tidak Ada di File" value={response.summary.onlyInMaster} tone="danger" />
          <SummaryTile icon={CheckCircle2} label="Sama" value={response.summary.same} tone="success" />
        </div>
      ) : null}

      <SectionCard
        title="Preview Perubahan"
        description="Bandingkan data Master ASN saat ini dengan data dari file import."
      >
        {loadingBatches || loadingReconciliation ? (
          <LoadingState label="Memuat rekonsiliasi ASN" />
        ) : !selectedBatchId ? (
          <EmptyState
            icon={Database}
            title="Belum ada batch ASN"
            description="Upload batch ASN SIASN terlebih dahulu untuk menjalankan rekonsiliasi."
          />
        ) : !response || response.items.length === 0 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Tidak ada hasil untuk filter ini"
            description="Coba ubah tipe rekonsiliasi atau kata kunci pencarian."
          />
        ) : (
          <DataTable
            items={response.items}
            rowKey={(item) => item.key}
            columns={[
              {
                key: 'status',
                header: 'Jenis',
                render: (item) => <StatusBadge value={typeLabel(item.type)} tone={typeTone(item.type)} />,
                className: 'w-[150px]',
              },
              {
                key: 'identity',
                header: 'ASN',
                render: (item) => (
                  <div className="max-w-[240px]">
                    <div className="font-semibold text-zinc-900">{item.nama ?? '-'}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{item.nip ?? '-'}</div>
                    {item.batch ? (
                      <div className="mt-1 text-xs text-muted-foreground">Row #{item.batch.rowNumber}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'master',
                header: 'Master Saat Ini',
                render: (item) => (
                  <div className="grid max-w-[260px] gap-1 text-xs">
                    <span className="font-semibold text-zinc-900">{item.master?.unitKerjaNama ?? '-'}</span>
                    <span>{item.master?.jabatanNama ?? '-'}</span>
                    <span className="text-muted-foreground">{item.master?.golonganNama ?? '-'}</span>
                  </div>
                ),
              },
              {
                key: 'batch',
                header: 'Data File',
                render: (item) => (
                  <div className="grid max-w-[260px] gap-1 text-xs">
                    <span className="font-semibold text-zinc-900">{item.batch?.unitKerjaNama ?? '-'}</span>
                    <span>{item.batch?.jabatanNama ?? '-'}</span>
                    <span className="text-muted-foreground">{item.batch?.golonganNama ?? '-'}</span>
                  </div>
                ),
              },
              {
                key: 'diff',
                header: 'Perubahan',
                render: (item) => <DiffList row={item} />,
              },
            ]}
          />
        )}

        {response && response.items.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
            <span className="text-muted-foreground">
              Total {response.total} hasil - halaman {response.page}
            </span>
            <div className="flex gap-2">
              <ActionButton
                disabled={!canPrev || loadingReconciliation}
                icon={ChevronLeft}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="secondary"
              >
                Sebelumnya
              </ActionButton>
              <ActionButton
                disabled={!canNext || loadingReconciliation}
                icon={ChevronRight}
                onClick={() => setPage((current) => current + 1)}
                variant="secondary"
              >
                Berikutnya
              </ActionButton>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">Catatan sebelum Simpan ke Master</p>
        <p className="mt-1 leading-6">
          Data Baru akan dibuat sebagai ASN baru. Berubah akan memperbarui data ASN yang NIP-nya sudah ada.
          Tidak Ada di File perlu dicek manual, karena ASN masih ada di Master ASN tetapi tidak muncul pada file import ini.
        </p>
      </div>
    </div>
  );
}
