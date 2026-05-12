import { FormEvent, useState } from 'react';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import { dmsApi } from '@/lib/api/dms';
import {
  ActionButton,
  ErrorAlert,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  DmsMetadataForm,
  initialDmsMetadataForm,
  toDmsCreatePayload,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';
import { DmsUploadDropzone } from '@/components/workspace/dms/dms-upload-dropzone';

export function DmsUploadPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<DmsMetadataFormValue>(initialDmsMetadataForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const created = await dmsApi.createDocument(toDmsCreatePayload(form));

      const finalDocument = file
        ? await dmsApi.uploadDocument(created.id, file, {
            description: form.description,
          })
        : created;

      navigate(`/dms/documents/${finalDocument.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan dokumen DMS',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload Dokumen DMS"
        description="Buat metadata dokumen dan unggah file bukti dukung ke Document Management System."
        meta={<StatusBadge value="CREATE DOCUMENT" tone="info" />}
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

      <form className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]" onSubmit={handleSubmit}>
        <SectionCard
          title="Metadata Dokumen"
          description="Isi informasi utama dokumen agar mudah dicari dan dihubungkan ke aktivitas kerja."
        >
          <DmsMetadataForm disabled={saving} value={form} onChange={setForm} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="File Dokumen"
            description="File dapat diunggah sekarang atau nanti dari halaman detail."
          >
            <DmsUploadDropzone disabled={saving} file={file} onSelect={setFile} />
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col gap-3">
              <ActionButton disabled={saving} icon={Save} type="submit">
                {saving ? 'Menyimpan...' : 'Simpan Dokumen'}
              </ActionButton>

              <ActionButton
                disabled={saving}
                icon={UploadCloud}
                onClick={() => navigate('/dms/documents')}
                variant="secondary"
              >
                Lihat Daftar Dokumen
              </ActionButton>
            </div>
          </SectionCard>
        </div>
      </form>
    </div>
  );
}