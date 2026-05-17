import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import { dmsApi } from '@/lib/api/dms';
import {
  buildSopEvidenceDefaultTitle,
  buildSopEvidenceDescription,
} from '@/lib/api/sop-evidence';
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
  const sourceFromQuery = searchParams.get('source') ?? '';
  const sopCodeFromQuery = searchParams.get('sopCode') ?? '';
  const sopTitleFromQuery = searchParams.get('sopTitle') ?? '';
  const rhkCodeFromQuery = searchParams.get('rhkCode') ?? '';
  const yearFromQuery = searchParams.get('year') ?? '';
  const monthFromQuery = searchParams.get('month') ?? '';
  const quarterFromQuery = searchParams.get('quarter') ?? '';

  const isSopEvidenceUpload = sourceFromQuery === 'sop-rhk' && Boolean(sopCodeFromQuery) && Boolean(sopTitleFromQuery);

  const [form, setForm] = useState<DmsMetadataFormValue>(() => {
    if (isSopEvidenceUpload) {
      const context = {
        sopCode: sopCodeFromQuery,
        sopTitle: sopTitleFromQuery,
        rhkCode: rhkCodeFromQuery,
        year: yearFromQuery,
        month: monthFromQuery,
        quarter: quarterFromQuery,
      };

      return {
        ...initialDmsMetadataForm,
        title: buildSopEvidenceDefaultTitle(context),
        description: buildSopEvidenceDescription(context),
        category: 'BUKTI_DUKUNG',
        periodYear: yearFromQuery || initialDmsMetadataForm.periodYear,
        periodMonth: monthFromQuery,
        periodQuarter: quarterFromQuery,
        worklogId: worklogIdFromQuery,
        caseId: caseIdFromQuery,
      };
    }

    return {
      ...initialDmsMetadataForm,
      worklogId: worklogIdFromQuery,
      caseId: caseIdFromQuery,
    };
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => {
      if (isSopEvidenceUpload) {
        const context = {
          sopCode: sopCodeFromQuery,
          sopTitle: sopTitleFromQuery,
          rhkCode: rhkCodeFromQuery,
          year: yearFromQuery,
          month: monthFromQuery,
          quarter: quarterFromQuery,
        };

        return {
          ...current,
          title: current.title || buildSopEvidenceDefaultTitle(context),
          description: current.description || buildSopEvidenceDescription(context),
          category: 'BUKTI_DUKUNG',
          periodYear: current.periodYear || yearFromQuery,
          periodMonth: current.periodMonth || monthFromQuery,
          periodQuarter: current.periodQuarter || quarterFromQuery,
          worklogId: current.worklogId || worklogIdFromQuery,
          caseId: current.caseId || caseIdFromQuery,
        };
      }

      return {
        ...current,
        worklogId: current.worklogId || worklogIdFromQuery,
        caseId: current.caseId || caseIdFromQuery,
      };
    });
  }, [
    isSopEvidenceUpload,
    sopCodeFromQuery,
    sopTitleFromQuery,
    rhkCodeFromQuery,
    yearFromQuery,
    monthFromQuery,
    quarterFromQuery,
    worklogIdFromQuery,
    caseIdFromQuery,
  ]);

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

      {isSopEvidenceUpload ? (
        <div className="rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4 text-sm leading-6 text-[#51614c] shadow-sm">
          <div className="font-semibold text-[#173c36]">Upload Bukti Dukung SOP/RHK</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div>
              <span className="font-semibold">Kode SOP:</span> {sopCodeFromQuery}
            </div>
            <div>
              <span className="font-semibold">RHK:</span> {rhkCodeFromQuery || '-'}
            </div>
            <div>
              <span className="font-semibold">Tahun:</span> {yearFromQuery || '-'}
            </div>
          </div>
          <div className="mt-2">
            <span className="font-semibold">Nama SOP:</span> {sopTitleFromQuery}
          </div>
        </div>
      ) : null}

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
