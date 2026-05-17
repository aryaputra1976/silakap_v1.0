import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  GitCompareArrows,
  Loader2,
  RefreshCcw,
  Search,
  TableProperties,
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
  StatCard,
  StatusBadge,
  Toolbar,
  formatDateTime,
} from '@/components/workspace/ui';
import { SidataSopPanel } from '@/components/workspace/sidata/sidata-sop-panel';
import { SidataDiscrepancyTable } from '@/components/workspace/sidata/sidata-discrepancy-table';
import { SIDATA_SOP_LIST } from '@/lib/sidata/sidata-sop-data';

type TypeFilter = '' | ReconciliationType;

const LIMIT = 20;

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: '', label: 'Semua perlu perhatian' },
  { value: 'DIFFERENT', label: 'Beda data' },
  { value: 'ONLY_IN_BATCH', label: 'Hanya di batch' },
  { value: 'ONLY_IN_MASTER', label: 'Hanya di master' },
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
  if (type === 'ONLY_IN_BATCH') return 'Hanya Batch';
  if (type === 'ONLY_IN_MASTER') return 'Hanya Master';
  if (type === 'DIFFERENT') return 'Beda';
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
        <span className="text-muted-foreground">Master:</span>{' '}
        <span className="font-medium text-zinc-900">{master ?? '-'}</span>
      </div>
      <div className="rounded border border-sky-200 bg-sky-50 px-2 py-1">
        <span className="text-sky-700">Batch:</span>{' '}
        <span className="font-medium text-zinc-900">{batch ?? '-'}</span>
      </div>
    </div>
  );
}

function DiffList({ row }: { row: ReconciliationRow }) {
  if (row.type === 'ONLY_IN_BATCH') {
    return <span className="text-sm text-amber-700">NIP belum ada di master ASN.</span>;
  }

  if (row.type === 'ONLY_IN_MASTER') {
    return <span className="text-sm text-rose-700">NIP tidak ditemukan di batch SIASN ini.</span>;
  }

  if (row.diffs.length === 0) {
    return <span className="text-sm text-emerald-700">Data master dan batch selaras.</span>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        title="Rekonsiliasi Data ASN"
        description="Bandingkan master ASN SIDATA dengan batch SIASN staging untuk menemukan data baru, hilang, dan berbeda."
        meta={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value="SIDATA" tone="info" />
            <StatusBadge value="Rekonsiliasi" tone="dark" />
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
          title="Batch Terpilih"
          description="Snapshot batch yang sedang dibandingkan dengan master ASN."
          actions={
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={selectedBatch.status} />
              <StatusBadge value={`${selectedBatch.totalRows} rows`} tone="info" />
            </div>
          }
        >
          <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">File</div>
              <div className="mt-1 font-semibold text-zinc-900">{getBatchLabel(selectedBatch)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Import Type</div>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={AlertTriangle} label="Perlu Perhatian" value={response.summary.attentionRows} tone="warning" description="Total data baru, hilang, dan berbeda." />
          <StatCard icon={GitCompareArrows} label="Beda Data" value={response.summary.different} tone="info" description="NIP sama, atribut berbeda." />
          <StatCard icon={TableProperties} label="Hanya di Batch" value={response.summary.onlyInBatch} tone="warning" description="Ada di SIASN batch, belum ada di master." />
          <StatCard icon={Database} label="Hanya di Master" value={response.summary.onlyInMaster} tone="danger" description="Ada di master, tidak ada di batch ini." />
          <StatCard icon={Database} label="Batch Rows" value={response.summary.totalBatchRows} description="Jumlah row staging pada batch." />
          <StatCard icon={Database} label="Master Rows" value={response.summary.totalMasterRows} description="Jumlah ASN aktif di master." />
          <StatCard icon={GitCompareArrows} label="Sama" value={response.summary.same} tone="success" description="NIP dan atribut kunci selaras." />
          <StatCard icon={TableProperties} label="Ditampilkan" value={total} description="Jumlah hasil sesuai filter." />
        </div>
      ) : null}

      <SectionCard
        title="Row-Level Diff"
        description="Perbandingan NIP, unit, jabatan, golongan, dan status ASN antara master dan batch."
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
                header: 'Status',
                render: (item) => <StatusBadge value={typeLabel(item.type)} tone={typeTone(item.type)} />,
                className: 'w-32',
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
                header: 'Master',
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
                header: 'Batch',
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
                header: 'Diff',
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

      {/* Discrepancy summary for attention rows */}
      {response && response.items.length > 0 && (
        <SectionCard
          title="Ringkasan Diskrepansi"
          description="Baris dengan perbedaan data antara master SIDATA dan batch SIASN."
        >
          <SidataDiscrepancyTable
            items={response.items.filter((r) => r.type !== 'SAME').slice(0, 10)}
            empty="Tidak ada diskrepansi pada halaman ini"
          />
        </SectionCard>
      )}

      {/* SOP Reference */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Catatan Rekonsiliasi</p>
          <p className="mt-1">
            Rekonsiliasi membandingkan data batch SIASN dengan master SIDATA. Baris <em>DIFFERENT</em> menunjukkan
            perubahan yang perlu dikonfirmasi sebelum commit. Baris <em>ONLY_IN_BATCH</em> adalah ASN baru dari SIASN.
            Baris <em>ONLY_IN_MASTER</em> adalah ASN yang tidak lagi ada di data SIASN terbaru.
          </p>
        </div>
        <SidataSopPanel
          sops={SIDATA_SOP_LIST.filter((s) => s.key === 'DAT-002' || s.key === 'SIK-002')}
          title="SOP Rekonsiliasi"
          compact
        />
      </div>
    </div>
  );
}
