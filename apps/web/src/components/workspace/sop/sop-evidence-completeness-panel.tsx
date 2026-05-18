import { useEffect, useState } from 'react';
import { FileCheck, Loader2, RefreshCcw } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';
import { sopAnalyticsApi } from '@/lib/api/sop-analytics';
import type { EvidenceCompletenessRow } from '@/lib/sop-analytics/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

// ─── Evidence bar ─────────────────────────────────────────────────────────────

function EvidenceBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'bg-emerald-500'
    : pct >= 50 ? 'bg-amber-400'
    : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`tabular-nums text-xs font-semibold ${
        pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-600' : 'text-rose-700'
      }`}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopEvidenceCompletenessPanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopEvidenceCompletenessPanel({ userRole }: SopEvidenceCompletenessPanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <EvidencePanelInner />;
}

function EvidencePanelInner() {
  const [rows, setRows] = useState<EvidenceCompletenessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    sopAnalyticsApi
      .fetchEvidenceCompleteness()
      .then(setRows)
      .catch(() => setError('Gagal memuat data bukti dukung.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // intentional one-time load

  const gapCount = rows.filter((r) => r.evidencePercent < 50).length;

  return (
    <SectionCard
      title="Kelengkapan Bukti Dukung"
      description="Persentase item checklist yang memiliki dokumen DMS terlampir per SOP. Diurutkan dari terendah."
      actions={
        <ActionButton
          icon={loading ? Loader2 : RefreshCcw}
          variant="secondary"
          disabled={loading}
          onClick={load}
        >
          Refresh
        </ActionButton>
      }
    >
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data...
        </div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Belum ada data item checklist.</p>
      ) : (
        <>
          {gapCount > 0 ? (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <FileCheck className="h-3.5 w-3.5 shrink-0" />
              {gapCount} SOP memiliki kelengkapan bukti dukung di bawah 50%.
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode SOP</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modul</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Total Item</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Ada Bukti</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kelengkapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {rows.map((row) => (
                  <tr
                    key={row.sopCode}
                    className={`${row.evidencePercent < 50 ? 'bg-rose-50' : ''} hover:brightness-95`}
                  >
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-900">{row.sopCode}</td>
                    <td className="px-3 py-2 text-zinc-600">{row.moduleKey}</td>
                    <td className="px-3 py-2 text-center text-zinc-600">
                      {row.totalItems > 0 ? row.totalItems : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-600">
                      {row.totalItems > 0 ? row.evidenceItems : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {row.totalItems > 0 ? (
                        <EvidenceBar pct={row.evidencePercent} />
                      ) : (
                        <span className="text-muted-foreground">Tidak ada item</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}
