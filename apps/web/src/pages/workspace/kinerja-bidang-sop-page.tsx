import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  BarChart3,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  UploadCloud,
} from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  kinerjaSopStageLabel,
  kinerjaSopStatusLabel,
  kinerjaTargetUnitLabel,
  type KinerjaBidangSop,
  type KinerjaSopStage,
} from '@/lib/api/kinerja-bidang';

type SopFilterValue = {
  q: string;
  stage: KinerjaSopStage | '';
  isRhkPrimary: '' | 'true' | 'false';
};

const defaultFilter: SopFilterValue = {
  q: '',
  stage: '',
  isRhkPrimary: '',
};

export function KinerjaBidangSopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<KinerjaBidangSop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filter = useMemo<SopFilterValue>(
    () => ({
      q: searchParams.get('q') ?? defaultFilter.q,
      stage: (searchParams.get('stage') ?? '') as KinerjaSopStage | '',
      isRhkPrimary: normalizePrimaryFilter(searchParams.get('isRhkPrimary')),
    }),
    [searchParams],
  );

  const summary = useMemo(() => buildSummary(items), [items]);

  function updateFilter(updates: Partial<SopFilterValue>) {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
    });

    setSearchParams(next);
  }

  function resetFilter() {
    setSearchParams(new URLSearchParams());
  }

  async function load({ silent = false }: { silent?: boolean } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const result = await kinerjaBidangApi.listSop({
        q: filter.q,
        status: 'ACTIVE',
        stage: filter.stage,
        isRhkPrimary:
          filter.isRhkPrimary === ''
            ? ''
            : filter.isRhkPrimary === 'true',
        limit: 100,
      });

      setItems(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Gagal memuat master SOP/RHK',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openDetail(item: KinerjaBidangSop) {
    navigate(`/kinerja-bidang/sop/${encodeURIComponent(item.id)}`);
  }

  function openEvidence(item: KinerjaBidangSop) {
    const primaryRhkCode = item.rhkMappings[0]?.rhkCode ?? '';
    const params = new URLSearchParams({
      source: 'sop-rhk',
      sopCode: item.code,
      sopTitle: item.title,
      year: String(new Date().getFullYear()),
    });

    if (primaryRhkCode) {
      params.set('rhkCode', primaryRhkCode);
    }

    navigate(`/dms/upload?${params.toString()}`);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.q, filter.stage, filter.isRhkPrimary]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master SOP/RHK"
        description="Daftar SOP resmi Bidang PPIK, pemetaan RHK, target kinerja, dan akses bukti dukung DMS."
        meta={
          <>
            <StatusBadge value="SOP/RHK" tone="dark" />
            <StatusBadge value="Sumber: API Kinerja Bidang" tone="info" />
            <StatusBadge value={`${items.length} SOP Aktif`} tone="success" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={RefreshCcw}
              disabled={refreshing || loading}
              onClick={() => void load({ silent: true })}
            >
              Refresh
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => navigate('/kinerja-bidang/targets')}
            >
              Target RHK
            </ActionButton>
            <ActionButton
              icon={FileText}
              onClick={() => navigate('/kinerja-bidang/report')}
            >
              Laporan
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total SOP Aktif" value={summary.total} icon={FileText} />
        <StatCard
          label="SOP Utama RHK"
          value={summary.primary}
          icon={BarChart3}
          tone="success"
        />
        <StatCard
          label="Tahap 1"
          value={summary.stage1}
          icon={FileText}
          tone="info"
        />
        <StatCard
          label="Tahap 2 & 3"
          value={summary.stage2 + summary.stage3}
          icon={FileText}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Filter SOP"
        description="Gunakan filter untuk mencari SOP berdasarkan kata kunci, tahap, dan status SOP utama RHK."
        actions={
          <ActionButton
            variant="secondary"
            icon={RefreshCcw}
            disabled={loading}
            onClick={resetFilter}
          >
            Reset
          </ActionButton>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6d7e68]" />
            <input
              className="h-10 w-full rounded-md border border-[#cfe1da] bg-white pl-9 pr-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#8fd8df]"
              placeholder="Cari kode SOP, judul, atau deskripsi..."
              value={filter.q}
              onChange={(event) => updateFilter({ q: event.target.value })}
            />
          </label>

          <select
            className="h-10 w-full rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#8fd8df]"
            value={filter.stage}
            onChange={(event) =>
              updateFilter({ stage: event.target.value as KinerjaSopStage | '' })
            }
          >
            <option value="">Semua tahap</option>
            <option value="TAHAP_1">Tahap 1</option>
            <option value="TAHAP_2">Tahap 2</option>
            <option value="TAHAP_3">Tahap 3</option>
          </select>

          <select
            className="h-10 w-full rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#8fd8df]"
            value={filter.isRhkPrimary}
            onChange={(event) =>
              updateFilter({
                isRhkPrimary: event.target.value as SopFilterValue['isRhkPrimary'],
              })
            }
          >
            <option value="">Semua jenis SOP</option>
            <option value="true">SOP Utama RHK</option>
            <option value="false">SOP Pendukung</option>
          </select>
        </div>
      </SectionCard>

      {loading ? (
        <LoadingState label="Memuat master SOP/RHK" />
      ) : (
        <SectionCard
          title="Daftar SOP Resmi"
          description="Klik Detail untuk membuka format SOP formal lengkap dengan dasar hukum, target RHK, langkah prosedur, tanda tangan, dan bukti dukung DMS."
        >
          <DataTable<KinerjaBidangSop>
            items={items}
            empty="Belum ada data SOP aktif"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'code',
                header: 'Kode',
                render: (item) => (
                  <button
                    type="button"
                    className="font-semibold text-[#0e7c86] hover:underline"
                    onClick={() => openDetail(item)}
                  >
                    {item.code}
                  </button>
                ),
              },
              {
                key: 'title',
                header: 'Judul SOP',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#18343a]">{item.title}</div>
                    <div className="mt-1 max-w-2xl text-xs leading-5 text-[#6d7e68]">
                      {item.shortDescription}
                    </div>
                  </div>
                ),
              },
              {
                key: 'stage',
                header: 'Tahap',
                render: (item) => (
                  <StatusBadge value={kinerjaSopStageLabel(item.stage)} tone="info" />
                ),
              },
              {
                key: 'rhk',
                header: 'RHK',
                render: (item) => (
                  <div className="flex flex-wrap gap-1">
                    {item.rhkMappings.length > 0 ? (
                      item.rhkMappings.map((rhk) => (
                        <StatusBadge key={rhk.id} value={rhk.rhkCode} tone="info" />
                      ))
                    ) : (
                      <StatusBadge value="Belum dipetakan" tone="warning" />
                    )}
                  </div>
                ),
              },
              {
                key: 'target',
                header: 'Target',
                render: (item) => (
                  <span className="text-sm text-[#18343a]">
                    {item.targetQuantity ?? 0}{' '}
                    {kinerjaTargetUnitLabel(item.targetUnit)}
                  </span>
                ),
              },
              {
                key: 'quality',
                header: 'Kualitas/Waktu',
                render: (item) => (
                  <div className="text-sm leading-5 text-[#51614c]">
                    <div>{item.qualityTarget ?? '-'}</div>
                    <div className="text-xs text-[#6d7e68]">
                      {item.timeTarget ?? '-'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <div className="flex flex-col gap-1">
                    <StatusBadge value={kinerjaSopStatusLabel(item.status)} />
                    <StatusBadge
                      value={item.isRhkPrimary ? 'Utama RHK' : 'Pendukung'}
                      tone={item.isRhkPrimary ? 'success' : 'neutral'}
                    />
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Aksi',
                className: 'text-right',
                render: (item) => (
                  <div className="flex flex-wrap justify-end gap-2">
                    <ActionButton
                      variant="secondary"
                      icon={Eye}
                      onClick={() => openDetail(item)}
                    >
                      Detail
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      icon={UploadCloud}
                      onClick={() => openEvidence(item)}
                    >
                      Bukti
                    </ActionButton>
                  </div>
                ),
              },
            ]}
          />
        </SectionCard>
      )}
    </div>
  );
}

function normalizePrimaryFilter(value: string | null): SopFilterValue['isRhkPrimary'] {
  if (value === 'true' || value === 'false') {
    return value;
  }

  return '';
}

function buildSummary(items: KinerjaBidangSop[]) {
  return {
    total: items.length,
    primary: items.filter((item) => item.isRhkPrimary).length,
    stage1: items.filter((item) => item.stage === 'TAHAP_1').length,
    stage2: items.filter((item) => item.stage === 'TAHAP_2').length,
    stage3: items.filter((item) => item.stage === 'TAHAP_3').length,
  };
}
