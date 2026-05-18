import { FolderArchive } from 'lucide-react';
import { EmptyState, SectionCard } from '@/components/workspace/ui';

export function ServiceInternalDocumentPanel() {
  return (
    <SectionCard
      title="Dokumen Internal PPIK"
      description="Ruang metadata dokumen internal untuk hasil verifikasi atau tautan DMS PPIK."
    >
      <EmptyState
        title="Upload file internal belum tersedia"
        description="Belum ada endpoint multipart khusus dokumen internal workbench. Tautkan dokumen melalui DMS/checklist SOP bila sudah tersedia."
        icon={FolderArchive}
      />
    </SectionCard>
  );
}
