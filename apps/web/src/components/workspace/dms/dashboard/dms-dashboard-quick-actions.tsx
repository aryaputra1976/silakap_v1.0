import { BarChart3, CheckCircle2, FileText, Plus } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';

type DmsDashboardQuickActionsProps = {
  onUpload: () => void;
  onViewDocuments: () => void;
  onViewVerification: () => void;
  onViewReports: () => void;
};

export function DmsDashboardQuickActions({
  onUpload,
  onViewDocuments,
  onViewVerification,
  onViewReports,
}: DmsDashboardQuickActionsProps) {
  return (
    <SectionCard
      title="Aksi Cepat"
      description="Navigasi cepat ke fitur utama DMS."
    >
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Plus} onClick={onUpload}>
          Upload Dokumen
        </ActionButton>
        <ActionButton
          icon={FileText}
          onClick={onViewDocuments}
          variant="secondary"
        >
          Semua Dokumen
        </ActionButton>
        <ActionButton
          icon={CheckCircle2}
          onClick={onViewVerification}
          variant="secondary"
        >
          Verifikasi
        </ActionButton>
        <ActionButton
          icon={BarChart3}
          onClick={onViewReports}
          variant="secondary"
        >
          Laporan
        </ActionButton>
      </div>
    </SectionCard>
  );
}
