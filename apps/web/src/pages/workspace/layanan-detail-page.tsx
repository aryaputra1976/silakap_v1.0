import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import {
  ErrorAlert,
  FileMeta,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopChecklistPanel } from '@/components/workspace/sop/sop-checklist-panel';
import { ServiceActionPanel } from '@/components/workspace/service-workbench/service-action-panel';
import { ServiceAuditTimeline } from '@/components/workspace/service-workbench/service-audit-timeline';
import {
  ServiceDocumentPanel,
  type ServiceDocumentAction,
} from '@/components/workspace/service-workbench/service-document-panel';
import { ServiceInternalDocumentPanel } from '@/components/workspace/service-workbench/service-internal-document-panel';
import { ServiceSlaCard } from '@/components/workspace/service-workbench/service-sla-card';
import { ServiceStatusBadge } from '@/components/workspace/service-workbench/service-status-badge';
import { ServiceStatusTimeline } from '@/components/workspace/service-workbench/service-status-timeline';
import { ServiceSubmissionDataCard } from '@/components/workspace/service-workbench/service-submission-data-card';
import { ServiceVerificationNotePanel } from '@/components/workspace/service-workbench/service-verification-note-panel';
import { ServiceWorkbenchHeader } from '@/components/workspace/service-workbench/service-workbench-header';
import type { InternalSubmissionAction } from '@/lib/opd-submissions/internal-policy';
import { getSopCodeForSubmission } from '@/lib/opd-submissions/sop-mapping';
import type {
  OpdSubmission,
  OpdSubmissionTimelineItem,
} from '@/lib/opd-submissions/types';
import { opdSubmissionStatusLabel } from '@/lib/opd-submissions/types';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

