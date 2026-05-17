import { DataTable, StatusBadge } from '@/components/workspace/ui';
import {
  formatRiskStatus,
  getRiskTone,
  getSopItemById,
  SOP_PROGRESS,
  type SopProgress,
} from '@/lib/sop/sop-data';

export function SopProgressTable({
  items = SOP_PROGRESS,
}: {
  items?: SopProgress[];
}) {
  return (
    <DataTable<SopProgress>
      items={items}
      empty="Belum ada data monitoring"
      rowKey={(item) => item.sopId}
      columns={[
        {
          key: 'sop',
          header: 'SOP',
          render: (item) => {
            const sop = getSopItemById(item.sopId);

            return (
              <div>
                <div className="font-semibold text-[#173c36]">
                  {sop?.title ?? item.sopId}
                </div>
                <div className="mt-1 text-xs text-[#6d7e68]">
                  {sop?.code ?? 'Data backend'}
                </div>
              </div>
            );
          },
        },
        {
          key: 'target',
          header: 'Target',
          render: (item) => item.target,
        },
        {
          key: 'realization',
          header: 'Realisasi',
          render: (item) => item.realization,
        },
        {
          key: 'evidence',
          header: 'Bukti',
          render: (item) => item.verifiedEvidence,
        },
        {
          key: 'progress',
          header: 'Capaian',
          render: (item) => (
            <div className="min-w-40">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#173c36]">
                <span>{item.progressPercent}%</span>
              </div>
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
          key: 'risk',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={formatRiskStatus(item.riskStatus)}
              tone={getRiskTone(item.riskStatus)}
            />
          ),
        },
      ]}
    />
  );
}