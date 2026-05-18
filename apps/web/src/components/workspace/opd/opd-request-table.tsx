import { FilePenLine, Eye } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  formatDate,
  StatusBadge,
} from '@/components/workspace/ui';
import type { OpdRequest } from '@/lib/opd/opd-portal-data';

export function OpdRequestTable({
  items,
  empty = 'Belum ada permohonan OPD',
}: {
  items: OpdRequest[];
  empty?: string;
}) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty}
      columns={[
        {
          key: 'nomor',
          header: 'Nomor',
          render: (item) => (
            <span className="font-mono text-xs font-semibold">
              {item.nomor}
            </span>
          ),
        },
        {
          key: 'jenis',
          header: 'Jenis Layanan',
          render: (item) => item.jenisLayanan,
        },
        {
          key: 'tanggal',
          header: 'Tanggal Pengajuan',
          render: (item) => formatDate(item.tanggalPengajuan),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.status} />,
        },
        {
          key: 'catatan',
          header: 'Catatan Terakhir',
          render: (item) => item.catatanTerakhir,
        },
        {
          key: 'aksi',
          header: 'Aksi',
          render: (item) => (
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Eye} variant="secondary" disabled>
                Lihat Detail
              </ActionButton>
              <ActionButton
                icon={FilePenLine}
                variant="secondary"
                disabled={!item.canRevise}
              >
                Perbaiki Berkas
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}
