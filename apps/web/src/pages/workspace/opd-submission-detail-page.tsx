import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FilePenLine, Send, UploadCloud } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  FileMeta,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdSubmissionTimeline } from '@/components/workspace/opd/opd-submission-timeline';
import { ServiceSlaCard } from '@/components/workspace/service-workbench/service-sla-card';
import {
  type OpdSubmissionStatus,
  canOpdUploadDocument,
  opdSubmissionDocumentStatusLabel,
  opdSubmissionDocumentStatusTone,
  opdSubmissionStatusLabel,
  opdSubmissionStatusTone,
  type OpdSubmission,
  type OpdSubmissionTimelineItem,
} from '@/lib/opd-submissions/types';

export function OpdSubmissionDetailPage() {
  const { id = '' } = useParams();
  const [submission, setSubmission] = useState<OpdSubmission | null>(null);
  const [timeline, setTimeline] = useState<OpdSubmissionTimelineItem[]>([]);
  const [timelineError, setTimelineError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [result, timelineResult] = await Promise.all([
        opdSubmissionsApi.fetchMyOpdSubmission(id),
        opdSubmissionsApi.fetchMyOpdSubmissionTimeline(id),
      ]);
      setSubmission(result);
      setTimeline(timelineResult);
      setTimelineError('');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat detail pengajuan OPD',
      );
      setTimelineError('Gagal memuat timeline status OPD.');
    } finally {
      setLoading(false);
    }
  }

  async function submitSubmission() {
    if (!submission) {
      return;
    }

    setWorking(true);
    setError('');
    setSuccess('');

    try {
      const result =
        submission.status === 'DRAFT'
          ? await opdSubmissionsApi.submitOpdSubmission(submission.id)
          : await opdSubmissionsApi.submitOpdCorrection(submission.id);
      setSubmission(result);
      setSuccess(
        submission.status === 'DRAFT'
          ? 'Permohonan berhasil dikirim ke antrian PPIK.'
          : 'Perbaikan berkas berhasil dikirim ke antrian PPIK.',
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengirim permohonan',
      );
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <LoadingState label="Memuat detail pengajuan OPD" />;
  }

  if (!submission) {
    return (
      <div className="space-y-5">
        {error ? <ErrorAlert message={error} /> : null}
      </div>
    );
  }

  const submitAction = getSubmitAction(submission.status);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title={submission.submissionNumber ?? 'Draft Pengajuan OPD'}
        description={submission.title}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/opd/dokumen/upload?submissionId=${submission.id}`}>
              <ActionButton
                disabled={!canOpdUploadDocument(submission.status)}
                icon={UploadCloud}
                variant="secondary"
              >
                Tambah Dokumen
              </ActionButton>
            </Link>
            {submitAction ? (
              <ActionButton
                icon={Send}
                disabled={working}
                onClick={() => void submitSubmission()}
              >
                {submitAction.label}
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {success ? (
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-4 text-sm font-medium text-[#12815f]">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Data Pengajuan" description="Informasi utama OPD">
          <div className="grid gap-3">
            <FileMeta
              label="Status"
              value={
                <StatusBadge
                  value={opdSubmissionStatusLabel(submission.status)}
                  tone={opdSubmissionStatusTone(submission.status)}
                />
              }
            />
            <FileMeta label="Module" value={submission.moduleKey} />
            <FileMeta label="Jenis Layanan" value={submission.serviceType} />
            <FileMeta label="OPD" value={submission.opdName ?? '-'} />
          </div>
        </SectionCard>

        <SectionCard title="ASN Terkait" description="Subjek pengajuan">
          <div className="grid gap-3">
            <FileMeta label="Nama" value={submission.subjectName ?? '-'} />
            <FileMeta label="NIP" value={submission.subjectNip ?? '-'} />
            <FileMeta label="Dibuat" value={new Date(submission.createdAt).toLocaleString('id-ID')} />
            <FileMeta label="Dikirim" value={submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('id-ID') : '-'} />
          </div>
        </SectionCard>

        <SectionCard
          title="Catatan Perbaikan"
          description="Catatan dari verifikator PPIK jika ada"
          actions={<FilePenLine className="size-4 text-[#587052]" />}
        >
          <p className="text-sm leading-6 text-[#51614c]">
            {submission.correctionNote ?? 'Tidak ada catatan perbaikan.'}
          </p>
        </SectionCard>
      </section>

      <SectionCard title="Keterangan" description="Ringkasan dari OPD">
        <p className="whitespace-pre-wrap text-sm leading-6 text-[#51614c]">
          {submission.description ?? '-'}
        </p>
      </SectionCard>

      <ServiceSlaCard submission={submission} />

      {submission.status === 'NEEDS_CORRECTION' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Waktu perbaikan berkas oleh OPD tidak dihitung sebagai keterlambatan
          internal PPIK. SLA dilanjutkan setelah perbaikan dikirim.
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Dokumen"
          description="Metadata dokumen pendukung pengajuan OPD"
          actions={<StatusBadge value={`${submission.documents.length} dokumen`} />}
        >
          {submission.documents.length > 0 ? (
            <div className="grid gap-3">
              {submission.documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border border-[#cfe1da] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#18343a]">
                        {document.title}
                      </div>
                      <div className="mt-1 text-xs text-[#687967]">
                        {document.documentType}
                      </div>
                    </div>
                    <StatusBadge value={document.status} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <FileMeta
                      label="Nama File"
                      value={document.originalFileName ?? '-'}
                    />
                    <FileMeta
                      label="Ukuran"
                      value={formatSize(document.sizeBytes)}
                    />
                    <FileMeta
                      label="Tipe"
                      value={document.mimeType ?? '-'}
                    />
                  </div>
                  <div className="mt-3">
                    <StatusBadge
                      value={opdSubmissionDocumentStatusLabel(document.status)}
                      tone={opdSubmissionDocumentStatusTone(document.status)}
                    />
                  </div>
                  {document.note ? (
                    <p className="mt-3 text-sm text-[#51614c]">{document.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#b7c9b1] bg-[#f4f8ef] p-6 text-sm text-[#6d7e68]">
              Belum ada metadata dokumen pendukung.
            </div>
          )}
        </SectionCard>

        <OpdSubmissionTimeline items={timeline} error={timelineError} />
      </section>
    </div>
  );
}

function formatSize(value: number | null) {
  if (!value) {
    return '-';
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getSubmitAction(status: OpdSubmissionStatus) {
  if (status === 'DRAFT') {
    return { label: 'Kirim Permohonan' };
  }

  if (status === 'NEEDS_CORRECTION') {
    return { label: 'Kirim Perbaikan' };
  }

  return null;
}
