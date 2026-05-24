import { useNavigate } from 'react-router';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { ActionButton, DataTable, StatusBadge } from '@/components/workspace/ui';
import {
  backendReportRowStatusLabel,
  backendReportRowStatusTone,
} from '@/lib/sop/sop-backend-adapter';
import {
  kinerjaTargetUnitLabel,
  type KinerjaBidangRhkReportRow,
} from '@/lib/api/kinerja-bidang';
import { buildRealizationCreatePath } from '@/lib/sop/sop-realization-routes';

export function SopBackendMonitoringTable({ rows }: { rows: KinerjaBidangRhkReportRow[] }) {
  const navigate = useNavigate();

  return (
    <DataTable<KinerjaBidangRhkReportRow>
      items={rows}
      empty="Belum ada data monitoring RHK dari backend"
      rowKey={(item) => item.targetId}
      columns={[
        {
          key: 'rhk',
          header: 'RHK',
          className: 'w-[7%]',
          render: (item) => <StatusBadge value={item.rhkCode} tone="info" />,
        },
        {
          key: 'sop',
          header: 'SOP / Kegiatan',
          className: 'w-[24%]',
          render: (item) => (
            <div className="min-w-0">
              <div className="break-words font-semibold leading-6 text-[#18343a]">{item.sopTitle}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">{item.sopCode}</div>
            </div>
          ),
        },
        {
          key: 'target',
          header: 'Target',
          className: 'w-[10%]',
          render: (item) => (
            <span>
              {item.targetQuantity} {kinerjaTargetUnitLabel(item.targetUnit)}
            </span>
          ),
        },
        {
          key: 'realization',
          header: 'Realisasi',
          className: 'w-[8%]',
          render: (item) => item.realizationQuantity,
        },
        {
          key: 'approved',
          header: 'Approved',
          className: 'w-[8%]',
          render: (item) => item.approvedRealizationQuantity,
        },
        {
          key: 'progress',
          header: 'Capaian',
          className: 'w-[16%]',
          render: (item) => (
            <div className="w-full min-w-0 max-w-40">
              <div className="mb-1 text-xs font-semibold text-[#18343a]">{item.progressPercent}%</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#dce8d6]">
                <div
                  className="h-full rounded-full bg-[#0e7c86]"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'evidence',
          header: 'Bukti',
          className: 'w-[6%]',
          render: (item) => item.evidenceCount,
        },
        {
          key: 'status',
          header: 'Status',
          className: 'w-[12%]',
          render: (item) => (
            <StatusBadge value={backendReportRowStatusLabel(item)} tone={backendReportRowStatusTone(item)} />
          ),
        },
        {
          key: 'action',
          header: 'Aksi',
          className: 'w-[15%] text-right',
          render: (item) => (
            <div className="flex flex-wrap justify-end gap-2">
              <ActionButton
                variant="secondary"
                icon={ExternalLink}
                onClick={() => navigate(`/kinerja-bidang/sop/${item.sopId}`)}
              >
                SOP
              </ActionButton>
              <ActionButton
                icon={ClipboardCheck}
                onClick={() =>
                  navigate(
                    buildRealizationCreatePath({
                      year: item.year,
                      targetId: item.targetId,
                      rhkCode: item.rhkCode,
                      source: 'monitoring',
                    }),
                  )
                }
              >
                Input
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}
