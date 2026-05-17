import type { ReconciliationRow } from '@/lib/api/sidata-import';
import { DataTable, StatusBadge } from '@/components/workspace/ui';

interface SidataDiscrepancyTableProps {
  items: ReconciliationRow[];
  empty?: string;
}

const TYPE_LABEL: Record<string, string> = {
  DIFFERENT: 'Beda Data',
  ONLY_IN_BATCH: 'Hanya Batch',
  ONLY_IN_MASTER: 'Hanya Master',
  SAME: 'Sama',
};

const TYPE_TONE: Record<string, 'warning' | 'info' | 'neutral' | 'danger' | 'success'> = {
  DIFFERENT: 'warning',
  ONLY_IN_BATCH: 'info',
  ONLY_IN_MASTER: 'danger',
  SAME: 'success',
};

export function SidataDiscrepancyTable({ items, empty }: SidataDiscrepancyTableProps) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.key}
      empty={empty ?? 'Tidak ada perbedaan data'}
      columns={[
        {
          key: 'type',
          header: 'Tipe',
          render: (item) => (
            <StatusBadge
              value={TYPE_LABEL[item.type] ?? item.type}
              tone={TYPE_TONE[item.type] ?? 'neutral'}
            />
          ),
        },
        {
          key: 'asn',
          header: 'ASN',
          render: (item) => (
            <div>
              <p className="text-xs font-mono text-zinc-500">{item.nip ?? '—'}</p>
              <p className="text-sm font-medium text-zinc-800">{item.nama ?? '—'}</p>
            </div>
          ),
        },
        {
          key: 'master',
          header: 'Master SIDATA',
          render: (item) => (
            <div className="text-xs text-zinc-600 space-y-0.5">
              <p>{item.master?.unitKerjaNama ?? '—'}</p>
              <p className="text-zinc-400">{item.master?.jabatanNama ?? '—'}</p>
              <p className="text-zinc-400">{item.master?.golonganNama ?? '—'}</p>
            </div>
          ),
        },
        {
          key: 'batch',
          header: 'Batch SIASN',
          render: (item) => (
            <div className="text-xs text-zinc-600 space-y-0.5">
              <p>{item.batch?.unitKerjaNama ?? '—'}</p>
              <p className="text-zinc-400">{item.batch?.jabatanNama ?? '—'}</p>
              <p className="text-zinc-400">{item.batch?.golonganNama ?? '—'}</p>
            </div>
          ),
        },
        {
          key: 'diffs',
          header: 'Field Berbeda',
          render: (item) =>
            item.diffs.length === 0 ? (
              <span className="text-xs text-zinc-400">—</span>
            ) : (
              <ul className="space-y-0.5 text-xs text-amber-700">
                {item.diffs.map((diff) => (
                  <li key={diff.field}>• {diff.label}</li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}
