import { SectionCard } from '@/components/workspace/ui';
import { OpdEmptyState } from '@/components/workspace/opd/opd-empty-state';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdServiceCardGrid } from '@/components/workspace/opd/opd-service-card-grid';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import { OpdSummaryCards } from '@/components/workspace/opd/opd-summary-cards';
import {
  emptyOpdSummary,
  opdRequests,
  opdServiceCards,
  opdTimeline,
} from '@/lib/opd/opd-portal-data';

export function OpdDashboardPage() {
  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Dashboard OPD"
        description="Ringkasan layanan, usulan, dokumen, dan status pengajuan milik OPD yang sedang login."
      />

      <OpdSummaryCards summary={emptyOpdSummary} />

      <SectionCard
        title="Layanan OPD"
        description="Akses cepat untuk membuat pengajuan dan memantau dokumen OPD."
      >
        <OpdServiceCardGrid items={opdServiceCards} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Permohonan Terbaru"
          description="Daftar ini hanya menampilkan permohonan milik OPD."
        >
          {opdRequests.length > 0 ? (
            <OpdRequestTable items={opdRequests} />
          ) : (
            <OpdEmptyState
              title="Belum ada permohonan"
              description="Mulai dari Ajukan Layanan atau Ajukan Usulan Pensiun untuk membuat draft OPD."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Status Terakhir"
          description="Jejak status layanan OPD."
        >
          <OpdStatusTimeline items={opdTimeline} />
        </SectionCard>
      </div>
    </div>
  );
}
