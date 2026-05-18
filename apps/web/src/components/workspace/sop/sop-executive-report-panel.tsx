import { useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { sopReportsApi } from '@/lib/api/sop-reports';
import type { SopExecutiveReport, SopReportPeriodType } from '@/lib/sop-reports/types';
import { SopExecutiveReportPrint } from './sop-executive-report-print';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

const CAN_EXPORT: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA',
];

// ─── Score color ──────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 85) return 'text-emerald-700';
  if (s >= 70) return 'text-amber-600';
  if (s >= 50) return 'text-orange-600';
  return 'text-rose-700';
}

function riskLabel(level: string) {
  const m: Record<string, string> = { LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi', CRITICAL: 'Kritis' };
  return m[level] ?? level;
}

function riskTone(level: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (level === 'LOW') return 'success';
  if (level === 'MEDIUM') return 'warning';
  return 'danger';
}

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: SopReportPeriodType; label: string }[] = [
  { value: 'YEARLY', label: 'Tahunan' },
  { value: 'QUARTERLY', label: 'Triwulanan' },
  { value: 'MONTHLY', label: 'Bulanan' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopExecutiveReportPanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopExecutiveReportPanel({ userRole }: SopExecutiveReportPanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <ReportPanelInner userRole={userRole} />;
}

function ReportPanelInner({ userRole }: { userRole: AppRole }) {
  const [report, setReport] = useState<SopExecutiveReport | null>(null);
  const [periodType, setPeriodType] = useState<SopReportPeriodType>('YEARLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLogging, setExportLogging] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function generate() {
    setLoading(true);
    setError(null);
    sopReportsApi
      .fetchSopExecutiveReport({ periodType })
      .then(setReport)
      .catch(() => setError('Gagal memuat laporan eksekutif.'))
      .finally(() => setLoading(false));
  }

  async function handlePrint() {
    if (!report) return;
    if (CAN_EXPORT.includes(userRole)) {
      setExportLogging(true);
      try {
        await sopReportsApi.writeSopExportLog({ reportType: 'EXECUTIVE', periodType, format: 'PRINT' });
      } catch {
        // non-fatal
      } finally {
        setExportLogging(false);
      }
    }
    window.print();
  }

  async function handleExportJson() {
    if (!report) return;
    if (CAN_EXPORT.includes(userRole)) {
      sopReportsApi.writeSopExportLog({ reportType: 'EXECUTIVE', periodType, format: 'JSON' }).catch(() => undefined);
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sop-executive-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SectionCard
      title="Laporan Eksekutif SOP"
      description="Generate preview laporan kepatuhan SOP untuk keperluan pimpinan, review berkala, dan arsip resmi."
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
          <ActionButton
            icon={loading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={loading}
            onClick={generate}
          >
            Generate Preview
          </ActionButton>
          {report && CAN_EXPORT.includes(userRole) ? (
            <>
              <ActionButton
                icon={exportLogging ? Loader2 : Printer}
                variant="secondary"
                disabled={exportLogging}
                onClick={() => void handlePrint()}
              >
                Print
              </ActionButton>
              <ActionButton
                icon={Download}
                variant="secondary"
                onClick={() => void handleExportJson()}
              >
                Export JSON
              </ActionButton>
            </>
          ) : null}
        </div>
      }
    >
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
      ) : null}

      {!report && !loading ? (
        <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-30" />
          <p className="text-sm">Pilih periode dan klik <strong>Generate Preview</strong> untuk membuat laporan.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyusun laporan eksekutif...
        </div>
      ) : report ? (
        <>
          {/* Header info */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Periode</p>
              <p className="text-sm font-semibold text-zinc-800">{report.periodLabel}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Dibuat:{' '}
                {new Date(report.generatedAt).toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
              <StatusBadge value={report.generatedByRole} tone="neutral" />
            </div>
          </div>

          {/* Overall score + stat cards */}
          <div className="mb-4 flex items-center gap-4 rounded-lg border border-border px-5 py-4">
            <BarChart2 className="h-7 w-7 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-muted-foreground">Skor Kepatuhan Keseluruhan</p>
              <p className={`text-3xl font-extrabold ${scoreColor(report.overallScore)}`}>
                {report.overallScore}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
              </p>
            </div>
            <div className="ml-auto text-right text-xs">
              <p className="text-muted-foreground">{report.totalSops} SOP</p>
              {report.reviewSummary.overdue > 0 ? (
                <p className="font-semibold text-rose-700">{report.reviewSummary.overdue} review terlambat</p>
              ) : null}
            </div>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={ShieldCheck} label="Risiko Rendah" value={report.riskDistribution.LOW} description="Skor ≥85" tone="success" />
            <StatCard icon={BarChart2} label="Risiko Sedang" value={report.riskDistribution.MEDIUM} description="Skor 70–84" tone="warning" />
            <StatCard icon={AlertTriangle} label="Risiko Tinggi" value={report.riskDistribution.HIGH} description="Skor 50–69" tone="danger" />
            <StatCard icon={ShieldAlert} label="Kritis" value={report.riskDistribution.CRITICAL} description="Skor <50" tone="danger" />
          </div>

          {/* Governance + review summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Governance Aktif', value: `${report.governanceSummary.active}/${report.governanceSummary.total}` },
              { label: 'Perlu Review', value: report.reviewSummary.needsReview },
              { label: 'Review Overdue', value: report.reviewSummary.overdue },
              { label: 'Reminder Aktif', value: report.reviewSummary.openReminders },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-zinc-50 px-3 py-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-bold text-zinc-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Top risks */}
          {report.topRisks.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-zinc-800">SOP Risiko Tertinggi</p>
              <div className="divide-y divide-border rounded-lg border border-border">
                {report.topRisks.map((r) => (
                  <div key={r.sopCode} className="flex items-start gap-3 px-3 py-2.5">
                    <StatusBadge value={riskLabel(r.riskLevel)} tone={riskTone(r.riskLevel)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-zinc-800">{r.sopCode}
                        <span className="ml-1 font-sans font-normal text-zinc-500">{r.moduleKey}</span>
                      </p>
                      {r.reasons.length > 0 ? (
                        <p className="mt-0.5 text-[10px] text-zinc-400">{r.reasons.join(' · ')}</p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${scoreColor(r.score)}`}>{r.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Tidak ada SOP dengan risiko tinggi atau kritis.
            </div>
          )}

          {/* Recommended actions */}
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-blue-800">Rekomendasi Tindakan</p>
            <ul className="space-y-1">
              {report.recommendedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-blue-700">
                  <span className="mt-0.5 shrink-0 text-blue-400">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Conclusion */}
          <div className="rounded-lg border border-border bg-zinc-50 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-700">Kesimpulan</p>
            <p className="mt-1 text-sm text-zinc-600">{report.conclusion}</p>
          </div>

          {/* Print area (hidden until window.print()) */}
          <div ref={printRef} className="print-only hidden">
            <SopExecutiveReportPrint report={report} />
          </div>
        </>
      ) : null}
    </SectionCard>
  );
}
