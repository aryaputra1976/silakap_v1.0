import { useMemo, useState } from 'react';
import {
  Users, TrendingDown, CalendarX2, TrendingUp, RefreshCcw,
  Loader2, Building2, ChevronDown, ChevronUp, Search, DatabaseZap,
} from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  PageHeader,
  StatCard,
} from '@/components/workspace/ui';
import {
  useProyeksiSummary,
  useProyeksi,
  useGenerateBupFromAsn,
} from '@/lib/siformen/hooks';
import type { ProyeksiJabatanItem, ProyeksiUnitKerja } from '@/lib/api/siformen';

const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];

const TABS = [
  { key: 'semua', label: 'Semua Unit' },
  { key: 'setda', label: 'Setda' },
  { key: 'dinas', label: 'Dinas' },
  { key: 'badan', label: 'Badan' },
  { key: 'kesehatan', label: 'Kesehatan' },
  { key: 'pendidikan', label: 'Pendidikan' },
];

function matchTab(unitKerja: string, tipe: string | null, tab: string): boolean {
  if (tab === 'semua') return true;
  const n = unitKerja.toLowerCase();
  const t = (tipe ?? '').toLowerCase();
  if (tab === 'setda') return t === 'setda' || n.includes('sekretariat') || n.includes('setda');
  if (tab === 'dinas') return t === 'dinas' || (n.includes('dinas') && !n.includes('pendidikan') && !n.includes('kesehatan'));
  if (tab === 'badan') return t === 'badan' || n.includes('badan') || n.includes('inspektorat') || n.includes('kecamatan');
  if (tab === 'kesehatan') return t === 'kesehatan' || n.includes('kesehatan') || n.includes('rsud') || n.includes('puskesmas');
  if (tab === 'pendidikan') return t === 'pendidikan' || n.includes('pendidikan') || n.includes('guru');
  return false;
}

function gapColor(gap: number): string {
  if (gap > 0) return 'text-emerald-600 font-semibold';
  if (gap < 0) return 'text-red-500 font-semibold';
  return 'text-muted-foreground';
}

function JabatanRows({ rows, label }: { rows: ProyeksiJabatanItem[]; label: string }) {
  if (rows.length === 0) return null;
  return (
    <>
      <tr className="bg-muted/30">
        <td colSpan={6 + BUP_YEARS.length * 2} className="py-1 pl-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </td>
      </tr>
      {rows
        .filter((j) => j.statusPosisi !== 'dihapus')
        .map((j, ji) => {
          const isKandidat = j.statusPosisi === 'kandidat_hapus';
          return (
            <tr
              key={j.id}
              title={isKandidat ? 'Posisi ini tidak akan diisi ulang saat kosong (kandidat hapus)' : undefined}
              className={`border-b border-border/40 ${ji % 2 === 0 ? 'bg-background' : 'bg-muted/10'} ${isKandidat ? 'opacity-60' : ''}`}
            >
              <td className="py-1.5 px-2 text-xs text-muted-foreground text-center">{ji + 1}</td>
              <td className="py-1.5 px-3 text-sm pl-12">
                <span className={isKandidat ? 'line-through italic text-muted-foreground' : 'text-foreground'}>
                  {j.namaJabatan}
                </span>
                {j.flagDelayering && (
                  <span className="ml-1.5 rounded bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 text-[9px] text-amber-700 dark:text-amber-400">delayering</span>
                )}
              </td>
              <td className="py-1.5 px-2 text-xs text-muted-foreground text-center">{j.levelKesetaraan ? `L${j.levelKesetaraan}` : '—'}</td>
              <td className="py-1.5 px-3 text-xs text-center text-foreground">{j.bezetting}</td>
              <td className="py-1.5 px-3 text-xs text-center text-foreground">{j.abk || '—'}</td>
              <td className={`py-1.5 px-3 text-xs text-center ${gapColor(j.gap)}`}>
                {j.gap !== 0 ? (j.gap > 0 ? `+${j.gap}` : j.gap) : '—'}
              </td>
              {BUP_YEARS.map((thn) => {
                const bup = j.bupPerTahun.find((b) => b.tahun === thn)?.jumlahPensiun ?? 0;
                return (
                  <td key={thn} className={`py-1.5 px-2 text-xs text-center ${bup > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                    {bup > 0 ? bup : '—'}
                  </td>
                );
              })}
              {BUP_YEARS.map((thn) => {
                const bup = j.bupPerTahun.find((b) => b.tahun === thn)?.jumlahPensiun ?? 0;
                const perlu = isKandidat ? 0 : Math.max(0, j.gap) + bup;
                return (
                  <td key={thn} className={`py-1.5 px-2 text-xs text-center ${perlu > 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                    {perlu > 0 ? perlu : '—'}
                  </td>
                );
              })}
            </tr>
          );
        })}
    </>
  );
}

function UnitKerjaGroup({ unit, idx }: { unit: ProyeksiUnitKerja; idx: number }) {
  const [expanded, setExpanded] = useState(true);
  const totalPerlu5Thn = unit.totalBup5Thn + Math.max(0, unit.totalGap);

  return (
    <tbody>
      <tr
        className="cursor-pointer select-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2 px-2 text-center">
          {expanded ? <ChevronUp className="size-3.5 mx-auto text-muted-foreground" /> : <ChevronDown className="size-3.5 mx-auto text-muted-foreground" />}
        </td>
        <td className="py-2 px-3 text-xs font-bold text-foreground" colSpan={1}>
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span>{String(idx + 1).padStart(2, '0')}. {unit.unitKerja.toUpperCase()}</span>
            {unit.flagDelayering && (
              <span className="rounded bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-400">Model B</span>
            )}
          </div>
        </td>
        <td className="py-2 px-2 text-xs text-center text-muted-foreground">—</td>
        <td className="py-2 px-3 text-xs text-center font-bold text-foreground">{unit.totalBezetting}</td>
        <td className="py-2 px-3 text-xs text-center font-bold text-foreground">{unit.totalAbk || '—'}</td>
        <td className={`py-2 px-3 text-xs text-center font-bold ${gapColor(unit.totalGap)}`}>
          {unit.totalGap !== 0 ? (unit.totalGap > 0 ? `+${unit.totalGap}` : unit.totalGap) : '—'}
        </td>
        {BUP_YEARS.map((thn) => {
          const bup = unit.bupPerTahun.find((b) => b.tahun === thn)?.jumlah ?? 0;
          return (
            <td key={thn} className={`py-2 px-2 text-xs text-center font-medium ${bup > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {bup > 0 ? bup : '—'}
            </td>
          );
        })}
        {BUP_YEARS.map((thn) => {
          const bup = unit.bupPerTahun.find((b) => b.tahun === thn)?.jumlah ?? 0;
          const perlu = Math.max(0, unit.totalGap) + bup;
          return (
            <td key={thn} className={`py-2 px-2 text-xs text-center font-medium ${perlu > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {perlu > 0 ? perlu : '—'}
            </td>
          );
        })}
      </tr>
      {expanded && (
        <>
          <JabatanRows rows={unit.subGrupA} label="A — Struktural / JPT" />
          <JabatanRows rows={unit.subGrupB} label="B — Jabatan Fungsional" />
          <JabatanRows rows={unit.subGrupC} label="C — Pelaksana / JFU" />
        </>
      )}
    </tbody>
  );
}

function BarChart({ data }: { data: { tahun: number; jumlah: number }[] }) {
  const max = Math.max(...data.map((d) => d.jumlah), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.tahun} className="flex items-center gap-3">
          <span className="w-10 text-right text-xs text-muted-foreground">{d.tahun}</span>
          <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
            <div className="h-full rounded bg-amber-400" style={{ width: `${Math.round((d.jumlah / max) * 100)}%` }} />
          </div>
          <span className="w-8 text-right text-xs font-medium text-foreground">{d.jumlah}</span>
        </div>
      ))}
    </div>
  );
}

