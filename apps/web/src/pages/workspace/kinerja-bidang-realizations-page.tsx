import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';
import {
  KINERJA_REALIZATION_STATUSES,
  kinerjaBidangApi,
  kinerjaRealizationStatusLabel,
  kinerjaRealizationStatusTone,
  kinerjaTargetUnitLabel,
  type KinerjaBidangRealization,
  type KinerjaSopRealizationStatus,
} from '@/lib/api/kinerja-bidang';

function periodLabel(item: KinerjaBidangRealization) {
  if (item.month) return `Bulan ${item.month}`;
  if (item.quarter) return `Triwulan ${item.quarter}`;
  return `Tahun ${item.year}`;
}

export function KinerjaBidangRealizationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<KinerjaBidangRealization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = searchParams.get('year') ?? String(new Date().getFullYear());
  const status = (searchParams.get('status') ?? '') as KinerjaSopRealizationStatus | '';

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.listRealizations({ year, status });
        if (mounted) setItems(result);
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat realisasi SOP/RHK');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [year, status]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Realisasi Bulanan"
        description="Daftar realisasi SOP/RHK resmi dari backend Kinerja Bidang."
        meta={
          <>
            <StatusBadge value={year} tone="success" />
            {status ? <StatusBadge value={kinerjaRealizationStatusLabel(status)} tone="info" /> : null}
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Filter" description="Filter sederhana berdasarkan tahun dan status.">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(event) => updateParam('year', event.target.value)}
          />
          <select
            className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
            value={status}
            onChange={(event) => updateParam('status', event.target.value)}
          >
            <option value="">Semua status</option>
            {KINERJA_REALIZATION_STATUSES.map((item) => (
              <option key={item} value={item}>{kinerjaRealizationStatusLabel(item)}</option>
            ))}
          </select>
        </div>
      </SectionCard>

      {loading ? (
        <LoadingState label="Memuat realisasi SOP/RHK" />
      ) : (
        <SectionCard title="Daftar Realisasi" description="Realisasi yang sudah tercatat di backend.">
          <DataTable<KinerjaBidangRealization>
            items={items}
            empty="Belum ada realisasi"
            rowKey={(item) => item.id}
            columns={[
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
              { key: 'rhk', header: 'RHK', render: (item) => <StatusBadge value={item.rhkCode} tone="info" /> },
              { key: 'period', header: 'Periode', render: periodLabel },
              { key: 'quantity', header: 'Kuantitas', render: (item) => `${item.realizationQuantity} ${kinerjaTargetUnitLabel(item.target.targetUnit)}` },
              { key: 'status', header: 'Status', render: (item) => <StatusBadge value={kinerjaRealizationStatusLabel(item.status)} tone={kinerjaRealizationStatusTone(item.status)} /> },
              { key: 'updated', header: 'Update', render: (item) => formatDateTime(item.updatedAt) },
            ]}
          />
        </SectionCard>
      )}
    </div>
  );
}
