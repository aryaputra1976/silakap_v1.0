import { useNavigate } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { ActionButton, DataTable, StatusBadge } from '@/components/workspace/ui';
import type { SopReportRhkRow } from '@/lib/sop/sop-report-data';

export function SopReportRhkTable({ rows }: { rows: SopReportRhkRow[] }) {
  const navigate = useNavigate();

  return (
    <DataTable<SopReportRhkRow>
      items={rows}
      empty="Belum ada data RHK"
      rowKey={(item) => item.sopId}
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
              {item.target} {item.targetUnit}
            </span>
          ),
        },
        {
          key: 'realization',
          header: 'Realisasi',
          render: (item) => item.realization,
        },
        {
          key: 'progress',
          header: 'Capaian',
          render: (item) => (
            <div className="min-w-36">
              <div className="mb-1 text-xs font-semibold text-[#173c36]">{item.progressPercent}%</div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dce8d6]">
                <div
                  className="h-full rounded-full bg-[#0f766e]"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'quality',
          header: 'Kualitas',
          render: (item) => <span className="text-sm text-[#51614c]">{item.qualityLabel}</span>,
        },
        {
          key: 'time',
          header: 'Waktu',
          render: (item) => <span className="text-sm text-[#51614c]">{item.timeLabel}</span>,
        },
        {
          key: 'evidence',
          header: 'Bukti',
          render: (item) => item.verifiedEvidence,
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.riskLabel} tone={item.riskTone} />,
        },
        {
          key: 'action',
          header: 'Aksi',
          className: 'text-right',
          render: (item) => (
            <div className="flex justify-end">
              <ActionButton
                variant="secondary"
                icon={ExternalLink}
                onClick={() => navigate(`/kinerja-bidang/sop/${item.sopId}`)}
              >
                SOP
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}
