import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Database,
  Filter,
  Layers3,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';

type ReferenceTab =
  | 'JENIS_JABATAN'
  | 'JABATAN'
  | 'UNIT_ORGANISASI'
  | GenericReferenceType;

type GenericReferenceType =
  | 'GOLONGAN'
  | 'PANGKAT'
  | 'PENDIDIKAN'
  | 'AGAMA'
  | 'JENIS_KELAMIN'
  | 'STATUS_KAWIN'
  | 'KEDUDUKAN_HUKUM'
  | 'JENIS_ASN';

type ActiveFilter = '' | 'true' | 'false';

type GenericReferenceRow = {
  id: string;
  kode: string | null;
  nama: string;
  isActive: boolean;
};

type JenisJabatanRow = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
};

type JabatanRow = {
  id: string;
  kode: string | null;
  nama: string;
  namaNormalized?: string | null;
  siasnId?: string | null;
  siasnKode?: string | null;
  siasnNama?: string | null;
  rumpun?: string | null;
  jenjang?: string | null;
  kelasJabatan?: number | null;
  source?: string | null;
  isActive: boolean;
  jenisJabatan?: {
    id: string;
    kode: string;
    nama: string;
  } | null;
};

type UnitRow = {
  id: string;
  kode: string | null;
  nama: string;
  parentId?: string | null;
  level?: number | null;
  isActive?: boolean | null;
};

type NormalizedReferenceRow = {
  id: string;
  kode: string | null;
  nama: string;
  kategori: string;
  deskripsi?: string | null;
  isActive: boolean;
  meta?: string | null;
};

type JabatanListResponse = PaginatedResult<JabatanRow>;

const GENERIC_REFERENCE_TYPES: Array<{
  value: GenericReferenceType;
  label: string;
  description: string;
}> = [
  {
    value: 'GOLONGAN',
    label: 'Golongan',
    description: 'Referensi golongan ASN.',
  },
  {
    value: 'PANGKAT',
    label: 'Pangkat',
    description: 'Referensi pangkat dan ruang ASN.',
  },
  {
    value: 'PENDIDIKAN',
    label: 'Pendidikan',
    description: 'Referensi tingkat pendidikan.',
  },
  {
    value: 'AGAMA',
    label: 'Agama',
    description: 'Referensi agama pegawai.',
  },
  {
    value: 'JENIS_KELAMIN',
    label: 'Jenis Kelamin',
    description: 'Referensi jenis kelamin.',
  },
  {
    value: 'STATUS_KAWIN',
    label: 'Status Kawin',
    description: 'Referensi status perkawinan.',
  },
  {
    value: 'KEDUDUKAN_HUKUM',
    label: 'Kedudukan Hukum',
    description: 'Referensi kedudukan hukum ASN.',
  },
  {
    value: 'JENIS_ASN',
    label: 'Jenis ASN',
    description: 'Referensi jenis ASN.',
  },
];

const REFERENCE_TABS: Array<{
  value: ReferenceTab;
  label: string;
  description: string;
}> = [
  {
    value: 'JENIS_JABATAN',
    label: 'Jenis Jabatan',
    description: 'Referensi kategori jabatan ASN.',
  },
  {
    value: 'JABATAN',
    label: 'Jabatan',
    description: 'Referensi jabatan struktural, fungsional, dan pelaksana.',
  },
  {
    value: 'UNIT_ORGANISASI',
    label: 'Unit Organisasi',
    description: 'Referensi unit organisasi aktif.',
  },
  ...GENERIC_REFERENCE_TYPES,
];

const ACTIVE_OPTIONS: Array<{
  value: ActiveFilter;
  label: string;
}> = [
  { value: '', label: 'Semua status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Tidak aktif' },
];

const PAGE_LIMIT = 10;

function getErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

function getTabLabel(tab: ReferenceTab) {
  return REFERENCE_TABS.find((item) => item.value === tab)?.label ?? tab;
}

function getTabDescription(tab: ReferenceTab) {
  return REFERENCE_TABS.find((item) => item.value === tab)?.description ?? '';
}

