import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  RefreshCcw,
  Save,
  UploadCloud,
} from 'lucide-react';
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
  Field,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsActionPanel } from '@/components/workspace/dms/dms-action-panel';
import { DmsAuditTimeline } from '@/components/workspace/dms/dms-audit-timeline';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import {
  DmsMetadataForm,
  initialDmsMetadataForm,
  toDmsCreatePayload,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';
import { DmsPreviewPanel } from '@/components/workspace/dms/dms-preview-panel';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';
import { DmsUploadDropzone } from '@/components/workspace/dms/dms-upload-dropzone';

export function DmsDocumentDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const documentId = params.id;

  const [document, setDocument] = useState<DmsDocument | null>(null);
  const [form, setForm] = useState<DmsMetadataFormValue>(initialDmsMetadataForm);
  const [file, setFile] = useState<File | null>(null);
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
      caught instanceof ApiError
        ? caught.message
        : 'Gagal submit dokumen',
    );
  } finally {
    setWorking(false);
  }
}

async function verifyDocument() {
  if (!document) {
    return;
  }

  if (
    !confirmAction(
      'Verifikasi dokumen ini sebagai bukti dukung yang sah?',
    )
  ) {
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
      caught instanceof ApiError
        ? caught.message
        : 'Gagal menolak dokumen',
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

  const firstConfirm = confirmAction(
    'Hapus dokumen ini? Data dokumen akan dihapus dari daftar DMS.',
  );

  if (!firstConfirm) {
    return;
  }

  const secondConfirm = confirmAction(
    'Konfirmasi sekali lagi: dokumen yang dihapus tidak akan tampil lagi di DMS. Lanjutkan hapus?',
  );

  if (!secondConfirm) {
    return;
  }

  setWorking(true);
  setError('');

  try {
    await dmsApi.deleteDocument(document.id);
    navigate('/dms/documents');
  } catch (caught) {
    setError(
      caught instanceof ApiError
        ? caught.message
        : 'Gagal menghapus dokumen',
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
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal mengunduh dokumen',
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
          <SectionCard
            title="Metadata Dokumen"
            description="Informasi utama yang digunakan untuk pencarian, klasifikasi, dan pelaporan."
            actions={
              canEditMetadata ? (
                editMode ? (
                  <>
                    <ActionButton
                      disabled={working}
                      onClick={() => {
                        setForm(toFormValue(document));
                        setEditMode(false);
                      }}
                      variant="secondary"
                    >
                      Batal
                    </ActionButton>
                    <ActionButton
                      disabled={working}
                      icon={Save}
                      onClick={() => void saveMetadata()}
                    >
                      Simpan Metadata
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    disabled={working}
                    icon={Edit3}
                    onClick={() => setEditMode(true)}
                    variant="secondary"
                  >
                    Edit Metadata
                  </ActionButton>
                )
              ) : null
            }
          >
            {editMode ? (
              <DmsMetadataForm
                disabled={working}
                value={form}
                onChange={setForm}
              />
            ) : (
              <DmsMetadataView document={document} />
            )}
          </SectionCard>

          <DmsPreviewPanel
            document={document}
            downloading={downloading}
            onDownload={() => void downloadDocument()}
          />

          {canEditMetadata ? (
            <SectionCard
              title="Upload / Ganti File"
              description="Unggah file dokumen. Jika dokumen sudah memiliki file, unggahan baru akan menaikkan versi dokumen."
              actions={
                <ActionButton
                  disabled={working || !file}
                  icon={UploadCloud}
                  onClick={() => void uploadFile()}
                >
                  {working ? 'Memproses...' : 'Upload File'}
                </ActionButton>
              }
            >
              <DmsUploadDropzone
                disabled={working}
                file={file}
                onSelect={setFile}
              />
            </SectionCard>
          ) : null}

          <SectionCard
            title="Riwayat Dokumen"
            description="Jejak aktivitas utama berdasarkan status dokumen."
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

          <SectionCard
            title="Catatan Verifikasi"
            description="Catatan opsional untuk verifikasi dan wajib untuk penolakan."
          >
            <Field label="Catatan">
              <textarea
                className={`${inputClass} min-h-32 py-2`}
                disabled={working || document.status !== 'SUBMITTED'}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Isi catatan verifikasi atau alasan penolakan."
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Relasi Dokumen"
            description="Koneksi dokumen dengan data ASN, unit kerja, case, atau worklog."
          >
            <div className="grid gap-3 text-sm">
              <Meta label="Unit Kerja" value={document.unitKerja?.nama ?? '-'} />
              <Meta label="Kode Unit" value={document.unitKerja?.kode ?? '-'} />
              <Meta label="ASN" value={document.asn?.nama ?? '-'} />
              <Meta label="NIP" value={document.asn?.nip ?? '-'} />
              <Meta label="Case SIAP" value={document.case?.caseNumber ?? '-'} />
              <Meta label="Worklog" value={document.worklog?.title ?? '-'} />
              <Meta label="Pembuat" value={document.createdBy?.name ?? '-'} />
              <Meta label="Verifikator" value={document.verifiedBy?.name ?? '-'} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function DmsMetadataView({ document }: { document: DmsDocument }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Meta label="Judul" value={document.title} />
      <Meta label="Kategori" value={document.category} />
      <Meta label="Status" value={document.status} />
      <Meta label="Tahun" value={document.periodYear?.toString() ?? '-'} />
      <Meta label="Bulan" value={document.periodMonth?.toString() ?? '-'} />
      <Meta label="Triwulan" value={document.periodQuarter?.toString() ?? '-'} />
      <div className="md:col-span-2">
        <Meta label="Deskripsi" value={document.description ?? '-'} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-zinc-50/60 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function toFormValue(document: DmsDocument): DmsMetadataFormValue {
  return {
    title: document.title,
    description: document.description ?? '',
    category: document.category as DmsDocumentCategory,
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