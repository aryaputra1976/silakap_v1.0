import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Layers3,
  Target,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { KinerjaBidangDashboardSummary } from '@/lib/api/kinerja-bidang';
import {
  getAverageProgress,
  getRiskCount,
  getRhkPrimarySopCount,
  getStageSopCount,
  getTotalRealization,
  getTotalSopCount,
  getTotalTarget,
  getTotalVerifiedEvidence,
} from '@/lib/sop/sop-data';

export function SopSummaryCards({
  summary,
}: {
  summary?: KinerjaBidangDashboardSummary | null;
}) {
  const totalSop = summary?.totalSop ?? getTotalSopCount();
  const totalRhk = summary?.totalRhkPrimary ?? getRhkPrimarySopCount();
  const totalTarget = summary?.totalTarget ?? getTotalTarget();
  const totalRealization = summary?.totalRealization ?? getTotalRealization();
  const averageProgress =
    summary?.averageProgressPercent ?? getAverageProgress();
  const totalEvidence = summary?.totalEvidence ?? getTotalVerifiedEvidence();
  const needAttention = summary?.needAttention ?? getRiskCount();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total SOP Bidang"
        value={totalSop}
        description="Seluruh paket SOP Bidang PPIK dari Tahap 1, Tahap 2, dan Tahap 3."
        icon={FileText}
        tone="info"
      />

      <StatCard
        label="SOP Utama RHK"
        value={totalRhk}
        description="SOP yang langsung menjadi pengendali target RHK bidang."
        icon={Target}
        tone="dark"
      />

      <StatCard
        label="Tahap 1"
        value={getStageSopCount(1)}
        description="SOP Manajemen Bidang."
        icon={Layers3}
        tone="info"
      />

      <StatCard
        label="Tahap 2"
        value={getStageSopCount(2)}
        description="SOP Pengelolaan Layanan Kepegawaian."
        icon={Layers3}
        tone="success"
      />

      <StatCard
        label="Tahap 3"
        value={getStageSopCount(3)}
        description="SOP Fungsi Spesifik Bidang."
        icon={Layers3}
        tone="warning"
      />

      <StatCard
        label="Target RHK"
        value={`${totalTarget} Output`}
        description="Akumulasi target kuantitas dari SOP utama RHK."
        icon={Target}
        tone="dark"
      />

      <StatCard
        label="Realisasi Berjalan"
        value={`${totalRealization} Output`}
        description="Realisasi sementara dari monitoring RHK."
        icon={TrendingUp}
        tone="success"
      />

      <StatCard
        label="Capaian Rata-rata"
        value={`${averageProgress}%`}
        description="Rata-rata capaian terhadap target SOP utama RHK."
        icon={CheckCircle2}
        tone="success"
      />

      <StatCard
        label="Bukti Dukung Tertaut"
        value={totalEvidence}
        description="Jumlah bukti dukung yang tertaut ke realisasi RHK."
        icon={FileCheck2}
        tone="info"
      />

      <StatCard
        label="Perlu Perhatian"
        value={needAttention}
        description="SOP/RHK dengan capaian rendah atau belum memiliki bukti dukung."
        icon={AlertTriangle}
        tone="warning"
      />
    </div>
  );
}