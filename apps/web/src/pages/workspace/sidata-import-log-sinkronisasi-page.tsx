import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Eye,
  Filter,
  GitMerge,
  Layers3,
  RefreshCcw,
  ScrollText,
  Search,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/types';
import { getErrorMessage, shortId } from '@/lib/sidata';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  FilterBar,
  formatDateTime,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

type SidataImportAuditLog = {
  id: string;
  batchId: string | null;
  batchType: string | null;
  action: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type BatchTypeFilter = '' | 'ASN' | 'REFERENCE';
type ActionFilter =
  | ''
  | 'UPLOAD_REFERENCE'
  | 'COMMIT_REFERENCE'
  | 'UPLOAD_ASN'
  | 'MAP_ASN'
  | 'COMMIT_ASN'
  | 'REMAP_ASN'
  | 'VIEW_ISSUES';

// ── Constants ─────────────────────────────────────────────────────────────────

const BATCH_TYPE_OPTIONS: Array<{ value: BatchTypeFilter; label: string }> = [
  { value: '', label: 'Semua jenis' },
  { value: 'ASN', label: 'ASN' },
  { value: 'REFERENCE', label: 'Reference' },
];

const ACTION_OPTIONS: Array<{ value: ActionFilter; label: string }> = [
  { value: '', label: 'Semua aksi' },
  { value: 'UPLOAD_REFERENCE', label: 'UPLOAD_REFERENCE' },
  { value: 'COMMIT_REFERENCE', label: 'COMMIT_REFERENCE' },
  { value: 'UPLOAD_ASN', label: 'UPLOAD_ASN' },
  { value: 'MAP_ASN', label: 'MAP_ASN' },
  { value: 'COMMIT_ASN', label: 'COMMIT_ASN' },
  { value: 'REMAP_ASN', label: 'REMAP_ASN' },
  { value: 'VIEW_ISSUES', label: 'VIEW_ISSUES' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type ActionTone = 'info' | 'success' | 'warning' | 'neutral';
type BatchTypeTone = 'info' | 'dark' | 'neutral';

function actionTone(action: string): ActionTone {
  if (action.startsWith('UPLOAD')) return 'info';
  if (action.startsWith('COMMIT')) return 'success';
  if (action === 'MAP_ASN' || action === 'REMAP_ASN') return 'warning';
  return 'neutral';
}

function batchTypeTone(batchType: string | null): BatchTypeTone {
  if (batchType === 'ASN') return 'info';
  if (batchType === 'REFERENCE') return 'dark';
  return 'neutral';
}

function metadataPreview(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '-';
  const keys = Object.keys(metadata).length;
  return keys === 0 ? '-' : `${keys} key${keys > 1 ? 's' : ''}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SidataImportLogSinkronisasiPage() {
  const [logs, setLogs] = useState<SidataImportAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedLog, setSelectedLog] = useState<SidataImportAuditLog | null>(null);

  // form state (updated as user types/selects)
  const [batchId, setBatchId] = useState('');
  const [batchType, setBatchType] = useState<BatchTypeFilter>('');
  const [action, setAction] = useState<ActionFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // active state (applied to API call)
  const [activeBatchId, setActiveBatchId] = useState('');
  const [activeBatchType, setActiveBatchType] = useState<BatchTypeFilter>('');
  const [activeAction, setActiveAction] = useState<ActionFilter>('');
  const [activeDateFrom, setActiveDateFrom] = useState('');
  const [activeDateTo, setActiveDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeBatchId, activeBatchType, activeAction, activeDateFrom, activeDateTo]);

  const stats = useMemo(() => {
    const asnLogs = logs.filter((l) => l.batchType === 'ASN').length;
    const referenceLogs = logs.filter((l) => l.batchType === 'REFERENCE').length;
    const commitActions = logs.filter((l) => l.action.startsWith('COMMIT')).length;
    const uploadActions = logs.filter((l) => l.action.startsWith('UPLOAD')).length;
    const mappingActions = logs.filter(
      (l) => l.action === 'MAP_ASN' || l.action === 'REMAP_ASN',
    ).length;
    const viewIssues = logs.filter((l) => l.action === 'VIEW_ISSUES').length;
    return { asnLogs, referenceLogs, commitActions, uploadActions, mappingActions, viewIssues };
  }, [logs]);

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.get<PaginatedResult<SidataImportAuditLog>>(
        '/sidata/import/audit-logs',
        {
          batchId: activeBatchId || undefined,
          batchType: activeBatchType || undefined,
          action: activeAction || undefined,
          dateFrom: activeDateFrom || undefined,
          dateTo: activeDateTo || undefined,
          page,
          limit,
        },
      );
      setLogs(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat log sinkronisasi'));
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setActiveBatchId(batchId);
    setActiveBatchType(batchType);
    setActiveAction(action);
    setActiveDateFrom(dateFrom);
    setActiveDateTo(dateTo);
    setPage(1);
  }

  function handleReset() {
    setBatchId('');
    setBatchType('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setActiveBatchId('');
    setActiveBatchType('');
    setActiveAction('');
    setActiveDateFrom('');
    setActiveDateTo('');
    setPage(1);
    setSelectedLog(null);
  }

  function toggleSelectedLog(log: SidataImportAuditLog) {
    setSelectedLog((prev) => (prev?.id === log.id ? null : log));
  }

  const canPrev = page > 1;
  const canNext = page * limit < total;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Log Sinkronisasi SIDATA"
        description="Audit trail aktivitas import, mapping, remap, commit, dan review issue data SIDATA."
        meta={
          <>
            <StatusBadge value="Audit Log" tone="info" />
            <StatusBadge value="SIDATA Import" tone="dark" />
            <StatusBadge value="Traceable" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadLogs()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      <div className="text-xs text-muted-foreground">
        SIDATA ASN / Import &amp; Sinkronisasi / Log Sinkronisasi
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ScrollText}
          label="Log Ditampilkan"
          value={logs.length}
          description="Jumlah log pada halaman ini."
        />
        <StatCard
          icon={Activity}
          label="Total Log"
          value={total}
          tone="info"
          description="Total seluruh log di database."
        />
        <StatCard
          icon={Database}
          label="ASN Logs"
          value={stats.asnLogs}
          tone="info"
          description="Log batch ASN pada halaman ini."
        />
        <StatCard
          icon={Layers3}
          label="Reference Logs"
          value={stats.referenceLogs}
          tone="dark"
          description="Log batch referensi pada halaman ini."
        />
        <StatCard
          icon={GitMerge}
          label="Commit Actions"
          value={stats.commitActions}
          tone="success"
          description="Aksi commit pada halaman ini."
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Upload Actions"
          value={stats.uploadActions}
          description="Aksi upload pada halaman ini."
        />
        <StatCard
          icon={ClipboardList}
          label="Mapping Actions"
          value={stats.mappingActions}
          tone="warning"
          description="Aksi map dan remap pada halaman ini."
        />
        <StatCard
          icon={Eye}
          label="View Issues"
          value={stats.viewIssues}
          description="Aksi view issues pada halaman ini."
        />
      </div>

      <Toolbar>
        <FilterBar>
          <input
            className={inputClass}
            placeholder="Filter Batch ID…"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          />
          <select
            className={inputClass}
            value={batchType}
            onChange={(e) => setBatchType(e.target.value as BatchTypeFilter)}
          >
            {BATCH_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={action}
            onChange={(e) => setAction(e.target.value as ActionFilter)}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterBar>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-600">Dari</label>
            <input
              className={inputClass}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-600">Sampai</label>
            <input
              className={inputClass}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <ActionButton icon={Search} onClick={handleSearch} variant="primary">
            Cari
          </ActionButton>
          <ActionButton icon={Filter} onClick={handleReset} variant="secondary">
            Reset
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadLogs()}
            variant="secondary"
          >
            Muat Ulang
          </ActionButton>
        </div>
      </Toolbar>

      <SectionCard
        title="Tabel Log Sinkronisasi"
        description="Daftar audit log aktivitas import dan sinkronisasi data SIDATA."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${logs.length} Ditampilkan`} tone="info" />
            <StatusBadge value={`${total} Total`} tone="neutral" />
          </div>
        }
      >
        {loading ? (
          <LoadingState label="Memuat log sinkronisasi" />
        ) : (
          <DataTable
            empty="Belum ada log yang sesuai filter"
            items={logs}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'waktu',
                header: 'Waktu',
                render: (item) => (
                  <span className="whitespace-nowrap text-xs">
                    {formatDateTime(item.createdAt)}
                  </span>
                ),
              },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <StatusBadge value={item.action} tone={actionTone(item.action)} />
                ),
              },
              {
                key: 'batchType',
                header: 'Batch Type',
                render: (item) => (
                  <StatusBadge
                    value={item.batchType ?? '-'}
                    tone={batchTypeTone(item.batchType)}
                  />
                ),
              },
              {
                key: 'batchId',
                header: 'Batch ID',
                render: (item) => (
                  <span className="font-mono text-xs text-zinc-500">
                    {item.batchId ? shortId(item.batchId) : '-'}
                  </span>
                ),
              },
              {
                key: 'actor',
                header: 'Actor',
                render: (item) => (
                  <span className="font-mono text-xs text-zinc-500">
                    {item.actorId ? shortId(item.actorId) : '-'}
                  </span>
                ),
              },
              {
                key: 'metadata',
                header: 'Metadata',
                render: (item) => (
                  <span className="text-xs text-muted-foreground">
                    {metadataPreview(item.metadata)}
                  </span>
                ),
              },
              {
                key: 'detail',
                header: 'Aksi',
                render: (item) => (
                  <ActionButton
                    onClick={() => toggleSelectedLog(item)}
                    variant={selectedLog?.id === item.id ? 'primary' : 'secondary'}
                  >
                    {selectedLog?.id === item.id ? 'Tutup' : 'Detail'}
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-5 py-3 shadow-sm shadow-zinc-200/40">
        <span className="text-sm text-muted-foreground">
          Total {total} log, halaman {page}
        </span>
        <div className="flex gap-2">
          <ActionButton
            disabled={!canPrev || loading}
            icon={ChevronLeft}
            onClick={() => setPage((p) => p - 1)}
            variant="secondary"
          >
            Sebelumnya
          </ActionButton>
          <ActionButton
            disabled={!canNext || loading}
            icon={ChevronRight}
            onClick={() => setPage((p) => p + 1)}
            variant="secondary"
          >
            Berikutnya
          </ActionButton>
        </div>
      </div>

      <SectionCard title="Detail Log" description="Detail audit log yang dipilih.">
        {!selectedLog ? (
          <EmptyState
            icon={ScrollText}
            title="Pilih log untuk melihat detail"
            description="Klik tombol Detail pada baris log di tabel untuk menampilkan informasi lengkap."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={selectedLog.action} tone={actionTone(selectedLog.action)} />
                {selectedLog.batchType ? (
                  <StatusBadge
                    value={selectedLog.batchType}
                    tone={batchTypeTone(selectedLog.batchType)}
                  />
                ) : null}
              </div>
              <ActionButton icon={X} onClick={() => setSelectedLog(null)} variant="secondary">
                Tutup Detail
              </ActionButton>
            </div>

            <div className="grid gap-4 rounded-lg border border-border bg-zinc-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  ID Log
                </div>
                <div className="mt-1 break-all font-mono text-sm text-zinc-900">
                  {selectedLog.id}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Action
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {selectedLog.action}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Batch Type
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {selectedLog.batchType ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Batch ID
                </div>
                <div className="mt-1 break-all font-mono text-sm text-zinc-900">
                  {selectedLog.batchId ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Actor ID
                </div>
                <div className="mt-1 break-all font-mono text-sm text-zinc-900">
                  {selectedLog.actorId ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Dibuat Pada
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {formatDateTime(selectedLog.createdAt)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Metadata
              </div>
              {selectedLog.metadata ? (
                <pre className="w-full overflow-x-auto rounded-lg border border-border bg-zinc-900 p-4 text-xs leading-5 text-zinc-100">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">Tidak ada metadata.</div>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
