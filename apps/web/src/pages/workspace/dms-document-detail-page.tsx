import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';
import {
  dmsApi,
  dmsAccessLevelLabel,
  dmsAccessLevelTone,
  type DmsAuditTimelineItem,
  type DmsDocument,
  type DmsDocumentCategory,
} from '@/lib/api/dms';
import { getChecklistTemplateBySopCode } from '@/lib/sop-checklist/checklist-policy';
import { SopChecklistPanel } from '@/components/workspace/sop/sop-checklist-panel';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsActionPanel } from '@/components/workspace/dms/dms-action-panel';
import { DmsAuditTimeline } from '@/components/workspace/dms/dms-audit-timeline';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import {
  initialDmsMetadataForm,
  toDmsCreatePayload,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';
import { DmsPreviewPanel } from '@/components/workspace/dms/dms-preview-panel';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';
import { DmsDocumentMetadataSection } from '@/components/workspace/dms/detail/dms-document-metadata-section';
import { DmsDocumentRelationsCard } from '@/components/workspace/dms/detail/dms-document-relations-card';
import { DmsDocumentReviewNoteCard } from '@/components/workspace/dms/detail/dms-document-review-note-card';
import { DmsDocumentUploadSection } from '@/components/workspace/dms/detail/dms-document-upload-section';

export function DmsDocumentDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const { user } = useAuth();
  const userRole = getPrimaryRole(user?.roles);

  const [document, setDocument] = useState<DmsDocument | null>(null);
  const [form, setForm] = useState<DmsMetadataFormValue>(initialDmsMetadataForm);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [auditItems, setAuditItems] = useState<DmsAuditTimelineItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

  async function loadAuditTimeline(targetDocumentId: string) {
    setAuditLoading(true);
    setAuditError('');

    try {
      const result = await dmsApi.getDocumentAuditTimeline(targetDocumentId);
      setAuditItems(result);
    } catch (caught) {
      setAuditItems([]);
      setAuditError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat audit timeline DMS',
      );
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadDocument() {
    if (!documentId) {
      setError('ID dokumen tidak valid');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setIsForbidden(false);

    try {
      const result = await dmsApi.getDocument(documentId);
      setDocument(result);
      setForm(toFormValue(result));
      await loadAuditTimeline(result.id);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setIsForbidden(true);
      } else {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal memuat detail dokumen DMS',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function saveMetadata() {
    if (!document) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.updateDocument(document.id, toDmsCreatePayload(form));
      setDocument(updated);
      setForm(toFormValue(updated));
      setEditMode(false);
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memperbarui metadata dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function uploadFile() {
    if (!document || !file) {
      return;
    }

    if (
      document.fileName &&
      !confirmAction(
        'Dokumen ini sudah memiliki file. Upload file baru akan mengganti file aktif dan menaikkan versi dokumen. Lanjutkan?',
      )
    ) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.uploadDocument(document.id, file, {
        description: form.description,
      });

      setDocument(updated);
      setForm(toFormValue(updated));
      setFile(null);
      setFileError('');
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengunggah file dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function submitDocument() {
    if (!document) {
      return;
    }

    if (
      !confirmAction(
        'Submit dokumen untuk verifikasi? Setelah disubmit, dokumen tidak dapat diedit sampai diverifikasi atau ditolak.',
      )
    ) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.submitDocument(document.id);
      setDocument(updated);
      setForm(toFormValue(updated));
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal submit dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function verifyDocument() {
    if (!document) {
      return;
    }

    if (!confirmAction('Verifikasi dokumen ini sebagai bukti dukung yang sah?')) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.verifyDocument(document.id, {
        note: reviewNote || undefined,
      });

      setDocument(updated);
      setForm(toFormValue(updated));
      setReviewNote('');
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memverifikasi dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function rejectDocument() {
    if (!document) {
      return;
    }

    if (reviewNote.trim().length < 3) {
      setError('Catatan penolakan wajib diisi minimal 3 karakter');
      return;
    }

    if (
      !confirmAction(
        'Tolak dokumen ini? Dokumen akan dikembalikan untuk diperbaiki oleh pembuat.',
      )
    ) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.rejectDocument(document.id, {
        note: reviewNote,
      });

      setDocument(updated);
      setForm(toFormValue(updated));
      setReviewNote('');
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal menolak dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function archiveDocument() {
    if (!document) {
      return;
    }

    if (
      !confirmAction(
        'Arsipkan dokumen ini sebagai dokumen final? Setelah diarsipkan, dokumen tidak dapat diedit atau dihapus.',
      )
    ) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const updated = await dmsApi.archiveDocument(document.id);
      setDocument(updated);
      setForm(toFormValue(updated));
      await loadAuditTimeline(updated.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengarsipkan dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function deleteDocument() {
    if (!document) {
      return;
    }

    if (
      !confirmAction('Hapus dokumen ini? Data dokumen akan dihapus dari daftar DMS.')
    ) {
      return;
    }

    if (
      !confirmAction(
        'Konfirmasi sekali lagi: dokumen yang dihapus tidak akan tampil lagi di DMS. Lanjutkan hapus?',
      )
    ) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      await dmsApi.deleteDocument(document.id);
      navigate('/dms/documents');
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal menghapus dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function downloadDocument() {
    if (!document) {
      return;
    }

    setDownloading(true);
    setError('');

    try {
      await dmsApi.downloadDocument(
        document.id,
        document.originalFileName ?? document.fileName ?? `${document.id}.bin`,
      );

      await loadAuditTimeline(document.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal mengunduh dokumen',
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Memuat detail dokumen DMS" />;
  }

  if (isForbidden) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Akses Ditolak"
          description="Dokumen ini memiliki level akses terbatas yang tidak sesuai dengan peran Anda."
          actions={
            <ActionButton
              icon={ArrowLeft}
              onClick={() => navigate('/dms/documents')}
              variant="secondary"
            >
              Kembali
            </ActionButton>
          }
        />
        <div className="flex flex-col items-center gap-4 rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-rose-200 bg-white">
            <Lock className="size-6 text-rose-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-rose-800">
              Dokumen ini tidak dapat diakses
            </p>
            <p className="mt-1 max-w-md text-sm text-rose-600">
              Level akses dokumen ini (TERBATAS / SANGAT_TERBATAS / PIMPINAN / AUDIT)
              memerlukan peran yang lebih tinggi. Hubungi administrator DMS jika Anda
              memerlukan akses.
            </p>
          </div>
          <ActionButton
            icon={ArrowLeft}
            onClick={() => navigate('/dms/documents')}
            variant="secondary"
          >
            Kembali ke Daftar Dokumen
          </ActionButton>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Detail Dokumen DMS"
          description="Dokumen tidak ditemukan atau tidak dapat diakses."
          actions={
            <ActionButton
              icon={ArrowLeft}
              onClick={() => navigate('/dms/documents')}
              variant="secondary"
            >
              Kembali
            </ActionButton>
          }
        />
        {error ? <ErrorAlert message={error} /> : null}
      </div>
    );
  }

  const canEditMetadata =
    document.status === 'DRAFT' ||
    document.status === 'UPLOADED' ||
    document.status === 'REJECTED';

  const docSopCode = Array.isArray(document.tags)
    ? (document.tags.map((t) => String(t)).find((t) => t.startsWith('SOP-BKPSDM-')) ?? '')
    : '';
  const hasChecklistTemplate =
    docSopCode !== '' && Boolean(getChecklistTemplateBySopCode(docSopCode));

  return (
    <div className="space-y-5">
      <PageHeader
        title={document.title}
        description="Detail dokumen DMS, metadata, file, riwayat, dan aksi workflow dokumen."
        meta={
          <>
            <DmsCategoryBadge category={document.category} />
            <DmsStatusBadge status={document.status} />
            <StatusBadge
              value={dmsAccessLevelLabel(document.accessLevel)}
              tone={dmsAccessLevelTone(document.accessLevel)}
            />
            {document.fileName ? (
              <StatusBadge value="FILE TERSEDIA" tone="success" />
            ) : (
              <StatusBadge value="BELUM ADA FILE" tone="warning" />
            )}
          </>
        }
        actions={
          <>
            <ActionButton
              icon={ArrowLeft}
              onClick={() => navigate('/dms/documents')}
              variant="secondary"
            >
              Kembali
            </ActionButton>
            <ActionButton
              disabled={loading || working}
              icon={RefreshCcw}
              onClick={() => void loadDocument()}
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {(document.accessLevel === 'SANGAT_TERBATAS' ||
        document.accessLevel === 'PIMPINAN' ||
        document.accessLevel === 'AUDIT') && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Dokumen Sensitif — {dmsAccessLevelLabel(document.accessLevel)}.</strong>{' '}
            Akses ke dokumen ini terbatas. Pastikan penanganan sesuai dengan kebijakan keamanan
            informasi BKPSDM. Jangan bagikan konten dokumen kepada pihak yang tidak berwenang.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-5">
          <DmsDocumentMetadataSection
            canEdit={canEditMetadata}
            document={document}
            editMode={editMode}
            form={form}
            working={working}
            onCancel={() => {
              setForm(toFormValue(document));
              setEditMode(false);
            }}
            onEdit={() => setEditMode(true)}
            onFormChange={setForm}
            onSave={() => void saveMetadata()}
          />

          <DmsPreviewPanel
            document={document}
            downloading={downloading}
            onDownload={() => void downloadDocument()}
          />

          {canEditMetadata ? (
            <DmsDocumentUploadSection
              file={file}
              fileError={fileError}
              working={working}
              onFileError={setFileError}
              onFileSelect={setFile}
              onUpload={() => void uploadFile()}
            />
          ) : null}

          <SectionCard
            title="Riwayat Dokumen"
            description="Jejak aktivitas utama berdasarkan audit log asli."
          >
            <DmsAuditTimeline
              error={auditError}
              items={auditItems}
              loading={auditLoading}
              onRefresh={() => void loadAuditTimeline(document.id)}
            />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <DmsActionPanel
            document={document}
            working={working}
            onArchive={() => void archiveDocument()}
            onDelete={() => void deleteDocument()}
            onReject={() => void rejectDocument()}
            onSubmit={() => void submitDocument()}
            onVerify={() => void verifyDocument()}
          />

          <DmsDocumentReviewNoteCard
            document={document}
            reviewNote={reviewNote}
            working={working}
            onChange={setReviewNote}
          />

          <DmsDocumentRelationsCard document={document} />
        </div>
      </div>

      {hasChecklistTemplate ? (
        <SopChecklistPanel
          sopCode={docSopCode}
          userRole={userRole}
          contextId={document.id}
          persistenceMode="api"
          entityType="dms_document"
          entityId={document.id}
        />
      ) : null}
    </div>
  );
}

function toFormValue(document: DmsDocument): DmsMetadataFormValue {
  const tagsArray = Array.isArray(document.tags)
    ? document.tags.map((t) => String(t))
    : [];

  const sopCodeFromTags = tagsArray.find((t) =>
    t.startsWith('SOP-BKPSDM-'),
  ) ?? '';

  return {
    title: document.title,
    description: document.description ?? '',
    category: document.category as DmsDocumentCategory,
    subCategory: document.subCategory ?? '',
    sopCode: sopCodeFromTags,
    tags: tagsArray.join(', '),
    accessLevel:
      document.accessLevel === 'TERBATAS' ||
      document.accessLevel === 'SANGAT_TERBATAS' ||
      document.accessLevel === 'PIMPINAN' ||
      document.accessLevel === 'AUDIT'
        ? document.accessLevel
        : 'INTERNAL',
    periodYear: document.periodYear ? String(document.periodYear) : '',
    periodMonth: document.periodMonth ? String(document.periodMonth) : '',
    periodQuarter: document.periodQuarter ? String(document.periodQuarter) : '',
    unitKerjaId: document.unitKerjaId ?? '',
    asnId: document.asnId ?? '',
    caseId: document.caseId ?? '',
    worklogId: document.worklogId ?? '',
  };
}

function confirmAction(message: string) {
  return window.confirm(message);
}
