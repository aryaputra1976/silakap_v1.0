import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download, GitCompareArrows, RefreshCw, Search } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { PaginatedResult } from '@/lib/api/types';
import type {
  FindingSummaryItem,
  ReconciliationFinding,
  ReconciliationPeriod,
} from '@/lib/reconciliation-bpkad/types';
import {
  FINDING_LABELS,
  FINDING_STATUS_LABELS,
  getFindingPriorityTone,
  RTL_ACTION_LABELS,
} from '@/lib/reconciliation-bpkad/types';
import { downloadCsv, toCsvRow } from '@/lib/utils/csv-export';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';

const ALL_CODES = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R08', 'R09'];

function SummaryGrid({ summary }: { summary: FindingSummaryItem[] }) {
  const byCode = Object.fromEntries(summary.map((s) => [s.findingCode, s.count]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_CODES.map((code) => {
        const count = byCode[code] ?? 0;
        const isSegera = ['R01', 'R02', 'R03', 'R04', 'R08', 'R09'].includes(code);
        return (
          <div
            key={code}
            className={`rounded-lg border p-3 ${count > 0 ? (isSegera ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50') : 'border-border bg-card'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-foreground">{code}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  count > 0
                    ? isSegera
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{FINDING_LABELS[code]}</p>
            <p className={`mt-1 text-xs font-medium ${isSegera ? 'text-red-600' : 'text-yellow-600'}`}>
              {isSegera ? 'Segera' : 'Bulan ini'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function RekonsiliasiBpkadTemuanPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [summary, setSummary] = useState<FindingSummaryItem[]>([]);
  const [findings, setFindings] = useState<PaginatedResult<ReconciliationFinding> | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [activeCode, setActiveCode] = useState<string>('');
  const [activePriority, setActivePriority] = useState<string>('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    reconciliationBpkadApi
      .fetchPeriods()
      .then((list) => {
        setPeriods(list);
        if (list.length > 0) setSelectedPeriodId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadSummary = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoadingSummary(true);
    try {
      const result = await reconciliationBpkadApi.fetchFindingsSummary(periodId);
      setSummary(result);
    } catch {
      setSummary([]);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadFindings = useCallback(
    async (periodId: string, opts: { code: string; priority: string; q: string; pg: number }) => {
      if (!periodId) return;
      setLoadingFindings(true);
      setError('');
      try {
        const result = await reconciliationBpkadApi.fetchFindings(periodId, {
          findingCode: opts.code || undefined,
          priority: opts.priority || undefined,
          q: opts.q.trim() || undefined,
          page: opts.pg,
          limit: 20,
        });
        setFindings(result);
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'Gagal memuat temuan.');
      } finally {
        setLoadingFindings(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedPeriodId) {
      loadSummary(selectedPeriodId);
      loadFindings(selectedPeriodId, { code: activeCode, priority: activePriority, q: query, pg: 1 });
    }
  }, [selectedPeriodId, loadSummary, loadFindings]);

  const handleFilter = (code: string, priority: string) => {
    setActiveCode(code);
    setActivePriority(priority);
    setPage(1);
    loadFindings(selectedPeriodId, { code, priority, q: query, pg: 1 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadFindings(selectedPeriodId, { code: activeCode, priority: activePriority, q: query, pg: 1 });
  };

  const handlePage = (nextPage: number) => {
    setPage(nextPage);
    loadFindings(selectedPeriodId, { code: activeCode, priority: activePriority, q: query, pg: nextPage });
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!selectedPeriodId) return;
    setExporting(true);
    try {
      const items = await reconciliationBpkadApi.exportFindings(selectedPeriodId, {
        findingCode: activeCode || undefined,
      });
      const header = toCsvRow([
        'Kode', 'Prioritas', 'NIP', 'Nama BKPSDM', 'Nama BPKAD',
        'Nilai BKPSDM', 'Nilai BPKAD', 'Status',
        'PIC RTL', 'Deadline RTL', 'Aksi RTL', 'Catatan RTL',
        'Tanggal Selesai',
      ]);
      const rows = items.map((f) =>
        toCsvRow([
          f.findingCode, f.priority, f.nip,
          f.namaBkpsdm, f.namaBpkad, f.bkpsdmValue, f.bpkadValue,
          FINDING_STATUS_LABELS[f.status] ?? f.status,
          f.rtlPic, f.rtlDeadline ? f.rtlDeadline.split('T')[0] : null,
          f.rtlAction ? (RTL_ACTION_LABELS[f.rtlAction] ?? f.rtlAction) : null,
          f.rtlNotes, f.resolvedAt ? f.resolvedAt.split('T')[0] : null,
        ]),
      );
      const period = periods.find((p) => p.id === selectedPeriodId);
      const slug = (period?.title ?? 'rekonsiliasi').replace(/\s+/g, '-').toLowerCase();
      downloadCsv(`temuan-${slug}.csv`, [header, ...rows]);
    } catch {
      /* silent — user sees no change */
    } finally {
      setExporting(false);
    }
  };

  const totalSegera = summary.filter((s) => s.priority === 'SEGERA').reduce((acc, s) => acc + s.count, 0);
  const totalBulanIni = summary.filter((s) => s.priority === 'BULAN_INI').reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Matriks Temuan Rekonsiliasi"
        description="Daftar temuan R01–R09 hasil pencocokan data ASN BKPSDM/SIASN dengan Simgaji BPKAD sesuai SOP."
        actions={
          <div className="flex gap-2">
            <ActionButton
              icon={Download}
              variant="secondary"
              onClick={handleExportCsv}
              disabled={!selectedPeriodId || exporting}
            >
              {exporting ? 'Mengekspor...' : 'Export CSV'}
            </ActionButton>
            <Link to="/rekonsiliasi-bpkad/matching">
              <ActionButton icon={GitCompareArrows} variant="secondary">
                Jalankan Matching
              </ActionButton>
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <select
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedPeriodId}
          onChange={(e) => {
            setSelectedPeriodId(e.target.value);
            setActiveCode('');
            setActivePriority('');
            setPage(1);
          }}
        >
          {periods.length === 0 && <option value="">— belum ada periode —</option>}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorAlert message={error} />}

      <SectionCard title="Ringkasan Temuan" description={`Total: ${totalSegera + totalBulanIni} temuan (${totalSegera} segera, ${totalBulanIni} bulan ini)`}>
        {loadingSummary ? (
          <LoadingState message="Memuat ringkasan..." />
        ) : summary.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Belum ada temuan"
            description="Jalankan matching terlebih dahulu untuk menghasilkan matriks temuan."
          />
        ) : (
          <SummaryGrid summary={summary} />
        )}
      </SectionCard>

      <SectionCard
        title="Daftar Temuan"
        description="Klik kode pada ringkasan di atas untuk filter per kode."
        actions={
          <ActionButton
            icon={RefreshCw}
            variant="ghost"
            onClick={() => {
              loadSummary(selectedPeriodId);
              loadFindings(selectedPeriodId, { code: activeCode, priority: activePriority, q: query, pg: page });
            }}
            disabled={!selectedPeriodId}
          >
            Refresh
          </ActionButton>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilter('', '')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activeCode === '' && activePriority === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              Semua
            </button>
            <button
              onClick={() => handleFilter('', 'SEGERA')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activePriority === 'SEGERA' && activeCode === '' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            >
              Segera ({totalSegera})
            </button>
            <button
              onClick={() => handleFilter('', 'BULAN_INI')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activePriority === 'BULAN_INI' && activeCode === '' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
            >
              Bulan ini ({totalBulanIni})
            </button>
            {ALL_CODES.map((code) => {
              const count = summary.find((s) => s.findingCode === code)?.count ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={code}
                  onClick={() => handleFilter(code, '')}
                  className={`rounded-full px-3 py-1 text-xs font-mono font-semibold transition-colors ${activeCode === code ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {code} ({count})
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Cari NIP, nama..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <ActionButton icon={Search} type="submit" variant="secondary">
              Cari
            </ActionButton>
          </form>
        </div>

        {loadingFindings ? (
          <LoadingState message="Memuat temuan..." />
        ) : !findings || findings.total === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Tidak ada temuan"
            description="Tidak ada temuan sesuai filter yang dipilih."
          />
        ) : (
          <>
            <DataTable<ReconciliationFinding>
              columns={[
                {
                  key: 'findingCode',
                  header: 'Kode',
                  render: (row) => (
                    <span className="font-mono font-bold">{row.findingCode}</span>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Prioritas',
                  render: (row) => (
                    <StatusBadge tone={getFindingPriorityTone(row.priority)}>
                      {row.priority === 'SEGERA' ? 'Segera' : 'Bulan ini'}
                    </StatusBadge>
                  ),
                },
                {
                  key: 'nip',
                  header: 'NIP',
                  render: (row) => <span className="font-mono text-xs">{row.nip ?? '-'}</span>,
                },
                {
                  key: 'namaBkpsdm',
                  header: 'Nama BKPSDM',
                  render: (row) => row.namaBkpsdm ?? '-',
                },
                {
                  key: 'namaBpkad',
                  header: 'Nama BPKAD',
                  render: (row) => row.namaBpkad ?? '-',
                },
                {
                  key: 'bkpsdmValue',
                  header: 'Nilai BKPSDM',
                  render: (row) => (
                    <span className="max-w-[180px] truncate block text-xs">{row.bkpsdmValue ?? '-'}</span>
                  ),
                },
                {
                  key: 'bpkadValue',
                  header: 'Nilai BPKAD',
                  render: (row) => (
                    <span className="max-w-[180px] truncate block text-xs">{row.bpkadValue ?? '-'}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <StatusBadge tone={row.status === 'RESOLVED' ? 'success' : row.status === 'OPEN' ? 'warning' : 'neutral'}>
                      {row.status}
                    </StatusBadge>
                  ),
                },
              ]}
              data={findings.items}
              keyField="id"
            />
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>
                {findings.total} temuan · halaman {findings.page}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePage(page - 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={findings.items.length < 20}
                  onClick={() => handlePage(page + 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
