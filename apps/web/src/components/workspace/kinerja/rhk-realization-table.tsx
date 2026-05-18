import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  LoadingState,
  SectionCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';
import { rhkRealizationsApi } from '@/lib/api/kinerja-rhk-realizations';
import type {
  KinerjaRhkRealization,
  KinerjaRhkRealizationQuery,
} from '@/lib/kinerja-rhk-realizations/types';
import {
  formatRealizationScore,
  formatRhkPeriod,
  rhkPeriodTypeLabel,
  rhkRealizationStatusLabel,
  rhkRealizationStatusTone,
} from '@/lib/kinerja-rhk-realizations/types';

export function RhkRealizationTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [items, setItems] = useState<KinerjaRhkRealization[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState<KinerjaRhkRealizationQuery>({
    periodYear: new Date().getFullYear(),
    status: 'APPROVED',
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await rhkRealizationsApi.fetchList(query);
      setItems(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat daftar realisasi RHK');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  function updateQuery(updates: Partial<KinerjaRhkRealizationQuery>) {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  return (
    <SectionCard
      title="Daftar Realisasi RHK"
      description="Catatan resmi berbasis kandidat yang sudah divalidasi role berwenang."
      actions={
        <ActionButton icon={RefreshCcw} variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </ActionButton>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}
      <FilterBar>
        <input
          className="h-9 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          inputMode="numeric"
          value={query.periodYear ?? ''}
          onChange={(event) => updateQuery({ periodYear: event.target.value })}
        />
        <select
          className="h-9 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={query.periodType ?? ''}
          onChange={(event) => updateQuery({ periodType: event.target.value as KinerjaRhkRealizationQuery['periodType'] })}
        >
          <option value="">Semua periode</option>
          <option value="MONTHLY">Bulanan</option>
          <option value="QUARTERLY">Triwulan</option>
          <option value="YEARLY">Tahunan</option>
        </select>
        <select
          className="h-9 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={query.status ?? ''}
          onChange={(event) => updateQuery({ status: event.target.value as KinerjaRhkRealizationQuery['status'] })}
        >
          <option value="">Semua status</option>
          <option value="APPROVED">Disetujui</option>
          <option value="ARCHIVED">Diarsipkan</option>
        </select>
      </FilterBar>

      {loading ? (
        <LoadingState label="Memuat realisasi RHK" />
      ) : (
        <>
          <DataTable<KinerjaRhkRealization>
            items={items}
            empty="Belum ada realisasi RHK resmi"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'title',
                header: 'RHK / Layanan',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">{item.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-[#6d7e68]">
                      <StatusBadge value={item.rhkCode} tone="info" />
                      {item.sopCode ? <StatusBadge value={item.sopCode} tone="neutral" /> : null}
                    </div>
                  </div>
                ),
              },
              { key: 'period', header: 'Periode', render: (item) => formatRhkPeriod(item) },
              { key: 'type', header: 'Tipe', render: (item) => rhkPeriodTypeLabel(item.periodType) },
              { key: 'quantity', header: 'Kuantitas', render: (item) => item.quantityValue ?? 0 },
              { key: 'score', header: 'Skor', render: (item) => formatRealizationScore(item.finalScore) },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={rhkRealizationStatusLabel(item.status)}
                    tone={rhkRealizationStatusTone(item.status)}
                  />
                ),
              },
              { key: 'approvedAt', header: 'Disetujui', render: (item) => formatDateTime(item.approvedAt) },
            ]}
          />
          <p className="mt-2 text-xs text-[#6d7e68]">Total: {total} realisasi</p>
        </>
      )}
    </SectionCard>
  );
}
