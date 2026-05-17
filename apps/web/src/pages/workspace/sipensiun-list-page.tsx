import { useEffect, useState } from 'react';
import { Eye, LayoutDashboard, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SipensiunCaseListItem } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Toolbar,
  WorkflowBadge,
} from '@/components/workspace/ui';
import { SipensiunPresetCards } from '@/components/workspace/sipensiun/sipensiun-preset-cards';
import { SipensiunSopPanel } from '@/components/workspace/sipensiun/sipensiun-sop-panel';
import { SipensiunLifecycle } from '@/components/workspace/sipensiun/sipensiun-lifecycle';
import {
  getSipensiunJenisConfig,
  jenisKeyToDbFilter,
  sipensiunJenisLabel,
  sipensiunViewLabel,
  viewToStateFilter,
} from '@/lib/sipensiun/sipensiun-data';

const STATE_OPTIONS = ['DRAFT', 'SUBMITTED', 'VERIFICATION', 'APPROVAL', 'COMPLETED', 'CANCELLED'];

export function SipensiunListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const jenisParam = searchParams.get('jenis') ?? '';
  const viewParam = searchParams.get('view') ?? '';

  const [q, setQ] = useState('');
  const [currentState, setCurrentState] = useState(viewToStateFilter(viewParam));
  const [data, setData] = useState<PaginatedResult<SipensiunCaseListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const jenisConfig = getSipensiunJenisConfig(jenisParam);
  const showDashboard = viewParam === 'dashboard' || (!jenisParam && !viewParam);

  const pageTitle = jenisConfig
    ? jenisConfig.label
    : sipensiunViewLabel(viewParam);

  const pageDescription = jenisConfig
    ? jenisConfig.description
    : 'Pengelolaan layanan pensiun dan pemberhentian ASN sesuai SOP Bidang PPIK.';

  function applyJenisFilter(key: string) {
    const params = new URLSearchParams();
    params.set('jenis', key);
    setSearchParams(params);
    setCurrentState('');
    setQ('');
  }

  useEffect(() => {
    if (showDashboard) {
      setData(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    const dbJenis = jenisParam ? jenisKeyToDbFilter(jenisParam) : '';
    const stateFilter = viewToStateFilter(viewParam) || currentState;

    apiClient
      .get<PaginatedResult<SipensiunCaseListItem>>('/sipensiun/cases', {
        q,
        jenisPensiun: dbJenis,
        currentState: stateFilter,
        page: 1,
        limit: 30,
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Gagal memuat data SIPENSIUN');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenisParam, viewParam, currentState, q, showDashboard]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pensiun & Pemberhentian ASN"
        description={pageDescription}
        meta={
          <>
            <StatusBadge value="SIPENSIUN" tone="info" />
            {jenisConfig && (
              <StatusBadge value={jenisConfig.shortLabel} tone={jenisConfig.tone as 'info' | 'success' | 'warning' | 'neutral'} />
            )}
            {!showDashboard && (
              <StatusBadge value={`${data?.total ?? 0} kasus`} tone="neutral" />
            )}
          </>
        }
        actions={
          <>
            {!showDashboard && (
              <ActionButton
                variant="secondary"
                icon={LayoutDashboard}
                onClick={() => setSearchParams({})}
              >
                Semua Jenis
              </ActionButton>
            )}
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {showDashboard ? (
        <>
          <SectionCard
            title="Pilih Jenis Layanan"
            description="Pilih jenis pensiun atau pemberhentian untuk melihat daftar kasus dan SOP terkait."
          >
            <SipensiunPresetCards />
          </SectionCard>
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Toolbar>
                <FilterBar>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      className={`${inputClass} w-full pl-10`}
                      placeholder="Cari nama ASN, NIP, nomor case"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                    />
                  </div>
                  <select
                    className={inputClass}
                    value={currentState}
                    onChange={(event) => setCurrentState(event.target.value)}
                  >
                    <option value="">Semua status</option>
                    {STATE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </FilterBar>
              </Toolbar>

              {jenisConfig && jenisConfig.dbJenisPensiun.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Jenis layanan <strong>{jenisConfig.shortLabel}</strong> belum tersedia di database. Data akan muncul setelah backend diperluas.
                </div>
              )}

              {loading ? (
                <LoadingState label={`Memuat data ${pageTitle}`} />
              ) : (
                <SectionCard
                  title={pageTitle}
                  description={`${data?.total ?? 0} kasus ditemukan`}
                >
                  <DataTable
                    items={data?.items ?? []}
                    rowKey={(item) => item.id}
                    empty={`Belum ada kasus ${jenisConfig?.shortLabel ?? ''}`}
                    columns={[
                      {
                        key: 'case',
                        header: 'Nomor Case',
                        render: (item) => (
                          <Link
                            className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
                            to={`/sipensiun/${item.id}`}
                          >
                            {item.siapCase.caseNumber}
                          </Link>
                        ),
                      },
                      {
                        key: 'nama',
                        header: 'Nama ASN',
                        render: (item) => (
                          <span className="font-medium text-zinc-900">{item.asn.nama}</span>
                        ),
                      },
                      {
                        key: 'nip',
                        header: 'NIP',
                        render: (item) => (
                          <span className="font-mono text-xs">{item.asn.nip}</span>
                        ),
                      },
                      {
                        key: 'jenis',
                        header: 'Jenis',
                        render: (item) => (
                          <StatusBadge
                            value={sipensiunJenisLabel(item.jenisPensiun)}
                            tone="info"
                          />
                        ),
                      },
                      {
                        key: 'tmt',
                        header: 'TMT',
                        render: (item) => formatDate(item.tmtPensiun),
                      },
                      {
                        key: 'state',
                        header: 'State',
                        render: (item) => <WorkflowBadge value={item.siapCase.currentState} />,
                      },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (item) => <StatusBadge value={item.siapCase.status} />,
                      },
                      {
                        key: 'action',
                        header: '',
                        render: (item) => (
                          <Link to={`/sipensiun/${item.id}`}>
                            <ActionButton icon={Eye} variant="secondary">
                              Detail
                            </ActionButton>
                          </Link>
                        ),
                      },
                    ]}
                  />
                </SectionCard>
              )}
            </div>

            <div className="space-y-4">
              {jenisConfig && (
                <>
                  <SipensiunSopPanel jenisKey={jenisParam} />
                  <SipensiunLifecycle jenisKey={jenisParam} />
                </>
              )}

              <SectionCard title="Jenis Lainnya" description="Navigasi cepat">
                <div className="space-y-1">
                  {(['BUP', 'AHLI_WARIS', 'APS', 'TIDAK_CAKAP', 'MENINGGAL_TEWAS_HILANG', 'DISIPLIN_HUKUM', 'SEMENTARA', 'AKTIF_KEMBALI', 'PERAMPINGAN'] as const).map((key) => {
                    const cfg = getSipensiunJenisConfig(key);
                    if (!cfg) return null;
                    const active = jenisParam === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyJenisFilter(key)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'bg-zinc-900 font-semibold text-white'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {cfg.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
