import { ArrowLeft } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';

type DmsUploadHeaderProps = {
  worklogIdFromQuery: string;
  caseIdFromQuery: string;
  onBack: () => void;
};

export function DmsUploadHeader({
  worklogIdFromQuery,
  caseIdFromQuery,
  onBack,
}: DmsUploadHeaderProps) {
  return (
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
        <ActionButton icon={ArrowLeft} onClick={onBack} variant="secondary">
          Kembali
        </ActionButton>
      }
    />
  );
}
