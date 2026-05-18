import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import type { PaginatedResult, SiapTask } from '@/lib/api/types';
import type { OpdSubmission } from '@/lib/opd-submissions/types';
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
  const [opdQueue, setOpdQueue] =
    useState<PaginatedResult<OpdSubmission> | null>(null);
  const [loading, setLoading] = useState(false);
  const [opdLoading, setOpdLoading] = useState(false);
  const [error, setError] = useState('');
  const [opdError, setOpdError] = useState('');

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

  useEffect(() => {
    let active = true;

    setOpdLoading(true);
    setOpdError('');

    opdSubmissionsApi
      .fetchInternalOpdSubmissions({
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        limit: 10,
      })
      .then((result) => {
        if (active) {
          setOpdQueue(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setOpdError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat antrian OPD',
          );
        }
      })
      .finally(() => {
        if (active) {
          setOpdLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
      {opdError ? <ErrorAlert message={opdError} /> : null}

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

          <SectionCard
            title="Antrian OPD Masuk"
            description="Pengajuan OPD yang sudah dikirim dan menunggu penerimaan PPIK."
            actions={
              <StatusBadge
                value={`${opdQueue?.total ?? 0} pengajuan OPD`}
                tone="warning"
              />
            }
          >
            {opdLoading ? (
              <LoadingState label="Memuat antrian OPD" />
            ) : (
              <LayananOpdQueueTable items={opdQueue?.items ?? []} />
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <LayananSopPanel sops={LAYANAN_SOP_LIST} title="SOP Layanan Kepegawaian" />
        </div>
      </div>
    </div>
  );
}

function LayananOpdQueueTable({ items }: { items: OpdSubmission[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#b7c9b1] bg-[#f4f8ef] p-6 text-sm text-[#6d7e68]">
        Belum ada pengajuan OPD yang menunggu penerimaan.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-[#d8e5d3] bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[#173c36]">{item.title}</div>
              <div className="mt-1 text-xs text-[#687967]">
                {item.submissionNumber ?? 'DRAFT'} - {item.opdName ?? 'OPD'}
              </div>
            </div>
            <StatusBadge value={item.status} tone="warning" />
          </div>
          <p className="mt-3 text-sm text-[#51614c]">
            {item.description ?? 'Tidak ada keterangan.'}
          </p>
        </div>
      ))}
    </div>
  );
}
