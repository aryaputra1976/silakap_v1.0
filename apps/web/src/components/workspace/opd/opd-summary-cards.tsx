import {
  CheckCircle2,
  ClipboardList,
  FileArchive,
  FileClock,
  FileWarning,
  Send,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { OpdSubmissionSummary } from '@/lib/opd-submissions/types';

export function OpdSummaryCards({ summary }: { summary: OpdSubmissionSummary }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        icon={ClipboardList}
        label="Total Permohonan"
        value={summary.totalPermohonan}
        description="Semua layanan OPD"
      />
      <StatCard
        icon={FileClock}
        label="Menunggu Verifikasi"
        value={summary.menungguVerifikasi}
        description="Dalam antrean PPIK"
        tone="warning"
      />
      <StatCard
        icon={FileWarning}
        label="Perlu Perbaikan"
        value={summary.perluPerbaikan}
        description="Menunggu revisi OPD"
        tone="danger"
      />
      <StatCard
        icon={CheckCircle2}
        label="Selesai"
        value={summary.selesai}
        description="Sudah tuntas"
        tone="success"
      />
      <StatCard
        icon={FileArchive}
        label="Dokumen Diunggah"
        value={summary.dokumenDiunggah}
        description="Bukti dukung OPD"
        tone="info"
      />
      <StatCard
        icon={Send}
        label="Usulan Aktif"
        value={summary.usulanAktif}
        description="Belum selesai"
        tone="neutral"
      />
    </section>
  );
}
