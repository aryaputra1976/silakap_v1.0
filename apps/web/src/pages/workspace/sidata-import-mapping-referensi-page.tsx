import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  FileDown,
  FileSpreadsheet,
  Filter,
  Layers3,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import {
  getBatchFileName,
  getCommitBlockReason,
  getErrorMessage,
  isCommitted,
  isCommitSafe,
  needsReviewBatch,
  normalizeIssueErrors,
  normalizeList,
  getPaginationMeta,
  shortId,
  sortByCreatedAtDesc,
  sumRows,
  toNumber,
  type SidataActionResult,
  type SidataBatchListResponse,
  type SidataImportBatch,
  type SidataImportIssueRow,
  type SidataImportSummary,
  type SidataIssueListResponse,
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
type IssueTab = 'issues' | 'needs-review' | 'invalid';
type ActionType = 'map' | 'remap' | 'commit';

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

const ISSUE_TABS: Array<{ value: IssueTab; label: string; description: string }> = [
  {
    value: 'issues',
    label: 'Semua Issue',
    description: 'Semua baris bermasalah dari batch ASN terpilih.',
  },
  {
    value: 'needs-review',
    label: 'Perlu Review',
    description: 'Baris yang perlu pemeriksaan manual sebelum commit.',
  },
  {
    value: 'invalid',
    label: 'Invalid',
    description: 'Baris yang tidak lolos validasi.',
  },
];

const ISSUE_LIMIT = 20;

function matchesBatchSearch(batch: SidataImportBatch, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [batch.id, batch.fileName, batch.originalFileName, batch.importType, batch.source, batch.status]
    .map((v) => (v ?? '').toLowerCase())
    .join(' ')
    .includes(q);
}

function canShowMap(batch: SidataImportBatch, summary: SidataImportSummary | null) {
  const status = (batch.status ?? '').toUpperCase();
  return (
    !isCommitted(batch) &&
    (status === 'UPLOADED' ||
      status === 'VALIDATED' ||
      toNumber(summary?.mappedRows ?? batch.mappedRows) === 0)
  );
}

function canShowRemap(batch: SidataImportBatch, summary: SidataImportSummary | null) {
  return (
    !isCommitted(batch) &&
    toNumber(summary?.mappedRows ?? batch.mappedRows) > 0
  );
}

export function SidataImportMappingReferensiPage() {
  const [batches, setBatches] = useState<SidataImportBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SidataImportBatch | null>(null);
  const [summary, setSummary] = useState<SidataImportSummary | null>(null);

  const [batchQ, setBatchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [reviewOnly, setReviewOnly] = useState(true);

  const [issueTab, setIssueTab] = useState<IssueTab>('issues');
  const [issueQ, setIssueQ] = useState('');
  const [issuePage, setIssuePage] = useState(1);
  const [issues, setIssues] = useState<SidataImportIssueRow[]>([]);
  const [issueTotal, setIssueTotal] = useState(0);

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [issuesError, setIssuesError] = useState('');
  const [actionLoading, setActionLoading] = useState<ActionType | ''>('');
  const [exportingIssues, setExportingIssues] = useState(false);

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setSummary(null);
      setSummaryError('');
      setIssues([]);
      setIssueTotal(0);
      setIssuesError('');
      return;
    }
    void loadSummary(selectedBatch.id);
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedBatch) return;
    void loadIssues(selectedBatch.id, issueTab, issuePage, issueQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, issueTab, issuePage]);

  const filteredBatches = useMemo(
    () =>
      batches
        .filter((item) => matchesBatchSearch(item, batchQ))
        .filter((item) => !statusFilter || (item.status ?? '').toUpperCase() === statusFilter)
        .filter((item) => (reviewOnly ? needsReviewBatch(item) : true)),
    [batchQ, batches, reviewOnly, statusFilter],
  );

  const globalStats = useMemo(() => {
    const totalBatch = batches.length;
    const committed = batches.filter(isCommitted).length;
    return {
      totalBatch,
      notCommitted: totalBatch - committed,
      totalRows: sumRows(batches, 'totalRows'),
      mappedRows: sumRows(batches, 'mappedRows'),
      needsReviewRows: sumRows(batches, 'needsReviewRows'),
      unmappedRows: sumRows(batches, 'unmappedRows'),
      invalidRows: sumRows(batches, 'invalidRows'),
      warningRows: sumRows(batches, 'warningRows'),
    };
  }, [batches]);

  const hasProcessingBatch = useMemo(
    () => batches.some((item) => (item.status ?? '').toUpperCase() === 'PROCESSING'),
    [batches],
  );

  useEffect(() => {
    if (!hasProcessingBatch) return;
    const timer = setInterval(() => {
      void loadBatches();
      if (selectedBatch) {
        void loadSummary(selectedBatch.id);
      }
    }, 4_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProcessingBatch, selectedBatch?.id]);

  const canPreviousIssues = issuePage > 1;
  const canNextIssues = issuePage * ISSUE_LIMIT < issueTotal;

  async function loadBatches() {
    setLoadingBatches(true);
    setBatchError('');
    try {
      const response = await apiClient.get<SidataBatchListResponse>('/sidata/import/asn-batches');
      const normalized = normalizeList(response).sort(sortByCreatedAtDesc);
      setBatches(normalized);
      if (selectedBatch) {
        const updated = normalized.find((item) => item.id === selectedBatch.id);
        setSelectedBatch(updated ?? null);
      }
    } catch (caught) {
      setBatchError(getErrorMessage(caught, 'Gagal memuat batch ASN'));
    } finally {
      setLoadingBatches(false);
    }
  }

  async function loadSummary(batchId: string) {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const result = await apiClient.get<SidataImportSummary>(
        `/sidata/import/asn-batches/${batchId}/summary`,
      );
      setSummary(result);
      setIssuePage(1);
      await loadIssues(batchId, issueTab, 1, issueQ);
    } catch (caught) {
      setSummary(null);
      setSummaryError(getErrorMessage(caught, 'Gagal memuat summary batch ASN'));
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadIssues(batchId: string, tab: IssueTab, page: number, query: string) {
    setLoadingIssues(true);
    setIssuesError('');
    const endpoint =
      tab === 'issues'
        ? `/sidata/import/asn-batches/${batchId}/issues`
        : `/sidata/import/asn-batches/${batchId}/${tab}`;
    const params: Record<string, string | number | undefined> = {
      page,
      limit: ISSUE_LIMIT,
      q: query || undefined,
    };
    try {
      const response = await apiClient.get<SidataIssueListResponse>(endpoint, params);
      setIssues(normalizeList(response));
      setIssueTotal(getPaginationMeta(response).total);
    } catch (caught) {
      setIssues([]);
      setIssueTotal(0);
      setIssuesError(getErrorMessage(caught, 'Gagal memuat issue mapping ASN'));
    } finally {
      setLoadingIssues(false);
    }
  }

  async function runAction(action: ActionType) {
    if (!selectedBatch) {
      toast.error('Pilih batch ASN terlebih dahulu.');
      return;
    }
    if (action === 'commit' && !isCommitSafe(summary)) {
      toast.error(`Commit belum aman: ${getCommitBlockReason(summary)}.`);
      return;
    }
    if (action === 'commit') {
      const confirmed = window.confirm(
        `Commit batch ${shortId(selectedBatch.id)} ke data ASN utama? Pastikan semua issue sudah diselesaikan.`,
      );
      if (!confirmed) return;
    }
    setActionLoading(action);
    const endpoint =
      action === 'map'
        ? `/sidata/import/asn-batches/${selectedBatch.id}/map`
        : action === 'remap'
          ? `/sidata/import/asn-batches/${selectedBatch.id}/remap`
          : `/sidata/import/asn-batches/${selectedBatch.id}/commit`;
    try {
      const result = await apiClient.post<SidataActionResult>(endpoint);
      toast.success(
        result.message ??
          (action === 'map'
            ? 'Mapping ASN berhasil dijalankan.'
            : action === 'remap'
              ? 'Remap ASN berhasil dijalankan.'
              : 'Commit ASN berhasil dijalankan.'),
      );
      await loadBatches();
      await loadSummary(selectedBatch.id);
    } catch (caught) {
      toast.error(
        getErrorMessage(
          caught,
          action === 'map'
            ? 'Gagal menjalankan map ASN'
            : action === 'remap'
              ? 'Gagal menjalankan remap ASN'
              : 'Gagal commit ASN',
        ),
      );
    } finally {
      setActionLoading('');
    }
  }

  function selectBatch(batch: SidataImportBatch) {
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch(null);
    } else {
      setSelectedBatch(batch);
      setIssueTab('issues');
      setIssueQ('');
      setIssuePage(1);
    }
  }

  function submitIssueSearch() {
    setIssuePage(1);
    if (selectedBatch) {
      void loadIssues(selectedBatch.id, issueTab, 1, issueQ);
    }
  }

  function changeIssueTab(tab: IssueTab) {
    setIssueTab(tab);
    setIssuePage(1);
  }

  async function exportIssuesCsv() {
    if (!selectedBatch) {
      toast.error('Pilih batch ASN terlebih dahulu.');
      return;
    }

    const status =
      issueTab === 'needs-review'
        ? 'NEEDS_REVIEW'
        : issueTab === 'invalid'
          ? 'INVALID'
          : undefined;

    setExportingIssues(true);
    try {
      await apiClient.download(
        `/sidata/import/asn-batches/${selectedBatch.id}/export-issues`,
        `sidata-asn-issues-${shortId(selectedBatch.id)}-${new Date().toISOString().slice(0, 10)}.csv`,
        {
          q: issueQ || undefined,
          status,
        },
      );
      toast.success('Export issue ASN berhasil dibuat.');
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal export issue ASN'));
    } finally {
      setExportingIssues(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mapping Referensi ASN"
        description="Review hasil mapping data ASN SIASN terhadap master referensi SIDATA sebelum commit ke data utama."
        meta={
          <>
            <StatusBadge value="SIDATA Mapping" tone="info" />
            <StatusBadge value="ASN" tone="dark" />
            <StatusBadge value="Quality Gate" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loadingBatches}
            icon={RefreshCcw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {batchError ? <ErrorAlert message={batchError} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="Total Batch ASN" value={globalStats.totalBatch} description="Jumlah batch import ASN SIASN." />
        <StatCard icon={RotateCcw} label="Belum Committed" value={globalStats.notCommitted} tone="warning" description="Batch yang masih perlu tindak lanjut." />
        <StatCard icon={FileSpreadsheet} label="Total Rows" value={globalStats.totalRows} description="Akumulasi baris seluruh batch ASN." />
        <StatCard icon={Layers3} label="Mapped Rows" value={globalStats.mappedRows} tone="info" description="Baris yang sudah termapping." />
        <StatCard icon={ShieldAlert} label="Needs Review" value={globalStats.needsReviewRows} tone="warning" description="Baris yang perlu review manual." />
        <StatCard icon={RefreshCcw} label="Unmapped" value={globalStats.unmappedRows} description="Baris yang belum punya referensi." />
        <StatCard icon={AlertTriangle} label="Invalid" value={globalStats.invalidRows} tone="danger" description="Baris yang tidak lolos validasi." />
        <StatCard icon={ShieldCheck} label="Warning" value={globalStats.warningRows} tone="warning" description="Baris dengan catatan validasi." />
      </div>

      <Toolbar>
        <FilterBar>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari batch, file, status, source…"
              value={batchQ}
              onChange={(event) => setBatchQ(event.target.value)}
            />
          </div>
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
          <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm font-semibold text-zinc-800">
            <input
              checked={reviewOnly}
              className="size-4"
              type="checkbox"
              onChange={(event) => setReviewOnly(event.target.checked)}
            />
            Hanya butuh review
          </label>
        </FilterBar>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionButton
            icon={Filter}
            onClick={() => {
              setBatchQ('');
              setStatusFilter('');
              setReviewOnly(true);
            }}
            variant="secondary"
          >
            Reset
          </ActionButton>
          <ActionButton disabled={loadingBatches} icon={RefreshCcw} onClick={() => void loadBatches()} variant="secondary">
            Muat Ulang
          </ActionButton>
        </div>
      </Toolbar>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <SectionCard
          title="Daftar Batch ASN"
          description="Pilih batch ASN untuk memeriksa hasil mapping dan issue validasi."
          actions={
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={`${filteredBatches.length} Ditampilkan`} tone="info" />
              <StatusBadge value={`${batches.length} Total`} tone="neutral" />
            </div>
          }
        >
          {loadingBatches ? (
            <LoadingState label="Memuat batch ASN" />
          ) : (
            <DataTable
              empty="Tidak ada batch ASN yang sesuai filter"
              items={filteredBatches}
              rowKey={(item) => item.id}
              columns={[
                {
                  key: 'batch',
                  header: 'Batch',
                  render: (item) => (
                    <button
                      className="font-mono text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => selectBatch(item)}
                    >
                      {shortId(item.id)}
                    </button>
                  ),
                },
                {
                  key: 'file',
                  header: 'File',
                  render: (item) => (
                    <div className="max-w-[260px]">
                      <div className="truncate font-semibold text-zinc-900">{getBatchFileName(item)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.source ?? item.importType ?? 'SIASN'}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => <StatusBadge value={item.status} />,
                },
                {
                  key: 'quality',
                  header: 'Quality',
                  render: (item) => (
                    <div className="grid gap-1 text-xs">
                      <span>Total: {toNumber(item.totalRows)}</span>
                      <span className="text-sky-700">Mapped: {toNumber(item.mappedRows)}</span>
                      <span className="text-amber-700">Review: {toNumber(item.needsReviewRows)}</span>
                      <span>Unmapped: {toNumber(item.unmappedRows)}</span>
                      <span className="text-rose-700">Invalid: {toNumber(item.invalidRows)}</span>
                    </div>
                  ),
                },
                {
                  key: 'action',
                  header: 'Aksi',
                  render: (item) => (
                    <ActionButton
                      onClick={() => selectBatch(item)}
                      variant={selectedBatch?.id === item.id ? 'primary' : 'secondary'}
                    >
                      {selectedBatch?.id === item.id ? 'Tutup' : 'Pilih'}
                    </ActionButton>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard title="Detail & Quality Gate" description="Validasi kesiapan batch ASN sebelum commit.">
          {!selectedBatch ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Pilih batch ASN"
              description="Pilih salah satu batch ASN untuk melihat summary, quality gate, dan action mapping."
            />
          ) : loadingSummary ? (
            <LoadingState label="Memuat summary batch ASN" />
          ) : summaryError ? (
            <ErrorAlert message={summaryError} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-zinc-50 p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Batch Terpilih</div>
                    <div className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900">{selectedBatch.id}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{getBatchFileName(selectedBatch)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={selectedBatch.status} />
                    <StatusBadge value={selectedBatch.source ?? 'SIASN'} tone="info" />
                    <StatusBadge
                      value={isCommitSafe(summary) ? 'Commit Aman' : 'Perlu Review'}
                      tone={isCommitSafe(summary) ? 'success' : 'warning'}
                    />
                  </div>
                </div>
              </div>

              <div
                className={
                  isCommitSafe(summary)
                    ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'
                    : 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'
                }
              >
                <div className="flex items-start gap-3">
                  {isCommitSafe(summary) ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {isCommitSafe(summary) ? 'Batch siap commit' : 'Commit belum aman'}
                    </div>
                    <div className="mt-1">
                      {isCommitSafe(summary)
                        ? 'Seluruh baris sudah mapped dan tidak ada invalid, needs review, atau unmapped.'
                        : getCommitBlockReason(summary)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canShowMap(selectedBatch, summary) && (
                  <ActionButton
                    disabled={Boolean(actionLoading)}
                    icon={actionLoading === 'map' ? Loader2 : Wand2}
                    onClick={() => void runAction('map')}
                    variant="secondary"
                  >
                    {actionLoading === 'map' ? 'Mapping…' : 'Map'}
                  </ActionButton>
                )}
                {canShowRemap(selectedBatch, summary) && (
                  <ActionButton
                    disabled={Boolean(actionLoading)}
                    icon={actionLoading === 'remap' ? Loader2 : RefreshCcw}
                    onClick={() => void runAction('remap')}
                    variant="secondary"
                  >
                    {actionLoading === 'remap' ? 'Remap…' : 'Remap'}
                  </ActionButton>
                )}
                {!isCommitted(selectedBatch) && (
                  <ActionButton
                    disabled={Boolean(actionLoading) || !isCommitSafe(summary)}
                    icon={actionLoading === 'commit' ? Loader2 : ShieldCheck}
                    onClick={() => void runAction('commit')}
                  >
                    {actionLoading === 'commit' ? 'Commit…' : 'Commit'}
                  </ActionButton>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard icon={Database} label="Total Rows" value={toNumber(summary?.totalRows)} description="Jumlah baris pada batch ASN." />
                <StatCard icon={CheckCircle2} label="Valid" value={toNumber(summary?.validRows)} tone="success" description="Baris yang lolos validasi." />
                <StatCard icon={AlertTriangle} label="Invalid" value={toNumber(summary?.invalidRows)} tone="danger" description="Baris yang tidak dapat diproses." />
                <StatCard icon={ShieldCheck} label="Warning" value={toNumber(summary?.warningRows)} tone="warning" description="Baris dengan catatan." />
                <StatCard icon={Layers3} label="Mapped" value={toNumber(summary?.mappedRows)} tone="info" description="Baris yang berhasil termapping." />
                <StatCard icon={ShieldAlert} label="Needs Review" value={toNumber(summary?.needsReviewRows)} tone="warning" description="Baris perlu pemeriksaan." />
                <StatCard icon={RotateCcw} label="Unmapped" value={toNumber(summary?.unmappedRows)} description="Baris belum termapping." />
                <StatCard icon={CheckCircle2} label="Committed" value={toNumber(summary?.committedRows)} tone="success" description="Baris sudah masuk data utama." />
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Issues / Needs Review"
        description="Daftar baris ASN yang perlu ditinjau sebelum batch dapat dicommit."
      >
        {!selectedBatch ? (
          <EmptyState
            icon={AlertTriangle}
            title="Belum ada batch dipilih"
            description="Pilih batch ASN untuk melihat daftar issue mapping dan validasi."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {ISSUE_TABS.map((item) => (
                  <button
                    key={item.value}
                    className={
                      issueTab === item.value
                        ? 'inline-flex h-10 items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 text-sm font-semibold text-white'
                        : 'inline-flex h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50'
                    }
                    type="button"
                    onClick={() => changeIssueTab(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    className={`${inputClass} w-full pl-10 sm:w-72`}
                    placeholder="Cari NIP, nama, unit, jabatan…"
                    value={issueQ}
                    onChange={(event) => setIssueQ(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') submitIssueSearch();
                    }}
                  />
                </div>
                <ActionButton disabled={loadingIssues} icon={Search} onClick={submitIssueSearch} variant="secondary">
                  Cari
                </ActionButton>
                <ActionButton
                  disabled={loadingIssues || exportingIssues}
                  icon={exportingIssues ? Loader2 : FileDown}
                  onClick={() => void exportIssuesCsv()}
                  variant="secondary"
                >
                  {exportingIssues ? 'Exporting...' : 'Export CSV'}
                </ActionButton>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-zinc-50 p-4 text-sm text-muted-foreground">
              {ISSUE_TABS.find((item) => item.value === issueTab)?.description}
            </div>

            {issuesError ? <ErrorAlert message={issuesError} /> : null}

            {loadingIssues ? (
              <LoadingState label="Memuat issue mapping ASN" />
            ) : (
              <DataTable
                empty="Tidak ada issue untuk filter ini"
                items={issues}
                rowKey={(item, index) =>
                  item.id ?? `${item.rowNumber}-${item.nip ?? 'no-nip'}-${index}`
                }
                columns={[
                  {
                    key: 'rowNumber',
                    header: 'Row',
                    render: (item) => (
                      <span className="font-mono text-xs font-semibold">#{item.rowNumber}</span>
                    ),
                    className: 'w-16',
                  },
                  {
                    key: 'asn',
                    header: 'ASN',
                    render: (item) => (
                      <div className="max-w-[260px]">
                        <div className="font-semibold text-zinc-900">{item.nama ?? '-'}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{item.nip ?? '-'}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'unit',
                    header: 'Unit / Jabatan',
                    render: (item) => (
                      <div className="max-w-[300px]">
                        <div className="text-sm text-zinc-800">{item.unitOrganisasiNama ?? '-'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.jabatanNama ?? '-'}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'golongan',
                    header: 'Gol / Jenis',
                    render: (item) => (
                      <div className="grid gap-1 text-xs">
                        <span>{item.golonganNama ?? '-'}</span>
                        <span className="text-muted-foreground">{item.jenisAsnNama ?? '-'}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'mapping',
                    header: 'Mapping',
                    render: (item) => <StatusBadge value={item.mappingStatus} />,
                    className: 'w-28',
                  },
                  {
                    key: 'validation',
                    header: 'Validasi',
                    render: (item) => <StatusBadge value={item.validationStatus} />,
                    className: 'w-24',
                  },
                  {
                    key: 'errors',
                    header: 'Error',
                    render: (item) => {
                      const errors = normalizeIssueErrors(item.validationErrors);
                      if (errors.length === 0) return <span className="text-zinc-400">—</span>;
                      return (
                        <ul className="max-w-[360px] list-disc space-y-1 pl-4 text-xs text-rose-700">
                          {errors.map((error, index) => (
                            <li key={`${item.rowNumber}-${index}`}>{error}</li>
                          ))}
                        </ul>
                      );
                    },
                  },
                ]}
              />
            )}

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
              <span className="text-muted-foreground">
                Total {issueTotal} issue — halaman {issuePage}
              </span>
              <div className="flex gap-2">
                <ActionButton
                  disabled={!canPreviousIssues || loadingIssues}
                  icon={ChevronLeft}
                  onClick={() => setIssuePage((p) => Math.max(1, p - 1))}
                  variant="secondary"
                >
                  Sebelumnya
                </ActionButton>
                <ActionButton
                  disabled={!canNextIssues || loadingIssues}
                  icon={ChevronRight}
                  onClick={() => setIssuePage((p) => p + 1)}
                  variant="secondary"
                >
                  Berikutnya
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
