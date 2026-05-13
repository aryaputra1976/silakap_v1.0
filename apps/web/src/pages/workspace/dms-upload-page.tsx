import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import { dmsApi } from '@/lib/api/dms';
import { ErrorAlert } from '@/components/workspace/ui';
import {
  initialDmsMetadataForm,
  toDmsCreatePayload,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';
import { DmsUploadFormSection } from '@/components/workspace/dms/upload/dms-upload-form-section';
import { DmsUploadGuidanceCard } from '@/components/workspace/dms/upload/dms-upload-guidance-card';
import { DmsUploadHeader } from '@/components/workspace/dms/upload/dms-upload-header';

export function DmsUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const worklogIdFromQuery = searchParams.get('worklogId') ?? '';
  const caseIdFromQuery = searchParams.get('caseId') ?? '';

  const [form, setForm] = useState<DmsMetadataFormValue>(() => ({
    ...initialDmsMetadataForm,
    worklogId: searchParams.get('worklogId') ?? '',
    caseId: searchParams.get('caseId') ?? '',
  }));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-5">
      <DmsUploadHeader
        caseIdFromQuery={caseIdFromQuery}
        worklogIdFromQuery={worklogIdFromQuery}
        onBack={() => navigate('/dms/documents')}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <DmsUploadFormSection
        caseIdFromQuery={caseIdFromQuery}
        file={file}
        fileError={fileError}
        form={form}
        saving={saving}
        worklogIdFromQuery={worklogIdFromQuery}
        onFileError={setFileError}
        onFileSelect={setFile}
        onFormChange={setForm}
        onSubmit={(event) => void handleSubmit(event)}
        onViewList={() => navigate('/dms/documents')}
      />

      <DmsUploadGuidanceCard />
    </div>
  );
}
