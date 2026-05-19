import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Printer, RefreshCw, TrendingUp } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { LaporanStats, ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import { FINDING_LABELS } from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  EmptyState,
  ErrorAlert,
  formatDate,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';

const INDIKATOR = [
  { label: 'Kesesuaian data BKPSDM – BPKAD', target: '≥ 95%', key: 'matchPct' },
  { label: 'ASN pensiun/meninggal masih aktif gaji (R03)', target: '0 kasus', key: 'r03' },
  { label: 'ASN aktif belum masuk payroll (R01)', target: '0 kasus', key: 'r01' },
  { label: 'RTL diselesaikan tepat waktu', target: '≥ 90%', key: 'resolvedPct' },
];

function ProgressBar({ value, max, tone }: { value: number; max: number; tone: 'success' | 'warning' | 'danger' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right">{pct}%</span>
    </div>
  );
}

export function RekonsiliasiBpkadLaporanPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [stats, setStats] = useState<LaporanStats | null>(null);
  const [loading, setLoading] = useState(false);
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

  const loadStats = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.fetchLaporanStats(periodId);
      setStats(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat laporan.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) loadStats(selectedPeriodId);
  }, [selectedPeriodId, loadStats]);

  const run = stats?.matchingRun;
  const ba = stats?.beritaAcara;
  const f = stats?.findings;
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const matchPct = run && run.totalBkpsdm > 0
    ? Math.round((run.totalMatched / run.totalBkpsdm) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan Rekonsiliasi"
        description="Ringkasan hasil rekonsiliasi data ASN BKPSDM/SIASN dengan Simgaji BPKAD berdasarkan indikator keberhasilan SOP."
        actions={
          <div className="flex gap-2">
            <ActionButton
              icon={RefreshCw}
              variant="secondary"
              onClick={() => loadStats(selectedPeriodId)}
              disabled={!selectedPeriodId || loading}
            >
              Refresh
            </ActionButton>
            <ActionButton
              icon={Printer}
              variant="secondary"
              onClick={() => {
                if (selectedPeriodId) {
                  window.open(`/rekonsiliasi-bpkad/laporan/print?periodId=${selectedPeriodId}`, '_blank');
                }
              }}
              disabled={!selectedPeriodId || !stats}
            >
              Cetak Laporan
            </ActionButton>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(e.target.value)}
        >
          {periods.length === 0 && <option value="">— belum ada periode —</option>}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        {selectedPeriod && (
          <span className="text-xs text-muted-foreground">{selectedPeriod.periodType}</span>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <LoadingState message="Memuat laporan..." />
      ) : !stats ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data laporan"
          description="Pilih periode yang sudah memiliki hasil matching untuk melihat laporan."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={TrendingUp}
              label="Total Temuan"
              value={String(f?.total ?? 0)}
              tone={f && f.total > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai Ditindaklanjuti"
              value={`${f?.totalResolved ?? 0} (${f?.resolvedPct ?? 0}%)`}
              tone={f && f.resolvedPct >= 90 ? 'success' : 'warning'}
            />
            <StatCard
              icon={BarChart3}
              label="Kesesuaian NIP"
              value={`${matchPct}%`}
              tone={matchPct >= 95 ? 'success' : 'warning'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Berita Acara"
              value={ba ? ba.status : 'Belum ada'}
              tone={ba?.status === 'FINALIZED' ? 'success' : ba ? 'warning' : 'neutral'}
            />
          </div>

          <SectionCard title="Indikator Keberhasilan SOP">
            <div className="space-y-4">
              {INDIKATOR.map((ind) => {
                let achieved: number | string = '-';
                let tone: 'success' | 'warning' | 'danger' = 'warning';
                let barValue = 0;
                let barMax = 100;

                if (ind.key === 'matchPct') {
                  achieved = `${matchPct}%`;
                  tone = matchPct >= 95 ? 'success' : 'danger';
                  barValue = matchPct;
                } else if (ind.key === 'r03' && f) {
                  achieved = `${f.byCode['R03'] ?? 0} kasus`;
                  tone = (f.byCode['R03'] ?? 0) === 0 ? 'success' : 'danger';
                  barValue = 0; barMax = 1;
                } else if (ind.key === 'r01' && f) {
                  achieved = `${f.byCode['R01'] ?? 0} kasus`;
                  tone = (f.byCode['R01'] ?? 0) === 0 ? 'success' : 'danger';
                  barValue = 0; barMax = 1;
                } else if (ind.key === 'resolvedPct' && f) {
                  achieved = `${f.resolvedPct}%`;
                  tone = f.resolvedPct >= 90 ? 'success' : 'warning';
                  barValue = f.resolvedPct;
                }

                return (
                  <div key={ind.key} className="flex items-center gap-4">
                    <div className="w-64 shrink-0">
                      <p className="text-sm text-foreground">{ind.label}</p>
                      <p className="text-xs text-muted-foreground">Target: {ind.target}</p>
                    </div>
                    <div className="flex-1">
                      <ProgressBar value={barValue} max={barMax} tone={tone} />
                    </div>
                    <div className="w-24 text-right">
                      <StatusBadge tone={tone}>{achieved}</StatusBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Distribusi Temuan per Kode">
              {!f || f.total === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada temuan.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(f.byCode).sort(([a], [b]) => a.localeCompare(b)).map(([code, count]) => (
                    <div key={code} className="flex items-center gap-3">
                      <span className="w-8 font-mono text-xs font-bold">{code}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${f.total > 0 ? (count / f.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-24 truncate">{FINDING_LABELS[code] ?? code}</span>
                      <span className="text-xs font-semibold w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Status Tindak Lanjut">
              {!f || f.total === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada temuan.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(f.byStatus).map(([status, count]) => {
                    const labelMap: Record<string, string> = {
                      OPEN: 'Terbuka',
                      NEEDS_CLARIFICATION: 'Perlu Klarifikasi OPD',
                      IN_FOLLOW_UP: 'Dalam Tindak Lanjut',
                      RESOLVED: 'Selesai',
                      REJECTED: 'Ditolak',
                    };
                    const toneMap: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
                      OPEN: 'danger', NEEDS_CLARIFICATION: 'warning',
                      IN_FOLLOW_UP: 'warning', RESOLVED: 'success', REJECTED: 'neutral',
                    };
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <StatusBadge tone={toneMap[status] ?? 'neutral'}>{labelMap[status] ?? status}</StatusBadge>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Informasi Matching & Berita Acara">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Matching Terakhir</p>
                {run ? (
                  <>
                    <p className="text-muted-foreground">Status: <span className="font-semibold text-foreground">{run.status}</span></p>
                    <p className="text-muted-foreground">Dijalankan: {run.runAt ? formatDateTime(run.runAt) : '-'}</p>
                    <p className="text-muted-foreground">Data BKPSDM: {run.totalBkpsdm} · BPKAD: {run.totalBpkad} · Cocok: {run.totalMatched}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Belum ada matching.</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Berita Acara</p>
                {ba ? (
                  <>
                    <p className="text-muted-foreground">
                      Status: <StatusBadge tone={ba.status === 'FINALIZED' ? 'success' : 'warning'}>{ba.status}</StatusBadge>
                    </p>
                    {ba.nomorBA && <p className="text-muted-foreground">Nomor: {ba.nomorBA}</p>}
                    {ba.tanggalBA && <p className="text-muted-foreground">Tanggal: {formatDate(ba.tanggalBA)}</p>}
                    {ba.finalizedAt && <p className="text-muted-foreground">Difinalisasi: {formatDateTime(ba.finalizedAt)}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground">Belum dibuat.</p>
                )}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
