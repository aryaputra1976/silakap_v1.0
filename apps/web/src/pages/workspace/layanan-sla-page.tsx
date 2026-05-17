import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SiapTask } from '@/lib/api/types';
import {
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import { LayananSlaTable } from '@/components/workspace/layanan/layanan-sla-table';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { getLayananSopConfig, getTaskSlaStatus } from '@/lib/layanan/layanan-data';

const sopConfig = getLayananSopConfig('LAY-003');

type SlaFilter = '' | 'OVERDUE' | 'PENDING' | 'COMPLETED';

const SLA_FILTER_OPTIONS: Array<{ value: SlaFilter; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'OVERDUE', label: 'Terlambat (OVERDUE)' },
  { value: 'PENDING', label: 'Sedang Berjalan' },
  { value: 'COMPLETED', label: 'Selesai' },
];

export function LayananSlaPage() {
  const [q, setQ] = useState('');
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('');
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<SiapTask>>('/siap/tasks', {
        q,
        status: slaFilter || undefined,
        page: 1,
        limit: 50,
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data SLA');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, slaFilter]);

  const items = data?.items ?? [];
  const overdueCount = items.filter((t) => getTaskSlaStatus(t.status, t.dueDate) === 'overdue').length;
  const atRiskCount = items.filter((t) => getTaskSlaStatus(t.status, t.dueDate) === 'at-risk').length;
  const onTimeCount = items.filter((t) => getTaskSlaStatus(t.status, t.dueDate) === 'on-time').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monitoring SLA Layanan"
        description={sopConfig?.description ?? 'Pemantauan ketepatan waktu layanan kepegawaian.'}
        meta={
          <>
            <StatusBadge value="LAY-003" tone="info" />
            <StatusBadge value={`${data?.total ?? 0} layanan`} tone="neutral" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Terlambat" value={overdueCount} tone="danger" />
        <StatCard label="Mendekati Batas" value={atRiskCount} tone="warning" />
        <StatCard label="Tepat Waktu" value={onTimeCount} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Toolbar>
            <FilterBar>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  className={`${inputClass} w-full pl-10`}
                  placeholder="Cari nomor case, nama ASN"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
              </div>
              <select
                className={inputClass}
                value={slaFilter}
                onChange={(event) => setSlaFilter(event.target.value as SlaFilter)}
              >
                {SLA_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterBar>
          </Toolbar>

          {loading ? (
            <LoadingState label="Memuat data SLA" />
          ) : (
            <SectionCard
              title="Tabel Monitoring SLA"
              description={`${data?.total ?? 0} layanan ditemukan`}
            >
              <LayananSlaTable items={items} />
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          {sopConfig && <LayananSopPanel sops={[sopConfig]} title="SOP Monitoring SLA" />}
        </div>
      </div>
    </div>
  );
}