export function LayananDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const [submission, setSubmission] = useState<OpdSubmission | null>(null);
  const [timeline, setTimeline] = useState<OpdSubmissionTimelineItem[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] =
    useState<InternalSubmissionAction | null>(null);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDetail = useCallback(() => {
    if (!id) {
      setError('ID pengajuan tidak valid');
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      opdSubmissionsApi.fetchInternalOpdSubmission(id),
      opdSubmissionsApi.fetchInternalOpdSubmissionTimeline(id),
    ])
      .then(([result, timelineResult]) => {
        setSubmission(result);
        setTimeline(timelineResult);
      })
      .catch((caught) => {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal memuat detail pengajuan OPD',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleAction(action: InternalSubmissionAction) {
    if (!submission) {
      return;
    }

    const trimmedNote = note.trim();
    if (
      (action === 'request-correction' || action === 'reject') &&
      !trimmedNote
    ) {
      setError('Catatan wajib diisi untuk Minta Perbaikan atau Tolak.');
      return;
    }

    setLoadingAction(action);
    setError('');
    setSuccess('');

    try {
      const payload = trimmedNote ? { note: trimmedNote } : {};
      const updated = await runAction(submission.id, action, payload);
      setSubmission(updated);
      setSuccess('Aksi berhasil disimpan dan audit log diperbarui.');
      setNote('');
      loadDetail();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Aksi internal gagal diproses',
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDocumentAction(
    documentId: string,
    action: ServiceDocumentAction,
  ) {
    if (!submission) {
      return;
    }

    const trimmedNote = note.trim();
    if (
      (action === 'request-document-correction' ||
        action === 'reject-document') &&
      !trimmedNote
    ) {
      setError('Catatan wajib diisi untuk Minta Perbaikan atau Tolak Dokumen.');
      return;
    }

    setLoadingDocumentId(documentId);
    setError('');
    setSuccess('');

    try {
      const updated = await runDocumentAction(
        submission.id,
        documentId,
        action,
        trimmedNote,
      );
      setSubmission(updated);
      setSuccess('Aksi dokumen berhasil disimpan dan audit log diperbarui.');
      setNote('');
      loadDetail();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Aksi dokumen gagal diproses',
      );
    } finally {
      setLoadingDocumentId(null);
    }
  }

  if (loading && !submission) {
    return <LoadingState label="Memuat detail pengajuan" />;
  }

  if (!submission) {
    return (
      <div className="space-y-5">
        <ServiceWorkbenchHeader detailMode />
        {error ? <ErrorAlert message={error} /> : null}
      </div>
    );
  }

  const sopCode = getSopCodeForSubmission(
    submission.moduleKey,
    submission.serviceType,
  );

  return (
    <div className="space-y-5">
      <ServiceWorkbenchHeader
        detailMode
        title="Detail Pengajuan OPD"
        description="Meja kerja internal untuk cek data usulan, dokumen OPD, checklist SOP, catatan verifikasi, dan aksi PPIK."
        onRefresh={loadDetail}
        refreshing={loading}
      />

      {error ? <ErrorAlert message={error} /> : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <PageHeader
        title={submission.submissionNumber ?? 'Pengajuan belum bernomor'}
        description={submission.title}
        meta={
          <>
            <ServiceStatusBadge status={submission.status} />
            <StatusBadge value={submission.opdName ?? 'OPD'} tone="info" />
            <StatusBadge value={submission.serviceType} tone="neutral" />
          </>
        }
      />

      <SectionCard title="Header Detail Pengajuan">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FileMeta
            label="Nomor pengajuan"
            value={submission.submissionNumber ?? '-'}
          />
          <FileMeta
            label="Status"
            value={opdSubmissionStatusLabel(submission.status)}
          />
          <FileMeta label="OPD" value={submission.opdName ?? '-'} />
          <FileMeta
            label="Tanggal submit"
            value={formatDateTime(submission.submittedAt)}
          />
          <FileMeta
            label="Diterima"
            value={formatDateTime(submission.receivedAt)}
          />
          <FileMeta
            label="Diverifikasi"
            value={formatDateTime(submission.verifiedAt)}
          />
          <FileMeta
            label="Selesai"
            value={formatDateTime(submission.completedAt)}
          />
          <FileMeta
            label="Ditugaskan ke"
            value={submission.assignedToId ?? '-'}
          />
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <ServiceSubmissionDataCard submission={submission} />
          <ServiceSlaCard submission={submission} />
          <ServiceDocumentPanel
            documents={submission.documents}
            loadingDocumentId={loadingDocumentId}
            note={note}
            role={role}
            onDocumentAction={handleDocumentAction}
          />
          <SopChecklistPanel
            entityId={submission.id}
            entityType="opd_submission"
            persistenceMode="api"
            sopCode={sopCode}
            userRole={role}
          />
          <ServiceInternalDocumentPanel />
          <ServiceStatusTimeline items={timeline} />
          <ServiceAuditTimeline auditLogs={submission.auditLogs} />
        </div>

        <div className="space-y-5">
          {submission.correctionNote ? (
            <SectionCard title="Catatan Perbaikan Terakhir">
              <p className="text-sm leading-6 text-[#51614c]">
                {submission.correctionNote}
              </p>
            </SectionCard>
          ) : null}
          <ServiceVerificationNotePanel
            disabled={Boolean(loadingAction)}
            value={note}
            onChange={setNote}
          />
          <ServiceActionPanel
            loadingAction={loadingAction}
            note={note}
            role={role}
            status={submission.status}
            onAction={handleAction}
          />
        </div>
      </div>
    </div>
  );
}

function runDocumentAction(
  id: string,
  documentId: string,
  action: ServiceDocumentAction,
  note: string,
) {
  switch (action) {
    case 'verify-document':
      return opdSubmissionsApi.verifySubmissionDocument(
        id,
        documentId,
        note ? { note } : {},
      );
    case 'request-document-correction':
      return opdSubmissionsApi.requestSubmissionDocumentCorrection(
        id,
        documentId,
        { note },
      );
    case 'reject-document':
      return opdSubmissionsApi.rejectSubmissionDocument(id, documentId, {
        note,
      });
  }
}

function runAction(
  id: string,
  action: InternalSubmissionAction,
  payload: { note?: string },
) {
  switch (action) {
    case 'receive':
      return opdSubmissionsApi.receiveOpdSubmission(id, payload);
    case 'start-verification':
      return opdSubmissionsApi.startOpdVerification(id, payload);
    case 'request-correction':
      return opdSubmissionsApi.requestOpdCorrection(id, {
        note: payload.note ?? '',
      });
    case 'verify':
      return opdSubmissionsApi.verifyOpdSubmission(id, payload);
    case 'reject':
      return opdSubmissionsApi.rejectOpdSubmission(id, payload);
    case 'complete':
      return opdSubmissionsApi.completeOpdSubmission(id, payload);
  }
}
