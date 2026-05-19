import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  GitCompareArrows,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { ReconciliationMatchingRun, ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import { getMatchingRunStatusTone } from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  EmptyState,
  ErrorAlert,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';

function MatchingRunStats({ run }: { run: ReconciliationMatchingRun }) {
  const stats = [
    { label: 'Data BKPSDM', value: run.totalBkpsdm, tone: 'info' as const },
    { label: 'Data BPKAD', value: run.totalBpkad, tone: 'info' as const },
    { label: 'NIP Cocok', value: run.totalMatched, tone: 'success' as const },
    { label: 'Total Temuan', value: run.totalFindings, tone: run.totalFindings > 0 ? 'danger' as const : 'success' as const },
  ];

  const findings = [
    { code: 'R01', label: 'BKPSDM ≠ BPKAD', value: run.totalR01, priority: 'SEGERA' },
    { code: 'R02', label: 'BPKAD ≠ BKPSDM', value: run.totalR02, priority: 'SEGERA' },
    { code: 'R03', label: 'Status berbeda', value: run.totalR03, priority: 'SEGERA' },
    { code: 'R04', label: 'Pangkat berbeda', value: run.totalR04, priority: 'SEGERA' },
    { code: 'R05', label: 'Jabatan berbeda', value: run.totalR05, priority: 'BULAN_INI' },
    { code: 'R06', label: 'Unit kerja berbeda', value: run.totalR06, priority: 'BULAN_INI' },
    { code: 'R08', label: 'Nama/NIP masalah', value: run.totalR08, priority: 'SEGERA' },
    { code: 'R09', label: 'ASN ganda', value: run.totalR09, priority: 'SEGERA' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={GitCompareArrows} label={s.label} value={String(s.value)} tone={s.tone} />
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Rincian Temuan per Kode</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {findings.map((f) => (
            <div key={f.code} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="font-mono font-semibold text-foreground">{f.code}</span>
              <span className="text-muted-foreground">{f.label}</span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  f.priority === 'SEGERA'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RekonsiliasiBpkadMatchingPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [run, setRun] = useState<ReconciliationMatchingRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [running, setRunning] = useState(false);
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

  const loadRun = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoadingRun(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.fetchMatchingRun(periodId);
      setRun(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data matching.');
    } finally {
      setLoadingRun(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) loadRun(selectedPeriodId);
  }, [selectedPeriodId, loadRun]);

  const handleRunMatching = async () => {
    if (!selectedPeriodId) return;
    setRunning(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.runMatching(selectedPeriodId);
      setRun(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Matching gagal. Pastikan file Simgaji sudah diupload dengan status VALIDATED.',
      );
    } finally {
      setRunning(false);
    }
  };

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pencocokan Data (Matching NIP)"
        description="Cocokkan data ASN BKPSDM/SIASN dengan data Simgaji BPKAD berdasarkan NIP. Hasil matching akan menghasilkan temuan R01–R09."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/rekonsiliasi-bpkad/temuan">
              <ActionButton icon={AlertTriangle} variant="secondary">
                Lihat Temuan
              </ActionButton>
            </Link>
            <ActionButton
              icon={running ? Loader2 : Play}
              onClick={handleRunMatching}
              disabled={!selectedPeriodId || running}
            >
              {running ? 'Menjalankan...' : 'Jalankan Matching'}
            </ActionButton>
          </div>
        }
      />

      {error && <ErrorAlert message={error} />}

      <SectionCard title="Pilih Periode Rekonsiliasi">
        {periods.length === 0 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Belum ada periode"
            description="Buat periode rekonsiliasi terlebih dahulu dari halaman Dashboard."
          />
        ) : (
          <div className="space-y-3">
            <select
              className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {selectedPeriod && (
              <p className="text-xs text-muted-foreground">
                Status periode:{' '}
                <StatusBadge tone={selectedPeriod.status === 'DRAFT' ? 'warning' : 'success'}>
                  {selectedPeriod.status}
                </StatusBadge>
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Hasil Matching Terakhir"
        description="Klik 'Jalankan Matching' untuk memperbarui hasil. Setiap run baru akan menggantikan temuan sebelumnya."
        actions={
          <ActionButton
            icon={RefreshCw}
            variant="ghost"
            onClick={() => loadRun(selectedPeriodId)}
            disabled={!selectedPeriodId || loadingRun}
          >
            Refresh
          </ActionButton>
        }
      >
        {loadingRun ? (
          <LoadingState message="Memuat hasil matching..." />
        ) : !run ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Belum ada hasil matching"
            description="Pilih periode dan klik 'Jalankan Matching' untuk memulai pencocokan data."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge tone={getMatchingRunStatusTone(run.status)}>{run.status}</StatusBadge>
              <span className="text-xs text-muted-foreground">
                Dijalankan: {run.runAt ? formatDateTime(run.runAt) : '-'}
              </span>
            </div>

            {run.status === 'FAILED' && run.errorMessage && (
              <ErrorAlert message={run.errorMessage} />
            )}

            {run.status === 'DONE' && <MatchingRunStats run={run} />}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Panduan Matching">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Prasyarat:</strong> Upload file Simgaji BPKAD dan pastikan status batch adalah <span className="font-mono">VALIDATED</span>.</p>
          <p><strong>Sumber data BKPSDM:</strong> Data ASN aktif dari modul SIDATA (isActive = true).</p>
          <p><strong>Kunci matching:</strong> NIP (Nomor Induk Pegawai) sebagai primary key pencocokan.</p>
          <p><strong>Temuan yang dideteksi:</strong> R01, R02, R03, R04, R05, R06, R08, R09.</p>
          <p><strong>Catatan:</strong> R07 (TMT berbeda) dan R10 (komponen pembayaran) memerlukan data tambahan dan akan diimplementasi pada sprint berikutnya.</p>
        </div>
      </SectionCard>
    </div>
  );
}
