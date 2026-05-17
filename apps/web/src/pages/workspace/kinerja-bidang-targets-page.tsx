import { useEffect, useState } from 'react';
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
  kinerjaTargetUnitLabel,
  type KinerjaBidangTargetForInput,
} from '@/lib/api/kinerja-bidang';

export function KinerjaBidangTargetsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [items, setItems] = useState<KinerjaBidangTargetForInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.listTargets({ year });
        if (mounted) setItems(result);
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat target RHK');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [year]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Target RHK"
        description="Target tahunan SOP/RHK yang menjadi dasar input realisasi."
        meta={<StatusBadge value={year} tone="success" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Filter Tahun" description="Pilih tahun target.">
        <div className="max-w-xs">
          <input
            className="h-10 w-full rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </div>
      </SectionCard>

      {loading ? (
        <LoadingState label="Memuat target RHK" />
      ) : (
        <SectionCard title="Daftar Target" description="Target SOP/RHK dari backend.">
          <DataTable<KinerjaBidangTargetForInput>
            items={items}
            empty="Belum ada target RHK"
            rowKey={(item) => item.id}
            columns={[
              { key: 'rhk', header: 'RHK', render: (item) => <StatusBadge value={item.rhkCode} tone="info" /> },
              {
                key: 'sop',
                header: 'SOP',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">{item.sop.title}</div>
                    <div className="mt-1 text-xs text-[#6d7e68]">{item.sop.code}</div>
                  </div>
                ),
              },
              { key: 'year', header: 'Tahun', render: (item) => item.year },
              { key: 'target', header: 'Target', render: (item) => `${item.targetQuantity} ${kinerjaTargetUnitLabel(item.targetUnit)}` },
              { key: 'quality', header: 'Kualitas', render: (item) => item.qualityTarget },
              { key: 'time', header: 'Waktu', render: (item) => item.timeTarget },
            ]}
          />
        </SectionCard>
      )}
    </div>
  );
}
