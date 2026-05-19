import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  RefreshCw,
} from 'lucide-react';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { LaporanStats, ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import { getMatchingRunStatusTone } from '@/lib/reconciliation-bpkad/types';
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

type Step = {
  icon: React.ElementType;
  label: string;
  path: string;
  description: string;
  done: boolean;
  active: boolean;
};

function WorkflowStep({ icon: Icon, label, path, description, done, active }: Step) {
  return (
    <Link
      to={path}
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 ${active ? 'border-primary/40 bg-primary/5' : done ? 'border-green-200 bg-green-50/50' : ''}`}
    >
      <div className={`mt-0.5 rounded-full p-1.5 ${done ? 'bg-green-100 text-green-600' : active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'text-green-700' : ''}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {done && <CheckCircle2 size={14} className="mt-1 shrink-0 text-green-500" />}
    </Link>
  );
}

export function RekonsiliasiBpkadDashboardPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState<LaporanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStats = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const s = await reconciliationBpkadApi.fetchLaporanStats(periodId);
      setStats(s);
    } catch {
      setStats(null);
      setError('Gagal memuat statistik periode.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reconciliationBpkadApi
      .fetchPeriods()
      .then((list) => {
        setPeriods(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) loadStats(selectedId);
  }, [selectedId, loadStats]);

  const run = stats?.matchingRun;
  const ba = stats?.beritaAcara;
  const f = stats?.findings;
  const matchPct = run && run.totalBkpsdm > 0
    ? Math.round((run.totalMatched / run.totalBkpsdm) * 100)
    : 0;

  const hasImport = true; // import always available
  const hasMatching = !!run && run.status === 'DONE';
  const hasFindings = !!f && f.total > 0;
  const hasBa = !!ba;
  const isFinalized = ba?.status === 'FINALIZED';

  const steps: Step[] = [
    {
      icon: CalendarDays,
      label: 'Manajemen Periode',
      path: '/rekonsiliasi-bpkad/periode',
      description: 'Buat atau pilih periode rekonsiliasi.',
      done: periods.length > 0,
      active: periods.length === 0,
    },
    {
      icon: FileSpreadsheet,
      label: 'Import Simgaji BPKAD',
      path: '/rekonsiliasi-bpkad/import/simgaji',
      description: 'Upload file ekspor Simgaji dari BPKAD.',
      done: hasImport && !!selectedId,
      active: !!selectedId && !hasMatching,
    },
    {
      icon: GitCompareArrows,
      label: 'Pencocokan Data (Matching)',
      path: '/rekonsiliasi-bpkad/matching',
      description: 'Jalankan matching NIP BKPSDM vs Simgaji.',
      done: hasMatching,
      active: !!selectedId && !hasMatching,
    },
    {
      icon: AlertTriangle,
      label: 'Matriks Temuan',
      path: '/rekonsiliasi-bpkad/temuan',
      description: 'Review temuan R01–R09 hasil matching.',
      done: hasFindings && (f?.resolvedPct ?? 0) > 0,
      active: hasMatching && !hasBa,
    },
    {
      icon: FileText,
      label: 'Tindak Lanjut',
      path: '/rekonsiliasi-bpkad/tindak-lanjut',
      description: 'Kelola RTL per temuan (PIC, deadline, aksi).',
      done: !!f && f.resolvedPct >= 90,
      active: hasFindings && !hasBa,
    },
    {
      icon: FileText,
      label: 'Berita Acara',
      path: '/rekonsiliasi-bpkad/berita-acara',
      description: 'Susun dan finalisasi BA rekonsiliasi.',
      done: isFinalized,
      active: !!f && f.resolvedPct >= 90 && !isFinalized,
    },
    {
      icon: BarChart3,
      label: 'Laporan',
      path: '/rekonsiliasi-bpkad/laporan',
      description: 'Ringkasan hasil dan indikator keberhasilan SOP.',
      done: isFinalized,
      active: isFinalized,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekonsiliasi BKPSDM-BPKAD"
        description="Pantau status rekonsiliasi data ASN berdasarkan SOP. Pilih periode untuk melihat progress terkini."
        actions={
          <div className="flex gap-2">
            <ActionButton
              icon={RefreshCw}
              variant="secondary"
              onClick={() => loadStats(selectedId)}
              disabled={!selectedId || loading}
            >
              Refresh
            </ActionButton>
            <Link to="/rekonsiliasi-bpkad/periode">
              <ActionButton icon={CalendarDays} variant="secondary">Periode</ActionButton>
            </Link>
            <Link to="/rekonsiliasi-bpkad/import/simgaji">
              <ActionButton icon={FileSpreadsheet}>Import Simgaji</ActionButton>
            </Link>
          </div>
        }
      />

      {periods.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada periode rekonsiliasi"
          description="Buat periode terlebih dahulu sebelum memulai proses rekonsiliasi."
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {periods.find((p) => p.id === selectedId) && (
              <StatusBadge tone="neutral">{periods.find((p) => p.id === selectedId)!.status}</StatusBadge>
            )}
          </div>

          {error && <ErrorAlert message={error} />}

          {loading ? (
            <LoadingState message="Memuat statistik..." />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                  icon={GitCompareArrows}
                  label="Kesesuaian NIP"
                  value={run ? `${matchPct}%` : '—'}
                  tone={!run ? 'neutral' : matchPct >= 95 ? 'success' : 'warning'}
                  description={run ? `${run.totalMatched} / ${run.totalBkpsdm} cocok` : 'Belum ada matching'}
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Total Temuan"
                  value={f ? String(f.total) : '—'}
                  tone={!f ? 'neutral' : f.total === 0 ? 'success' : 'danger'}
                  description={f ? `${f.totalOpen} terbuka · ${f.totalInFollowUp} proses` : 'Belum ada matching'}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="RTL Selesai"
                  value={f ? `${f.resolvedPct}%` : '—'}
                  tone={!f ? 'neutral' : f.resolvedPct >= 90 ? 'success' : 'warning'}
                  description={f ? `${f.totalResolved} / ${f.total} diselesaikan` : '—'}
                />
                <StatCard
                  icon={FileText}
                  label="Berita Acara"
                  value={ba ? ba.status : 'Belum ada'}
                  tone={!ba ? 'neutral' : ba.status === 'FINALIZED' ? 'success' : 'warning'}
                  description={ba?.finalizedAt ? `Finalisasi: ${formatDate(ba.finalizedAt)}` : ba?.draftedAt ? `Draft: ${formatDate(ba.draftedAt)}` : '—'}
                />
              </div>

              {run && (
                <SectionCard title="Matching Terakhir">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>
                      Status:{' '}
                      <StatusBadge tone={getMatchingRunStatusTone(run.status)}>{run.status}</StatusBadge>
                    </span>
                    {run.runAt && <span>Dijalankan: {formatDateTime(run.runAt)}</span>}
                    <span>BKPSDM: <strong className="text-foreground">{run.totalBkpsdm}</strong></span>
                    <span>BPKAD: <strong className="text-foreground">{run.totalBpkad}</strong></span>
                    <span>Cocok: <strong className="text-foreground">{run.totalMatched}</strong></span>
                    <span>Temuan: <strong className="text-foreground">{run.totalFindings}</strong></span>
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Alur Rekonsiliasi"
                description="Ikuti tahapan ini secara berurutan sesuai SOP rekonsiliasi BKPSDM-BPKAD."
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {steps.map((step) => (
                    <WorkflowStep key={step.path} {...step} />
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </>
      )}
    </div>
  );
}
