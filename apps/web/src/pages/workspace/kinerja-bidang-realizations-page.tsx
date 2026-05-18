import { useState } from 'react';
import { PageHeader, StatusBadge } from '@/components/workspace/ui';
import { RhkCandidateDetailPanel } from '@/components/workspace/kinerja/rhk-candidate-detail-panel';
import { RhkCandidateSummaryPanel } from '@/components/workspace/kinerja/rhk-candidate-summary-panel';
import { RhkCandidateTable } from '@/components/workspace/kinerja/rhk-candidate-table';
import { RhkPerformanceReportPanel } from '@/components/workspace/kinerja/rhk-performance-report-panel';
import { RhkRealizationSummaryPanel } from '@/components/workspace/kinerja/rhk-realization-summary-panel';
import { RhkRealizationTable } from '@/components/workspace/kinerja/rhk-realization-table';
import { useAuth } from '@/lib/auth/session';
import type { KinerjaRhkCandidate } from '@/lib/kinerja-rhk-candidates/types';
import { getPrimaryRole } from '@/lib/rbac/roles';

export function KinerjaBidangRealizationsPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const [selectedCandidate, setSelectedCandidate] = useState<KinerjaRhkCandidate | null>(null);
  const [realizationRefreshKey, setRealizationRefreshKey] = useState(0);

  function handleCandidateUpdated(updated: KinerjaRhkCandidate) {
    setSelectedCandidate(updated);
    setRealizationRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Realisasi RHK & Laporan Kinerja"
        description="Validasi kandidat layanan OPD menjadi realisasi resmi per periode, lalu susun laporan bulanan dan triwulan."
        meta={
          <>
            <StatusBadge value="Approval kandidat" tone="warning" />
            <StatusBadge value="Realisasi resmi" tone="success" />
          </>
        }
      />

      <RhkCandidateSummaryPanel />

      <RhkCandidateTable onSelect={(candidate) => setSelectedCandidate(candidate)} />

      {selectedCandidate ? (
        <RhkCandidateDetailPanel
          candidate={selectedCandidate}
          role={role}
          onUpdated={handleCandidateUpdated}
        />
      ) : null}

      <RhkRealizationSummaryPanel refreshKey={realizationRefreshKey} />

      <RhkRealizationTable refreshKey={realizationRefreshKey} />

      <RhkPerformanceReportPanel refreshKey={realizationRefreshKey} />
    </div>
  );
}
