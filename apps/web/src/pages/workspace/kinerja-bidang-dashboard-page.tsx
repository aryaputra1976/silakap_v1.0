import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, FileText, ListChecks, Target } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  type KinerjaBidangDashboardSummary,
} from '@/lib/api/kinerja-bidang';

export function KinerjaBidangDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<KinerjaBidangDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const year = String(new Date().getFullYear());

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.getDashboard({ year });
        if (mounted) setSummary(result);
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat dashboard Kinerja Bidang');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [year]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Kinerja Bidang"
        description="Ringkasan SOP/RHK, target, realisasi, approval, dan bukti dukung Bidang PPIK."
        meta={
          <>
            <StatusBadge value="Kinerja Bidang" tone="dark" />
            <StatusBadge value={year} tone="success" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={ListChecks}
              onClick={() => navigate('/kinerja-bidang/sop')}
            >
              Master SOP
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => navigate('/kinerja-bidang/realizations')}
            >
              Realisasi
            </ActionButton>
            <ActionButton icon={FileText} onClick={() => navigate('/kinerja-bidang/report')}>
              Laporan
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {loading ? <LoadingState label="Memuat dashboard Kinerja Bidang" /> : null}

      <SectionCard
        title="Ringkasan Kinerja"
        description="Data diambil dari API resmi Kinerja Bidang."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total SOP" value={summary?.totalSop ?? 0} icon={ListChecks} />
          <StatCard label="RHK Utama" value={summary?.totalRhkPrimary ?? 0} icon={Target} tone="info" />
          <StatCard label="Total Target" value={summary?.totalTarget ?? 0} icon={Target} />
          <StatCard label="Total Realisasi" value={summary?.totalRealization ?? 0} icon={BarChart3} tone="success" />
          <StatCard label="Approved" value={summary?.totalApprovedRealization ?? 0} icon={BarChart3} tone="success" />
          <StatCard label="Bukti Dukung" value={summary?.totalEvidence ?? 0} icon={FileText} tone="info" />
          <StatCard label="Rata-rata Progres" value={`${summary?.averageProgressPercent ?? 0}%`} icon={BarChart3} />
          <StatCard label="Perlu Perhatian" value={summary?.needAttention ?? 0} icon={Target} tone="warning" />
        </div>
      </SectionCard>
    </div>
  );
}
