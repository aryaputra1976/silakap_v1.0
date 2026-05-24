import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { ActionButton, DataTable, StatusBadge } from '@/components/workspace/ui';
import { SOP_ITEMS, type SopItem, type SopStage } from '@/lib/sop/sop-data';

type SopTableFilter =
  | 'all'
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'rhk-primary'
  | 'supporting';

const filters: Array<{
  key: SopTableFilter;
  label: string;
}> = [
  { key: 'all', label: 'Semua SOP' },
  { key: 'stage-1', label: 'Tahap 1' },
  { key: 'stage-2', label: 'Tahap 2' },
  { key: 'stage-3', label: 'Tahap 3' },
  { key: 'rhk-primary', label: 'SOP Utama RHK' },
  { key: 'supporting', label: 'SOP Pendukung' },
];

function getStageLabel(stage: SopStage): string {
  const labels: Record<SopStage, string> = {
    1: 'Tahap 1',
    2: 'Tahap 2',
    3: 'Tahap 3',
  };

  return labels[stage];
}

function getFilteredItems(
  filter: SopTableFilter,
  sourceItems: SopItem[],
): SopItem[] {
  if (filter === 'stage-1') {
    return sourceItems.filter((item) => item.stage === 1);
  }

  if (filter === 'stage-2') {
    return sourceItems.filter((item) => item.stage === 2);
  }

  if (filter === 'stage-3') {
    return sourceItems.filter((item) => item.stage === 3);
  }

  if (filter === 'rhk-primary') {
    return sourceItems.filter((item) => item.isRhkPrimary);
  }

  if (filter === 'supporting') {
    return sourceItems.filter((item) => !item.isRhkPrimary);
  }

  return sourceItems;
}

export function SopTable({ items = SOP_ITEMS }: { items?: SopItem[] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SopTableFilter>('all');

  const filteredItems = useMemo(() => getFilteredItems(filter, items), [filter, items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
              filter === item.key
                ? 'border-[#0e7c86] bg-[#0e7c86] text-white'
                : 'border-[#cfe1da] bg-white text-[#18343a] hover:bg-[#eef8f6]'
            }`}
            onClick={() => setFilter(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <DataTable<SopItem>
        items={filteredItems}
        empty="Belum ada data SOP"
        rowKey={(item) => item.id}
        columns={[
          {
            key: 'code',
            header: 'Kode SOP',
            render: (item) => (
              <span className="font-semibold text-[#18343a]">{item.code}</span>
            ),
          },
          {
            key: 'title',
            header: 'Nama SOP',
            render: (item) => (
              <div>
                <div className="font-semibold text-[#18343a]">{item.title}</div>
                <div className="mt-1 max-w-xl text-xs leading-5 text-[#6d7e68]">
                  {item.shortDescription}
                </div>
              </div>
            ),
          },
          {
            key: 'stage',
            header: 'Tahap',
            render: (item) => (
              <StatusBadge
                value={getStageLabel(item.stage)}
                tone={
                  item.stage === 1
                    ? 'info'
                    : item.stage === 2
                      ? 'success'
                      : 'warning'
                }
              />
            ),
          },
          {
            key: 'rhk',
            header: 'RHK',
            render: (item) => (
              <div className="flex flex-wrap gap-1">
                {item.rhkCodes.map((rhk) => (
                  <StatusBadge key={rhk} value={rhk} tone="info" />
                ))}
              </div>
            ),
          },
          {
            key: 'target',
            header: 'Target',
            render: (item) => (
              <span>
                {item.targetQuantity} {item.targetUnit}
              </span>
            ),
          },
          {
            key: 'type',
            header: 'Jenis',
            render: (item) => (
              <StatusBadge
                value={item.isRhkPrimary ? 'Utama RHK' : 'Pendukung'}
                tone={item.isRhkPrimary ? 'dark' : 'neutral'}
              />
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => (
              <StatusBadge
                value={item.status === 'ACTIVE' ? 'Aktif' : item.status}
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
                  icon={ArrowRight}
                  onClick={() => navigate(`/kinerja-bidang/sop/${item.id}`)}
                >
                  Detail
                </ActionButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}