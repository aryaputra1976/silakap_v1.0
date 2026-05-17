import { useEffect, useMemo, useState } from 'react';
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
import { SopBackendMonitoringTable } from '@/components/workspace/sop/sop-backend-monitoring-table';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import {
  kinerjaBidangApi,
  type KinerjaBidangDashboardSummary,
  type KinerjaBidangReportResponse,
} from '@/lib/api/kinerja-bidang';
import { backendReportToSopProgress } from '@/lib/sop/sop-backend-adapter';

export function SopMonitoringPage() {
  const navigate = useNavigate();
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
            : 'Gagal membaca monitoring backend. Menggunakan fallback statis.',
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

  const progressItems = useMemo(
    () => (report ? backendReportToSopProgress(report) : undefined),
    [report],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monitoring Realisasi SOP/RHK"
        description="Pemantauan capaian target kuantitas, kualitas, waktu, risiko, dan bukti dukung per SOP utama RHK."
        meta={
          <>
            <StatusBadge value="Monitoring RHK" tone="dark" />
            <StatusBadge value="RHK 1-8" tone="info" />
            <StatusBadge value="Bukti Dukung DMS" tone="success" />
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
              onClick={() => navigate('/kinerja-bidang/sop')}
            >
              Daftar SOP
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

      {error ? (
        <ErrorAlert message={`${error} Data statis tetap ditampilkan sebagai fallback.`} />
      ) : null}

      {loading ? <LoadingState label="Memuat monitoring realisasi" /> : null}

      <SopSummaryCards summary={summary} />

      <SectionCard
        title="Tabel Monitoring RHK"
        description="Monitoring ini fokus pada SOP utama yang langsung mendukung target RHK bidang."
      >
        {report?.rows.length ? (
          <SopBackendMonitoringTable rows={report.rows} />
        ) : (
          <SopProgressTable items={progressItems} />
        )}
      </SectionCard>
    </div>
  );
}
