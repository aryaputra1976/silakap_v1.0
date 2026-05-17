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
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import { LayananDelayPanel } from '@/components/workspace/layanan/layanan-delay-panel';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { getLayananSopConfig } from '@/lib/layanan/layanan-data';

const sopConfig = getLayananSopConfig('LAY-004');

export function LayananDelayPage() {
  const [q, setQ] = useState('');
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
        status: 'OVERDUE',
        page: 1,
        limit: 50,
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data keterlambatan');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Keterlambatan Layanan"
        description={sopConfig?.description ?? 'Tindak lanjut atas layanan yang melewati batas waktu SLA.'}
        meta={
          <>
            <StatusBadge value="LAY-004" tone="warning" />
            <StatusBadge value={`${data?.total ?? 0} kasus terlambat`} tone="neutral" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

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
            </FilterBar>
          </Toolbar>

          {loading ? (
            <LoadingState label="Memuat data keterlambatan" />
          ) : (
            <SectionCard
              title="Daftar Layanan Terlambat"
              description={`${data?.total ?? 0} layanan melewati batas SLA`}
            >
              {data?.total === 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Tidak ada keterlambatan layanan. Semua layanan berjalan sesuai SLA.
                </div>
              )}
              <LayananDelayPanel items={data?.items ?? []} />
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          {sopConfig && <LayananSopPanel sops={[sopConfig]} title="SOP Penanganan Keterlambatan" />}
        </div>
      </div>
    </div>
  );
}
