import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarDays, Check, ChevronDown, FileUp, Loader2, Pencil, RefreshCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ActionButton,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  inputClass,
} from '@/components/workspace/ui';
import {
  formatRupiah,
  getMatrix,
  getSummary,
  listPeriodes,
  GOLONGAN_LIST,
  importGajiPokok,
  lookupGajiPokok,
  parseCsvGajiPokok,
  updateGajiPokok,
  type GajiPokokMatrixItem,
  type GajiPokokSummary,
} from '@/lib/api/ref-gaji-pokok';

// ─── Import CSV Modal ─────────────────────────────────────────────────────────

function ImportCsvModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<Array<{ golonganKode: string; masaKerja: number; gajiPokok: number }>>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [berlakuSejak, setBerlakuSejak] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecords([]);
      setFileName('');
      setParseError('');
      setBerlakuSejak('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setRecords([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsvGajiPokok(text);
      if (parsed.length === 0) {
        setParseError('Tidak ada data valid. Pastikan format CSV: golonganKode,masaKerja,gajiPokok');
      } else {
        setRecords(parsed);
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (records.length === 0 || !berlakuSejak) return;
    setImporting(true);
    importGajiPokok(records, berlakuSejak)
      .then(r => {
        toast.success(`${r.count} record gaji pokok berhasil di-import`);
        onSuccess();
        onClose();
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Gagal import'))
      .finally(() => setImporting(false));
  }

  if (!open) return null;

  const preview = records.slice(0, 5);
  const golonganCount = new Set(records.map(r => r.golonganKode)).size;
  const canImport = records.length > 0 && berlakuSejak !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#cfe1da] bg-white shadow-xl">
        <div className="border-b border-[#cfe1da] px-6 py-4">
          <h2 className="text-base font-semibold text-[#18343a]">Import Tabel Gaji Pokok</h2>
          <p className="mt-1 text-sm text-[#6d7e68]">
            Upload file CSV dengan format: <code className="rounded bg-[#f0f4ef] px-1 text-xs">golonganKode,masaKerja,gajiPokok</code>
          </p>
        </div>

        <div className="space-y-4 p-6">
          {/* Berlaku Sejak (required) */}
          <div>
            <label className="grid gap-1 text-xs">
              <span className="font-semibold text-[#18343a]">Berlaku Sejak <span className="text-rose-500">*</span></span>
              <span className="text-[#73816e]">Tanggal mulai berlakunya peraturan gaji ini (contoh: 2024-01-01 untuk PP No.5/2024)</span>
              <input
                type="date"
                className={inputClass + ' h-9 text-sm'}
                value={berlakuSejak}
                onChange={e => setBerlakuSejak(e.target.value)}
              />
            </label>
          </div>

          {/* Format hint */}
          <div className="rounded-lg border border-[#cfe1da] bg-[#f5faf7] px-4 py-3 text-xs text-[#4a6356]">
            <p className="font-semibold mb-1">Format CSV (header opsional):</p>
            <pre className="font-mono leading-relaxed">
{`golonganKode,masaKerja,gajiPokok
I/a,0,1685700
III/a,10,3252900`}
            </pre>
          </div>

          {/* File picker */}
          <div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-[#9dc4b0] bg-[#f5faf7] px-4 py-4 hover:border-[#2f7a5e] hover:bg-[#eaf5ef] transition-colors">
              <FileUp className="h-5 w-5 text-[#2f7a5e] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#18343a]">
                  {fileName ? fileName : 'Pilih file CSV…'}
                </p>
                <p className="text-xs text-[#73816e]">Klik untuk upload, format .csv</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>

          {parseError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {parseError}
            </p>
          )}

          {/* Preview */}
          {records.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#18343a]">
                  Preview — {records.length} baris valid, {golonganCount} golongan
                </span>
                <button
                  onClick={() => { setRecords([]); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-xs text-[#9aaa95] hover:text-rose-500"
                >
                  Ganti file
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e6ede4] bg-[#f5faf7]">
                    <th className="px-3 py-2 text-left text-xs text-[#6d7e68]">Golongan</th>
                    <th className="px-3 py-2 text-left text-xs text-[#6d7e68]">Masa Kerja</th>
                    <th className="px-3 py-2 text-right text-xs text-[#6d7e68]">Gaji Pokok</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-b border-[#f0f4ef]">
                      <td className="px-3 py-1.5 font-medium text-[#18343a]">{r.golonganKode}</td>
                      <td className="px-3 py-1.5 text-[#4a6356]">{r.masaKerja} th</td>
                      <td className="px-3 py-1.5 text-right text-[#18343a]">{formatRupiah(r.gajiPokok)}</td>
                    </tr>
                  ))}
                  {records.length > 5 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-1.5 text-center text-xs text-[#73816e]">
                        … dan {records.length - 5} baris lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#cfe1da] px-6 py-4">
          <ActionButton variant="secondary" onClick={onClose} disabled={importing}>
            Batal
          </ActionButton>
          <ActionButton
            icon={importing ? Loader2 : FileUp}
            onClick={handleImport}
            disabled={importing || !canImport}
          >
            {importing ? 'Mengimport…' : `Import ${records.length > 0 ? `(${records.length} baris)` : ''}`}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ─── Period Selector ──────────────────────────────────────────────────────────

function PeriodSelector({
  periodes,
  selected,
  onChange,
}: {
  periodes: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  if (periodes.length === 0) return null;

  function formatPeriode(d: string) {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#cfe1da] bg-white px-3 py-1.5">
      <CalendarDays className="h-4 w-4 text-[#2f7a5e] shrink-0" />
      <label className="flex items-center gap-1 text-xs text-[#6d7e68]">
        <span className="font-medium">Periode:</span>
        <div className="relative flex items-center">
          <select
            className="appearance-none bg-transparent pr-5 text-sm font-semibold text-[#18343a] focus:outline-none"
            value={selected}
            onChange={e => onChange(e.target.value)}
          >
            {periodes.map(p => (
              <option key={p} value={p}>{formatPeriode(p)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-[#73816e]" />
        </div>
      </label>
    </div>
  );
}

// ─── Lookup Widget ────────────────────────────────────────────────────────────

function LookupWidget({ berlakuSejak }: { berlakuSejak: string }) {
  const [golonganKode, setGolonganKode] = useState('III/a');
  const [masaKerja, setMasaKerja] = useState(10);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleLookup() {
    setLoading(true);
    setError('');
    setResult(null);
    lookupGajiPokok(golonganKode, masaKerja, berlakuSejak || undefined)
      .then(r => setResult(r.gajiPokok))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Tidak ditemukan'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="rounded-xl border border-[#cfe1da] bg-[#f5faf7] p-4">
      <p className="mb-3 text-sm font-semibold text-[#18343a]">Cari Gaji Pokok</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs">
          <span className="text-[#6d7e68]">Golongan</span>
          <select
            className={inputClass + ' h-9 text-sm'}
            value={golonganKode}
            onChange={e => setGolonganKode(e.target.value)}
          >
            {GOLONGAN_LIST.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-[#6d7e68]">Masa Kerja (tahun)</span>
          <input
            type="number"
            min={0}
            max={40}
            className={inputClass + ' h-9 w-24 text-sm'}
            value={masaKerja}
            onChange={e => setMasaKerja(Number(e.target.value))}
          />
        </label>
        <ActionButton icon={loading ? Loader2 : Search} onClick={handleLookup} disabled={loading}>
          Cari
        </ActionButton>
        {result !== null && (
          <div className="rounded-lg border border-[#b8dac8] bg-white px-4 py-2">
            <span className="text-xs text-[#6d7e68]">Gaji Pokok</span>
            <div className="text-lg font-bold text-[#18343a]">{formatRupiah(result)}</div>
          </div>
        )}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </div>
  );
}

// ─── Inline Edit Cell ─────────────────────────────────────────────────────────

function EditableCell({
  id,
  gajiPokok,
  label,
  onSaved,
  canEdit,
}: {
  id: number;
  gajiPokok: string;
  label: string;
  onSaved: (val: string) => void;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(parseFloat(gajiPokok).toFixed(0));
    setEditing(true);
  }

  function cancel() { setEditing(false); }

  function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    updateGajiPokok(id, num)
      .then(r => {
        onSaved(r.gajiPokok);
        setEditing(false);
        toast.success(`${label} diperbarui`);
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Gagal menyimpan'))
      .finally(() => setSaving(false));
  }

  const numVal = parseFloat(gajiPokok);
  const display = isNaN(numVal) || numVal === 0 ? '—' : formatRupiah(gajiPokok);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          className="w-28 rounded border border-[#9dc4b0] px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2f7a5e]"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        />
        <button onClick={save} disabled={saving} className="text-[#2f7a5e] hover:text-[#1b5040]">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        </button>
        <button onClick={cancel} className="text-[#9aaa95] hover:text-rose-500">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <span className={numVal === 0 ? 'text-[#c4d0c0]' : 'text-[#18343a]'}>{display}</span>
      {canEdit && numVal > 0 && (
        <button
          onClick={startEdit}
          className="hidden text-[#9aaa95] hover:text-[#2f7a5e] group-hover:block"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Golongan Detail Table ────────────────────────────────────────────────────

function GolonganDetailTable({
  item,
  canEdit,
  onUpdate,
}: {
  item: GajiPokokMatrixItem;
  canEdit: boolean;
  onUpdate: (id: number, val: string) => void;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e6ede4] bg-[#f5faf7]">
            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6d7e68]">Masa Kerja</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-[#6d7e68]">Gaji Pokok</th>
          </tr>
        </thead>
        <tbody>
          {item.rows.map(r => (
            <tr key={r.id} className="border-b border-[#f0f4ef] hover:bg-[#fafcf9]">
              <td className="px-3 py-1.5 text-[#4a6356]">{r.masaKerja} tahun</td>
              <td className="px-3 py-1.5 text-right">
                <EditableCell
                  id={r.id}
                  gajiPokok={r.gajiPokok}
                  label={`${item.golonganKode} MK ${r.masaKerja}`}
                  onSaved={val => onUpdate(r.id, val)}
                  canEdit={canEdit}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RefGajiPokokPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [matrix, setMatrix] = useState<GajiPokokMatrixItem[]>([]);
  const [summary, setSummary] = useState<GajiPokokSummary | null>(null);
  const [periodes, setPeriodes] = useState<string[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGolongan, setSelectedGolongan] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showImport, setShowImport] = useState(false);

  const load = useCallback((periode?: string) => {
    let mounted = true;
    setLoading(true);
    setError('');
    Promise.all([getMatrix(periode), getSummary(), listPeriodes()])
      .then(([mat, sum, ps]) => {
        if (!mounted) return;
        setMatrix(mat);
        setSummary(sum);
        setPeriodes(ps);
        if (!periode && ps.length > 0) setSelectedPeriode(ps[0]);
        if (mat.length > 0) setSelectedGolongan(prev => prev && mat.find(m => m.golonganKode === prev) ? prev : mat[0].golonganKode);
      })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat data'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => { load(); }, [load]);

  function handlePeriodeChange(p: string) {
    setSelectedPeriode(p);
    load(p);
  }

  const filteredMatrix = filter
    ? matrix.filter(m => m.golonganKode.toLowerCase().includes(filter.toLowerCase()))
    : matrix;

  const selectedItem = matrix.find(m => m.golonganKode === selectedGolongan);

  function updateCell(id: number, val: string) {
    setMatrix(prev => prev.map(m => ({
      ...m,
      rows: m.rows.map(r => r.id === id ? { ...r, gajiPokok: val } : r),
    })));
  }

  const allRows = matrix.flatMap(m => m.rows);
  const minGaji = allRows.reduce((min, r) => { const v = parseFloat(r.gajiPokok); return v > 0 && v < min ? v : min; }, Infinity);
  const maxGaji = allRows.reduce((max, r) => { const v = parseFloat(r.gajiPokok); return v > max ? v : max; }, 0);
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodSelector periodes={periodes} selected={selectedPeriode} onChange={handlePeriodeChange} />
      <ActionButton icon={loading ? Loader2 : RefreshCcw} variant="secondary" disabled={loading} onClick={() => load(selectedPeriode || undefined)}>
        Refresh
      </ActionButton>
      <ActionButton icon={FileUp} onClick={() => setShowImport(true)}>
        Import CSV
      </ActionButton>
    </div>
  );

  return (
    <div className="space-y-5">
      {embedded ? (
        <SectionCard
          title="Tabel Gaji Pokok PNS"
          description="Referensi gaji pokok berdasarkan golongan dan masa kerja."
          actions={headerActions}
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge value="REFERENSI" tone="dark" />
            <StatusBadge value="GAJI POKOK" tone="info" />
          </div>
        </SectionCard>
      ) : (
        <PageHeader
          title="Tabel Gaji Pokok PNS"
          description="Referensi gaji pokok berdasarkan golongan dan masa kerja (PP No. 5 Tahun 2024)."
          meta={<StatusBadge value="REFERENSI" tone="dark" />}
          actions={headerActions}
        />
      )}

      {error ? <ErrorAlert message={error} /> : null}

      {/* Summary cards */}
      {summary && !loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#cfe1da] bg-white p-4">
            <div className="text-2xl font-bold text-[#18343a]">{summary.totalGolongan}</div>
            <div className="text-xs text-[#73816e]">Golongan</div>
          </div>
          <div className="rounded-xl border border-[#cfe1da] bg-white p-4">
            <div className="text-2xl font-bold text-[#18343a]">{summary.totalRecords.toLocaleString('id-ID')}</div>
            <div className="text-xs text-[#73816e]">Total Data</div>
          </div>
          <div className="rounded-xl border border-[#cfe1da] bg-white p-4">
            <div className="text-xl font-bold text-[#12815f]">{isFinite(minGaji) ? formatRupiah(minGaji) : '—'}</div>
            <div className="text-xs text-[#73816e]">Gaji Terendah</div>
          </div>
          <div className="rounded-xl border border-[#cfe1da] bg-white p-4">
            <div className="text-xl font-bold text-[#18343a]">{formatRupiah(maxGaji)}</div>
            <div className="text-xs text-[#73816e]">Gaji Tertinggi</div>
          </div>
        </div>
      )}

      {!loading && matrix.length > 0 && <LookupWidget berlakuSejak={selectedPeriode} />}

      {loading && matrix.length === 0 ? (
        <LoadingState label="Memuat tabel gaji pokok" />
      ) : matrix.length === 0 ? (
        <EmptyState
          title="Data belum tersedia"
          description="Klik tombol Import CSV di kanan atas untuk upload tabel gaji pokok."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          {/* Golongan selector */}
          <SectionCard title="Pilih Golongan">
            <div className="mb-2">
              <input
                placeholder="Filter golongan…"
                className={inputClass + ' text-sm'}
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <div className="space-y-0.5">
              {filteredMatrix.map(item => {
                const maxRow = item.rows.reduce((m, r) => { const v = parseFloat(r.gajiPokok); return v > m ? v : m; }, 0);
                const minRow = item.rows.reduce((m, r) => { const v = parseFloat(r.gajiPokok); return v > 0 && v < m ? v : m; }, Infinity);
                const isSelected = item.golonganKode === selectedGolongan;
                return (
                  <button
                    key={item.golonganKode}
                    onClick={() => setSelectedGolongan(item.golonganKode)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      isSelected ? 'bg-[#e4f8ef] text-[#18343a]' : 'hover:bg-[#f5faf7] text-[#4a6356]'
                    }`}
                  >
                    <div className="font-semibold text-sm">{item.golonganKode}</div>
                    <div className="text-xs text-[#73816e]">
                      {isFinite(minRow) ? formatRupiah(minRow) : '—'} – {formatRupiah(maxRow)}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Detail table */}
          <SectionCard
            title={selectedItem
              ? `Golongan ${selectedItem.golonganKode} — ${selectedItem.rows.length} entri masa kerja`
              : 'Detail'}
          >
            {selectedItem ? (
              <GolonganDetailTable
                item={selectedItem}
                canEdit={true}
                onUpdate={updateCell}
              />
            ) : (
              <p className="py-8 text-center text-sm text-[#73816e]">Pilih golongan di kiri untuk melihat detail</p>
            )}
          </SectionCard>
        </div>
      )}

      <ImportCsvModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => load(selectedPeriode || undefined)}
      />
    </div>
  );
}
