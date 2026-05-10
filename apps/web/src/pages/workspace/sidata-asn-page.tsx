import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FilePlus2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { AsnRecord, PaginatedResult, SipensiunCaseDetail } from '@/lib/api/types';
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

export function SidataAsnPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statusAsn, setStatusAsn] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResult<AsnRecord> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<AsnRecord>>('/sidata/asn', { q, statusAsn, page, limit: 10 })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : 'Gagal memuat ASN');
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
  }, [page, q, statusAsn]);

  async function createSipensiun(asn: AsnRecord) {
    setCreatingId(asn.id);
    setError('');

    try {
      const result = await apiClient.post<SipensiunCaseDetail>('/sipensiun/cases', {
        asnId: asn.id,
        jenisPensiun: 'BUP',
        tmtPensiun: asn.tmtPensiun ?? undefined,
        catatan: `Usulan pensiun BUP untuk ${asn.nama}`,
      });
      navigate(`/sipensiun/${result.sipensiunDetail.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal membuat usulan');
    } finally {
      setCreatingId('');
    }
  }

  const total = data?.total ?? 0;
  const canNext = data ? page * data.limit < data.total : false;

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIDATA ASN"
        description="Pencarian data master ASN untuk memulai layanan pensiun dari sumber data backend."
        meta={<StatusBadge value={`${total} ASN`} tone="info" />}
      />
      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari NIP, nama, jabatan"
              value={q}
              onChange={(event) => {
                setPage(1);
                setQ(event.target.value);
              }}
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
            <option value="">Semua status ASN</option>
            <option value="AKTIF">AKTIF</option>
            <option value="PENSIUN">PENSIUN</option>
          </select>
        </FilterBar>
      </Toolbar>

      {loading ? (
        <LoadingState label="Memuat data ASN" />
      ) : (
        <DataTable
          items={data?.items ?? []}
          rowKey={(item) => item.id}
          empty="Belum ada ASN ditemukan"
          columns={[
            { key: 'nip', header: 'NIP', render: (item) => <span className="font-mono text-xs text-zinc-700">{item.nip}</span> },
            {
              key: 'nama',
              header: 'Nama',
              render: (item) => (
                <div>
                  <div className="font-semibold text-zinc-950">{item.nama}</div>
                  <div className="text-xs text-muted-foreground">{item.email ?? '-'}</div>
                </div>
              ),
            },
            { key: 'unit', header: 'Unit Kerja', render: (item) => item.unitKerja?.nama ?? '-' },
            { key: 'jabatan', header: 'Jabatan', render: (item) => item.jabatanNama ?? '-' },
            { key: 'golongan', header: 'Golongan', render: (item) => item.golonganNama ?? '-' },
            { key: 'status', header: 'Status ASN', render: (item) => <StatusBadge value={item.statusAsn} /> },
            {
              key: 'action',
              header: 'Action',
              render: (item) => (
                <ActionButton
                  disabled={creatingId === item.id}
                  icon={FilePlus2}
                  onClick={() => createSipensiun(item)}
                  variant="secondary"
                >
                  Buat Usulan
                </ActionButton>
              ),
            },
          ]}
        />
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          Total {total} data, halaman {data?.page ?? page}
        </span>
        <div className="flex gap-2">
          <ActionButton disabled={page <= 1} icon={ChevronLeft} onClick={() => setPage(page - 1)} variant="secondary">
            Sebelumnya
          </ActionButton>
          <ActionButton disabled={!canNext} icon={ChevronRight} onClick={() => setPage(page + 1)}>
            Berikutnya
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
