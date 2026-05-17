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

export function SopReportBackendRhkTable({ rows }: { rows: KinerjaBidangRhkReportRow[] }) {
  const navigate = useNavigate();

  return (
    <DataTable<KinerjaBidangRhkReportRow>
      items={rows}
      empty="Belum ada data RHK dari backend"
      rowKey={(item) => item.targetId}
      columns={[
        {
          key: 'rhk',
          header: 'RHK',
          render: (item) => <StatusBadge value={item.rhkCode} tone="info" />,
        },
        {
          key: 'sop',
          header: 'SOP / Kegiatan',
          render: (item) => (
            <div>
              <div className="font-semibold text-[#173c36]">{item.sopTitle}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">{item.sopCode}</div>
            </div>
          ),
        },
        {
          key: 'target',
          header: 'Target',
          render: (item) => (
            <span>
              {item.targetQuantity} {kinerjaTargetUnitLabel(item.targetUnit)}
            </span>
          ),
        },
        {
          key: 'realization',
          header: 'Realisasi',
          render: (item) => item.realizationQuantity,
        },
        {
          key: 'approved',
          header: 'Approved',
          render: (item) => item.approvedRealizationQuantity,
        },
        {
          key: 'progress',
          header: 'Capaian',
          render: (item) => `${item.progressPercent}%`,
        },
        {
          key: 'evidence',
          header: 'Bukti',
          render: (item) => item.evidenceCount,
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge value={backendReportRowStatusLabel(item)} tone={backendReportRowStatusTone(item)} />
          ),
        },
        {
          key: 'action',
          header: 'Aksi',
          className: 'text-right',
          render: (item) => (
            <div className="flex justify-end gap-2">
              <ActionButton
                variant="secondary"
                icon={ExternalLink}
                onClick={() => navigate(`/kinerja-bidang/sop/${item.sopId}`)}
              >
                SOP
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={ClipboardCheck}
                onClick={() =>
                  navigate(
                    buildRealizationCreatePath({
                      year: item.year,
                      targetId: item.targetId,
                      rhkCode: item.rhkCode,
                      source: 'report',
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
