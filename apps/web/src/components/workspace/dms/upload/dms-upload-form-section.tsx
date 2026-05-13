import { FormEvent } from 'react';
import { Save, UploadCloud } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';
import {
  DmsMetadataForm,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';
import { DmsUploadDropzone } from '@/components/workspace/dms/dms-upload-dropzone';

type DmsUploadFormSectionProps = {
  form: DmsMetadataFormValue;
  file: File | null;
  fileError: string;
  saving: boolean;
  worklogIdFromQuery: string;
  caseIdFromQuery: string;
  onFormChange: (value: DmsMetadataFormValue) => void;
  onFileSelect: (file: File | null) => void;
  onFileError: (message: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onViewList: () => void;
};

export function DmsUploadFormSection({
  form,
  file,
  fileError,
  saving,
  worklogIdFromQuery,
  caseIdFromQuery,
  onFormChange,
  onFileSelect,
  onFileError,
  onSubmit,
  onViewList,
}: DmsUploadFormSectionProps) {
  return (
    <>
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
        onSubmit={onSubmit}
      >
        <SectionCard
          title="Metadata Dokumen"
          description="Isi informasi utama dokumen agar mudah dicari dan dihubungkan ke aktivitas kerja."
        >
          <DmsMetadataForm disabled={saving} value={form} onChange={onFormChange} />
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
              onError={onFileError}
              onSelect={onFileSelect}
            />
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col gap-3">
              <ActionButton disabled={saving || !!fileError} icon={Save} type="submit">
                {saving ? 'Menyimpan...' : 'Simpan Dokumen'}
              </ActionButton>

              <ActionButton
                disabled={saving}
                icon={UploadCloud}
                onClick={onViewList}
                variant="secondary"
              >
                Lihat Daftar Dokumen
              </ActionButton>
            </div>
          </SectionCard>
        </div>
      </form>
    </>
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
