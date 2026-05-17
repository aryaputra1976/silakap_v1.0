import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SiapTask } from '@/lib/api/types';
import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { LAYANAN_SOP_LIST, getTaskSlaStatus } from '@/lib/layanan/layanan-data';

export function LayananReportPage() {
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<SiapTask>>('/siap/tasks', { page: 1, limit: 100 })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data laporan');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const overdueCount = items.filter((t) => getTaskSlaStatus(t.status, t.dueDate) === 'overdue').length;
  const completedCount = items.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
  const onTimeCount = items.filter((t) => getTaskSlaStatus(t.status, t.dueDate) === 'on-time').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekap & Laporan Layanan"
        description="Rekapitulasi data layanan kepegawaian untuk pelaporan bulanan dan evaluasi kinerja bidang."
        meta={
          <>
            <StatusBadge value="LAYANAN" tone="info" />
            <StatusBadge value="Rekap Bulanan" tone="neutral" />
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat data laporan" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Permohonan" value={total} />
            <StatCard label="Selesai" value={completedCount} tone="success" />
            <StatCard label="Tepat Waktu" value={onTimeCount} tone="success" />
            <StatCard label="Terlambat" value={overdueCount} tone="danger" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <SectionCard
                title="Ringkasan SOP Layanan"
                description="Referensi SOP LAY-001 s.d. LAY-005 dan link DMS terkait."
              >
                <div className="divide-y divide-zinc-100">
                  {LAYANAN_SOP_LIST.map((sop) => (
                    <div key={sop.code} className="flex items-center gap-3 py-3">
                      <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-zinc-500">{sop.code}</span>
                          {sop.rhkCodes.slice(0, 2).map((rhk) => (
                            <span key={rhk} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                              {rhk}
                            </span>
                          ))}
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-zinc-800">{sop.title}</p>
                      </div>
                      <Link
                        to={`/layanan${sop.pageRoute === '/layanan' ? '' : sop.pageRoute.replace('/layanan', '')}`}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Buka
                      </Link>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Dokumen Laporan DMS"
                description="Dokumen laporan layanan yang tersimpan di DMS."
              >
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
                  <p className="text-sm text-zinc-500">
                    Lihat dokumen laporan layanan di DMS Bukti Dukung.
                  </p>
                  <Link
                    to="/dms/documents?category=ARSIP_KEPEGAWAIAN"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka DMS Arsip Kepegawaian
                  </Link>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-4">
              <LayananSopPanel sops={LAYANAN_SOP_LIST} title="Semua SOP Layanan" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
