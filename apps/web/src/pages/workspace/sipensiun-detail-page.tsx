import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Play,
  RefreshCcw,
  Save,
  Send,
  UploadCloud,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';
import { SipensiunSopPanel } from '@/components/workspace/sipensiun/sipensiun-sop-panel';
import { SipensiunLifecycle } from '@/components/workspace/sipensiun/sipensiun-lifecycle';
import { SopChecklistPanel } from '@/components/workspace/sop/sop-checklist-panel';
import { SIPENSIUN_JENIS_LIST, sipensiunJenisLabel } from '@/lib/sipensiun/sipensiun-data';
import type {
  ChecklistItem as ChecklistItemType,
  DocumentChecklist,
  DocumentRecord,
  SipensiunCaseDetail,
  SipensiunGeneratedLetter,
  SipensiunLetterPreview,
  SiapTask,
  UpdateSipensiunLetterData,
} from '@/lib/api/types';
import {
  ActionButton,
  ChecklistItem,
  DataTable,
  DownloadButton,
  EmptyState,
  ErrorAlert,
  Field,
  FileMeta,
  FileUploadButton,
  formatDate,
  formatDateTime,
  formatFileSize,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Timeline,
  WorkflowBadge,
} from '@/components/workspace/ui';

const categoryOrder = [
  'KEPEGAWAIAN',
  'KELUARGA',
  'PERNYATAAN',
  'KEMATIAN',
  'FOTO',
  'FISIK',
  'LAINNYA',
];

type LetterDataForm = Required<UpdateSipensiunLetterData>;

