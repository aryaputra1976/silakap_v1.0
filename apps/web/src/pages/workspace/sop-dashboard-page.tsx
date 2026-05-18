import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardCheck, FileText, GitBranch, ListChecks } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopSummaryCards } from '@/components/workspace/sop/sop-summary-cards';
import { SopProgressTable } from '@/components/workspace/sop/sop-progress-table';
import { SopWorkspaceNav } from '@/components/workspace/sop/sop-workspace-nav';
import { SopContextNote } from '@/components/workspace/sop/sop-context-note';
import { SopDashboardBackendProgressTable } from '@/components/workspace/sop/sop-dashboard-backend-progress-table';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import { SopChecklistDashboardPanel } from '@/components/workspace/sop/sop-checklist-dashboard-panel';
import { SopRhkLinkPanel } from '@/components/workspace/sop/sop-rhk-link-panel';
import { SopGovernancePanel } from '@/components/workspace/sop/sop-governance-panel';
import {
  kinerjaBidangApi,
  type KinerjaBidangDashboardSummary,
  type KinerjaBidangReportResponse,
} from '@/lib/api/kinerja-bidang';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

export function SopDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = getPrimaryRole(user?.roles);
  const [summary, setSummary] = useState<KinerjaBidangDashboardSummary | null>(null);
  const [report, setReport] = useState<KinerjaBidangReportResponse | null>(null);
  const [source, setSource] = useState<SopDataSource>('static');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = String(new Date().getFullYear());

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [dashboardResult, reportResult] = await Promise.all([
          kinerjaBidangApi.getDashboard({ year }),
          kinerjaBidangApi.getReport({ year }),
        ]);

        if (!mounted) {
          return;
        }

        setSummary(dashboardResult);
        setReport(reportResult);
        setSource('backend');
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setSummary(null);
        setReport(null);
        setSource('static');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Gagal membaca backend Kinerja Bidang. Menggunakan fallback statis.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [year]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard SOP & RHK Bidang"
        description="Dashboard paket SOP Bidang PPIK, target RHK, realisasi, bukti dukung, dan risiko capaian kegiatan bidang."
        meta={
          <>
            <StatusBadge value="Paket SOP Bidang PPIK" tone="dark" />
            <StatusBadge value="Tahap 1-3" tone="info" />
            <StatusBadge value="RHK 1-8" tone="success" />
            <SopDataSourceBadge source={source} error={error} />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={GitBranch}
              onClick={() => navigate('/kinerja-bidang/sop/map')}
            >
              Peta SOP
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={ListChecks}
              onClick={() => navigate('/kinerja-bidang/monitoring')}
            >
              Monitoring
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={ClipboardCheck}
              onClick={() => navigate('/kinerja-bidang/realisasi?mode=create')}
            >
              Input Realisasi
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

      <SopWorkspaceNav />

      {error ? (
        <ErrorAlert message={`${error} Data statis tetap ditampilkan agar halaman tidak kosong.`} />
      ) : null}

      {loading ? <LoadingState label="Memuat dashboard Kinerja Bidang" /> : null}

      <SopSummaryCards summary={summary} />

      <SectionCard
        title="Monitoring Ringkas RHK"
        description="Ringkasan realisasi SOP utama RHK. Gunakan halaman Monitoring untuk melihat detail capaian."
        actions={
          <ActionButton
            variant="secondary"
            icon={ListChecks}
            onClick={() => navigate('/kinerja-bidang/monitoring')}
          >
            Lihat Monitoring
          </ActionButton>
        }
      >
        {report?.rows.length ? (
          <SopDashboardBackendProgressTable rows={report.rows} />
        ) : (
          <SopProgressTable />
        )}
      </SectionCard>

      <SopContextNote />

      <SopGovernancePanel userRole={userRole} />

      <SopChecklistDashboardPanel userRole={userRole} />

      <SopRhkLinkPanel userRole={userRole} />
    </div>
  );
}
