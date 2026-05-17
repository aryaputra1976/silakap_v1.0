import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsAuditTimelineItem,
  type DmsDocument,
  type DmsDocumentCategory,
} from '@/lib/api/dms';
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

    try {
      const result = await dmsApi.getDocument(documentId);
      setDocument(result);
      setForm(toFormValue(result));
      await loadAuditTimeline(result.id);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat detail dokumen DMS',
      );
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

  return (
    <div className="space-y-5">
      <PageHeader
        title={document.title}
        description="Detail dokumen DMS, metadata, file, riwayat, dan aksi workflow dokumen."
        meta={
          <>
            <DmsCategoryBadge category={document.category} />
            <DmsStatusBadge status={document.status} />
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
    </div>
  );
}

function toFormValue(document: DmsDocument): DmsMetadataFormValue {
  return {
    title: document.title,
    description: document.description ?? '',
    category: document.category as DmsDocumentCategory,
    subCategory: document.subCategory ?? '',
    tags: Array.isArray(document.tags) ? document.tags.join(', ') : '',
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
