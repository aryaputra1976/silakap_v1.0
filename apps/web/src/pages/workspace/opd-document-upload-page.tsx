import { FormEvent, useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
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
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import type { OpdSubmission } from '@/lib/opd-submissions/types';

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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const updated = await opdSubmissionsApi.addOpdSubmissionDocument(
        submissionId,
        {
          documentType,
          title,
          note,
        },
      );

      setSuccess(
        'Metadata dokumen berhasil disimpan. File fisik belum diunggah sampai integrasi DMS OPD diaktifkan.',
      );
      navigate(`/opd/layanan/${updated.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan metadata dokumen OPD',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Upload Bukti Dukung"
        description="Unggah bukti dukung OPD untuk layanan, SIPENSIUN, atau pemutakhiran SIDATA."
      />

      {success ? (
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-4 text-sm font-medium text-[#087052]">
          {success}
        </div>
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Draft Upload Dokumen"
        description="Form ini menyimpan metadata dokumen ke pengajuan OPD. File fisik tetap menunggu integrasi DMS OPD."
        actions={<StatusBadge value="Metadata API" tone="success" />}
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
            <Field label="Kategori Dokumen">
              <select
                className={inputClass}
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                <option value="" disabled>
                  Pilih kategori
                </option>
                <option value="LAYANAN_KEPEGAWAIAN">Layanan Kepegawaian</option>
                <option value="SIPENSIUN">SIPENSIUN</option>
                <option value="SIDATA_ASN">SIDATA ASN</option>
              </select>
            </Field>
            <Field label="Judul Dokumen">
              <input
                className={inputClass}
                placeholder="Contoh: Surat Pengantar OPD"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="File Bukti Dukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                disabled
                type="file"
              />
            </Field>
            <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Sprint 22 menyimpan metadata/link DMS. Upload file fisik lewat
              endpoint OPD belum diaktifkan, sehingga kolom file dinonaktifkan.
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
            <ActionButton icon={Save} disabled={saving} type="submit">
              Simpan Metadata
            </ActionButton>
            <ActionButton icon={Send} disabled>
              Upload File
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
