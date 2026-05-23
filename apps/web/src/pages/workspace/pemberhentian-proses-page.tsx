import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { FileText, Plus, RefreshCcw, Search, User, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  inputClass,
} from '@/components/workspace/ui';
import {
  createProses,
  JENIS_BY_KATEGORI,
  JENIS_LABEL,
  KATEGORI_LABEL,
  listProses,
  STATUS_COLOR,
  STATUS_LABEL,
  type JenisPemberhentian,
  type KategoriPemberhentian,
  type PaginatedProses,
  type ProsesListItem,
  type StatusPemberhentian,
} from '@/lib/api/pemberhentian';
import { sidataApi } from '@/lib/api/sidata';
import type { AsnRecord } from '@/lib/api/types';

const STATUS_OPTIONS: Array<{ value: StatusPemberhentian; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENGUMPULAN_BERKAS', label: 'Pengumpulan Berkas' },
  { value: 'VERIFIKASI_BERKAS', label: 'Verifikasi Berkas' },
  { value: 'NOTA_USUL', label: 'Nota Usul' },
  { value: 'DIKIRIM_BKN', label: 'Dikirim ke BKN' },
  { value: 'PROSES_BKN', label: 'Proses di BKN' },
  { value: 'SK_TERBIT', label: 'SK Terbit' },
  { value: 'DIKEMBALIKAN', label: 'Dikembalikan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
];

// ─── Create Modal ────────────────────────────────────────────────────────────

function AsnSearchResult({
  asn,
  onSelect,
}: {
  asn: AsnRecord;
  onSelect: (asn: AsnRecord) => void;
}) {
  return (
    <button
      onClick={() => onSelect(asn)}
      className="flex w-full items-center gap-3 rounded border border-[#d8e5d3] p-3 text-left hover:bg-[#f4f8ef] transition-colors"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0e5] text-[#3a6b52]">
        <User className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#102f2b]">{asn.nama}</p>
        <p className="text-xs text-[#687967]">{asn.nip} · {asn.jabatanNama ?? '—'} · {asn.golonganNama ?? '—'}</p>
      </div>
    </button>
  );
}

function CreateProsesModal({
  open,
  defaultAsnId,
  defaultJenis,
  onClose,
  onSuccess,
}: {
  open: boolean;
  defaultAsnId?: string;
  defaultJenis?: JenisPemberhentian;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [step, setStep] = useState<'asn' | 'jenis'>('asn');
  const [selectedAsn, setSelectedAsn] = useState<AsnRecord | null>(null);
  const [kategori, setKategori] = useState<KategoriPemberhentian>('DH_BUP' === defaultJenis ? 'DENGAN_HORMAT' : 'APS');
  const [jenis, setJenis] = useState<JenisPemberhentian>(defaultJenis ?? 'APS');
  const [tmt, setTmt] = useState('');
  const [catatan, setCatatan] = useState('');
  const [asnSearch, setAsnSearch] = useState('');
  const [asnResults, setAsnResults] = useState<AsnRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('asn');
      setSelectedAsn(null);
      setAsnSearch('');
      setAsnResults([]);
      setJenis(defaultJenis ?? 'APS');
      setKategori('APS');
      setTmt('');
      setCatatan('');
    }
  }, [open, defaultJenis]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (asnSearch.length < 2) { setAsnResults([]); return; }
      setSearching(true);
      try {
        const res = await sidataApi.getAsnList({ q: asnSearch, limit: 8 });
        setAsnResults(res?.items ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [asnSearch]);

  useEffect(() => {
    const jenisList = JENIS_BY_KATEGORI[kategori];
    if (!jenisList.includes(jenis)) setJenis(jenisList[0]);
  }, [kategori, jenis]);

  async function handleSubmit() {
    if (!selectedAsn) return;
    setSubmitting(true);
    try {
      const res = await createProses({ asnId: selectedAsn.id, jenisPemberhentian: jenis, tmtPemberhentian: tmt || undefined, catatan: catatan || undefined });
      toast.success('Proses pemberhentian berhasil dibuat');
      onSuccess(res.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal membuat proses');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#d8e5d3] px-5 py-4">
          <h2 className="text-base font-semibold text-[#102f2b]">Buat Proses Pemberhentian</h2>
          <button onClick={onClose} className="text-[#687967] hover:text-[#102f2b]"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Step: Pilih ASN */}
          {!selectedAsn ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#102f2b]">Cari ASN</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687967]" />
                <input
                  type="text"
                  placeholder="Ketik NIP atau nama ASN..."
                  value={asnSearch}
                  onChange={(e) => setAsnSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                  autoFocus
                />
              </div>
              {searching && <p className="text-xs text-[#687967]">Mencari...</p>}
              {asnResults.length > 0 && (
                <div className="max-h-56 space-y-1.5 overflow-y-auto">
                  {asnResults.map((a) => (
                    <AsnSearchResult key={a.id} asn={a} onSelect={setSelectedAsn} />
                  ))}
                </div>
              )}
              {asnSearch.length >= 2 && !searching && asnResults.length === 0 && (
                <p className="text-xs text-[#687967]">Tidak ada ASN ditemukan</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[#c8d8c3] bg-[#f4f8ef] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#102f2b]">{selectedAsn.nama}</p>
                  <p className="text-xs text-[#687967]">{selectedAsn.nip} · {selectedAsn.jabatanNama ?? '—'}</p>
                </div>
                <button onClick={() => setSelectedAsn(null)} className="text-xs text-[#3a6b52] hover:underline">Ganti</button>
              </div>
            </div>
          )}

          {selectedAsn && (
            <>
              {/* Kategori */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#102f2b]">Kategori Pemberhentian</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(JENIS_BY_KATEGORI) as KategoriPemberhentian[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setKategori(k)}
                      className={`rounded border px-3 py-2 text-xs font-medium text-left transition-colors ${kategori === k ? 'border-[#3a6b52] bg-[#e8f0e5] text-[#3a6b52]' : 'border-[#d8e5d3] text-[#687967] hover:bg-[#f4f8ef]'}`}
                    >
                      {KATEGORI_LABEL[k]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jenis */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#102f2b]">Jenis Pemberhentian</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as JenisPemberhentian)}
                  className={inputClass}
                >
                  {JENIS_BY_KATEGORI[kategori].map((j) => (
                    <option key={j} value={j}>{JENIS_LABEL[j]}</option>
                  ))}
                </select>
              </div>

              {/* TMT */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#102f2b]">TMT Pemberhentian <span className="text-[#687967] font-normal">(opsional)</span></label>
                <input type="date" value={tmt} onChange={(e) => setTmt(e.target.value)} className={inputClass} />
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#102f2b]">Catatan <span className="text-[#687967] font-normal">(opsional)</span></label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#d8e5d3] px-5 py-3">
          <button onClick={onClose} className="rounded border border-[#c8d8c3] px-4 py-2 text-sm text-[#687967] hover:bg-[#f4f8ef]">Batal</button>
          {selectedAsn && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded bg-[#3a6b52] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5340] disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Buat Proses'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Proses Row ───────────────────────────────────────────────────────────────

function ProsesRow({ proses }: { proses: ProsesListItem }) {
  const navigate = useNavigate();
  const tmt = proses.tmtPemberhentian
    ? new Date(proses.tmtPemberhentian).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const createdAt = new Date(proses.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <tr
      className="cursor-pointer border-b border-[#e8f0e5] hover:bg-[#f9fbf8] transition-colors"
      onClick={() => navigate(`/pemberhentian/proses/${proses.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0e5] text-[#3a6b52]">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#102f2b]">{proses.asn.nama}</p>
            <p className="text-xs text-[#687967]">{proses.asn.nip}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-[#102f2b]">{proses.jenisLabel}</p>
        <p className="text-xs text-[#687967]">{KATEGORI_LABEL[proses.kategori]}</p>
      </td>
      <td className="px-4 py-3 text-xs text-[#3a3a3a]">{proses.asn.jabatanNama ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-[#3a3a3a]">{proses.asn.unitKerja?.nama ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-[#3a3a3a]">{tmt}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[proses.status]}`}>
          {proses.statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-[#687967]">{createdAt}</td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PemberhentianProsesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedProses | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const q = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') ?? '') as StatusPemberhentian | '';
  const jenis = (searchParams.get('jenis') ?? '') as JenisPemberhentian | '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listProses({
        q: q || undefined,
        status: status || undefined,
        jenis: jenis || undefined,
        page,
        limit: 20,
      });
      setResult(res);
    } catch {
      setError('Gagal memuat data proses pemberhentian');
      toast.error('Gagal memuat daftar proses');
    } finally {
      setLoading(false);
    }
  }, [q, status, jenis, page]);

  useEffect(() => { load(); }, [load]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proses Pemberhentian"
        description="Daftar seluruh proses pemberhentian/pensiun ASN"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/pemberhentian/monitoring')}
              className="rounded border border-[#c8d8c3] px-3 py-1.5 text-sm text-[#3a6b52] hover:bg-[#e8f0e5]"
            >
              Monitoring BUP
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded bg-[#3a6b52] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2d5340]"
            >
              <Plus className="h-4 w-4" />
              Buat Proses
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687967]" />
          <input
            type="text"
            placeholder="Cari NIP atau nama ASN..."
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className={`${inputClass} w-48`}
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={jenis}
          onChange={(e) => setParam('jenis', e.target.value)}
          className={`${inputClass} w-52`}
        >
          <option value="">Semua Jenis</option>
          {(Object.entries(JENIS_LABEL) as [JenisPemberhentian, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(q || status || jenis) && (
          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="flex items-center gap-1 text-sm text-[#687967] hover:text-[#102f2b]"
          >
            <X className="h-4 w-4" />Reset
          </button>
        )}
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-[#3a6b52] hover:underline disabled:opacity-50">
          <RefreshCcw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      <SectionCard
        title={result ? `${result.total} proses ditemukan` : 'Daftar Proses'}
      >
        {loading ? (
          <LoadingState message="Memuat proses pemberhentian..." />
        ) : !result || result.items.length === 0 ? (
          <EmptyState
            title="Belum Ada Proses Pemberhentian"
            description="Klik 'Buat Proses' untuk memulai proses pemberhentian baru"
            icon={FileText}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-[#d8e5d3] text-xs text-[#687967]">
                    <th className="px-4 py-2 text-left font-medium">ASN</th>
                    <th className="px-4 py-2 text-left font-medium">Jenis Pemberhentian</th>
                    <th className="px-4 py-2 text-left font-medium">Jabatan</th>
                    <th className="px-4 py-2 text-left font-medium">Unit Kerja</th>
                    <th className="px-4 py-2 text-left font-medium">TMT</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((p) => <ProsesRow key={p.id} proses={p} />)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#e8f0e5] pt-3 mt-3">
                <p className="text-xs text-[#687967]">Halaman {page} dari {totalPages}</p>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                    className="rounded border border-[#c8d8c3] px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-[#f4f8ef]"
                  >
                    &larr;
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                    className="rounded border border-[#c8d8c3] px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-[#f4f8ef]"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <CreateProsesModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(id) => { setShowCreate(false); navigate(`/pemberhentian/proses/${id}`); }}
      />
    </div>
  );
}
