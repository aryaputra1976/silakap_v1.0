import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import type { PaginatedResult } from '@/lib/api/types';
import type {
  OpdSubmission,
  OpdSubmissionModuleKey,
  OpdSubmissionStatus,
  OpdSubmissionSummary,
} from '@/lib/opd-submissions/types';
import {
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  SectionCard,
  Toolbar,
} from '@/components/workspace/ui';
import { ServiceWorkbenchHeader } from '@/components/workspace/service-workbench/service-workbench-header';
import { ServiceWorkbenchStatCards } from '@/components/workspace/service-workbench/service-workbench-stat-cards';
import { ServiceWorkbenchTable } from '@/components/workspace/service-workbench/service-workbench-table';

const STATUS_OPTIONS: Array<{ value: OpdSubmissionStatus | ''; label: string }> =
  [
    { value: '', label: 'Semua status' },
    { value: 'SUBMITTED', label: 'Menunggu Verifikasi' },
    { value: 'CORRECTION_SUBMITTED', label: 'Perbaikan Dikirim' },
    { value: 'RECEIVED', label: 'Diterima PPIK' },
    { value: 'IN_VERIFICATION', label: 'Dalam Verifikasi' },
    { value: 'NEEDS_CORRECTION', label: 'Perlu Perbaikan' },
    { value: 'VERIFIED', label: 'Terverifikasi' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'COMPLETED', label: 'Selesai' },
  ];

const MODULE_OPTIONS: Array<{ value: OpdSubmissionModuleKey | ''; label: string }> =
  [
    { value: '', label: 'Semua module' },
    { value: 'LAYANAN_KEPEGAWAIAN', label: 'Layanan Kepegawaian' },
    { value: 'SIPENSIUN', label: 'SIPENSIUN' },
    { value: 'SIDATA', label: 'SIDATA ASN' },
    { value: 'DMS', label: 'DMS' },
  ];

export function LayananWorkbenchPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OpdSubmissionStatus | ''>('');
  const [moduleKey, setModuleKey] = useState<OpdSubmissionModuleKey | ''>('');
  const [serviceType, setServiceType] = useState('');
  const [data, setData] = useState<PaginatedResult<OpdSubmission> | null>(null);
  const [summary, setSummary] = useState<OpdSubmissionSummary | null>(null);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');

    const query = {
      q,
      status,
      moduleKey,
      serviceType: serviceType.trim() || undefined,
      page: 1,
      limit: 30,
    };

    Promise.all([
      opdSubmissionsApi.fetchInternalOpdSubmissions(query),
      opdSubmissionsApi.fetchInternalOpdSubmissionSummary(query),
      opdSubmissionsApi.fetchInternalOpdSubmissionSummary({
        ...query,
        status: 'VERIFIED',
      }),
    ])
      .then(([submissions, nextSummary, verifiedSummary]) => {
        if (active) {
          setData(submissions);
          setSummary(nextSummary);
          setVerifiedCount(verifiedSummary.totalPermohonan);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat antrian pengajuan OPD',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [moduleKey, q, serviceType, status]);

  useEffect(() => load(), [load, refreshKey]);

  return (
    <div className="space-y-5">
      <ServiceWorkbenchHeader
        total={data?.total ?? 0}
        onRefresh={() => setRefreshKey((value) => value + 1)}
        refreshing={loading}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <ServiceWorkbenchStatCards
        summary={summary}
        verifiedCount={verifiedCount}
      />

      <Toolbar>
        <FilterBar>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Cari nomor, OPD, ASN, atau layanan"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <select
            className={inputClass}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as OpdSubmissionStatus | '')
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'ALL'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={moduleKey}
            onChange={(event) =>
              setModuleKey(event.target.value as OpdSubmissionModuleKey | '')
            }
          >
            {MODULE_OPTIONS.map((option) => (
              <option key={option.value || 'ALL'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Filter jenis layanan"
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          />
        </FilterBar>
      </Toolbar>

      <SectionCard
        title="Antrian Pengajuan OPD"
        description={`${data?.total ?? 0} pengajuan ditemukan`}
      >
        {loading ? (
          <LoadingState label="Memuat antrian verifikasi" />
        ) : (
          <ServiceWorkbenchTable items={data?.items ?? []} />
        )}
      </SectionCard>
    </div>
  );
}
