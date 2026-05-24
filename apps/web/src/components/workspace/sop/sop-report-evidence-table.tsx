import { useNavigate } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { ActionButton, DataTable, StatusBadge } from '@/components/workspace/ui';
import type { SopReportEvidencePlan } from '@/lib/sop/sop-report-data';

export function SopReportEvidenceTable({
  items,
}: {
  items: SopReportEvidencePlan[];
}) {
  const navigate = useNavigate();

  return (
    <DataTable<SopReportEvidencePlan>
      items={items}
      empty="Belum ada daftar bukti dukung"
      rowKey={(item) => item.id}
      columns={[
        {
          key: 'rhk',
          header: 'RHK',
          render: (item) => <StatusBadge value={item.rhkCode} tone="info" />,
        },
        {
          key: 'sop',
          header: 'SOP',
          render: (item) => (
            <div>
              <div className="font-semibold text-[#18343a]">{item.sopTitle}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">{item.sopCode}</div>
            </div>
          ),
        },
        {
          key: 'evidence',
          header: 'Bukti Dukung Minimal',
          render: (item) => (
            <ul className="list-disc space-y-1 ps-4 text-sm leading-6 text-[#51614c]">
              {item.requiredEvidence.map((evidence) => (
                <li key={evidence}>{evidence}</li>
              ))}
            </ul>
          ),
        },
        {
          key: 'tag',
          header: 'Tag DMS',
          render: (item) => (
            <div className="max-w-xs rounded-md border border-[#cfe1da] bg-white px-3 py-2 font-mono text-xs text-[#51614c]">
              {item.dmsTag}
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.statusLabel} tone={item.statusTone} />,
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
                onClick={() => navigate(`/kinerja-bidang/sop/${item.id}`)}
              >
                Bukti
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}
