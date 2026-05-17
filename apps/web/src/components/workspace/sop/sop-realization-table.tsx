import { useNavigate } from 'react-router';
import { ExternalLink } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  kinerjaRealizationStatusLabel,
  kinerjaRealizationStatusTone,
  kinerjaTargetUnitLabel,
  type KinerjaBidangRealization,
} from '@/lib/api/kinerja-bidang';

function periodLabel(item: KinerjaBidangRealization) {
  if (item.month) {
    return `Bulan ${item.month}`;
  }

  if (item.quarter) {
    return `Triwulan ${item.quarter}`;
  }

  return `Tahun ${item.year}`;
}

export function SopRealizationTable({
  items,
}: {
  items: KinerjaBidangRealization[];
}) {
  const navigate = useNavigate();

  return (
    <DataTable<KinerjaBidangRealization>
      items={items}
      empty="Belum ada realisasi SOP/RHK"
      rowKey={(item) => item.id}
      columns={[
        {
          key: 'title',
          header: 'Realisasi',
          render: (item) => (
            <div>
              <div className="font-semibold text-[#173c36]">{item.title}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">
                {item.sop.title} • {item.rhkCode}
              </div>
            </div>
          ),
        },
        {
          key: 'period',
          header: 'Periode',
          render: (item) => periodLabel(item),
        },
        {
          key: 'quantity',
          header: 'Kuantitas',
          render: (item) => (
            <span>
              {item.realizationQuantity}{' '}
              {kinerjaTargetUnitLabel(item.target.targetUnit)}
            </span>
          ),
        },
        {
          key: 'quality',
          header: 'Kualitas',
          render: (item) =>
            item.qualityPercent === null ? '-' : `${item.qualityPercent}%`,
        },
        {
          key: 'evidence',
          header: 'Bukti',
          render: (item) => item.evidence.length,
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={kinerjaRealizationStatusLabel(item.status)}
              tone={kinerjaRealizationStatusTone(item.status)}
            />
          ),
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
                onClick={() => navigate(`/kinerja-bidang/realisasi/${item.id}`)}
              >
                Detail
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}
