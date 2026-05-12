import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
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
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<DmsMetadataFormValue>(() => ({
    ...initialDmsMetadataForm,
    worklogId: searchParams.get('worklogId') ?? '',
    caseId: searchParams.get('caseId') ?? '',
  }));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const worklogIdFromQuery = searchParams.get('worklogId') ?? '';
  const caseIdFromQuery = searchParams.get('caseId') ?? '';

  useEffect(() => {
    setForm((current) => ({
      ...current,
      worklogId: current.worklogId || worklogIdFromQuery,
      caseId: current.caseId || caseIdFromQuery,
    }));
  }, [worklogIdFromQuery, caseIdFromQuery]);

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

  function goBack() {
    navigate('/dms/documents');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload Dokumen DMS"
        description="Buat metadata dokumen dan unggah file bukti dukung ke Document Management System."
        meta={
          <>
            <StatusBadge value="CREATE DOCUMENT" tone="info" />
            {worklogIdFromQuery ? (
              <StatusBadge value="TERHUBUNG WORKLOG" tone="success" />
            ) : null}
            {caseIdFromQuery ? (
              <StatusBadge value="TERHUBUNG CASE" tone="success" />
            ) : null}
          </>
        }
        actions={
          <ActionButton icon={ArrowLeft} onClick={goBack} variant="secondary">
            Kembali
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {worklogIdFromQuery || caseIdFromQuery ? (
        <SectionCard
          title="Konteks Integrasi SIAP"
          description="Dokumen ini dibuat dari panel bukti dukung SIAP Worklog. Field relasi sudah otomatis terisi dari URL."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ContextItem label="Worklog ID" value={worklogIdFromQuery} />
            <ContextItem label="Case ID" value={caseIdFromQuery} />
          </div>
        </SectionCard>
      ) : null}

      <form
        className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]"
        onSubmit={handleSubmit}
      >
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
            <DmsUploadDropzone
              disabled={saving}
              error={fileError}
              file={file}
              onError={setFileError}
              onSelect={setFile}
            />
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

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-zinc-50/70 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-medium text-zinc-900">
        {value || '-'}
      </div>
    </div>
  );
}