function isGenericReferenceType(tab: ReferenceTab): tab is GenericReferenceType {
  return GENERIC_REFERENCE_TYPES.some((item) => item.value === tab);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').toLowerCase();
}

function matchesLocalSearch(row: NormalizedReferenceRow, query: string) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return true;
  }

  const searchable = [
    row.id,
    row.kode,
    row.nama,
    row.kategori,
    row.deskripsi,
    row.meta,
    row.isActive ? 'aktif active true' : 'tidak aktif inactive false',
  ]
    .map(normalizeText)
    .join(' ');

  return searchable.includes(q);
}

function matchesActive(row: NormalizedReferenceRow, isActive: ActiveFilter) {
  if (!isActive) {
    return true;
  }

  return row.isActive === (isActive === 'true');
}

function normalizeJenisJabatan(rows: JenisJabatanRow[]): NormalizedReferenceRow[] {
  return rows.map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    kategori: 'Jenis Jabatan',
    deskripsi: item.deskripsi,
    isActive: item.isActive,
    meta: item.deskripsi,
  }));
}

function normalizeJabatan(rows: JabatanRow[]): NormalizedReferenceRow[] {
  return rows.map((item) => ({
    id: item.id,
    kode: item.kode ?? item.siasnKode ?? null,
    nama: item.nama,
    kategori: item.jenisJabatan?.nama ?? 'Jabatan',
    deskripsi: item.rumpun ?? item.jenjang ?? item.siasnNama ?? null,
    isActive: item.isActive,
    meta: [
      item.jenisJabatan?.kode,
      item.rumpun,
      item.jenjang,
      item.kelasJabatan ? `Kelas ${item.kelasJabatan}` : null,
      item.source,
    ]
      .filter(Boolean)
      .join(' • '),
  }));
}

function normalizeUnits(rows: UnitRow[]): NormalizedReferenceRow[] {
  return rows.map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    kategori: 'Unit Organisasi',
    deskripsi:
      item.level !== null && item.level !== undefined ? `Level ${item.level}` : null,
    isActive: item.isActive ?? true,
    meta:
      item.parentId || item.level !== null
        ? [
            item.level !== null && item.level !== undefined ? `Level ${item.level}` : null,
            item.parentId ? `Parent ${item.parentId}` : null,
          ]
            .filter(Boolean)
            .join(' • ')
        : null,
  }));
}

function normalizeGeneric(
  rows: GenericReferenceRow[],
  label: string,
): NormalizedReferenceRow[] {
  return rows.map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    kategori: label,
    isActive: item.isActive,
    meta: label,
  }));
}

