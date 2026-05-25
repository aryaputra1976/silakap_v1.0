import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SiapTask } from '@/lib/api/types';
import {
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  secondaryButtonClass,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import { LayananSummaryCards } from '@/components/workspace/layanan/layanan-summary-cards';
import { LayananRegisterTable } from '@/components/workspace/layanan/layanan-register-table';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { useLayananSopConfigs } from '@/lib/layanan/use-layanan-sop-configs';

export function LayananKepegawaianPage() {
  const { sops } = useLayananSopConfigs();
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

          <SectionCard
            title="Meja Kerja Verifikasi PPIK"
            description="Pengajuan OPD yang sudah dikirim diproses di workbench internal agar data OPD, dokumen, checklist SOP, catatan, dan audit tetap dalam satu alur."
            actions={
              <Link className={secondaryButtonClass} to="/layanan/workbench">
                Buka Workbench
                <ArrowRight className="size-4" />
              </Link>
            }
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#cfe1da] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-normal text-[#73816e]">
                  Data OPD
                </div>
                <p className="mt-2 text-sm leading-6 text-[#51614c]">
                  Staff memeriksa data yang dikirim OPD tanpa input ulang.
                </p>
              </div>
              <div className="rounded-lg border border-[#cfe1da] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-normal text-[#73816e]">
                  Checklist SOP
                </div>
                <p className="mt-2 text-sm leading-6 text-[#51614c]">
                  Setiap pengajuan ditautkan ke checklist SOP sesuai module layanan.
                </p>
              </div>
              <div className="rounded-lg border border-[#cfe1da] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-normal text-[#73816e]">
                  Audit Log
                </div>
                <p className="mt-2 text-sm leading-6 text-[#51614c]">
                  Aksi receive, correction, verify, reject, dan complete tercatat.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <LayananSopPanel sops={sops} title="SOP Layanan Kepegawaian" />
        </div>
      </div>
    </div>
  );
}