const emptyLetterDataForm: LetterDataForm = {
  nomorKarpeg: '',
  alamatSekarang: '',
  alamatSesudahPensiun: '',
  noHp: '',
  namaPemohon: '',
  nikPemohon: '',
  hubunganPemohon: '',
  alamatPemohon: '',
  noHpPemohon: '',
  namaPenerimaManfaat: '',
  tanggalMeninggal: '',
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function toLetterDataForm(detail: SipensiunCaseDetail): LetterDataForm {
  return {
    nomorKarpeg: detail.sipensiunDetail.nomorKarpeg ?? '',
    alamatSekarang: detail.sipensiunDetail.alamatSekarang ?? '',
    alamatSesudahPensiun:
      detail.sipensiunDetail.alamatSesudahPensiun ?? '',
    noHp: detail.sipensiunDetail.noHp ?? '',
    namaPemohon: detail.sipensiunDetail.namaPemohon ?? '',
    nikPemohon: detail.sipensiunDetail.nikPemohon ?? '',
    hubunganPemohon: detail.sipensiunDetail.hubunganPemohon ?? '',
    alamatPemohon: detail.sipensiunDetail.alamatPemohon ?? '',
    noHpPemohon: detail.sipensiunDetail.noHpPemohon ?? '',
    namaPenerimaManfaat:
      detail.sipensiunDetail.namaPenerimaManfaat ?? '',
    tanggalMeninggal: toDateInputValue(
      detail.sipensiunDetail.tanggalMeninggal,
    ),
  };
}

export function SipensiunDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const userRole = getPrimaryRole(user?.roles);

  const [detail, setDetail] = useState<SipensiunCaseDetail | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [letterPreview, setLetterPreview] =
    useState<SipensiunLetterPreview | null>(null);
  const [generatedLetter, setGeneratedLetter] =
    useState<DocumentRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [letterLoading, setLetterLoading] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [letterSaving, setLetterSaving] = useState(false);
  const [letterForm, setLetterForm] =
    useState<LetterDataForm>(emptyLetterDataForm);
  const [taskActionId, setTaskActionId] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.get<SipensiunCaseDetail>(
        `/sipensiun/cases/${id}`,
      );

      setDetail(result);
      setLetterForm(toLetterDataForm(result));

      const checklistResult = await apiClient.get<DocumentChecklist>(
        `/siarsip/cases/${result.siapCase.id}/checklist`,
      );

      setChecklist(checklistResult);

      await loadLetterPreview(result.sipensiunDetail.id, false);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat detail SIPENSIUN',
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadLetterPreview(
    sipensiunId = id,
    showLoading = true,
  ) {
    if (!sipensiunId) {
      return;
    }

    if (showLoading) {
      setLetterLoading(true);
    }

    try {
      const result = await apiClient.get<SipensiunLetterPreview>(
        `/sipensiun/cases/${sipensiunId}/letter-preview`,
      );

      setLetterPreview(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat preview surat',
      );
    } finally {
      if (showLoading) {
        setLetterLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const uploadedByType = useMemo(() => {
    const map = new Map<string, DocumentRecord>();

    for (const document of checklist?.uploadedDocuments ?? []) {
      map.set(document.documentType, document);
    }

    return map;
  }, [checklist]);

  const groupedChecklist = useMemo(() => {
    const groups = new Map<string, ChecklistItemType[]>();

    for (const item of checklist?.required ?? []) {
      const category = item.category || 'LAINNYA';
      groups.set(category, [...(groups.get(category) ?? []), item]);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => {
      const leftIndex = categoryOrder.indexOf(left);
      const rightIndex = categoryOrder.indexOf(right);

      return (
        (leftIndex === -1 ? 99 : leftIndex) -
        (rightIndex === -1 ? 99 : rightIndex)
      );
    });
  }, [checklist]);

  const requiredItems = useMemo(
    () => checklist?.required.filter((item) => item.required !== false) ?? [],
    [checklist],
  );

  const uploadedRequired = useMemo(
    () => requiredItems.filter((item) => item.uploaded).length,
    [requiredItems],
  );

  const progress = useMemo(() => {
    return requiredItems.length > 0
      ? Math.round((uploadedRequired / requiredItems.length) * 100)
      : 0;
  }, [requiredItems.length, uploadedRequired]);

  const activeTasks = useMemo(() => {
    return (
      detail?.tasks.filter(
        (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
      ) ?? []
    );
  }, [detail]);

  async function submitCase() {
    if (!detail) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      await apiClient.post(`/sipensiun/cases/${detail.sipensiunDetail.id}/submit`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal submit case',
      );
    } finally {
      setWorking(false);
    }
  }

  function updateLetterForm(
    name: keyof LetterDataForm,
    value: string,
  ) {
    setLetterForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveLetterData() {
    if (!detail) {
      return;
    }

    setLetterSaving(true);
    setError('');

    try {
      const result = await apiClient.patch<SipensiunCaseDetail>(
        `/sipensiun/cases/${detail.sipensiunDetail.id}/letter-data`,
        letterForm,
      );

      setDetail(result);
      setLetterForm(toLetterDataForm(result));
      await loadLetterPreview(result.sipensiunDetail.id, false);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan data surat',
      );
    } finally {
      setLetterSaving(false);
    }
  }

  async function generateLetter() {
    if (!detail) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      const result = await apiClient.post<SipensiunGeneratedLetter>(
        `/sipensiun/cases/${detail.sipensiunDetail.id}/generate-letter`,
      );

      setLetterPreview(result.preview);
      setGeneratedLetter(result.document);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal generate surat PDF',
      );
    } finally {
      setWorking(false);
    }
  }

  async function uploadDocument(documentType: string, file: File) {
    if (!detail) {
      return;
    }

    setWorking(true);
    setError('');

    const formData = new FormData();
    formData.set('documentType', documentType);
    formData.set('file', file);

    try {
      await apiClient.upload(`/siarsip/cases/${detail.siapCase.id}/upload`, formData);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal upload dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function downloadDocument(documentId: string, fileName: string) {
    setError('');

    try {
      const blob = await apiClient.download(`/siarsip/documents/${documentId}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = fileName;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal download dokumen',
      );
    }
  }

  async function mutateTask(taskId: string, action: 'start' | 'complete') {
    setTaskActionId(taskId);
    setError('');

    try {
      await apiClient.post(
        `/siap/tasks/${taskId}/${action}`,
        action === 'complete'
          ? { note: 'Selesai dari workspace SIPENSIUN' }
          : undefined,
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Aksi task gagal',
      );
    } finally {
      setTaskActionId('');
    }
  }

  if (loading) {
    return <LoadingState label="Memuat detail SIPENSIUN" />;
  }

  if (!detail) {
    return (
      <EmptyState
        title="Detail tidak ditemukan"
        description="Data SIPENSIUN tidak tersedia atau sudah dihapus."
        icon={FileText}
      />
    );
  }

  const canSubmit = detail.siapCase.currentState === 'DRAFT';
  const generatedLetterDocument =
    generatedLetter ??
    checklist?.uploadedDocuments.find(
      (document) => document.documentType === 'SURAT_PERMOHONAN_PENSIUN',
    ) ??
    null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.siapCase.caseNumber}
        description={`${detail.asn.nama} · ${detail.asn.nip} · ${sipensiunJenisLabel(detail.sipensiunDetail.jenisPensiun)}`}
        meta={
          <div className="flex flex-wrap gap-2">
            <WorkflowBadge value={detail.siapCase.currentState} />
            <StatusBadge value={detail.siapCase.status} />
            <StatusBadge value={detail.sipensiunDetail.jenisPensiun} />
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={FileText}
              variant="secondary"
              disabled={working}
              onClick={generateLetter}
            >
              Generate PDF
            </ActionButton>

            <ActionButton
              icon={Send}
              disabled={!canSubmit || working}
              onClick={submitCase}
            >
              {canSubmit ? 'Submit Case' : 'Sudah Disubmit'}
            </ActionButton>
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Profil ASN" description="Data dari SIDATA ASN">
          <div className="grid gap-3">
            <FileMeta label="Nama" value={detail.asn.nama} />
            <FileMeta label="NIP" value={detail.asn.nip} />
            <FileMeta label="Unit Kerja" value={detail.asn.unitKerja?.nama ?? '-'} />
            <FileMeta label="Jabatan" value={detail.asn.jabatanNama ?? '-'} />
            <FileMeta label="Golongan" value={detail.asn.golonganNama ?? '-'} />
            <FileMeta label="Status ASN" value={detail.asn.statusAsn ?? '-'} />
          </div>
        </SectionCard>

        <SectionCard title="Detail SIPENSIUN" description="Informasi domain pensiun">
          <div className="grid gap-3">
            <FileMeta
              label="Jenis Pensiun"
              value={<StatusBadge value={detail.sipensiunDetail.jenisPensiun} />}
            />
            <FileMeta
              label="TMT Pensiun"
              value={formatDate(detail.sipensiunDetail.tmtPensiun)}
            />
            <FileMeta label="Catatan" value={detail.sipensiunDetail.catatan ?? '-'} />
            <FileMeta
              label="Created"
              value={formatDateTime(detail.sipensiunDetail.createdAt)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Tujuan Surat" description="Rule BKN berdasarkan golongan">
          {detail.recipient ? (
            <div className="grid gap-3">
              <FileMeta label="Kategori" value={<StatusBadge value={detail.recipient.category} />} />
              <FileMeta label="Tujuan" value={detail.recipient.recipientName} />
              <FileMeta label="Kota" value={detail.recipient.recipientCity} />
              <FileMeta
                label="Review"
                value={detail.recipient.needsReview ? 'Perlu review manual' : 'Otomatis'}
              />
            </div>
          ) : (
            <EmptyState
              title="Recipient belum tersedia"
              description="Tujuan surat belum dapat ditentukan."
              icon={FileText}
            />
          )}
        </SectionCard>
      </section>

      {(() => {
        const jenisPensiun = detail.sipensiunDetail.jenisPensiun;
        const jenisConfig = SIPENSIUN_JENIS_LIST.find((item) =>
          item.dbJenisPensiun.includes(jenisPensiun),
        );
        if (!jenisConfig) return null;
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <SipensiunSopPanel jenisKey={jenisConfig.key} />
            <SipensiunLifecycle
              jenisKey={jenisConfig.key}
              currentState={detail.siapCase.currentState}
            />
          </div>
        );
      })()}

      <SectionCard
        title="Data Surat"
        description="Data tambahan untuk preview dan PDF permohonan pensiun."
        actions={
          <ActionButton
            icon={Save}
            disabled={letterSaving || working}
            onClick={saveLetterData}
          >
            {letterSaving ? 'Menyimpan' : 'Simpan Data'}
          </ActionButton>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Nomor Seri Karpeg">
            <input
              className={inputClass}
              value={letterForm.nomorKarpeg}
              onChange={(event) =>
                updateLetterForm('nomorKarpeg', event.target.value)
              }
            />
          </Field>

          <Field label="No. HP ASN">
            <input
              className={inputClass}
              value={letterForm.noHp}
              onChange={(event) =>
                updateLetterForm('noHp', event.target.value)
              }
            />
          </Field>

          <Field label="Tanggal Meninggal">
            <input
              className={inputClass}
              type="date"
              value={letterForm.tanggalMeninggal}
              onChange={(event) =>
                updateLetterForm('tanggalMeninggal', event.target.value)
              }
            />
          </Field>

          <Field label="Alamat Sekarang">
            <textarea
              className={`${inputClass} h-auto min-h-24 py-2`}
              value={letterForm.alamatSekarang}
              onChange={(event) =>
                updateLetterForm('alamatSekarang', event.target.value)
              }
            />
          </Field>

          <Field label="Alamat Sesudah Pensiun">
            <textarea
              className={`${inputClass} h-auto min-h-24 py-2`}
              value={letterForm.alamatSesudahPensiun}
              onChange={(event) =>
                updateLetterForm(
                  'alamatSesudahPensiun',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Nama Penerima Manfaat">
            <input
              className={inputClass}
              value={letterForm.namaPenerimaManfaat}
              onChange={(event) =>
                updateLetterForm(
                  'namaPenerimaManfaat',
                  event.target.value,
                )
              }
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Field label="Nama Pemohon / Ahli Waris">
            <input
              className={inputClass}
              value={letterForm.namaPemohon}
              onChange={(event) =>
                updateLetterForm('namaPemohon', event.target.value)
              }
            />
          </Field>

          <Field label="NIK Pemohon">
            <input
              className={inputClass}
              value={letterForm.nikPemohon}
              onChange={(event) =>
                updateLetterForm('nikPemohon', event.target.value)
              }
            />
          </Field>

          <Field label="Hubungan Pemohon">
            <input
              className={inputClass}
              value={letterForm.hubunganPemohon}
              onChange={(event) =>
                updateLetterForm('hubunganPemohon', event.target.value)
              }
            />
          </Field>

          <Field label="Alamat Pemohon">
            <textarea
              className={`${inputClass} h-auto min-h-24 py-2 lg:col-span-2`}
              value={letterForm.alamatPemohon}
              onChange={(event) =>
                updateLetterForm('alamatPemohon', event.target.value)
              }
            />
          </Field>

          <Field label="No. HP Pemohon">
            <input
              className={inputClass}
              value={letterForm.noHpPemohon}
              onChange={(event) =>
                updateLetterForm('noHpPemohon', event.target.value)
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Surat Permohonan Pensiun"
        description="Preview surat resmi dan generate PDF ke SIARSIP."
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={RefreshCcw}
              variant="secondary"
              disabled={letterLoading}
              onClick={() => void loadLetterPreview(detail.sipensiunDetail.id)}
            >
              Refresh Preview
            </ActionButton>

            <ActionButton
              icon={FileText}
              disabled={working}
              onClick={generateLetter}
            >
              Generate PDF
            </ActionButton>

            {generatedLetterDocument ? (
              <ActionButton
                icon={Download}
                variant="secondary"
                onClick={() =>
                  void downloadDocument(
                    generatedLetterDocument.id,
                    generatedLetterDocument.originalFileName ??
                      generatedLetterDocument.fileName,
                  )
                }
              >
                Download PDF
              </ActionButton>
            ) : null}
          </div>
        }
      >
        {letterPreview ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">
                  {letterPreview.subject}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {letterPreview.recipient.recipientName} ·{' '}
                  {letterPreview.recipient.recipientCity}
                </p>
              </div>

              <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-5 font-mono text-sm leading-6 text-zinc-800">
                {letterPreview.body}
              </pre>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  Field Surat
                </p>

                <div className="mt-3 grid gap-2">
                  <FileMeta label="Nama" value={letterPreview.fields.nama} />
                  <FileMeta label="NIP" value={letterPreview.fields.nip} />
                  <FileMeta
                    label="Karpeg"
                    value={letterPreview.fields.nomorSeriKarpeg || '-'}
                  />
                  <FileMeta
                    label="Golongan"
                    value={letterPreview.fields.golonganNama ?? '-'}
                  />
                  <FileMeta
                    label="Unit"
                    value={letterPreview.fields.unitKerjaNama ?? '-'}
                  />
                  <FileMeta
                    label="TMT"
                    value={letterPreview.fields.tmtPensiun ?? '-'}
                  />
                  <FileMeta
                    label="Alamat"
                    value={letterPreview.fields.alamatSekarang || '-'}
                  />
                  <FileMeta
                    label="No. HP"
                    value={letterPreview.fields.noHp || '-'}
                  />
                  <FileMeta
                    label="Pemohon"
                    value={letterPreview.fields.namaPemohon ?? '-'}
                  />
                  <FileMeta
                    label="Penerima Manfaat"
                    value={letterPreview.fields.namaPenerimaManfaat ?? '-'}
                  />
                  <FileMeta
                    label="Tanggal Meninggal"
                    value={letterPreview.fields.tanggalMeninggal ?? '-'}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Kelengkapan Lampiran
                    </p>
                    <p className="text-xs text-zinc-500">
                      {letterPreview.requirements.length -
                        letterPreview.missingDocuments.length}
                      /{letterPreview.requirements.length} dokumen tersedia
                    </p>
                  </div>

                  <StatusBadge
                    value={
                      letterPreview.missingDocuments.length === 0
                        ? 'LENGKAP'
                        : 'BELUM LENGKAP'
                    }
                    tone={
                      letterPreview.missingDocuments.length === 0
                        ? 'success'
                        : 'warning'
                    }
                  />
                </div>

                {letterPreview.missingDocuments.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {letterPreview.missingDocuments.map((item) => (
                      <div
                        key={item.documentType}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-emerald-700">
                    Semua lampiran wajib sudah terunggah.
                  </p>
                )}
              </div>

              {generatedLetterDocument ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-900">
                        PDF sudah digenerate
                      </p>
                      <p className="mt-1 break-all text-xs text-emerald-800">
                        {generatedLetterDocument.originalFileName ??
                          generatedLetterDocument.fileName}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {formatFileSize(generatedLetterDocument.fileSize)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Preview belum tersedia"
            description="Klik Refresh Preview untuk memuat naskah surat."
            icon={FileText}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Checklist Dokumen"
        description={`${uploadedRequired}/${requiredItems.length} dokumen wajib terpenuhi`}
        actions={<StatusBadge value={`${progress}%`} />}
      >
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {groupedChecklist.length > 0 ? (
          <div className="space-y-5">
            {groupedChecklist.map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {category}
                  </h3>
                  <StatusBadge
                    value={`${items.filter((item) => item.uploaded).length}/${items.length}`}
                  />
                </div>

                <div className="grid gap-3">
                  {items.map((item) => {
                    const uploadedDocument = uploadedByType.get(item.documentType);

                    return (
                      <ChecklistItem
                        key={item.documentType}
                        label={item.label}
                        documentType={item.documentType}
                        category={item.category}
                        required={item.required}
                        digital={item.digital}
                        uploaded={item.uploaded}
                        notes={item.notes}
                        actions={
                          <div className="flex flex-wrap gap-2">
                            <FileUploadButton
                              disabled={working}
                              label="Upload"
                              onSelect={(file) =>
                                void uploadDocument(item.documentType, file)
                              }
                            />

                            {uploadedDocument ? (
                              <DownloadButton
                                onClick={() =>
                                  void downloadDocument(
                                    uploadedDocument.id,
                                    uploadedDocument.originalFileName ??
                                      uploadedDocument.fileName,
                                  )
                                }
                              />
                            ) : null}
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Checklist belum tersedia"
            description="Persyaratan akan tampil berdasarkan jenis pensiun."
            icon={UploadCloud}
          />
        )}
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Task SIAP"
          description={
            activeTasks.length > 0
              ? `${activeTasks.length} task aktif`
              : 'Semua task selesai atau belum dibuat'
          }
        >
          {detail.tasks.length > 0 ? (
            <DataTable<SiapTask>
              items={detail.tasks}
              rowKey={(task) => task.id}
              empty="Belum ada task"
              columns={[
                {
                  key: 'task',
                  header: 'Task',
                  render: (task) => (
                    <div>
                      <p className="font-medium text-zinc-900">{task.title}</p>
                      <p className="text-xs text-zinc-500">{task.taskType}</p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (task) => <StatusBadge value={task.status} />,
                },
                {
                  key: 'due',
                  header: 'Due',
                  render: (task) => formatDate(task.dueDate),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (task) => (
                    <div className="flex flex-wrap gap-2">
                      {task.status === 'ASSIGNED' ? (
                        <ActionButton
                          icon={Play}
                          variant="secondary"
                          disabled={taskActionId === task.id}
                          onClick={() => void mutateTask(task.id, 'start')}
                        >
                          Start
                        </ActionButton>
                      ) : null}

                      {task.status === 'IN_PROGRESS' ? (
                        <ActionButton
                          icon={CheckCircle2}
                          disabled={taskActionId === task.id}
                          onClick={() => void mutateTask(task.id, 'complete')}
                        >
                          Complete
                        </ActionButton>
                      ) : null}

                      {task.status !== 'ASSIGNED' &&
                      task.status !== 'IN_PROGRESS' ? (
                        <span className="text-xs text-zinc-400">-</span>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="Belum ada task"
              description="Task akan muncul setelah case disubmit."
              icon={Play}
            />
          )}
        </SectionCard>

        <SectionCard title="Timeline" description="Aktivitas workflow">
          <Timeline
            items={detail.timelines.map((timeline) => ({
              id: timeline.id,
              title: timeline.title,
              description: timeline.description,
              type: timeline.eventType,
              timestamp: timeline.createdAt,
              actor: timeline.performedBy,
            }))}
          />
        </SectionCard>
      </section>

      <SectionCard title="Workflow Log" description="Jejak transisi case">
        <DataTable
          items={detail.workflowLogs}
          rowKey={(log) => log.id}
          empty="Belum ada workflow log"
          columns={[
            {
              key: 'action',
              header: 'Action',
              render: (log) => <StatusBadge value={log.action} />,
            },
            {
              key: 'from',
              header: 'From',
              render: (log) => <StatusBadge value={log.fromState ?? 'START'} />,
            },
            {
              key: 'to',
              header: 'To',
              render: (log) => <StatusBadge value={log.toState} />,
            },
            {
              key: 'note',
              header: 'Note',
              render: (log) => log.note ?? '-',
            },
            {
              key: 'by',
              header: 'Actor',
              render: (log) => log.performedBy ?? '-',
            },
            {
              key: 'at',
              header: 'Performed At',
              render: (log) => formatDateTime(log.performedAt),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Dokumen Terunggah" description="Dokumen SIARSIP pada case ini">
        {checklist && checklist.uploadedDocuments.length > 0 ? (
          <DataTable<DocumentRecord>
            items={checklist.uploadedDocuments}
            rowKey={(document) => document.id}
            empty="Belum ada dokumen"
            columns={[
              {
                key: 'file',
                header: 'File',
                render: (document) => (
                  <div>
                    <p className="font-medium text-zinc-900">
                      {document.originalFileName ?? document.fileName}
                    </p>
                    <p className="text-xs text-zinc-500">{document.fileName}</p>
                    <p className="text-xs text-zinc-400">
                      {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'type',
                header: 'Tipe',
                render: (document) => <StatusBadge value={document.documentType} />,
              },
              {
                key: 'uploaded',
                header: 'Uploaded',
                render: (document) => formatDateTime(document.uploadedAt),
              },
              {
                key: 'download',
                header: 'Action',
                render: (document) => (
                  <ActionButton
                    icon={Download}
                    variant="secondary"
                    onClick={() =>
                      void downloadDocument(
                        document.id,
                        document.originalFileName ?? document.fileName,
                      )
                    }
                  >
                    Download
                  </ActionButton>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            title="Belum ada dokumen"
            description="Upload dokumen melalui checklist atau generate surat PDF."
            icon={Download}
          />
        )}
      </SectionCard>

      <SopChecklistPanel
        sopCode="SOP-BKPSDM-PAN-002"
        userRole={userRole}
        contextId={id}
        persistenceMode="api"
        entityType="sipensiun_case"
        entityId={id}
      />
    </div>
  );
}
