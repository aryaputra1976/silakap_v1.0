import { useEffect, useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { ActionButton, ErrorAlert, LoadingState, SectionCard, StatCard } from '@/components/workspace/ui';
import { rhkCandidatesApi } from '@/lib/api/kinerja-rhk-candidates';
import type { KinerjaRhkCandidateSummary } from '@/lib/kinerja-rhk-candidates/types';

export function RhkCandidateSummaryPanel() {
  const [summary, setSummary] = useState<KinerjaRhkCandidateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await rhkCandidatesApi.fetchSummary();
      setSummary(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat ringkasan kandidat RHK');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SectionCard
      title="Ringkasan Kandidat RHK"
      description="Layanan OPD selesai yang menunggu validasi realisasi kinerja bidang."
      actions={
        <ActionButton
          icon={loading ? Loader2 : RefreshCcw}
          variant="secondary"
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh
        </ActionButton>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}

      {loading && !summary ? (
        <LoadingState label="Memuat ringkasan" />
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Menunggu Validasi"
            value={String(summary.candidate)}
            tone="warning"
          />
          <StatCard
            label="Disetujui"
            value={String(summary.approved)}
            tone="success"
          />
          <StatCard
            label="Ditolak"
            value={String(summary.rejected)}
            tone="danger"
          />
          <StatCard
            label="Total Kandidat"
            value={String(summary.total)}
            tone="neutral"
          />
        </div>
      ) : null}
    </SectionCard>
  );
}
