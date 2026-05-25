import { SectionCard, FileMeta, formatDateTime } from '@/components/workspace/ui';
import type { OpdSubmission } from '@/lib/opd-submissions/types';
import { layananServiceTypeLabel } from '@/lib/layanan/layanan-data';

export function ServiceSubmissionDataCard({
  submission,
}: {
  submission: OpdSubmission;
}) {
  return (
    <SectionCard
      title="Data Usulan OPD"
      description="Data ini berasal dari pengajuan OPD dan ditampilkan untuk diverifikasi, bukan diketik ulang oleh staff."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FileMeta label="Module" value={submission.moduleKey} />
        <FileMeta label="Jenis layanan" value={layananServiceTypeLabel(submission.serviceType)} />
        <FileMeta label="Judul" value={submission.title} />
        <FileMeta label="ASN terkait" value={submission.subjectName ?? '-'} />
        <FileMeta label="NIP" value={submission.subjectNip ?? '-'} />
        <FileMeta
          label="Tanggal submit"
          value={formatDateTime(submission.submittedAt)}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <FileMeta
            label="Keterangan OPD"
            value={submission.description ?? 'Tidak ada keterangan.'}
          />
        </div>
      </div>
    </SectionCard>
  );
}
