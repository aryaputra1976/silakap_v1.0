import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  SectionCard,
  StatCard,
} from '@/components/workspace/ui';
import { kinerjaExecutiveReportApi } from '@/lib/api/kinerja-executive-report';
import type { KinerjaRhkRealizationSummary } from '@/lib/kinerja-executive-report/types';

export function KinerjaExecutiveSummaryPanel() {
  const [summary, setSummary] = useState<KinerjaRhkRealizationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    kinerjaExecutiveReportApi
      .fetchSummary()
      .then((result) => {
        if (mounted) setSummary(result);
      })
      .catch((caught) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat ringkasan eksekutif');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <SectionCard
      title="Ringkasan Eksekutif Kinerja"
      description="Statistik agregat realisasi RHK resmi yang telah disetujui."
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
      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat ringkasan eksekutif" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Realisasi" value={summary?.totalRealizations ?? 0} />
          <StatCard
            label="Rata-rata Skor Akhir"
            value={`${summary?.averageFinalScore ?? 0}%`}
            tone="success"
          />
          <StatCard
            label="Rata-rata Kualitas"
            value={`${summary?.averageQuality ?? 0}%`}
            tone="info"
          />
          <StatCard
            label="Rata-rata Ketepatan Waktu"
            value={`${summary?.averageTimeScore ?? 0}%`}
            tone="info"
          />
        </div>
      )}
    </SectionCard>
  );
}
