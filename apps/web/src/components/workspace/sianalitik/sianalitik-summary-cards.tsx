import { Users, FileText, CheckSquare, TrendingUp, Upload, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';
import type { KinerjaBidangDashboardSummary } from '@/lib/api/kinerja-bidang';

interface Props {
  analytics: AnalyticsDashboard;
  kinerja: KinerjaBidangDashboardSummary;
}

export function SianalitikSummaryCards({ analytics, kinerja }: Props) {
  const { summary } = analytics;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total ASN"
        value={summary.totalAsn.toLocaleString('id-ID')}
        icon={Users}
        tone="neutral"
      />
      <StatCard
        label="Kasus SIAP"
        value={summary.totalSiapCases.toLocaleString('id-ID')}
        icon={FileText}
        tone="info"
      />
      <StatCard
        label="Tugas Selesai"
        value={summary.completedTasks.toLocaleString('id-ID')}
        icon={CheckSquare}
        tone="success"
      />
      <StatCard
        label="SLA Terlambat"
        value={(summary.slaOverdue ?? 0).toLocaleString('id-ID')}
        icon={AlertTriangle}
        tone={(summary.slaOverdue ?? 0) > 0 ? 'danger' : 'success'}
      />
      <StatCard
        label="Progres RHK"
        value={`${Math.round(kinerja.averageProgressPercent)}%`}
        icon={TrendingUp}
        tone={kinerja.averageProgressPercent >= 70 ? 'success' : 'warning'}
      />
      <StatCard
        label="Dokumen DMS"
        value={summary.uploadedDocuments.toLocaleString('id-ID')}
        icon={Upload}
        tone="neutral"
      />
    </div>
  );
}
