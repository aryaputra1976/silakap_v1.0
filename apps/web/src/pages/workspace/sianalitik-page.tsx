import { useEffect, useState } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ErrorAlert, LoadingState, PageHeader, SectionCard } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';
import {
  kinerjaBidangApi,
  type KinerjaBidangDashboardSummary,
  type KinerjaBidangRhkReportRow,
} from '@/lib/api/kinerja-bidang';
import { sidataApi, type SidataAsnQualityDashboard } from '@/lib/api/sidata';
import { dmsApi, type DmsDashboardSummary } from '@/lib/api/dms';
import { SianalitikSummaryCards } from '@/components/workspace/sianalitik/sianalitik-summary-cards';
import { SianalitikRhkProgress } from '@/components/workspace/sianalitik/sianalitik-rhk-progress';
import { SianalitikLayananSla } from '@/components/workspace/sianalitik/sianalitik-layanan-sla';
import { SianalitikSipensiunStatus } from '@/components/workspace/sianalitik/sianalitik-sipensiun-status';
import { SianalitikDmsEvidence } from '@/components/workspace/sianalitik/sianalitik-dms-evidence';
import { SianalitikSidataQuality } from '@/components/workspace/sianalitik/sianalitik-sidata-quality';
import { SianalitikRiskMatrix } from '@/components/workspace/sianalitik/sianalitik-risk-matrix';
import { SianalitikExecutiveNotes } from '@/components/workspace/sianalitik/sianalitik-executive-notes';

const YEAR = String(new Date().getFullYear());

const PERIOD_SHORTCUTS = [
  { label: 'TW 1', query: { year: YEAR, quarter: '1' } },
  { label: 'TW 2', query: { year: YEAR, quarter: '2' } },
  { label: 'TW 3', query: { year: YEAR, quarter: '3' } },
  { label: 'TW 4', query: { year: YEAR, quarter: '4' } },
  { label: 'Tahunan', query: { year: YEAR } },
];

type PeriodQuery = { year: string; quarter?: string };

export default function SianalitikPage() {
  const [period, setPeriod] = useState<PeriodQuery>({ year: YEAR });
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [kinerja, setKinerja] = useState<KinerjaBidangDashboardSummary | null>(null);
  const [rhkRows, setRhkRows] = useState<KinerjaBidangRhkReportRow[]>([]);
  const [quality, setQuality] = useState<SidataAsnQualityDashboard | null>(null);
  const [dms, setDms] = useState<DmsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const reportQuery = period.quarter
      ? { year: period.year, quarter: period.quarter }
      : { year: period.year };

    Promise.all([
      apiClient.get<AnalyticsDashboard>('/analytics/dashboard'),
      kinerjaBidangApi.getDashboard(reportQuery),
      kinerjaBidangApi.getReport(reportQuery),
    ])
      .then(([analyticsData, kinerjaData, reportData]) => {
        if (cancelled) return;
        setAnalytics(analyticsData);
        setKinerja(kinerjaData);
        setRhkRows(reportData.rows);
        setLastRefresh(new Date());
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat data dashboard';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    sidataApi.getAsnQualityDashboard().then(setQuality).catch(() => null);
    dmsApi.getDashboardSummary().then(setDms).catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [period]);

  function handleRefresh() {
    setPeriod((prev) => ({ ...prev }));
  }

  const periodLabel = period.quarter
    ? `Triwulan ${period.quarter} ${period.year}`
    : `Tahunan ${period.year}`;

  const lastRefreshStr = lastRefresh.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="SIANALITIK"
        description="Dashboard pimpinan — ringkasan kinerja, layanan, data ASN, dan dokumen."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Diperbarui {lastRefreshStr}</span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        }
      />

      <SectionCard title="" className="py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Periode:</span>
          {PERIOD_SHORTCUTS.map((s) => {
            const active =
              s.query.year === period.year &&
              (s.query.quarter ?? '') === (period.quarter ?? '');
            return (
              <button
                key={s.label}
                onClick={() => setPeriod(s.query)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-[#1e4620] text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-slate-400">{periodLabel}</span>
        </div>
      </SectionCard>

      {loading && <LoadingState label="Memuat data dashboard eksekutif..." />}
      {!loading && error && <ErrorAlert message={error} />}

      {!loading && !error && analytics && kinerja && (
        <>
          <SianalitikSummaryCards analytics={analytics} kinerja={kinerja} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SianalitikRhkProgress summary={kinerja} rows={rhkRows} />
            <SianalitikLayananSla analytics={analytics} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SianalitikSipensiunStatus analytics={analytics} />
            {dms && <SianalitikDmsEvidence dms={dms} />}
            {quality && <SianalitikSidataQuality quality={quality} />}
          </div>

          <SianalitikRiskMatrix
            analytics={analytics}
            kinerja={kinerja}
            rhkRows={rhkRows}
            quality={quality}
            dms={dms}
          />

          <SianalitikExecutiveNotes
            analytics={analytics}
            kinerja={kinerja}
            rhkRows={rhkRows}
            quality={quality}
            dms={dms}
            generatedAt={new Date().toISOString()}
          />
        </>
      )}
    </div>
  );
}
