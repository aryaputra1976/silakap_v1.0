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
import { LayananSummaryCards } from '@/components/workspace/layanan/layanan-summary-cards';
import { LayananRegisterTable } from '@/components/workspace/layanan/layanan-register-table';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { LAYANAN_SOP_LIST } from '@/lib/layanan/layanan-data';

export function LayananKepegawaianPage() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<SiapTask>>('/siap/tasks', { q, page: 1, limit: 30 })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data layanan');
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
        title="Layanan Kepegawaian"
        description="Pengelolaan layanan kepegawaian sesuai SOP LAY-001 s.d. LAY-005 Bidang PPIK."
        meta={
          <>
            <StatusBadge value="LAYANAN" tone="info" />
            <StatusBadge value={`${data?.total ?? 0} permohonan`} tone="neutral" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Modul Layanan"
        description="Pilih modul layanan untuk melihat detail dan daftar permohonan."
      >
        <LayananSummaryCards />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Toolbar>
            <FilterBar>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  className={`${inputClass} w-full pl-10`}
                  placeholder="Cari nomor case, nama ASN, NIP"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
              </div>
            </FilterBar>
          </Toolbar>

          {loading ? (
            <LoadingState label="Memuat daftar permohonan" />
          ) : (
            <SectionCard
              title="Daftar Permohonan Masuk"
              description={`${data?.total ?? 0} permohonan ditemukan`}
            >
              <LayananRegisterTable items={data?.items ?? []} />
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <LayananSopPanel sops={LAYANAN_SOP_LIST} title="SOP Layanan Kepegawaian" />
        </div>
      </div>
    </div>
  );
}
