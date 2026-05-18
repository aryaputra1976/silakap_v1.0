import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';
import { PageHeader, StatusBadge } from '@/components/workspace/ui';
import { KinerjaExecutiveSummaryPanel } from '@/components/workspace/kinerja/kinerja-executive-summary-panel';
import { KinerjaEvidenceBundlePanel } from '@/components/workspace/kinerja/kinerja-evidence-bundle-panel';
import { KinerjaExecutiveReportPanel } from '@/components/workspace/kinerja/kinerja-executive-report-panel';

export function KinerjaBidangReportPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan Eksekutif Kinerja"
        description="Ringkasan, laporan bulanan/triwulan, dan bundle bukti dukung dari realisasi RHK resmi."
        meta={
          <>
            <StatusBadge value="Hanya realisasi disetujui" tone="success" />
            <StatusBadge value="OPD & PPPK tidak dapat akses" tone="danger" />
          </>
        }
      />

      <KinerjaExecutiveSummaryPanel />

      <KinerjaExecutiveReportPanel role={role} />

      <KinerjaEvidenceBundlePanel />
    </div>
  );
}
