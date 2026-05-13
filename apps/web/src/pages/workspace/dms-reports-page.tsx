import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDashboardQuery,
  type DmsDashboardSummary,
} from '@/lib/api/dms';
import { ErrorAlert } from '@/components/workspace/ui';
import {
  defaultFilter,
  DmsReportsFilterSection,
  type ReportFilter,
} from '@/components/workspace/dms/reports/dms-reports-filter-section';
import { DmsReportsExportSection } from '@/components/workspace/dms/reports/dms-reports-export-section';
import { DmsReportsHeader } from '@/components/workspace/dms/reports/dms-reports-header';
import { DmsReportsSummarySection } from '@/components/workspace/dms/reports/dms-reports-summary-section';

export function DmsReportsPage() {
  const [summary, setSummary] = useState<DmsDashboardSummary | null>(null);
  const [filter, setFilter] = useState<ReportFilter>(defaultFilter);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function loadReports(nextFilter: ReportFilter = filter) {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.getDashboardSummary(toDashboardQuery(nextFilter));
      setSummary(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat laporan DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    setError('');

    try {
      await dmsApi.exportReportsCsv(toDashboardQuery(filter));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal export laporan DMS',
      );
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    void loadReports(defaultFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter() {
    void loadReports(filter);
  }

  function resetFilter() {
    setFilter(defaultFilter);
    void loadReports(defaultFilter);
  }

  return (
    <div className="space-y-5">
      <DmsReportsHeader
        totalDocuments={summary?.total ?? 0}
        loading={loading}
        exporting={exporting}
        onRefresh={() => void loadReports()}
        onExport={() => void exportCsv()}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <DmsReportsFilterSection
        filter={filter}
        loading={loading}
        onFilterChange={setFilter}
        onApply={applyFilter}
        onReset={resetFilter}
      />

      <DmsReportsSummarySection summary={summary} loading={loading} />

      <DmsReportsExportSection
        exporting={exporting}
        loading={loading}
        onExport={() => void exportCsv()}
      />
    </div>
  );
}

function toDashboardQuery(filter: ReportFilter): DmsDashboardQuery {
  return {
    year: filter.year,
    month: filter.month,
    quarter: filter.quarter,
    category: filter.category,
    status: filter.status,
  };
}
