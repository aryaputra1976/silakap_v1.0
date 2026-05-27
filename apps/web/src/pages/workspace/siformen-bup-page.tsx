import { useState } from 'react';
import { RefreshCcw, Loader2, Search, CalendarX2 } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { useBupList } from '@/lib/siformen/hooks';

const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];
const LIMIT = 25;

function formatTanggal(val: string | null): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getYearTone(tahun: number): 'danger' | 'warning' | 'neutral' {
  if (tahun === 2024) return 'danger';
  if (tahun === 2025 || tahun === 2026) return 'warning';
  return 'neutral';
}

export function SiformenBupPage() {
  const [tahun, setTahun] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useBupList({
    tahun: tahun || undefined,
    q: search || undefined,
    page,
    limit: LIMIT,
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const errMsg = (error as Error)?.message ?? '';

  function handleTahunChange(val: string) {
    setTahun(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="BUP / Pensiun"
        description="Daftar ASN yang memasuki Batas Usia Pensiun periode 2024 – 2028 berdasarkan data SIASN"
        actions={
          <ActionButton
            icon={isLoading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={isLoading}
            onClick={() => refetch()}
          />
        }
      />

      {errMsg ? <ErrorAlert message={errMsg} /> : null}

      {/* Year filter chips */}
      <div className="grid gap-3 sm:grid-cols-5">
        {BUP_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => handleTahunChange(String(y) === tahun ? '' : String(y))}
            className={`rounded-lg border p-3 text-left transition-colors ${
              String(y) === tahun ? 'border-ring bg-muted' : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            <div className="text-xs text-muted-foreground">{y}</div>
            <div className="text-xl font-bold text-foreground">
              {tahun === String(y) && data ? data.total.toLocaleString('id') : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">Klik untuk filter</div>
          </button>
        ))}
      </div>

      <SectionCard
        title={`Daftar ASN BUP${tahun ? ` Tahun ${tahun}` : ' 2024–2028'}`}
        description={data ? `${data.total.toLocaleString('id')} ASN akan pensiun` : ''}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
            value={tahun}
            onChange={(e) => handleTahunChange(e.target.value)}
          >
            <option value="">Semua Tahun (2024–2028)</option>
            {BUP_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, NIP, jabatan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none focus:border-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Memuat data BUP" />
        ) : data?.items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada data BUP sesuai filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase w-10">No</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase">NIP</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase min-w-40">Nama</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase">Jabatan</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase">Unit Kerja</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase">Golongan</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-center">TMT Pensiun</th>
                  <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-center">Tahun</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item, i) => {
                  const thnPensiun = item.tmtPensiun ? new Date(item.tmtPensiun).getFullYear() : null;
                  return (
                    <tr key={item.id} className={`border-b border-border/50 ${i % 2 !== 0 ? 'bg-muted/20' : ''}`}>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{(page - 1) * LIMIT + i + 1}</td>
                      <td className="py-1.5 px-3 text-xs font-mono text-muted-foreground">{item.nip}</td>
                      <td className="py-1.5 px-3 text-sm font-medium text-foreground">{item.nama}</td>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{item.jabatanNama ?? '—'}</td>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{item.unitKerja?.nama ?? item.unorNama ?? '—'}</td>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{item.golonganNama ?? '—'}</td>
                      <td className="py-1.5 px-3 text-xs text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarX2 className="size-3 text-amber-500" />
                          {formatTanggal(item.tmtPensiun)}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {thnPensiun ? (
                          <StatusBadge value={String(thnPensiun)} tone={getYearTone(thnPensiun)} />
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages} · {data?.total.toLocaleString('id')} total
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
