import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2, RefreshCw, Search } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { PaginatedResult } from '@/lib/api/types';
import type {
  ReconciliationFinding,
  ReconciliationPeriod,
} from '@/lib/reconciliation-bpkad/types';
import {
  FINDING_LABELS,
  FINDING_STATUS_LABELS,
  getFindingPriorityTone,
  getFindingStatusTone,
  RTL_ACTION_LABELS,
} from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  Field,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';

type RtlFormState = {
  status: string;
  rtlPic: string;
  rtlDeadline: string;
  rtlAction: string;
  rtlNotes: string;
  notes: string;
};

const EMPTY_FORM: RtlFormState = {
  status: '',
  rtlPic: '',
  rtlDeadline: '',
  rtlAction: '',
  rtlNotes: '',
  notes: '',
};

function RtlDrawer({
  finding,
  onClose,
  onSaved,
}: {
  finding: ReconciliationFinding;
  onClose: () => void;
  onSaved: (updated: ReconciliationFinding) => void;
}) {
  const [form, setForm] = useState<RtlFormState>({
    status: finding.status,
    rtlPic: finding.rtlPic ?? '',
    rtlDeadline: finding.rtlDeadline ? finding.rtlDeadline.split('T')[0] : '',
    rtlAction: finding.rtlAction ?? '',
    rtlNotes: finding.rtlNotes ?? '',
    notes: finding.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await reconciliationBpkadApi.patchFinding(
        finding.periodId,
        finding.id,
        {
          status: form.status || undefined,
          rtlPic: form.rtlPic || undefined,
          rtlDeadline: form.rtlDeadline || undefined,
          rtlAction: form.rtlAction || undefined,
          rtlNotes: form.rtlNotes || undefined,
          notes: form.notes || undefined,
        },
      );
      onSaved(updated);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="flex-1 bg-black/30" onClick={onClose} />
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <span className="font-mono font-bold text-foreground">{finding.findingCode}</span>
            <span className="ml-2 text-sm text-muted-foreground">{FINDING_LABELS[finding.findingCode]}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error && <ErrorAlert message={error} />}

          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">NIP:</span> <span className="font-mono">{finding.nip ?? '-'}</span></p>
            <p><span className="text-muted-foreground">BKPSDM:</span> {finding.namaBkpsdm ?? '-'} — {finding.bkpsdmValue ?? '-'}</p>
            <p><span className="text-muted-foreground">BPKAD:</span> {finding.namaBpkad ?? '-'} — {finding.bpkadValue ?? '-'}</p>
            <p><span className="text-muted-foreground">Prioritas:</span>
              <StatusBadge tone={getFindingPriorityTone(finding.priority)} className="ml-1">
                {finding.priority === 'SEGERA' ? 'Segera' : 'Bulan ini'}
              </StatusBadge>
            </p>
          </div>

          <Field label="Status Temuan">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {Object.entries(FINDING_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Tindak Lanjut (Jenis)">
            <select
              className={inputClass}
              value={form.rtlAction}
              onChange={(e) => setForm((f) => ({ ...f, rtlAction: e.target.value }))}
            >
              <option value="">— pilih jenis —</option>
              {Object.entries(RTL_ACTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="PIC (Penanggung Jawab)">
            <input
              className={inputClass}
              placeholder="Nama / jabatan / instansi"
              value={form.rtlPic}
              onChange={(e) => setForm((f) => ({ ...f, rtlPic: e.target.value }))}
            />
          </Field>

          <Field label="Batas Waktu Tindak Lanjut">
            <input
              type="date"
              className={inputClass}
              value={form.rtlDeadline}
              onChange={(e) => setForm((f) => ({ ...f, rtlDeadline: e.target.value }))}
            />
          </Field>

          <Field label="Catatan Tindak Lanjut">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              placeholder="Uraian tindakan yang diambil..."
              value={form.rtlNotes}
              onChange={(e) => setForm((f) => ({ ...f, rtlNotes: e.target.value }))}
            />
          </Field>

          <Field label="Catatan Internal">
            <textarea
              className={`${inputClass} min-h-[60px]`}
              placeholder="Catatan tambahan (opsional)..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <ActionButton variant="secondary" onClick={onClose}>Batal</ActionButton>
          <ActionButton icon={saving ? Loader2 : CheckCircle2} onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function RekonsiliasiBpkadTindakLanjutPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [findings, setFindings] = useState<PaginatedResult<ReconciliationFinding> | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [query, setQuery] = useState('');
  const [activeFinding, setActiveFinding] = useState<ReconciliationFinding | null>(null);
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

  const loadFindings = useCallback(
    async (periodId: string, opts: { status: string; priority: string; q: string; pg: number }) => {
      if (!periodId) return;
      setLoading(true);
      setError('');
      try {
        const result = await reconciliationBpkadApi.fetchFindings(periodId, {
          status: opts.status || undefined,
          priority: opts.priority || undefined,
          q: opts.q.trim() || undefined,
          page: opts.pg,
          limit: 25,
        });
        setFindings(result);
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'Gagal memuat temuan.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedPeriodId) {
      loadFindings(selectedPeriodId, { status: filterStatus, priority: filterPriority, q: query, pg: 1 });
    }
  }, [selectedPeriodId, loadFindings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadFindings(selectedPeriodId, { status: filterStatus, priority: filterPriority, q: query, pg: 1 });
  };

  const handleFilterChange = (status: string, priority: string) => {
    setFilterStatus(status);
    setFilterPriority(priority);
    setPage(1);
    loadFindings(selectedPeriodId, { status, priority, q: query, pg: 1 });
  };

  const handleSaved = (updated: ReconciliationFinding) => {
    setFindings((prev) =>
      prev
        ? { ...prev, items: prev.items.map((f) => (f.id === updated.id ? updated : f)) }
        : prev,
    );
    setActiveFinding(null);
  };

  const openCount = findings?.items.filter((f) => f.status === 'OPEN').length ?? 0;
  const resolvedCount = findings?.items.filter((f) => f.status === 'RESOLVED').length ?? 0;

  return (
    <div className="space-y-5">
      {activeFinding && (
        <RtlDrawer
          finding={activeFinding}
          onClose={() => setActiveFinding(null)}
          onSaved={handleSaved}
        />
      )}

      <PageHeader
        title="Rencana Tindak Lanjut (RTL)"
        description="Tetapkan PIC, batas waktu, dan jenis tindakan untuk setiap temuan rekonsiliasi sesuai SOP."
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedPeriodId}
          onChange={(e) => { setSelectedPeriodId(e.target.value); setPage(1); }}
        >
          {periods.length === 0 && <option value="">— belum ada periode —</option>}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Semua', status: '', priority: '' },
            { label: 'Segera', status: '', priority: 'SEGERA' },
            { label: 'Terbuka', status: 'OPEN', priority: '' },
            { label: 'Dalam TL', status: 'IN_FOLLOW_UP', priority: '' },
            { label: 'Perlu OPD', status: 'NEEDS_CLARIFICATION', priority: '' },
            { label: 'Selesai', status: 'RESOLVED', priority: '' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => handleFilterChange(f.status, f.priority)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filterStatus === f.status && filterPriority === f.priority
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <SectionCard
        title="Daftar Temuan"
        description="Klik baris untuk membuka form Tindak Lanjut."
        actions={
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex gap-1">
              <input
                className={`${inputClass} w-40`}
                placeholder="Cari NIP, nama..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <ActionButton icon={Search} type="submit" variant="ghost" />
            </form>
            <ActionButton
              icon={RefreshCw}
              variant="ghost"
              onClick={() => loadFindings(selectedPeriodId, { status: filterStatus, priority: filterPriority, q: query, pg: page })}
              disabled={!selectedPeriodId || loading}
            />
          </div>
        }
      >
        {loading ? (
          <LoadingState message="Memuat temuan..." />
        ) : !findings || findings.total === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Tidak ada temuan"
            description="Jalankan matching terlebih dahulu atau ubah filter."
          />
        ) : (
          <>
            {findings.total > 0 && (
              <p className="mb-2 text-xs text-muted-foreground">
                {findings.total} temuan · {openCount} belum ditindaklanjuti · {resolvedCount} selesai pada halaman ini
              </p>
            )}
            <DataTable<ReconciliationFinding>
              columns={[
                {
                  key: 'findingCode',
                  header: 'Kode',
                  render: (row) => <span className="font-mono font-bold">{row.findingCode}</span>,
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
                  header: 'Nama',
                  render: (row) => row.namaBkpsdm ?? row.namaBpkad ?? '-',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <StatusBadge tone={getFindingStatusTone(row.status)}>
                      {FINDING_STATUS_LABELS[row.status] ?? row.status}
                    </StatusBadge>
                  ),
                },
                {
                  key: 'rtlPic',
                  header: 'PIC',
                  render: (row) => row.rtlPic ?? <span className="text-muted-foreground text-xs">Belum</span>,
                },
                {
                  key: 'rtlDeadline',
                  header: 'Deadline',
                  render: (row) =>
                    row.rtlDeadline ? (
                      <span className="text-xs">{formatDate(row.rtlDeadline)}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    ),
                },
                {
                  key: 'rtlAction',
                  header: 'Tindak Lanjut',
                  render: (row) =>
                    row.rtlAction ? (
                      <span className="text-xs">{RTL_ACTION_LABELS[row.rtlAction] ?? row.rtlAction}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    ),
                },
              ]}
              data={findings.items}
              keyField="id"
              onRowClick={(row) => setActiveFinding(row)}
            />
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>{findings.total} total temuan · halaman {page}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage(page - 1); loadFindings(selectedPeriodId, { status: filterStatus, priority: filterPriority, q: query, pg: page - 1 }); }}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={findings.items.length < 25}
                  onClick={() => { setPage(page + 1); loadFindings(selectedPeriodId, { status: filterStatus, priority: filterPriority, q: query, pg: page + 1 }); }}
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
