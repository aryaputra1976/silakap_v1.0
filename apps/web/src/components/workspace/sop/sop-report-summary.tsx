import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { SopReportSummary as SopReportSummaryValue } from '@/lib/sop/sop-report-data';

export function SopReportSummary({
  summary,
}: {
  summary: SopReportSummaryValue;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
      <StatCard
        label="RHK Utama"
        value={summary.totalRhk}
        description="Jumlah RHK utama yang dipantau dalam laporan."
        icon={Target}
        tone="dark"
      />
      <StatCard
        label="Target Output"
        value={summary.totalTarget}
        description="Akumulasi target kuantitas seluruh RHK utama."
        icon={FileText}
        tone="info"
      />
      <StatCard
        label="Realisasi"
        value={summary.totalRealization}
        description="Jumlah realisasi output yang tercatat."
        icon={TrendingUp}
        tone="success"
      />
      <StatCard
        label="Capaian Rata-rata"
        value={`${summary.averageProgressPercent}%`}
        description="Rata-rata capaian realisasi terhadap target."
        icon={CheckCircle2}
        tone="success"
      />
      <StatCard
        label="Bukti Valid"
        value={summary.totalVerifiedEvidence}
        description="Bukti dukung yang telah dianggap valid."
        icon={FileCheck2}
        tone="info"
      />
      <StatCard
        label="Perlu Perhatian"
        value={summary.attentionRhk + summary.noEvidenceRhk}
        description="RHK yang perlu tindak lanjut atau belum punya bukti valid."
        icon={AlertTriangle}
        tone="warning"
      />
    </div>
  );
}
