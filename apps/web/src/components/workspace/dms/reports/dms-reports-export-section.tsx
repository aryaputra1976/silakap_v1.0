import { Download } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';

type DmsReportsExportSectionProps = {
  exporting: boolean;
  loading: boolean;
  onExport: () => void;
};

export function DmsReportsExportSection({
  exporting,
  loading,
  onExport,
}: DmsReportsExportSectionProps) {
  return (
    <SectionCard
      title="Export Laporan"
      description="Unduh seluruh data dokumen yang sesuai filter aktif dalam format CSV untuk diolah lebih lanjut di spreadsheet."
    >
      <div className="flex items-center gap-4">
        <ActionButton
          disabled={exporting || loading}
          icon={Download}
          onClick={onExport}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </ActionButton>
        <p className="text-sm text-muted-foreground">
          Ekspor akan mengunduh maksimal 5.000 baris sesuai filter yang diterapkan.
        </p>
      </div>
    </SectionCard>
  );
}
