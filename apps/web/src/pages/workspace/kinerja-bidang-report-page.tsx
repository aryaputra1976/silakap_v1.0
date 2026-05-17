import { useEffect, useState } from 'react';
import {
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  kinerjaRhkReportStatusLabel,
  kinerjaRhkReportStatusTone,
  kinerjaTargetUnitLabel,
  type KinerjaBidangReportResponse,
  type KinerjaBidangRhkReportRow,
} from '@/lib/api/kinerja-bidang';

export function KinerjaBidangReportPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [report, setReport] = useState<KinerjaBidangReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.getReport({ year });
        if (mounted) setReport(result);
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat laporan Kinerja Bidang');
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
        title="Laporan Kinerja"
        description="Ringkasan dan narasi laporan Kinerja Bidang dari API backend."
        meta={<StatusBadge value={year} tone="success" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Parameter" description="Filter tahun laporan.">
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

      {loading ? <LoadingState label="Memuat laporan Kinerja Bidang" /> : null}

      <SectionCard title={report?.narrative.title ?? 'Ringkasan Laporan'} description="Ringkasan eksekutif.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="RHK Utama" value={report?.summary.totalRhkPrimary ?? 0} />
          <StatCard label="Target" value={report?.summary.totalTarget ?? 0} />
          <StatCard label="Realisasi" value={report?.summary.totalRealization ?? 0} tone="success" />
          <StatCard label="Progres" value={`${report?.summary.averageProgressPercent ?? 0}%`} tone="info" />
        </div>
      </SectionCard>

      <SectionCard title="Rekapitulasi RHK" description="Capaian per RHK utama.">
        <DataTable<KinerjaBidangRhkReportRow>
          items={report?.rows ?? []}
          empty="Belum ada data RHK"
          rowKey={(item) => item.targetId}
          columns={[
            { key: 'rhk', header: 'RHK', render: (item) => <StatusBadge value={item.rhkCode} tone="info" /> },
            {
              key: 'sop',
              header: 'SOP',
              render: (item) => (
                <div>
                  <div className="font-semibold text-[#173c36]">{item.sopTitle}</div>
                  <div className="mt-1 text-xs text-[#6d7e68]">{item.sopCode}</div>
                </div>
              ),
            },
            { key: 'target', header: 'Target', render: (item) => `${item.targetQuantity} ${kinerjaTargetUnitLabel(item.targetUnit)}` },
            { key: 'realization', header: 'Realisasi', render: (item) => item.realizationQuantity },
            { key: 'approved', header: 'Approved', render: (item) => item.approvedRealizationQuantity },
            { key: 'progress', header: 'Progres', render: (item) => `${item.progressPercent}%` },
            { key: 'status', header: 'Status', render: (item) => <StatusBadge value={kinerjaRhkReportStatusLabel(item.status)} tone={kinerjaRhkReportStatusTone(item.status)} /> },
          ]}
        />
      </SectionCard>

      <SectionCard title="Narasi Laporan" description="Draft narasi dari backend.">
        <div className="space-y-4 text-sm leading-6 text-[#51614c]">
          <p>{report?.narrative.opening ?? '-'}</p>
          <p>{report?.narrative.achievement ?? '-'}</p>
          <p>{report?.narrative.constraint ?? '-'}</p>
          <p>{report?.narrative.followUp ?? '-'}</p>
        </div>
      </SectionCard>
    </div>
  );
}
