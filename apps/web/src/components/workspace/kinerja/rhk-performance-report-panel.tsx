import { useState } from 'react';
import { FileText, Loader2, Printer } from 'lucide-react';
import { ActionButton, ErrorAlert, FileMeta, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { rhkRealizationsApi } from '@/lib/api/kinerja-rhk-realizations';
import type {
  KinerjaRhkMonthlyReport,
  KinerjaRhkPrintSummary,
  KinerjaRhkQuarterlyReport,
} from '@/lib/kinerja-rhk-realizations/types';
import { RhkPerformancePrint } from './rhk-performance-print';

export function RhkPerformanceReportPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [quarter, setQuarter] = useState(String(Math.floor(new Date().getMonth() / 3) + 1));
  const [monthly, setMonthly] = useState<KinerjaRhkMonthlyReport | null>(null);
  const [quarterly, setQuarterly] = useState<KinerjaRhkQuarterlyReport | null>(null);
  const [printSummary, setPrintSummary] = useState<KinerjaRhkPrintSummary | null>(null);
  const [loading, setLoading] = useState<'monthly' | 'quarterly' | 'print' | null>(null);
  const [error, setError] = useState('');

  async function loadMonthly() {
    setLoading('monthly');
    setError('');
    try {
      setMonthly(await rhkRealizationsApi.fetchMonthlyReport({
        periodYear: year,
        periodMonth: month,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat laporan bulanan');
    } finally {
      setLoading(null);
    }
  }

  async function loadQuarterly() {
    setLoading('quarterly');
    setError('');
    try {
      setQuarterly(await rhkRealizationsApi.fetchQuarterlyReport({
        periodYear: year,
        periodQuarter: quarter,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat laporan triwulan');
    } finally {
      setLoading(null);
    }
  }

  async function loadPrintSummary() {
    setLoading('print');
    setError('');
    try {
      const summary = await rhkRealizationsApi.fetchPrintSummary({
        periodYear: year,
        periodMonth: month,
      });
      setPrintSummary(summary);
      window.setTimeout(() => window.print(), 100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat ringkasan cetak');
    } finally {
      setLoading(null);
    }
  }

  return (
    <SectionCard
      title="Laporan Kinerja Bulanan/Triwulan"
      description="Narasi laporan dibuat dari realisasi resmi, bukan dari kandidat mentah."
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={loading === 'monthly' ? Loader2 : FileText}
            variant="secondary"
            disabled={Boolean(loading)}
            onClick={() => void loadMonthly()}
          >
            Bulanan
          </ActionButton>
          <ActionButton
            icon={loading === 'quarterly' ? Loader2 : FileText}
            variant="secondary"
            disabled={Boolean(loading)}
            onClick={() => void loadQuarterly()}
          >
            Triwulan
          </ActionButton>
          <ActionButton
            icon={loading === 'print' ? Loader2 : Printer}
            disabled={Boolean(loading)}
            onClick={() => void loadPrintSummary()}
          >
            Print
          </ActionButton>
        </div>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          inputMode="numeric"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
        <select
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={quarter}
          onChange={(event) => setQuarter(event.target.value)}
        >
          <option value="1">Triwulan 1</option>
          <option value="2">Triwulan 2</option>
          <option value="3">Triwulan 3</option>
          <option value="4">Triwulan 4</option>
        </select>
      </div>

      {monthly ? (
        <div className="rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[#173c36]">{monthly.periodLabel}</h3>
            <StatusBadge value={`${monthly.averageFinalScore}%`} tone="success" />
          </div>
          <p className="mt-2 text-sm leading-6 text-[#51614c]">{monthly.narrativeSummary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <FileMeta label="Total RHK" value={monthly.totalRhk} />
            <FileMeta label="Realisasi" value={monthly.totalRealizations} />
            <FileMeta label="Evidence snapshot" value={monthly.evidenceSummary.totalSnapshot} />
          </div>
        </div>
      ) : null}

      {quarterly ? (
        <div className="mt-4 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
          <h3 className="font-semibold text-[#173c36]">{quarterly.quarterLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-[#51614c]">{quarterly.strategicSummary}</p>
          <p className="mt-1 text-sm text-[#6d7e68]">{quarterly.trendNotes}</p>
          <p className="mt-1 text-sm text-[#6d7e68]">{quarterly.leadershipRecommendation}</p>
        </div>
      ) : null}

      {printSummary ? (
        <div className="mt-4">
          <RhkPerformancePrint summary={printSummary} />
        </div>
      ) : null}
      <span className="sr-only">{refreshKey}</span>
    </SectionCard>
  );
}
