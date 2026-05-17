import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  kinerjaSopStageLabel,
  kinerjaSopStatusLabel,
  kinerjaTargetUnitLabel,
  type KinerjaBidangSop,
  type KinerjaSopStage,
} from '@/lib/api/kinerja-bidang';

export function KinerjaBidangSopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<KinerjaBidangSop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stage = (searchParams.get('stage') ?? '') as KinerjaSopStage | '';

  function updateStage(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('stage', value);
    else next.delete('stage');
    setSearchParams(next);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.listSop({ status: 'ACTIVE', stage, limit: 100 });
        if (mounted) setItems(result);
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat master SOP/RHK');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [stage]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master SOP/RHK"
        description="Daftar SOP Bidang PPIK dan pemetaan RHK dari API Kinerja Bidang."
        meta={<StatusBadge value="SOP/RHK" tone="dark" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Filter" description="Filter sederhana berdasarkan tahap SOP.">
        <div className="max-w-xs">
          <select
            className="h-10 w-full rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
            value={stage}
            onChange={(event) => updateStage(event.target.value)}
          >
            <option value="">Semua tahap</option>
            <option value="TAHAP_1">Tahap 1</option>
            <option value="TAHAP_2">Tahap 2</option>
            <option value="TAHAP_3">Tahap 3</option>
          </select>
        </div>
      </SectionCard>

      {loading ? (
        <LoadingState label="Memuat master SOP/RHK" />
      ) : (
        <SectionCard title="Daftar SOP" description="Master SOP aktif yang tersedia di backend.">
          <DataTable<KinerjaBidangSop>
            items={items}
            empty="Belum ada data SOP"
            rowKey={(item) => item.id}
            columns={[
              { key: 'code', header: 'Kode', render: (item) => <span className="font-semibold text-[#173c36]">{item.code}</span> },
              {
                key: 'title',
                header: 'Judul',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">{item.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#6d7e68]">{item.shortDescription}</div>
                  </div>
                ),
              },
              { key: 'stage', header: 'Tahap', render: (item) => <StatusBadge value={kinerjaSopStageLabel(item.stage)} tone="info" /> },
              {
                key: 'rhk',
                header: 'RHK',
                render: (item) => (
                  <div className="flex flex-wrap gap-1">
                    {item.rhkMappings.map((rhk) => <StatusBadge key={rhk.id} value={rhk.rhkCode} tone="info" />)}
                  </div>
                ),
              },
              {
                key: 'target',
                header: 'Target',
                render: (item) => `${item.targetQuantity ?? 0} ${kinerjaTargetUnitLabel(item.targetUnit)}`,
              },
              { key: 'status', header: 'Status', render: (item) => <StatusBadge value={kinerjaSopStatusLabel(item.status)} /> },
            ]}
          />
        </SectionCard>
      )}
    </div>
  );
}
