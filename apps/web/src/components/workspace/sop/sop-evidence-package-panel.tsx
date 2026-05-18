import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileX,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { sopReportsApi } from '@/lib/api/sop-reports';
import type { SopEvidencePackage, SopEvidencePackageBySop, SopReportPeriodType } from '@/lib/sop-reports/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

// ─── Access level tone ────────────────────────────────────────────────────────

function accessTone(level: string): 'neutral' | 'warning' | 'danger' | 'dark' {
  if (level === 'TERBATAS' || level === 'SANGAT_TERBATAS') return 'danger';
  if (level === 'INTERNAL') return 'warning';
  if (level === 'PIMPINAN' || level === 'AUDIT') return 'dark';
  return 'neutral';
}

// ─── Evidence bar ─────────────────────────────────────────────────────────────

function EvidenceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-600' : 'text-rose-700'}`}>
        {pct}%
      </span>
    </div>
  );
}

// ─── SOP row (expandable) ─────────────────────────────────────────────────────

function SopEvidenceRow({ row }: { row: SopEvidencePackageBySop }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-900">{row.sopCode}</span>
            <span className="truncate text-xs text-zinc-500">{row.title}</span>
            <span className="ml-1 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
              {row.moduleKey}
            </span>
          </p>
          {row.relatedRhkCodes.length > 0 ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              RHK: {row.relatedRhkCodes.join(', ')}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <EvidenceBar pct={row.evidenceCompletenessPercent} />
        </div>
        <div className="ml-2 shrink-0 text-right text-xs text-muted-foreground">
          <p>{row.evidenceDocuments.length} dok</p>
          {row.missingEvidenceItems.length > 0 ? (
            <p className="text-rose-600">{row.missingEvidenceItems.length} item kosong</p>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          {row.evidenceDocuments.length > 0 ? (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold text-zinc-700">
                <FileCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                Dokumen Bukti Dukung ({row.evidenceDocuments.length})
              </p>
              <div className="space-y-1.5">
                {row.evidenceDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-2 rounded border border-zinc-200 bg-white px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-800">{doc.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {doc.category}
                        {doc.subCategory ? ` › ${doc.subCategory}` : ''}
                        {' · '}
                        {new Date(doc.uploadedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">Item: {doc.linkedChecklistItemId}</p>
                    </div>
                    <StatusBadge
                      value={doc.accessLevel.replace(/_/g, ' ')}
                      tone={accessTone(doc.accessLevel)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {row.missingEvidenceItems.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-700">
                <FileX className="mr-1 inline h-3.5 w-3.5 text-rose-500" />
                Item Belum Ada Bukti Dukung ({row.missingEvidenceItems.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.missingEvidenceItems.map((itemId) => (
                  <span key={itemId} className="rounded bg-rose-50 px-2 py-0.5 font-mono text-[10px] text-rose-700">
                    {itemId}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {row.evidenceDocuments.length === 0 && row.missingEvidenceItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">Tidak ada item checklist tercatat untuk SOP ini.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopEvidencePackagePanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: SopReportPeriodType; label: string }[] = [
  { value: 'YEARLY', label: 'Tahunan' },
  { value: 'QUARTERLY', label: 'Triwulanan' },
  { value: 'MONTHLY', label: 'Bulanan' },
];

export function SopEvidencePackagePanel({ userRole }: SopEvidencePackagePanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <EvidencePackagePanelInner />;
}

function EvidencePackagePanelInner() {
  const [data, setData] = useState<SopEvidencePackage | null>(null);
  const [periodType, setPeriodType] = useState<SopReportPeriodType>('YEARLY');
  const [moduleKeyFilter, setModuleKeyFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    sopReportsApi
      .fetchSopEvidencePackage({ periodType, moduleKey: moduleKeyFilter || undefined })
      .then(setData)
      .catch(() => setError('Gagal memuat evidence package.'))
      .finally(() => setLoading(false));
  }

  const filteredBySop = data?.bySop.filter((r) =>
    !moduleKeyFilter || r.moduleKey === moduleKeyFilter,
  ) ?? [];

  const gapCount = filteredBySop.filter((r) => r.evidenceCompletenessPercent < 50).length;

  return (
    <SectionCard
      title="Evidence Package per SOP"
      description="Kelengkapan bukti dukung DMS per SOP berdasarkan checklist item. Klik baris SOP untuk melihat detail dokumen."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as SopReportPeriodType)}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter moduleKey..."
            value={moduleKeyFilter}
            onChange={(e) => setModuleKeyFilter(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-xs w-36"
          />
          <ActionButton
            icon={loading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={loading}
            onClick={load}
          >
            Muat Data
          </ActionButton>
        </div>
      }
    >
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
      ) : null}

      {!data && !loading ? (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <FileCheck className="h-8 w-8 opacity-30" />
          <p className="text-sm">Klik <strong>Muat Data</strong> untuk melihat evidence package per SOP.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat evidence package...
        </div>
      ) : data ? (
        <>
          {/* Summary bar */}
          <div className="mb-3 flex items-center gap-4 rounded-lg border border-border bg-zinc-50 px-4 py-2.5 text-xs">
            <span><strong>{data.totalSop}</strong> SOP</span>
            <span><strong>{data.totalEvidence}</strong> dokumen bukti</span>
            {gapCount > 0 ? (
              <span className="ml-auto font-semibold text-amber-600">
                {gapCount} SOP kelengkapan &lt;50%
              </span>
            ) : null}
          </div>

          {filteredBySop.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada data{moduleKeyFilter ? ` untuk modul "${moduleKeyFilter}"` : ''}.
            </p>
          ) : (
            <div className="rounded-lg border border-border">
              {[...filteredBySop]
                .sort((a, b) => a.evidenceCompletenessPercent - b.evidenceCompletenessPercent)
                .map((row) => (
                  <SopEvidenceRow key={row.sopCode} row={row} />
                ))}
            </div>
          )}
        </>
      ) : null}
    </SectionCard>
  );
}
