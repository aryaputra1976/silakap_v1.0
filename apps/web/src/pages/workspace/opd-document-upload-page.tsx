import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Send, UploadCloud } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionButton,
  ErrorAlert,
  Field,
  inputClass,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { getRequiredDocumentOptions } from '@/lib/opd-document-catalog';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import type { OpdSubmission } from '@/lib/opd-submissions/types';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function OpdDocumentUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [submissionId, setSubmissionId] = useState(
    searchParams.get('submissionId') ?? '',
  );
  const [submissions, setSubmissions] = useState<OpdSubmission[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === submissionId),
    [submissionId, submissions],
  );

  const documentOptions = useMemo(
    () => getRequiredDocumentOptions(selectedSubmission?.serviceType),
    [selectedSubmission?.serviceType],
  );

  useEffect(() => {
    let active = true;

    opdSubmissionsApi
      .fetchMyOpdSubmissions({ limit: 100 })
      .then((result) => {
        if (active) {
          setSubmissions(result.items);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat daftar pengajuan OPD',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDocumentType('');
    setTitle('');
    setNote('');
    setFile(null);
    setSuccess('');
    setError('');
  }, [submissionId]);

  useEffect(() => {
    if (!documentType) {
      return;
    }

    const selectedDocument = documentOptions.find(
      (item) => item.value === documentType,
    );

    if (selectedDocument && !title.trim()) {
      setTitle(selectedDocument.label);
    }
  }, [documentOptions, documentType, title]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    if (!submissionId) {
      setError('Pengajuan OPD wajib dipilih.');
      setSaving(false);
      return;
    }

    if (!selectedSubmission) {
      setError('Data pengajuan OPD tidak ditemukan.');
      setSaving(false);
      return;
    }

    if (!documentType) {
      setError('Jenis dokumen syarat wajib dipilih.');
      setSaving(false);
      return;
    }

    if (documentOptions.length === 0) {
      setError(
        'Jenis layanan pada pengajuan ini belum memiliki daftar dokumen syarat.',
      );
      setSaving(false);
      return;
    }

    const isAllowedDocumentType = documentOptions.some(
      (item) => item.value === documentType,
    );

    if (!isAllowedDocumentType) {
      setError('Jenis dokumen tidak sesuai dengan jenis layanan pengajuan.');
      setSaving(false);
      return;
    }

    if (!title.trim()) {
      setError('Judul dokumen wajib diisi.');
      setSaving(false);
      return;
    }

    if (!file) {
      setError('File bukti dukung wajib dipilih.');
      setSaving(false);
      return;
    }

    const fileError = validateFile(file);
    if (fileError) {
      setError(fileError);
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.set('documentType', documentType);
      formData.set('title', title.trim());

      if (note.trim()) {
        formData.set('note', note.trim());
      }

      formData.set('file', file);

      const updated = await opdSubmissionsApi.uploadOpdSubmissionDocumentFile(
        submissionId,
        formData,
      );

      setSuccess('File dokumen berhasil diunggah dan ditautkan ke pengajuan.');
      navigate(`/opd/layanan/${updated.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengunggah dokumen OPD',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Upload Bukti Dukung"
        description="Unggah dokumen syarat dan bukti dukung OPD sesuai jenis layanan PPIK."
      />

      {success ? (
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-4 text-sm font-medium text-[#12815f]">
          {success}
        </div>
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Upload Dokumen"
        description="File bukti dukung diunggah ke endpoint OPD dan ditautkan ke DMS internal bila berhasil."
        actions={<StatusBadge value="Multipart API" tone="success" />}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Pengajuan OPD">
              <select
                className={inputClass}
                value={submissionId}
                onChange={(event) => setSubmissionId(event.target.value)}
              >
                <option value="" disabled>
                  Pilih pengajuan
                </option>

                {submissions.map((submission) => (
                  <option key={submission.id} value={submission.id}>
                    {submission.submissionNumber ?? 'DRAFT'} - {submission.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jenis Dokumen Syarat">
              <select
                className={inputClass}
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                disabled={!selectedSubmission || documentOptions.length === 0}
              >
                <option value="" disabled>
                  {selectedSubmission
                    ? 'Pilih jenis dokumen syarat'
                    : 'Pilih pengajuan terlebih dahulu'}
                </option>

                {documentOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Judul Dokumen">
              <input
                className={inputClass}
                placeholder="Contoh: KTP"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
          </div>

          {selectedSubmission ? (
            <div className="rounded-lg border border-[#b9e4d4] bg-[#f1fbf7] px-4 py-3 text-sm text-[#0f5f50]">
              <div className="font-semibold">Jenis layanan terpilih</div>
              <div className="mt-1">
                {selectedSubmission.serviceType}
                {documentOptions.length > 0
                  ? ` — ${documentOptions.length} dokumen syarat tersedia`
                  : ' — belum ada dokumen syarat yang dikonfigurasi'}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="File Bukti Dukung">
              <input
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className={inputClass}
                type="file"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  setError(selectedFile ? validateFile(selectedFile) : '');
                }}
              />
            </Field>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:col-span-2">
              Maksimal 10 MB. Format yang diterima: PDF, JPG, PNG, DOCX, dan
              XLSX. Dokumen tidak otomatis terverifikasi setelah upload.
            </div>
          </div>

          <Field label="Keterangan Dokumen">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Jelaskan isi dokumen dan kaitannya dengan permohonan"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={UploadCloud} disabled={saving} type="submit">
              Upload File
            </ActionButton>

            <ActionButton icon={Send} disabled={saving} variant="secondary">
              Simpan ke Pengajuan
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Ukuran file maksimal 10 MB.';
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX.';
  }

  return '';
}