export function SidataReferensiPage() {
  const [activeTab, setActiveTab] = useState<ReferenceTab>('JABATAN');
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState<ActiveFilter>('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<NormalizedReferenceRow[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualForm, setManualForm] = useState({
    kode: '',
    nama: '',
    jenisJabatanId: '',
  });
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [activeTab, q, isActive]);

  useEffect(() => {
    void loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const filteredRows = useMemo(() => {
    if (activeTab === 'JABATAN') {
      return rows;
    }

    return rows
      .filter((item) => matchesLocalSearch(item, q))
      .filter((item) => matchesActive(item, isActive));
  }, [activeTab, isActive, q, rows]);

  const pageRows = useMemo(() => {
    if (activeTab === 'JABATAN') {
      return filteredRows;
    }

    const start = (page - 1) * PAGE_LIMIT;
    return filteredRows.slice(start, start + PAGE_LIMIT);
  }, [activeTab, filteredRows, page]);

  const effectiveTotal = activeTab === 'JABATAN' ? total : filteredRows.length;
  const activeCount = filteredRows.filter((item) => item.isActive).length;
  const inactiveCount = filteredRows.length - activeCount;
  const canPrevious = page > 1;
  const canNext = page * PAGE_LIMIT < effectiveTotal;

  async function loadReferences(pageOverride?: number) {
    setLoading(true);
    setError('');

    const effectivePage = pageOverride ?? page;

    try {
      if (activeTab === 'JENIS_JABATAN') {
        const result = await apiClient.get<JenisJabatanRow[]>(
          '/sidata/references/jenis-jabatan',
        );

        const normalized = normalizeJenisJabatan(result);
        setRows(normalized);
        setTotal(normalized.length);
        return;
      }

      if (activeTab === 'JABATAN') {
        const result = await apiClient.get<JabatanListResponse>(
          '/sidata/references/jabatan',
          {
            q,
            isActive,
            page: effectivePage,
            limit: PAGE_LIMIT,
          },
        );

        const normalized = normalizeJabatan(result.items);
        setRows(normalized);
        setTotal(result.total);
        return;
      }

      if (activeTab === 'UNIT_ORGANISASI') {
        const result = await apiClient.get<UnitRow[]>('/sidata/units');

        const normalized = normalizeUnits(result);
        setRows(normalized);
        setTotal(normalized.length);
        return;
      }

      if (isGenericReferenceType(activeTab)) {
        const result = await apiClient.get<GenericReferenceRow[]>(
          '/sidata/references/generic',
          {
            type: activeTab,
            q,
            isActive,
          },
        );

        const normalized = normalizeGeneric(result, getTabLabel(activeTab));
        setRows(normalized);
        setTotal(normalized.length);
      }
    } catch (caught) {
      setRows([]);
      setTotal(0);
      setError(getErrorMessage(caught, 'Gagal memuat referensi SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ('');
    setIsActive('');
    setPage(1);
  }

  function submitSearch() {
    setPage(1);
    void loadReferences(1);
  }

  function changeTab(tab: ReferenceTab) {
    setActiveTab(tab);
    setQ('');
    setIsActive('');
    setPage(1);
  }

  async function createManualReference() {
    if (!manualForm.nama.trim()) {
      toast.error('Nama referensi wajib diisi');
      return;
    }

    setSavingManual(true);
    try {
      if (activeTab === 'UNIT_ORGANISASI') {
        await apiClient.post('/sidata/references/units', {
          kode: manualForm.kode,
          nama: manualForm.nama,
          level: '1',
          isActive: true,
        });
      } else if (activeTab === 'JABATAN') {
        await apiClient.post('/sidata/references/jabatan', {
          jenisJabatanId: manualForm.jenisJabatanId,
          kode: manualForm.kode,
          nama: manualForm.nama,
          isActive: true,
        });
      } else if (isGenericReferenceType(activeTab)) {
        await apiClient.post('/sidata/references/generic', {
          type: activeTab,
          kode: manualForm.kode,
          nama: manualForm.nama,
          isActive: true,
        });
      } else {
        toast.error('Kategori ini belum mendukung tambah manual');
        return;
      }

      setManualForm({ kode: '', nama: '', jenisJabatanId: '' });
      toast.success('Referensi manual berhasil dibuat');
      await loadReferences(1);
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal membuat referensi manual'));
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Referensi Data SIDATA"
        description="Browser master referensi ASN untuk validasi, mapping, dan sinkronisasi data SIDATA."
        meta={
          <>
            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
              SIDATA ASN / Referensi Data
            </span>
            <StatusBadge value="Master Data" tone="info" />
            <StatusBadge value="Reference Browser" tone="dark" />
            <StatusBadge value="Mapping Ready" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadReferences()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Database}
          label="Total Data"
          value={effectiveTotal}
          description={`Jumlah data pada referensi ${getTabLabel(activeTab)}.`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Aktif"
          value={activeCount}
          tone="success"
          description="Data referensi aktif."
        />
        <StatCard
          icon={Layers3}
          label="Tidak Aktif"
          value={inactiveCount}
          tone="warning"
          description="Data referensi tidak aktif."
        />
        <StatCard
          icon={Building2}
          label="Kategori"
          value={REFERENCE_TABS.length}
          tone="info"
          description="Jumlah kategori referensi tersedia."
        />
      </div>

      <SectionCard
        title="Kategori Referensi"
        description="Pilih jenis master referensi yang ingin diperiksa."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {REFERENCE_TABS.map((item) => {
            const selected = item.value === activeTab;

            return (
              <button
                key={item.value}
                className={
                  selected
                    ? 'rounded-lg border border-zinc-900 bg-zinc-900 p-4 text-left text-white shadow-sm'
                    : 'rounded-lg border border-border bg-white p-4 text-left text-zinc-800 transition-colors hover:bg-zinc-50'
                }
                type="button"
                onClick={() => changeTab(item.value)}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <p
                  className={
                    selected
                      ? 'mt-1 line-clamp-2 text-xs leading-5 text-zinc-200'
                      : 'mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'
                  }
                >
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <Toolbar>
        <FilterBar>
          <div className="relative md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari kode, nama, kategori"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitSearch();
                }
              }}
            />
          </div>

          <select
            className={inputClass}
            value={isActive}
            onChange={(event) => setIsActive(event.target.value as ActiveFilter)}
          >
            {ACTIVE_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <ActionButton
              disabled={loading}
              icon={Search}
              onClick={submitSearch}
              variant="secondary"
            >
              Cari
            </ActionButton>
            <ActionButton icon={Filter} onClick={resetFilters} variant="secondary">
              Reset
            </ActionButton>
          </div>
        </FilterBar>
      </Toolbar>

      <SectionCard
        title="Tambah Manual"
        description="Koreksi satu data referensi tanpa upload ulang seluruh file."
      >
        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <input
            className={inputClass}
            value={manualForm.kode}
            onChange={(event) => setManualForm((current) => ({ ...current, kode: event.target.value }))}
            placeholder="Kode"
          />
          <input
            className={inputClass}
            value={manualForm.nama}
            onChange={(event) => setManualForm((current) => ({ ...current, nama: event.target.value }))}
            placeholder="Nama referensi"
          />
          {activeTab === 'JABATAN' ? (
            <input
              className={inputClass}
              value={manualForm.jenisJabatanId}
              onChange={(event) => setManualForm((current) => ({ ...current, jenisJabatanId: event.target.value }))}
              placeholder="ID jenis jabatan"
            />
          ) : (
            <div />
          )}
          <ActionButton
            icon={Plus}
            disabled={savingManual || activeTab === 'JENIS_JABATAN'}
            onClick={() => void createManualReference()}
          >
            {savingManual ? 'Menyimpan...' : 'Tambah'}
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title={getTabLabel(activeTab)}
        description={getTabDescription(activeTab)}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${effectiveTotal} Data`} tone="info" />
            <StatusBadge value={`${activeCount} Aktif`} tone="success" />
          </div>
        }
      >
        {loading ? (
          <LoadingState label={`Memuat referensi ${getTabLabel(activeTab)}`} />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={Database}
            title="Referensi tidak ditemukan"
            description="Tidak ada data referensi yang sesuai filter."
          />
        ) : (
          <DataTable
            empty="Referensi tidak ditemukan"
            items={pageRows}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'kode',
                header: 'Kode',
                render: (item) => (
                  <span className="font-mono text-xs font-semibold text-zinc-800">
                    {item.kode ?? '-'}
                  </span>
                ),
              },
              {
                key: 'nama',
                header: 'Nama',
                render: (item) => (
                  <div className="max-w-[360px]">
                    <div className="font-semibold text-zinc-900">{item.nama}</div>
                    {item.deskripsi ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.deskripsi}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'kategori',
                header: 'Kategori',
                render: (item) => (
                  <div className="space-y-1">
                    <StatusBadge value={item.kategori} tone="neutral" />
                    {item.meta ? (
                      <div className="text-xs text-muted-foreground">{item.meta}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={item.isActive ? 'AKTIF' : 'TIDAK AKTIF'}
                    tone={item.isActive ? 'success' : 'warning'}
                  />
                ),
              },
              {
                key: 'id',
                header: 'ID',
                render: (item) => (
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.id}
                  </span>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          Total {effectiveTotal} data, halaman {page}
        </span>
        <div className="flex gap-2">
          <ActionButton
            disabled={!canPrevious || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            variant="secondary"
          >
            Sebelumnya
          </ActionButton>
          <ActionButton
            disabled={!canNext || loading}
            onClick={() => setPage((current) => current + 1)}
            variant="secondary"
          >
            Berikutnya
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
