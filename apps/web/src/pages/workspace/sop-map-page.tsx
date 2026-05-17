import { useNavigate } from 'react-router';
import { FileText, ListChecks } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';
import { SopStageMap } from '@/components/workspace/sop/sop-stage-map';

export function SopMapPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-full overflow-x-hidden space-y-5">
      <PageHeader
        title="Peta SOP Bidang PPIK"
        description="Peta hubungan SOP berdasarkan Tahap 1, Tahap 2, dan Tahap 3 untuk mendukung pencapaian RHK bidang."
        meta={
          <>
            <StatusBadge value="Tahap 1: Manajemen Bidang" tone="info" />
            <StatusBadge value="Tahap 2: Layanan Kepegawaian" tone="success" />
            <StatusBadge value="Tahap 3: Fungsi Spesifik" tone="warning" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={ListChecks}
              onClick={() => navigate('/kinerja-bidang/sop')}
            >
              Daftar SOP
            </ActionButton>
            <ActionButton
              icon={FileText}
              onClick={() => navigate('/kinerja-bidang/laporan')}
            >
              Laporan
            </ActionButton>
          </>
        }
      />

      <SopStageMap />
    </div>
  );
}
