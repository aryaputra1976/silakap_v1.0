import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, RefreshCcw } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsApi,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDashboardQuery,
  type DmsDashboardSummary,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  Field,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

type ReportFilter = {
  year: string;
  month: string;
  quarter: string;
  category: DmsDocumentCategory | '';
  status: DmsDocumentStatus | '';
};

const defaultFilter: ReportFilter = {
  year: String(new Date().getFullYear()),
  month: '',
  quarter: '',
  category: '',
  status: '',
};

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

  const byStatus = useMemo(() => summary?.byStatus ?? [], [summary]);
  const byCategory = useMemo(() => summary?.byCategory ?? [], [summary]);

  function update<K extends keyof ReportFilter>(
    key: K,
    value: ReportFilter[K],
  ) {
    setFilter((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetFilter() {
    setFilter(defaultFilter);
    void loadReports(defaultFilter);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan DMS"
        description="Rekapitulasi dokumen bukti dukung berdasarkan status, kategori, periode, dan kesiapan arsip."
        meta={<StatusBadge value={`${summary?.total ?? 0} DOKUMEN`} tone="info" />}
        actions={
          <>
            <ActionButton
              disabled={loading}
              icon={RefreshCcw}
              onClick={() => void loadReports()}
              variant="secondary"
            >
              Refresh
            </ActionButton>
            <ActionButton
              disabled={exporting || loading}
              icon={Download}
              onClick={() => void exportCsv()}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <div className="grid w-full gap-3 md:grid-cols-5">
          <Field label="Tahun">
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={4}
              value={filter.year}
              onChange={(event) => update('year', event.target.value)}
              placeholder="2026"
            />
          </Field>

          <Field label="Bulan">
            <select
              className={inputClass}
              value={filter.month}
              onChange={(event) => update('month', event.target.value)}
            >
              <option value="">Semua bulan</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (month) => (
                  <option key={month} value={String(month)}>
                    {month}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="Triwulan">
            <select
              className={inputClass}
              value={filter.quarter}
              onChange={(event) => update('quarter', event.target.value)}
            >
              <option value="">Semua triwulan</option>
              {[1, 2, 3, 4].map((quarter) => (
                <option key={quarter} value={String(quarter)}>
                  Triwulan {quarter}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kategori">
            <select
              className={inputClass}
              value={filter.category}
              onChange={(event) =>
                update('category', event.target.value as DmsDocumentCategory | '')
              }
            >
              <option value="">Semua kategori</option>
              {DMS_DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {dmsCategoryLabel(category)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={filter.status}
              onChange={(event) =>
                update('status', event.target.value as DmsDocumentStatus | '')
              }
            >
              <option value="">Semua status</option>
              {DMS_DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {dmsStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadReports()}
            variant="secondary"
          >
            Terapkan
          </ActionButton>
          <ActionButton disabled={loading} onClick={resetFilter} variant="ghost">
            Reset
          </ActionButton>
        </div>
      </Toolbar>

      {loading && !summary ? (
        <LoadingState label="Memuat laporan DMS" />
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Total Dokumen"
              value={summary?.total ?? 0}
              tone="info"
            />
            <StatCard
              icon={BarChart3}
              label="Sah / Arsip"
              value={summary?.verifiedOrArchived ?? 0}
              description="Dokumen VERIFIED dan ARCHIVED"
              tone="success"
            />
            <StatCard
              icon={BarChart3}
              label="Menunggu Verifikasi"
              value={summary?.waitingVerification ?? 0}
              description="Dokumen SUBMITTED"
              tone="warning"
            />
            <StatCard
              icon={BarChart3}
              label="Ditolak"
              value={summary?.rejected ?? 0}
              description="Dokumen perlu perbaikan"
              tone={(summary?.rejected ?? 0) > 0 ? 'danger' : 'neutral'}
            />
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Rekap Berdasarkan Status"
              description="Jumlah dokumen per status workflow DMS."
            >
              {loading ? (
                <LoadingState label="Memuat rekap status" />
              ) : (
                <DataTable
                  items={byStatus}
                  rowKey={(item) => item.status}
                  empty="Belum ada rekap status"
                  columns={[
                    {
                      key: 'status',
                      header: 'Status',
                      render: (item) => <DmsStatusBadge status={item.status} />,
                    },
                    {
                      key: 'label',
                      header: 'Label',
                      render: (item) => dmsStatusLabel(item.status),
                    },
                    {
                      key: 'total',
                      header: 'Jumlah',
                      render: (item) => (
                        <span className="font-semibold text-zinc-950">
                          {item.total}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </SectionCard>

            <SectionCard
              title="Rekap Berdasarkan Kategori"
              description="Jumlah dokumen per kategori dokumen DMS."
            >
              {loading ? (
                <LoadingState label="Memuat rekap kategori" />
              ) : (
                <DataTable
                  items={byCategory}
                  rowKey={(item) => item.category}
                  empty="Belum ada rekap kategori"
                  columns={[
                    {
                      key: 'category',
                      header: 'Kategori',
                      render: (item) => (
                        <DmsCategoryBadge category={item.category} />
                      ),
                    },
                    {
                      key: 'label',
                      header: 'Label',
                      render: (item) => dmsCategoryLabel(item.category),
                    },
                    {
                      key: 'total',
                      header: 'Jumlah',
                      render: (item) => (
                        <span className="font-semibold text-zinc-950">
                          {item.total}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </SectionCard>
          </div>
        </>
      )}
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