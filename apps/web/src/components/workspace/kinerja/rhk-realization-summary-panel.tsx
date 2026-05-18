import { useEffect, useState } from 'react';
import { BarChart3, ClipboardCheck, Gauge, RefreshCcw } from 'lucide-react';
import { ActionButton, ErrorAlert, LoadingState, SectionCard, StatCard } from '@/components/workspace/ui';
import { rhkRealizationsApi } from '@/lib/api/kinerja-rhk-realizations';
import type { KinerjaRhkRealizationSummary } from '@/lib/kinerja-rhk-realizations/types';

export function RhkRealizationSummaryPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [summary, setSummary] = useState<KinerjaRhkRealizationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSummary(await rhkRealizationsApi.fetchSummary({ status: 'APPROVED' }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat ringkasan realisasi RHK');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);

  return (
    <SectionCard
      title="Ringkasan Realisasi Resmi"
      description="Agregasi kandidat yang sudah disetujui menjadi realisasi RHK periodik."
      actions={
        <ActionButton icon={RefreshCcw} variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </ActionButton>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}
      {loading && !summary ? (
        <LoadingState label="Memuat realisasi resmi" />
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Realisasi" value={summary.totalRealizations} icon={ClipboardCheck} tone="success" />
          <StatCard label="Kuantitas" value={summary.totalQuantity} icon={BarChart3} tone="info" />
          <StatCard label="Rata-rata Skor" value={`${summary.averageFinalScore}%`} icon={Gauge} tone="success" />
          <StatCard label="RHK Tercakup" value={summary.byRhk.length} tone="neutral" />
        </div>
      ) : null}
    </SectionCard>
  );
}
