import { DataTable, StatusBadge } from '@/components/workspace/ui';
import {
  kinerjaTargetUnitLabel,
  type KinerjaBidangRhkReportRow,
} from '@/lib/api/kinerja-bidang';
import {
  backendReportRowStatusLabel,
  backendReportRowStatusTone,
} from '@/lib/sop/sop-backend-adapter';

export function SopDashboardBackendProgressTable({
  rows,
}: {
  rows: KinerjaBidangRhkReportRow[];
}) {
  return (
    <DataTable<KinerjaBidangRhkReportRow>
      items={rows}
      empty="Belum ada data monitoring dari backend"
      rowKey={(item) => item.targetId}
      columns={[
        {
          key: 'sop',
          header: 'SOP',
          className: 'w-[34%]',
          render: (item) => (
            <div className="min-w-0">
              <div className="break-words font-semibold leading-6 text-[#173c36]">
                {item.sopTitle}
              </div>
              <div className="mt-1 break-words text-xs leading-5 text-[#6d7e68]">
                {item.sopCode}
              </div>
            </div>
          ),
        },
        {
          key: 'target',
          header: 'Target',
          className: 'w-[11%]',
          render: (item) => (
            <span>
              {item.targetQuantity} {kinerjaTargetUnitLabel(item.targetUnit)}
            </span>
          ),
        },
        {
          key: 'realization',
          header: 'Realisasi',
          className: 'w-[10%]',
          render: (item) => item.realizationQuantity,
        },
        {
          key: 'evidence',
          header: 'Bukti',
          className: 'w-[9%]',
          render: (item) => item.evidenceCount,
        },
        {
          key: 'progress',
          header: 'Capaian',
          className: 'w-[18%]',
          render: (item) => (
            <div className="w-full min-w-0 max-w-48">
              <div className="mb-1 text-xs font-semibold text-[#173c36]">
                {item.progressPercent}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#dce8d6]">
                <div
                  className="h-full rounded-full bg-[#0f766e]"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          className: 'w-[18%]',
          render: (item) => (
            <StatusBadge
              value={backendReportRowStatusLabel(item)}
              tone={backendReportRowStatusTone(item)}
            />
          ),
        },
      ]}
    />
  );
}