export function SiformenDashboardPage() {
  const [tahunBezetting, setTahunBezetting] = useState(new Date().getFullYear());
  const [filterJenis, setFilterJenis] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('semua');

  const proyeksiQuery: Record<string, string | number | undefined> = {
    tahunBezetting,
    jenisJabatan: filterJenis || undefined,
    q: search || undefined,
  };

  const { data: summary, isLoading: loadingSummary, error: errSummary, refetch: refetchSummary } = useProyeksiSummary();
  const { data: proyeksi = [], isLoading: loadingProyeksi, error: errProyeksi, refetch: refetchProyeksi } = useProyeksi(proyeksiQuery);
  const generateBup = useGenerateBupFromAsn();

  const filteredProyeksi = useMemo(
    () => proyeksi.filter((u) => matchTab(u.unitKerja, u.tipe, activeTab)),
    [proyeksi, activeTab],
  );

  const totalJabatan = filteredProyeksi.reduce(
    (s, u) => s + u.subGrupA.length + u.subGrupB.length + u.subGrupC.length, 0,
  );

  const errMsg = (errSummary as Error)?.message ?? (errProyeksi as Error)?.message ?? '';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proyeksi Kebutuhan Pegawai 5 Tahun"
        description={`Periode 2024 – 2028 · Formula: Kebutuhan = ABK − Bezetting + BUP · Tahun Bezetting: ${tahunBezetting}`}
        actions={
          <div className="flex gap-2">
            <ActionButton
              icon={generateBup.isPending ? Loader2 : DatabaseZap}
              variant="secondary"
              disabled={generateBup.isPending}
              onClick={() => generateBup.mutate({}, { onSuccess: () => { refetchSummary(); refetchProyeksi(); } })}
            >
              Generate BUP dari ASN
            </ActionButton>
            <ActionButton
              icon={loadingSummary || loadingProyeksi ? Loader2 : RefreshCcw}
              variant="secondary"
              disabled={loadingSummary || loadingProyeksi}
              onClick={() => { refetchSummary(); refetchProyeksi(); }}
            />
          </div>
        }
      />

      {errMsg ? <ErrorAlert message={errMsg} /> : null}
      {generateBup.error ? <ErrorAlert message={(generateBup.error as Error).message} /> : null}
      {generateBup.data ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {generateBup.data.created} entri BUP di-generate dari data ASN
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Bezetting" value={loadingSummary ? '…' : (summary?.stats.totalBezetting.toLocaleString('id') ?? '—')} tone="info" icon={Users} description="PNS + PPPK aktif" />
        <StatCard label="Kebutuhan ABK" value={loadingSummary ? '…' : (summary?.stats.totalAbk.toLocaleString('id') ?? '—')} tone="neutral" icon={TrendingUp} description="Seluruh unit org." />
        <StatCard label="Kekurangan" value={loadingSummary ? '…' : (summary?.stats.kekurangan.toLocaleString('id') ?? '—')} tone="danger" icon={TrendingDown} description="ABK − Bezetting" />
        <StatCard label="BUP 5 Thn" value={loadingSummary ? '…' : (summary?.stats.totalBup5Thn.toLocaleString('id') ?? '—')} tone="warning" icon={CalendarX2} description="Pensiun 2024–2028" />
        <StatCard label="Total Kebutuhan" value={loadingSummary ? '…' : (summary?.stats.totalKebutuhan.toLocaleString('id') ?? '—')} tone="success" icon={Users} description="Rekrut 5 tahun" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring" value={tahunBezetting} onChange={(e) => setTahunBezetting(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>Bezetting {y}</option>)}
        </select>
        <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring" value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
          <option value="">Semua Jenis Jabatan</option>
          <option value="struktural_jpt">Struktural / JPT</option>
          <option value="STRUKTURAL">Struktural (lama)</option>
          <option value="fungsional">Fungsional</option>
          <option value="FUNGSIONAL">Fungsional (lama)</option>
          <option value="pelaksana">Pelaksana / JFU</option>
        </select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input type="text" placeholder="Cari jabatan / unit..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-ring" />
        </div>
      </div>

      {/* Projection Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tabel Proyeksi per Unit Organisasi &amp; Jabatan</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {loadingProyeksi ? 'Memuat...' : `${filteredProyeksi.length} unit · ${totalJabatan} jabatan`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500 inline-block" /> Kebutuhan rekrut</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-400 inline-block" /> Kekurangan</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400 inline-block" /> BUP</span>
            </div>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded px-3 py-1 text-xs font-medium transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30 sticky top-0">
                <th className="py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase w-8"></th>
                <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase min-w-56">Nama Unit / Jabatan</th>
                <th className="py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase text-center w-10">Lvl</th>
                <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-center">Bezetting</th>
                <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-center">ABK</th>
                <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-center">GAP</th>
                {BUP_YEARS.map((y) => <th key={y} className="py-2 px-2 text-[10px] font-semibold text-amber-600 uppercase text-center whitespace-nowrap">BUP {y}</th>)}
                {BUP_YEARS.map((y) => <th key={y} className="py-2 px-2 text-[10px] font-semibold text-emerald-600 uppercase text-center whitespace-nowrap">Perlu {y}</th>)}
              </tr>
            </thead>
            {loadingProyeksi ? (
              <tbody>
                <tr><td colSpan={6 + BUP_YEARS.length * 2} className="py-12 text-center text-sm text-muted-foreground">Memuat data proyeksi…</td></tr>
              </tbody>
            ) : filteredProyeksi.length === 0 ? (
              <tbody>
                <tr><td colSpan={6 + BUP_YEARS.length * 2} className="py-12 text-center text-sm text-muted-foreground">{search ? 'Tidak ada jabatan sesuai pencarian' : 'Belum ada data jabatan'}</td></tr>
              </tbody>
            ) : (
              filteredProyeksi.map((unit, idx) => (
                <UnitKerjaGroup key={unit.unitKerjaId ?? unit.unitKerja} unit={unit} idx={idx} />
              ))
            )}
          </table>
        </div>
      </div>

      {/* Bottom charts */}
      {summary && !loadingSummary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Distribusi BUP / Pensiun per Tahun</h3>
            <BarChart data={summary.bupPerTahun} />
            <p className="mt-3 text-xs text-muted-foreground">
              Total BUP 5 Tahun: <span className="font-semibold text-amber-600">{summary.stats.totalBup5Thn.toLocaleString('id')} orang</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Ringkasan Kebutuhan Rekrut</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xl font-bold text-foreground">{summary.stats.kekurangan.toLocaleString('id')}</div>
                <div className="text-xs text-muted-foreground">Kekurangan saat ini</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xl font-bold text-amber-600">{summary.stats.totalBup5Thn.toLocaleString('id')}</div>
                <div className="text-xs text-muted-foreground">Pensiun 2024–2028</div>
              </div>
              <div className="col-span-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3">
                <div className="text-2xl font-bold text-emerald-600">{summary.stats.totalKebutuhan.toLocaleString('id')}</div>
                <div className="text-xs text-muted-foreground">Total kebutuhan rekrut 5 tahun</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
