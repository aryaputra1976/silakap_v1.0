import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FilePlus2,
  Folder,
  FolderOpen,
  Loader2,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  formatJenisAsn,
  sidataApi,
  SIDATA_JENIS_ASN_OPTIONS,
  SIDATA_STATUS_ASN_OPTIONS,
  type SidataUnitTreeNode,
} from '@/lib/api/sidata';
import type { AsnRecord, PaginatedResult, SipensiunCaseDetail } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  inputClass,
  LoadingState,
  PageHeader,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import { SidataSummaryCards } from '@/components/workspace/sidata/sidata-summary-cards';
import { type SidataAsnQualityDashboard } from '@/lib/api/sidata';

function JenisAsnBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-zinc-400">-</span>;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        value === 'PNS'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-purple-100 text-purple-700'
      }`}
    >
      {formatJenisAsn(value)}
    </span>
  );
}

type UnitTreeOption = {
  id: string;
  kode: string;
  nama: string;
  level: number;
  path: string;
};

function flattenUnitTree(nodes: SidataUnitTreeNode[], parentPath = ''): UnitTreeOption[] {
  return nodes.flatMap((node) => {
    const path = parentPath ? `${parentPath} / ${node.nama}` : node.nama;
    return [
      {
        id: node.id,
        kode: node.kode,
        nama: node.nama,
        level: node.level,
        path,
      },
      ...flattenUnitTree(node.children, path),
    ];
  });
}

function unitTreeMatches(node: SidataUnitTreeNode, query: string): boolean {
  if (!query) return true;
  const haystack = `${node.nama} ${node.kode}`.toLowerCase();
  return haystack.includes(query) || node.children.some((child) => unitTreeMatches(child, query));
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });
}

export function SidataAsnPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [statusAsn, setStatusAsn] = useState('');
  const [jenisAsn, setJenisAsn] = useState('');
  const [unitKerjaId, setUnitKerjaId] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PaginatedResult<AsnRecord> | null>(null);
  const [unitTree, setUnitTree] = useState<SidataUnitTreeNode[]>([]);
  const [unitComboOpen, setUnitComboOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState('');
  const [exporting, setExporting] = useState(false);

  const [quality, setQuality] = useState<SidataAsnQualityDashboard | null>(null);

  const isMounted = useRef(true);
  const unitComboRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Debounce search input → q, reset page on change
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 650);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load quality dashboard once on mount
  useEffect(() => {
    sidataApi
      .getAsnQualityDashboard()
      .then((result) => {
        if (isMounted.current) setQuality(result);
      })
      .catch(() => {
        // Non-critical; summary stays hidden on failure
      });
  }, []);

  // Load unit kerja tree once on mount
  useEffect(() => {
    sidataApi
      .getUnitTree()
      .then((result) => {
        if (isMounted.current) {
          setUnitTree(result);
        }
      })
      .catch(() => {
        // Unit list failure is non-critical; filter stays hidden
      });
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!unitComboRef.current?.contains(event.target as Node)) {
        setUnitComboOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  // Fetch ASN list when any filter or page changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    sidataApi
      .getAsnList({ q, statusAsn, jenisAsn, unitKerjaId, page, limit: 20 })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError ? caught.message : 'Gagal memuat data ASN',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, statusAsn, jenisAsn, unitKerjaId, page]);

  async function handleCreateSipensiun(asn: AsnRecord) {
    setCreatingId(asn.id);
    setError('');

    try {
      const result = await apiClient.post<SipensiunCaseDetail>('/sipensiun/cases', {
        asnId: asn.id,
        jenisPensiun: 'BUP',
        tmtPensiun: asn.tmtPensiun ?? undefined,
        catatan: `Usulan pensiun BUP untuk ${asn.nama}`,
      });
      if (isMounted.current) {
        navigate(`/sipensiun/${result.sipensiunDetail.id}`);
      }
    } catch (caught) {
      if (isMounted.current) {
        setError(
          caught instanceof ApiError ? caught.message : 'Gagal membuat usulan pensiun',
        );
        setCreatingId('');
      }
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    setError('');

    try {
      await sidataApi.exportAsnExcel({ q, statusAsn, jenisAsn, unitKerjaId });
    } catch (caught) {
      if (isMounted.current) {
        setError(
          caught instanceof ApiError ? caught.message : 'Gagal export data ASN',
        );
      }
    } finally {
      if (isMounted.current) {
        setExporting(false);
      }
    }
  }

  function resetFilters() {
    setSearchInput('');
    setQ('');
    setStatusAsn('');
    setJenisAsn('');
    setUnitKerjaId('');
    setPage(1);
  }

  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const currentPage = data?.page ?? page;
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  const canPrev = page > 1;
  const canNext = data ? page * limit < total : false;

  const hasActiveFilter = !!(searchInput || statusAsn || jenisAsn || unitKerjaId);
  const unitOptions = flattenUnitTree(unitTree);
  const selectedUnit = unitOptions.find((unit) => unit.id === unitKerjaId);
  const unitQuery = unitSearch.trim().toLowerCase();
  const hasVisibleUnits = unitTree.some((node) => unitTreeMatches(node, unitQuery));

  function toggleUnitNode(unitId: string) {
    setExpandedUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  }

  function selectUnit(unitId: string) {
    setPage(1);
    setUnitKerjaId(unitId);
    setUnitSearch('');
    setUnitComboOpen(false);
  }

  function renderUnitNode(node: SidataUnitTreeNode, depth = 0): ReactNode {
    if (!unitTreeMatches(node, unitQuery)) return null;

    const hasChildren = node.children.length > 0;
    const isExpanded = unitQuery ? true : expandedUnitIds.has(node.id);
    const isSelected = unitKerjaId === node.id;
    const FolderIcon = isExpanded && hasChildren ? FolderOpen : Folder;

    return (
      <div key={node.id}>
        <div
          className={`flex min-h-10 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-[#eef7ec] ${
            isSelected ? 'bg-[#e7f4ef] text-[#0f766e]' : 'text-[#173c36]'
          }`}
          style={{ paddingLeft: `${8 + depth * 18}px` }}
        >
          <button
            aria-label={isExpanded ? 'Tutup unit' : 'Buka unit'}
            className={`flex size-6 shrink-0 items-center justify-center rounded hover:bg-[#dcebe0] ${
              hasChildren ? 'visible' : 'invisible'
            }`}
            onClick={() => hasChildren && toggleUnitNode(node.id)}
            type="button"
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>

          <button
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 text-left"
            onClick={() => selectUnit(node.id)}
            type="button"
          >
            <FolderIcon className="size-4 shrink-0 text-[#c59a28]" />
            <span className="truncate font-medium">{node.nama}</span>
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <div>
            {node.children.map((child) => renderUnitNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Direktori ASN"
        description="Data master Aparatur Sipil Negara — pencarian, filter, dan profil lengkap."
        meta={
          total > 0 ? (
            <StatusBadge value={`${total} ASN`} tone="info" />
          ) : undefined
        }
        actions={
          <ActionButton
            disabled={exporting}
            icon={exporting ? Loader2 : FileDown}
            onClick={() => void handleExportExcel()}
            variant="secondary"
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {quality && <SidataSummaryCards quality={quality} />}

      <Toolbar>
        <FilterBar>
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari NIP, NIK, nama, jabatan…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <select
            className={inputClass}
            value={statusAsn}
            onChange={(event) => {
              setPage(1);
              setStatusAsn(event.target.value);
            }}
          >
            <option value="">Semua status</option>
            {SIDATA_STATUS_ASN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={jenisAsn}
            onChange={(event) => {
              setPage(1);
              setJenisAsn(event.target.value);
            }}
          >
            <option value="">Semua jenis ASN</option>
            {SIDATA_JENIS_ASN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {unitOptions.length > 0 && (
            <div className="relative" ref={unitComboRef}>
              <button
                className={`${inputClass} flex w-full cursor-pointer items-center justify-between gap-3 text-left`}
                onClick={() => setUnitComboOpen((current) => !current)}
                type="button"
              >
                <span className="truncate">
                  {selectedUnit ? selectedUnit.nama : 'Semua unit kerja'}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-[#60705b] transition-transform ${
                    unitComboOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {unitComboOpen ? (
                <div className="absolute left-0 right-0 z-30 mt-2 rounded-lg border border-[#c9d9c4] bg-[#fbfdf8] p-2 shadow-xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      className={`${inputClass} h-10 w-full pl-9`}
                      onChange={(event) => setUnitSearch(event.target.value)}
                      placeholder="Cari unit kerja..."
                      value={unitSearch}
                    />
                  </div>

                  <div className="mt-2 max-h-80 overflow-auto rounded-md border border-[#d8e4d3] bg-white p-1">
                    <button
                      className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-[#eef7ec] ${
                        !unitKerjaId ? 'font-semibold text-[#0f766e]' : 'text-[#173c36]'
                      }`}
                      onClick={() => {
                        setPage(1);
                        setUnitKerjaId('');
                        setUnitSearch('');
                        setUnitComboOpen(false);
                      }}
                      type="button"
                    >
                      <span className="size-6 shrink-0" />
                      <FolderOpen className="size-4 shrink-0 text-[#c59a28]" />
                      <span className="truncate">Semua unit kerja</span>
                    </button>

                    {!hasVisibleUnits ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">
                        Unit kerja tidak ditemukan.
                      </div>
                    ) : (
                      unitTree.map((node) => renderUnitNode(node))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {hasActiveFilter && (
            <button
              className="text-sm text-zinc-500 hover:text-zinc-700"
              onClick={resetFilters}
              type="button"
            >
              Reset filter
            </button>
          )}
        </FilterBar>
      </Toolbar>

      {loading ? (
        <LoadingState label="Memuat data ASN" />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="block md:hidden">
            {(data?.items ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-400">
                {hasActiveFilter ? 'Tidak ada ASN yang cocok dengan filter.' : 'Belum ada data ASN.'}
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.items ?? []).map((item) => {
                  const tmt = item.tmtPensiun ? new Date(item.tmtPensiun) : null;
                  const now = new Date();
                  const bulanSisa = tmt
                    ? (tmt.getFullYear() - now.getFullYear()) * 12 + (tmt.getMonth() - now.getMonth())
                    : null;
                  const tmtLabel = tmt
                    ? tmt.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
                    : null;
                  const tmtUrgent = bulanSisa !== null && bulanSisa <= 6 && bulanSisa >= 0;
                  const tmtLewat = bulanSisa !== null && bulanSisa < 0;

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">{item.nama}</p>
                          <p className="font-mono text-xs text-zinc-400">{item.nip}</p>
                        </div>
                        <StatusBadge value={item.statusAsn ?? '-'} />
                      </div>

                      {/* Card body */}
                      <div className="px-4 py-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="w-20 shrink-0 text-xs text-zinc-400">Unit</span>
                          <span className="text-zinc-700 leading-tight">{item.unitKerja?.nama ?? '-'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-20 shrink-0 text-xs text-zinc-400">Pangkat</span>
                          <span className="font-medium text-[#173c36]">{item.golonganNama ?? '-'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-20 shrink-0 text-xs text-zinc-400">Jabatan</span>
                          <span className="text-zinc-600 leading-tight">{item.jabatanNama ?? '-'}</span>
                        </div>
                        {tmtLabel && (
                          <div className="flex items-center gap-2">
                            <span className="w-20 shrink-0 text-xs text-zinc-400">Pensiun</span>
                            <span className={`font-medium ${tmtUrgent ? 'text-amber-600' : tmtLewat ? 'text-red-500' : 'text-zinc-700'}`}>
                              {tmtLabel}
                            </span>
                            {tmtUrgent && <span className="text-xs text-amber-500">{bulanSisa} bln</span>}
                            {tmtLewat && <span className="text-xs text-red-400">Lewat</span>}
                          </div>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
                        <ActionButton
                          icon={Eye}
                          onClick={() => navigate(`/sidata/asn/${item.id}`)}
                          variant="secondary"
                        >
                          Detail
                        </ActionButton>
                        <ActionButton
                          disabled={creatingId === item.id}
                          icon={FilePlus2}
                          onClick={() => void handleCreateSipensiun(item)}
                          variant="secondary"
                        >
                          {creatingId === item.id ? 'Membuat…' : 'Usulan'}
                        </ActionButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <DataTable
              items={data?.items ?? []}
              rowKey={(item) => item.id}
              empty={
                hasActiveFilter
                  ? 'Tidak ada ASN yang cocok dengan filter.'
                  : 'Belum ada data ASN.'
              }
              columns={[
                {
                  key: 'nip_status',
                  header: 'NIP',
                  className: 'w-[160px]',
                  render: (item) => (
                    <div>
                      <span className="whitespace-nowrap font-mono text-xs text-zinc-700">{item.nip}</span>
                      <div className="mt-2">
                        <StatusBadge value={item.statusAsn ?? '-'} />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'nama_unit',
                  header: 'Nama / Unit Kerja',
                  render: (item) => (
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-950">{item.nama}</div>
                      <div className="mt-1 text-xs text-zinc-500">{item.unitKerja?.nama ?? '-'}</div>
                    </div>
                  ),
                },
                {
                  key: 'pangkat_jabatan',
                  header: 'Pangkat / Jabatan',
                  className: 'w-[190px]',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-[#173c36]">{item.golonganNama ?? '-'}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">{item.jabatanNama ?? '-'}</div>
                      <div className="mt-1 text-xs text-[#60735b]">MK {item.masaKerjaGolongan ?? '-'}</div>
                      <div className="text-xs text-zinc-400">{item.pendidikanTingkatNama ?? item.pendidikanNama ?? '-'}</div>
                    </div>
                  ),
                },
                {
                  key: 'tmt_pensiun',
                  header: 'TMT Pensiun',
                  className: 'w-[120px]',
                  render: (item) => {
                    if (!item.tmtPensiun) return <span className="text-xs text-zinc-400">-</span>;
                    const tmt = new Date(item.tmtPensiun);
                    const now = new Date();
                    const bulanSisa = (tmt.getFullYear() - now.getFullYear()) * 12 + (tmt.getMonth() - now.getMonth());
                    const label = tmt.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                    const urgent = bulanSisa <= 6 && bulanSisa >= 0;
                    const lewat = bulanSisa < 0;
                    return (
                      <div>
                        <span className={`text-sm font-medium ${urgent ? 'text-amber-600' : lewat ? 'text-red-500' : 'text-zinc-700'}`}>
                          {label}
                        </span>
                        {urgent && <div className="text-xs text-amber-500">{bulanSisa} bln lagi</div>}
                        {lewat && <div className="text-xs text-red-400">Lewat</div>}
                      </div>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'w-[140px]',
                  render: (item) => (
                    <div className="flex flex-col items-start gap-2">
                      <ActionButton
                        icon={Eye}
                        onClick={() => navigate(`/sidata/asn/${item.id}`)}
                        variant="secondary"
                      >
                        Detail
                      </ActionButton>
                      <ActionButton
                        disabled={creatingId === item.id}
                        icon={FilePlus2}
                        onClick={() => void handleCreateSipensiun(item)}
                        variant="secondary"
                      >
                        {creatingId === item.id ? 'Membuat…' : 'Usulan'}
                      </ActionButton>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          {total === 0
            ? 'Tidak ada data'
            : `Menampilkan ${from}–${to} dari ${total} ASN`}
        </span>
        <div className="flex gap-2">
          <ActionButton
            disabled={!canPrev}
            icon={ChevronLeft}
            onClick={() => setPage(page - 1)}
            variant="secondary"
          >
            Sebelumnya
          </ActionButton>
          <ActionButton
            disabled={!canNext}
            icon={ChevronRight}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
