import { UploadCloud } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';
import { DmsUploadDropzone } from '@/components/workspace/dms/dms-upload-dropzone';

export function DmsDocumentUploadSection({
  file,
  fileError,
  working,
  onFileError,
  onFileSelect,
  onUpload,
}: {
  file: File | null;
  fileError: string;
  working: boolean;
  onFileError: (message: string) => void;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <SectionCard
      title="Upload / Ganti File"
      description="Unggah file dokumen. Jika dokumen sudah memiliki file, unggahan baru akan menaikkan versi dokumen."
      actions={
        <ActionButton
          disabled={working || !file}
          icon={UploadCloud}
          onClick={onUpload}
        >
          {working ? 'Memproses...' : 'Upload File'}
        </ActionButton>
      }
    >
      <DmsUploadDropzone
        disabled={working}
        error={fileError}
        file={file}
        onError={onFileError}
        onSelect={onFileSelect}
      />
    </SectionCard>
  );
}
