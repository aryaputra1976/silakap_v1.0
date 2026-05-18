import { useState } from 'react';
import { FileText, Loader2, Printer } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  FileMeta,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { kinerjaExecutiveReportApi } from '@/lib/api/kinerja-executive-report';
import type {
  ExecutiveReportQuery,
  KinerjaRhkMonthlyReport,
  KinerjaRhkPrintSummary,
  KinerjaRhkQuarterlyReport,
} from '@/lib/kinerja-executive-report/types';
import type { AppRole } from '@/lib/rbac/roles';
import { KinerjaExecutiveReportPrint } from './kinerja-executive-report-print';

const EXPORT_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

export function KinerjaExecutiveReportPanel({
  role,
  refreshKey = 0,
}: {
  role: AppRole;
  refreshKey?: number;
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [quarter, setQuarter] = useState(String(Math.floor(new Date().getMonth() / 3) + 1));
  const [monthly, setMonthly] = useState<KinerjaRhkMonthlyReport | null>(null);
  const [quarterly, setQuarterly] = useState<KinerjaRhkQuarterlyReport | null>(null);
  const [printSummary, setPrintSummary] = useState<KinerjaRhkPrintSummary | null>(null);
  const [loading, setLoading] = useState<'monthly' | 'quarterly' | 'print' | 'export' | null>(null);
  const [error, setError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  const canExport = EXPORT_ROLES.includes(role);
  const query: ExecutiveReportQuery = { periodYear: year, periodMonth: month, periodQuarter: quarter };

  async function loadMonthly() {
    setLoading('monthly');
    setError('');
    setExportSuccess('');
    try {
      setMonthly(await kinerjaExecutiveReportApi.fetchMonthly({ periodYear: year, periodMonth: month }));
      setQuarterly(null);
      setPrintSummary(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat laporan bulanan');
    } finally {
      setLoading(null);
    }
  }

  async function loadQuarterly() {
    setLoading('quarterly');
    setError('');
    setExportSuccess('');
    try {
      setQuarterly(await kinerjaExecutiveReportApi.fetchQuarterly({ periodYear: year, periodQuarter: quarter }));
      setMonthly(null);
      setPrintSummary(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat laporan triwulan');
    } finally {
      setLoading(null);
    }
  }

  async function loadPrint() {
    setLoading('print');
    setError('');
    setExportSuccess('');
    try {
      const summary = await kinerjaExecutiveReportApi.fetchPrintSummary({ periodYear: year, periodMonth: month });
      setPrintSummary(summary);
      window.setTimeout(() => window.print(), 100);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat ringkasan cetak');
    } finally {
      setLoading(null);
    }
  }

  async function handleExportLog(reportType: 'MONTHLY' | 'QUARTERLY') {
    setLoading('export');
    setError('');
    setExportSuccess('');
    try {
      await kinerjaExecutiveReportApi.writeExportLog({
        reportType,
        format: 'JSON',
        ...query,
      });
      setExportSuccess(`Log ekspor ${reportType.toLowerCase()} berhasil dicatat.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal mencatat log ekspor');
    } finally {
      setLoading(null);
    }
  }

  return (
    <SectionCard
      title="Laporan Eksekutif Kinerja Bidang"
      description="Laporan bulanan dan triwulan dari realisasi RHK resmi yang telah disetujui."
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
            onClick={() => void loadPrint()}
          >
            Print
          </ActionButton>
        </div>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}
      {exportSuccess ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {exportSuccess}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          inputMode="numeric"
          placeholder="Tahun"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <select
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
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
            <FileMeta label="Snapshot Bukti" value={monthly.evidenceSummary.totalSnapshot} />
          </div>
          {canExport ? (
            <div className="mt-3">
              <ActionButton
                icon={loading === 'export' ? Loader2 : FileText}
                variant="secondary"
                disabled={Boolean(loading)}
                onClick={() => void handleExportLog('MONTHLY')}
              >
                Catat Log Ekspor
              </ActionButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {quarterly ? (
        <div className="mt-4 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
          <h3 className="font-semibold text-[#173c36]">{quarterly.quarterLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-[#51614c]">{quarterly.strategicSummary}</p>
          <p className="mt-1 text-sm text-[#6d7e68]">{quarterly.trendNotes}</p>
          <p className="mt-1 text-sm text-[#6d7e68]">{quarterly.leadershipRecommendation}</p>
          {canExport ? (
            <div className="mt-3">
              <ActionButton
                icon={loading === 'export' ? Loader2 : FileText}
                variant="secondary"
                disabled={Boolean(loading)}
                onClick={() => void handleExportLog('QUARTERLY')}
              >
                Catat Log Ekspor
              </ActionButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {printSummary ? (
        <div className="mt-4">
          <KinerjaExecutiveReportPrint summary={printSummary} />
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-[#e5ede0] bg-[#f9fdf6] p-3 text-xs text-[#6d7e68]">
        Laporan dibuat dari realisasi resmi berstatus Disetujui. Print menggunakan{' '}
        <code>window.print()</code> — bukan ekspor PDF.
      </div>
      <span className="sr-only">{refreshKey}</span>
    </SectionCard>
  );
}
