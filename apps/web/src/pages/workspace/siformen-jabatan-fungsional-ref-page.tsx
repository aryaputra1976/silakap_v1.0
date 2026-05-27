import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Link2,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  siformenApi,
  type CreateJabatanFungsionalRefPayload,
  type SiformenJabatanFungsionalRef,
} from '@/lib/api/siformen';
import {
  useJabatanFungsionalRefList,
  useJabatanFungsionalRefFilterOptions,
  useDeleteJabatanFungsionalRef,
} from '@/lib/siformen/hooks';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'KEAHLIAN', label: 'Keahlian' },
  { value: 'KETERAMPILAN', label: 'Keterampilan' },
];

const CSV_COLUMN_MAP: Record<string, keyof CreateJabatanFungsionalRefPayload> = {
  'Nama Jabatan Fungsional': 'namaJabatan',
  'Jenjang': 'jenjang',
  'Dasar Hukum': 'dasarHukum',
  'Tugas Jabatan': 'tugasJabatan',
  'Pendidikan_Pengangkatan_Pertama': 'pendidikanPengangkatan',
  'Pendidikan_Perpindahan': 'pendidikanPerpindahan',
  'Kategori': 'kategori',
  'Awal': 'jenjangAwal',
  'Puncak': 'jenjangPuncak',
  'Golongan Ruang Awal': 'golonganRuangAwal',
  'Rumpun Jabatan': 'rumpunJabatan',
  'Ruang Lingkup': 'ruangLingkup',
  'Kedudukan': 'kedudukan',
  'Pengisian ASN': 'pengisianAsn',
  'Instansi Pembina': 'instansiPembina',
  'Peraturan Presiden Tentang Tunjangan': 'perpresTunjangan',
  'Besaran Tunjangan': 'besaranTunjangan',
};

function parseTabSeparated(text: string): CreateJabatanFungsionalRefPayload[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const results: CreateJabatanFungsionalRefPayload[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const key = CSV_COLUMN_MAP[h];
      if (key) row[key] = cols[idx] ?? '';
    });
    if (!row.namaJabatan || !row.jenjang) continue;
    const item: CreateJabatanFungsionalRefPayload = {
      namaJabatan: row.namaJabatan,
      jenjang: row.jenjang,
      kategori: row.kategori?.toUpperCase() === 'KETERAMPILAN' ? 'KETERAMPILAN' : 'KEAHLIAN',
    };
    const optionals: (keyof CreateJabatanFungsionalRefPayload)[] = [
      'jenjangAwal', 'jenjangPuncak', 'golonganRuangAwal', 'rumpunJabatan', 'ruangLingkup',
      'kedudukan', 'pengisianAsn', 'instansiPembina', 'dasarHukum', 'tugasJabatan',
      'pendidikanPengangkatan', 'pendidikanPerpindahan', 'perpresTunjangan', 'besaranTunjangan',
    ];
    optionals.forEach((k) => { if (row[k]) (item as Record<string, string>)[k] = row[k]; });
    results.push(item);
  }
  return results;
}

