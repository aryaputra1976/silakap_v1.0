import { Link } from 'react-router-dom';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import {
  kinerjaRhkReportStatusLabel,
  kinerjaRhkReportStatusTone,
  type KinerjaBidangRhkReportRow,
  type KinerjaBidangDashboardSummary,
} from '@/lib/api/kinerja-bidang';

interface Props {
  summary: KinerjaBidangDashboardSummary;
  rows: KinerjaBidangRhkReportRow[];
}

function ProgressBar({ percent, status }: { percent: number; status: string }) {
  const bg =
    status === 'AMAN' || status === 'TERLAMPAUI'
      ? 'bg-[#12815f]'
      : status === 'PERLU_PERHATIAN'
        ? 'bg-amber-500'
        : 'bg-slate-300';

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${bg}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function SianalitikRhkProgress({ summary, rows }: Props) {
  return (
    <SectionCard title="Progres Kinerja Bidang (RHK)" className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-[#d6e2d1] bg-[#f4f8ef] p-3 text-center text-sm">
        <div>
          <p className="text-lg font-bold text-[#1e4620]">{summary.totalRealization}</p>
          <p className="text-xs text-[#51614c]">Realisasi</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#12815f]">{summary.totalApprovedRealization}</p>
          <p className="text-xs text-[#51614c]">Disetujui</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-700">{summary.needAttention}</p>
          <p className="text-xs text-[#51614c]">Perlu Perhatian</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.slice(0, 8).map((row) => (
          <div key={row.targetId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                [{row.sopCode}] {row.sopTitle}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{Math.round(row.progressPercent)}%</span>
                <StatusBadge
                  value={kinerjaRhkReportStatusLabel(row.status)}
                  tone={kinerjaRhkReportStatusTone(row.status)}
                />
              </div>
            </div>
            <ProgressBar percent={row.progressPercent} status={row.status} />
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-center text-sm text-slate-400">Belum ada data RHK tahun ini.</p>
      )}

      <div className="border-t border-slate-100 pt-2">
        <Link
          to="/kinerja-bidang/laporan"
          className="text-xs font-medium text-[#12815f] hover:underline"
        >
          Lihat laporan lengkap →
        </Link>
      </div>
    </SectionCard>
  );
}
