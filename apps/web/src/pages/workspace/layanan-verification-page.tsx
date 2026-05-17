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
import { LayananVerificationChecklist } from '@/components/workspace/layanan/layanan-verification-checklist';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { getLayananSopConfig } from '@/lib/layanan/layanan-data';

const sopConfig = getLayananSopConfig('LAY-002');

const STATE_OPTIONS = ['DRAFT', 'SUBMITTED', 'VERIFICATION', 'APPROVAL', 'COMPLETED'];

export function LayananVerificationPage() {
  const [q, setQ] = useState('');
  const [currentState, setCurrentState] = useState('VERIFICATION');
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
        status: currentState || undefined,
        page: 1,
        limit: 30,
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data verifikasi');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, currentState]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Verifikasi Kelengkapan Berkas"
        description={sopConfig?.description ?? 'Pemeriksaan kelengkapan dan kesesuaian berkas layanan kepegawaian.'}
        meta={
          <>
            <StatusBadge value="LAY-002" tone="info" />
            <StatusBadge value={`${data?.total ?? 0} berkas`} tone="neutral" />
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
              <select
                className={inputClass}
                value={currentState}
                onChange={(event) => setCurrentState(event.target.value)}
              >
                <option value="">Semua status</option>
                {STATE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterBar>
          </Toolbar>

          {loading ? (
            <LoadingState label="Memuat daftar berkas verifikasi" />
          ) : (
            <SectionCard
              title="Daftar Berkas Verifikasi"
              description={`${data?.total ?? 0} berkas ditemukan`}
            >
              <LayananVerificationChecklist items={data?.items ?? []} />
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          {sopConfig && <LayananSopPanel sops={[sopConfig]} title="SOP Verifikasi Berkas" />}
        </div>
      </div>
    </div>
  );
}
