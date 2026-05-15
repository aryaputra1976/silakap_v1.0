import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FilePlus2,
  Loader2,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  sidataApi,
  SIDATA_JENIS_ASN_OPTIONS,
  SIDATA_STATUS_ASN_OPTIONS,
  type SidataUnitKerja,
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
      {value}
    </span>
  );
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
  const [units, setUnits] = useState<SidataUnitKerja[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState('');
  const [exporting, setExporting] = useState(false);

  const isMounted = useRef(true);

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
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load unit kerja options once on mount
  useEffect(() => {
    sidataApi
      .getUnits()
      .then((result) => {
        if (isMounted.current) {
          setUnits(result);
        }
      })
      .catch(() => {
        // Unit list failure is non-critical; filter stays hidden
      });
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

  async function handleExportCsv() {
    setExporting(true);
    setError('');

    try {
      await sidataApi.exportAsnCsv({ q, statusAsn, jenisAsn, unitKerjaId });
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
            onClick={() => void handleExportCsv()}
            variant="secondary"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

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

          {units.length > 0 && (
            <select
              className={inputClass}
              value={unitKerjaId}
              onChange={(event) => {
                setPage(1);
                setUnitKerjaId(event.target.value);
              }}
            >
              <option value="">Semua unit kerja</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.nama}
                </option>
              ))}
            </select>
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
              key: 'nip',
              header: 'NIP',
              render: (item) => (
                <span className="font-mono text-xs text-zinc-700">{item.nip}</span>
              ),
            },
            {
              key: 'nama',
              header: 'Nama',
              render: (item) => (
                <div>
                  <div className="font-semibold text-zinc-950">{item.nama}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.jabatanNama ?? '-'}
                  </div>
                </div>
              ),
            },
            {
              key: 'jenis',
              header: 'Jenis',
              render: (item) => <JenisAsnBadge value={item.jenisAsn} />,
            },
            {
              key: 'unit',
              header: 'Unit Kerja',
              render: (item) => item.unitKerja?.nama ?? '-',
            },
            {
              key: 'golongan',
              header: 'Golongan',
              render: (item) => item.golonganNama ?? '-',
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => (
                <StatusBadge value={item.statusAsn ?? '-'} />
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (item) => (
                <div className="flex items-center gap-2">
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