function DetailPanel({ item, onClose }: { item: SiformenJabatanFungsionalRef; onClose: () => void }) {
  const fields: { label: string; value: string | null }[] = [
    { label: 'Nama Jabatan', value: item.namaJabatan },
    { label: 'Jenjang', value: item.jenjang },
    { label: 'Kategori', value: item.kategori },
    { label: 'Jenjang Awal', value: item.jenjangAwal },
    { label: 'Jenjang Puncak', value: item.jenjangPuncak },
    { label: 'Golongan Ruang Awal', value: item.golonganRuangAwal },
    { label: 'Rumpun Jabatan', value: item.rumpunJabatan },
    { label: 'Ruang Lingkup', value: item.ruangLingkup },
    { label: 'Kedudukan', value: item.kedudukan },
    { label: 'Pengisian ASN', value: item.pengisianAsn },
    { label: 'Instansi Pembina', value: item.instansiPembina },
    { label: 'Dasar Hukum', value: item.dasarHukum },
    { label: 'Tugas Jabatan', value: item.tugasJabatan },
    { label: 'Pendidikan Pengangkatan Pertama', value: item.pendidikanPengangkatan },
    { label: 'Pendidikan Perpindahan', value: item.pendidikanPerpindahan },
    { label: 'Perpres Tunjangan', value: item.perpresTunjangan },
    { label: 'Besaran Tunjangan', value: item.besaranTunjangan },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.namaJabatan}</h3>
            <p className="text-sm text-gray-500">{item.jenjang}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {fields.map(({ label, value }) => value ? (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
              <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{value}</p>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<CreateJabatanFungsionalRefPayload[]>([]);
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [importError, setImportError] = useState('');
  const [showAll, setShowAll] = useState(false);

  function handleParse() {
    setParseError('');
    setResult(null);
    if (!csvText.trim()) { setParseError('Tempel data terlebih dahulu'); return; }
    const parsed = parseTabSeparated(csvText);
    if (parsed.length === 0) {
      setParseError('Tidak ada baris valid. Pastikan format sesuai: header tab-separated di baris pertama.');
      return;
    }
    setPreview(parsed);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setLoading(true);
    setImportError('');
    try {
      const res = await siformenApi.bulkImportJabatanFungsionalRef(preview);
      setResult(res);
      onDone();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import gagal');
    } finally {
      setLoading(false);
    }
  }

  const displayRows = showAll ? preview : preview.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Referensi Jabatan Fungsional (CSV/TSV)
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <strong>Format:</strong> Salin langsung dari Excel (tab-separated). Baris pertama harus header.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tempel data dari Excel</label>
            <textarea rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="Salin dan tempel di sini..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          {parseError && <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>}
          <div className="flex gap-2">
            <button onClick={handleParse} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              <Eye className="h-4 w-4" /> Pratinjau ({preview.length} baris)
            </button>
            {preview.length > 0 && (
              <button onClick={() => void handleImport()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {preview.length} Jabatan
              </button>
            )}
          </div>
          {result && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              Import selesai: <strong>{result.created}</strong> baru ditambahkan, <strong>{result.skipped}</strong> diperbarui.
            </div>
          )}
          {importError && <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pratinjau ({preview.length} baris)</p>
              <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {['Nama Jabatan', 'Jenjang', 'Kategori', 'Rumpun', 'Instansi Pembina', 'Pengisian ASN'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, i) => (
                      <tr key={i} className="border-t dark:border-gray-700">
                        <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{row.namaJabatan}</td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.jenjang}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${row.kategori === 'KETERAMPILAN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                            {row.kategori}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{row.rumpunJabatan ?? '-'}</td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{row.instansiPembina ?? '-'}</td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.pengisianAsn ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 10 && (
                <button onClick={() => setShowAll((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                  {showAll ? <><ChevronUp className="h-3 w-3" /> Tampilkan lebih sedikit</> : <><ChevronDown className="h-3 w-3" /> Tampilkan semua {preview.length} baris</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddFromRefModal({ item, onClose, onDone }: { item: SiformenJabatanFungsionalRef; onClose: () => void; onDone: () => void }) {
  const [unitKerja, setUnitKerja] = useState('');
  const [kodeJabatan, setKodeJabatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!unitKerja.trim()) { setError('Unit kerja / bidang wajib diisi'); return; }
    setLoading(true);
    setError('');
    try {
      await siformenApi.addJabatanFromRef({ refId: item.id, unitKerja: unitKerja.trim(), kodeJabatan: kodeJabatan.trim() || undefined });
      setSuccess(true);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambahkan jabatan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <Link2 className="h-4 w-4 text-blue-600" /> Tambah ke Peta Jabatan
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{item.namaJabatan}</p>
            <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
              {item.jenjang} · {item.kategori}
              {item.golonganRuangAwal ? ` · Gol. ${item.golonganRuangAwal}` : ''}
              {item.instansiPembina ? ` · ${item.instansiPembina}` : ''}
            </p>
          </div>
          {success ? (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              Jabatan <strong>{item.namaJabatan}</strong> berhasil ditambahkan ke Peta Jabatan.
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Kerja / Bidang <span className="text-red-500">*</span></label>
                <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" value={unitKerja} onChange={(e) => setUnitKerja(e.target.value)} placeholder="cth. Bidang Pengembangan Kompetensi" autoFocus />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Unit kerja atau bidang tempat jabatan fungsional ini ditempatkan</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Jabatan</label>
                <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" value={kodeJabatan} onChange={(e) => setKodeJabatan(e.target.value)} placeholder="Kosongkan untuk auto-generate (FUN-XXXX)" />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => void handleSubmit()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tambah ke Peta Jabatan
                </button>
                <button onClick={onClose} className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Batal</button>
              </div>
            </>
          )}
          {success && (
            <div className="flex gap-2">
              <button onClick={() => { setSuccess(false); setUnitKerja(''); setKodeJabatan(''); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                <Plus className="h-4 w-4" /> Tambah Unit Lain
              </button>
              <button onClick={onClose} className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Tutup</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiformenJabatanFungsionalRefPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const canWrite = role ? WRITE_ROLES.includes(role) : false;

  const [q, setQ] = useState('');
  const [kategori, setKategori] = useState('');
  const [rumpunJabatan, setRumpunJabatan] = useState('');
  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<SiformenJabatanFungsionalRef | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [addFromRefItem, setAddFromRefItem] = useState<SiformenJabatanFungsionalRef | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Queries & mutations ────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useJabatanFungsionalRefList({
    q: q || undefined,
    kategori: kategori || undefined,
    rumpunJabatan: rumpunJabatan || undefined,
    page,
    limit: 25,
  });
  const filterOptsQuery = useJabatanFungsionalRefFilterOptions();
  const deleteMut = useDeleteJabatanFungsionalRef();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const rumpunOptions = filterOptsQuery.data?.rumpunJabatan ?? [];
  const errMsg = (error as Error)?.message ?? '';

  function handleDelete(item: SiformenJabatanFungsionalRef) {
    if (!confirm(`Hapus "${item.namaJabatan} — ${item.jenjang}"?`)) return;
    setDeletingId(item.id);
    deleteMut.mutate(item.id, { onSettled: () => setDeletingId(null) });
  }

  const columns = [
    {
      key: 'namaJabatan',
      label: 'Nama Jabatan Fungsional',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{item.namaJabatan}</span>
      ),
    },
    {
      key: 'jenjang',
      label: 'Jenjang',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.jenjang}</span>
      ),
    },
    {
      key: 'kategori',
      label: 'Kategori',
      render: (item: SiformenJabatanFungsionalRef) => (
        <StatusBadge value={item.kategori} tone={item.kategori === 'KETERAMPILAN' ? 'warning' : 'info'} />
      ),
    },
    {
      key: 'golonganRuangAwal',
      label: 'Gol. Awal',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{item.golonganRuangAwal ?? '-'}</span>
      ),
    },
    {
      key: 'rumpunJabatan',
      label: 'Rumpun Jabatan',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{item.rumpunJabatan ?? '-'}</span>
      ),
    },
    {
      key: 'instansiPembina',
      label: 'Instansi Pembina',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{item.instansiPembina ?? '-'}</span>
      ),
    },
    {
      key: 'pengisianAsn',
      label: 'Pengisian ASN',
      render: (item: SiformenJabatanFungsionalRef) => (
        <span className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.pengisianAsn ?? '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: SiformenJabatanFungsionalRef) => (
        <div className="flex items-center gap-1">
          <ActionButton icon={Eye} label="Detail" onClick={() => setSelectedItem(item)} variant="ghost" />
          {canWrite && (
            <ActionButton icon={Link2} label="Ke Peta Jabatan" onClick={() => setAddFromRefItem(item)} variant="ghost" className="text-blue-600 hover:text-blue-800" />
          )}
          {canAdmin && (
            <ActionButton
              icon={deletingId === item.id ? Loader2 : Trash2}
              label="Hapus"
              onClick={() => handleDelete(item)}
              variant="ghost"
              className="text-red-500 hover:text-red-700"
              disabled={deletingId === item.id}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Referensi Jabatan Fungsional Nasional"
        description="Data acuan jabatan fungsional berdasarkan PermenPAN-RB — sumber: BKN/KemenPAN"
        actions={
          canAdmin ? (
            <div className="flex gap-2">
              <ActionButton icon={Upload} label="Import CSV" onClick={() => setShowImport(true)} variant="secondary" />
            </div>
          ) : undefined
        }
      />

      <SectionCard>
        <FilterBar>
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Cari nama jabatan, rumpun..."
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            {KATEGORI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {rumpunOptions.length > 0 && (
            <select value={rumpunJabatan} onChange={(e) => { setRumpunJabatan(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <option value="">Semua Rumpun</option>
              {rumpunOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <ActionButton icon={isLoading ? Loader2 : RefreshCcw} label="Refresh" onClick={() => refetch()} variant="ghost" />
        </FilterBar>

        {errMsg ? <ErrorAlert message={errMsg} /> : null}
        {deleteMut.error ? <ErrorAlert message={(deleteMut.error as Error).message} /> : null}

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">{total} jabatan fungsional ditemukan</div>
            <DataTable
              columns={columns}
              data={items}
              emptyMessage={q || kategori || rumpunJabatan ? 'Tidak ada jabatan yang cocok dengan filter' : 'Belum ada data referensi. Gunakan Import CSV untuk memuat data BKN.'}
            />
            {total > 25 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Halaman {page} dari {Math.ceil(total / 25)}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40 dark:border-gray-600">Sebelumnya</button>
                  <button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40 dark:border-gray-600">Berikutnya</button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => refetch()} />}
      {addFromRefItem && <AddFromRefModal item={addFromRefItem} onClose={() => setAddFromRefItem(null)} onDone={() => {}} />}
    </div>
  );
}
