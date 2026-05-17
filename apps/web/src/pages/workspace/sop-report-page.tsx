import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, ClipboardCheck, FileText, GitBranch } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopReportFilters } from '@/components/workspace/sop/sop-report-filters';
import { SopReportSummary } from '@/components/workspace/sop/sop-report-summary';
import { SopReportRhkTable } from '@/components/workspace/sop/sop-report-rhk-table';
import { SopReportEvidenceTable } from '@/components/workspace/sop/sop-report-evidence-table';
import { SopReportNarrative } from '@/components/workspace/sop/sop-report-narrative';
import { SopReportBackendRhkTable } from '@/components/workspace/sop/sop-report-backend-rhk-table';
import { SopPrintActions } from '@/components/workspace/sop/sop-print-actions';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import { kinerjaBidangApi, type KinerjaBidangReportResponse } from '@/lib/api/kinerja-bidang';
import {
  backendReportToSopEvidencePlan,
  backendReportToSopNarrative,
  backendReportToSopReportRows,
  backendReportToSopReportSummary,
} from '@/lib/sop/sop-backend-adapter';
import {
  buildReportTitle,
  buildSopReportEvidencePlan,
  buildSopReportNarrative,
  buildSopReportRows,
  buildSopReportSummary,
  type SopReportFilter,
} from '@/lib/sop/sop-report-data';

const initialFilter: SopReportFilter = {
  year: String(new Date().getFullYear()),
  periodType: 'TAHUNAN',
  month: '',
  quarter: '',
};

function toBackendQuery(filter: SopReportFilter) {
  return {
    year: filter.year,
    month: filter.periodType === 'BULANAN' ? filter.month : '',
    quarter: filter.periodType === 'TRIWULAN' ? filter.quarter : '',
  };
}

export function SopReportPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SopReportFilter>(initialFilter);
  const [backendReport, setBackendReport] =
    useState<KinerjaBidangReportResponse | null>(null);
  const [source, setSource] = useState<SopDataSource>('static');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.getReport(toBackendQuery(filter));

        if (!mounted) {
          return;
        }

        setBackendReport(result);
        setSource('backend');
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setBackendReport(null);
        setSource('static');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Gagal membaca laporan dari backend. Menggunakan fallback statis.',
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
  }, [filter]);

  const staticRows = useMemo(() => buildSopReportRows(), []);
  const staticSummary = useMemo(
    () => buildSopReportSummary(staticRows),
    [staticRows],
  );
  const staticEvidenceItems = useMemo(() => buildSopReportEvidencePlan(), []);
  const staticNarrative = useMemo(
    () => buildSopReportNarrative(filter, staticSummary),
    [filter, staticSummary],
  );

  const rows = useMemo(
    () =>
      backendReport
        ? backendReportToSopReportRows(backendReport)
        : staticRows,
    [backendReport, staticRows],
  );

  const summary = useMemo(
    () =>
      backendReport
        ? backendReportToSopReportSummary(backendReport)
        : staticSummary,
    [backendReport, staticSummary],
  );

  const evidenceItems = useMemo(
    () =>
      backendReport
        ? backendReportToSopEvidencePlan(backendReport)
        : staticEvidenceItems,
    [backendReport, staticEvidenceItems],
  );

  const narrative = useMemo(
    () =>
      backendReport
        ? backendReportToSopNarrative(backendReport)
        : staticNarrative,
    [backendReport, staticNarrative],
  );

  const title = useMemo(
    () =>
      backendReport?.narrative.title ??
      buildReportTitle(filter),
    [backendReport, filter],
  );

  return (
    <div className="space-y-5 print-page">
      <PageHeader
        title="Laporan Kinerja Bidang"
        description="Draft laporan kinerja Bidang PPIK berdasarkan SOP, RHK, realisasi, capaian, kendala, tindak lanjut, dan bukti dukung."
        meta={
          <>
            <StatusBadge value="SOP & RHK" tone="dark" />
            <StatusBadge value="Draft Laporan" tone="info" />
            <StatusBadge value={filter.year} tone="success" />
            <SopDataSourceBadge source={source} error={error} />
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <ActionButton
              variant="secondary"
              icon={GitBranch}
              onClick={() => navigate('/kinerja-bidang/sop/map')}
            >
              Peta SOP
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
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
            <SopPrintActions />
          </div>
        }
      />

      {error ? (
        <ErrorAlert message={`${error} Data statis tetap ditampilkan sebagai fallback.`} />
      ) : null}

      {loading ? <LoadingState label="Memuat laporan Kinerja Bidang" /> : null}

      <SectionCard
        title="Parameter Laporan"
        description="Jika backend sudah migration dan seed, laporan akan membaca data realisasi resmi."
        className="no-print"
      >
        <SopReportFilters value={filter} onChange={setFilter} />
      </SectionCard>

      <SectionCard title={title} description="Ringkasan eksekutif laporan.">
        <SopReportSummary summary={summary} />
      </SectionCard>

      <SectionCard
        title="Rekapitulasi RHK"
        description="Tabel capaian kuantitas, kualitas, waktu, status risiko, dan bukti dukung per RHK."
      >
        {backendReport?.rows?.length ? (
          <SopReportBackendRhkTable rows={backendReport.rows} />
        ) : (
          <SopReportRhkTable rows={rows} />
        )}
      </SectionCard>

      <SectionCard
        title="Daftar Bukti Dukung Minimal"
        description="Daftar bukti dukung yang perlu tersedia pada DMS Bukti Dukung untuk setiap RHK."
      >
        <SopReportEvidenceTable items={evidenceItems} />
      </SectionCard>

      <SopReportNarrative narrative={narrative} />

      <SectionCard
        title="Catatan Integrasi Berikutnya"
        description="Arah integrasi setelah halaman laporan membaca backend."
        className="no-print"
      >
        <div className="space-y-3 text-sm leading-6 text-[#51614c]">
          <p>
            Setelah Phase 3D ini, halaman dashboard, daftar SOP, monitoring,
            detail, dan laporan sudah bisa membaca backend resmi dengan fallback
            data statis.
          </p>
          <p>
            Phase berikutnya adalah membuat form realisasi dan panel tautan bukti
            dukung DMS dari sisi frontend.
          </p>
          <div>
            <ActionButton
              variant="secondary"
              icon={FileText}
              onClick={() => navigate('/dms/documents')}
            >
              Lihat DMS Bukti Dukung
            </ActionButton>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
