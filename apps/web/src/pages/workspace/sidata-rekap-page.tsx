import { useEffect, useState } from 'react';
import { Download, Loader2, Printer, Search } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ErrorAlert, LoadingState } from '@/components/workspace/ui';
import {
  sidataApi,
  type RekapAsnResponse,
  type RekapFungsionalRow,
  type RekapGolonganRow,
  type RekapJenjangRow,
  type RekapStrukturalEselonRow,
} from '@/lib/api/sidata';
import { getErrorMessage } from '@/lib/sidata';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'ikhtisar' | 'golongan' | 'pendidikan' | 'jabatan';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: T };

type ReportMetric = { label: string; value: number };
type SheetRow = Array<string | number>;

const WANITA_COLOR = '#10b981';
const PRIA_COLOR   = '#f97316';
const UNKNOWN_COLOR = '#94a3b8';

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SidataRekapPage() {
  const [activeTab, setActiveTab]   = useState<ActiveTab>('ikhtisar');
  const [jabSearch, setJabSearch]   = useState('');
  const [jabFilter, setJabFilter]   = useState('Semua');

  const [rekap, setRekap] = useState<AsyncState<RekapAsnResponse>>({ status: 'idle' });

  async function loadRekap() {
    setRekap({ status: 'loading' });
    try {
      setRekap({ status: 'done', data: await sidataApi.getRekapAsn() });
    } catch (e) {
      setRekap({ status: 'error', message: getErrorMessage(e, 'Gagal memuat data rekap ASN') });
    }
  }

  useEffect(() => {
    void loadRekap();
  }, []);

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
  }

  const rekapData = rekap.status === 'done' ? rekap.data : null;

  const today = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'ikhtisar',  label: 'Ikhtisar'   },
    { key: 'golongan',  label: 'Golongan'   },
    { key: 'pendidikan',label: 'Pendidikan' },
    { key: 'jabatan',   label: 'Jabatan'    },
  ];

  return (
    <div className="space-y-0">
      {/* ── Green Header ──────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-600 p-5 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Rekap ASN Tolitoli</h1>
            <p className="mt-0.5 text-sm text-emerald-200">Data per {today}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak
          </button>
        </div>

        {/* Tab Nav */}
        <div className="mt-4 flex gap-1 border-b border-white/20 pb-0">
          {TABS.map((tab) => {
            const isLoading = rekap.status === 'loading';
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white/15 text-white border-b-2 border-white'
                    : 'text-emerald-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────── */}
      <div className="mt-4 space-y-4">

        {/* IKHTISAR */}
        {activeTab === 'ikhtisar' && (
          <>
            {rekap.status === 'error' ? <ErrorAlert message={rekap.message} /> : null}
            {rekapData ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Donut chart */}
                <ContentCard title="Komposisi jenis kelamin">
                  <GenderDonut row={rekapData.allJk} />
                </ContentCard>

                {/* Golongan bars */}
                <ContentCard title="Komposisi golongan (PNS)">
                  <GolonganBars rows={rekapData.pnsGolonganGroup} />
                </ContentCard>

                {/* Jenjang jabatan */}
                <ContentCard title="Jenis / Jenjang Jabatan" className="lg:col-span-2">
                  <JenjangBars rows={rekapData.allJenjangJabatan} total={rekapData.allJk.total} />
                </ContentCard>

                <div className="lg:col-span-2">
                  <EksporSection data={rekapData} lastUpdate={today} />
                </div>
              </div>
            ) : rekap.status === 'loading' ? (
              <LoadingState label="Memuat ikhtisar..." />
            ) : null}
          </>
        )}

        {/* GOLONGAN */}
        {activeTab === 'golongan' && (
          <GolonganTab rekap={rekap} />
        )}

        {/* PENDIDIKAN */}
        {activeTab === 'pendidikan' && (
          <PendidikanTab rekap={rekap} />
        )}

        {/* JABATAN */}
        {activeTab === 'jabatan' && (
          <JabatanTab
            rekap={rekap}
            search={jabSearch}
            onSearch={setJabSearch}
            filter={jabFilter}
            onFilter={setJabFilter}
          />
        )}

      </div>
      {rekapData ? (
        <PrintableRekapReport
          data={rekapData}
          lastUpdate={today}
          ringkasan={getReportMetrics(rekapData)}
        />
      ) : null}
    </div>
  );
}

// ── Content Card ──────────────────────────────────────────────────────────────

function ContentCard({
  title,
  children,
  loading,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm ${className ?? ''}`}>
      <div className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ── Gender Donut Chart ────────────────────────────────────────────────────────

function GenderDonut({ row }: { row: RekapAsnResponse['allJk'] }) {
  const data = [
    { name: 'Wanita', value: row.wanita },
    { name: 'Pria',   value: row.pria   },
    { name: 'Belum terbaca', value: row.lainnya },
  ];
  const wanitaPct = row.total > 0 ? Math.round((row.wanita / row.total) * 100) : 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={WANITA_COLOR} />
              <Cell fill={PRIA_COLOR} />
              <Cell fill={UNKNOWN_COLOR} />
            </Pie>
            <Tooltip
              formatter={(v: number) => v.toLocaleString('id-ID')}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-zinc-700">{wanitaPct}%</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: WANITA_COLOR }} />
          <span className="text-sm text-zinc-600">Wanita</span>
          <span className="ml-2 font-semibold tabular-nums">{row.wanita.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PRIA_COLOR }} />
          <span className="text-sm text-zinc-600">Pria</span>
          <span className="ml-2 font-semibold tabular-nums">{row.pria.toLocaleString('id-ID')}</span>
        </div>
        {row.lainnya > 0 ? (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: UNKNOWN_COLOR }} />
            <span className="text-sm text-zinc-600">Belum terbaca</span>
            <span className="ml-2 font-semibold tabular-nums">{row.lainnya.toLocaleString('id-ID')}</span>
          </div>
        ) : null}
        <div className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-400">
          Total: {row.total.toLocaleString('id-ID')} ASN
        </div>
      </div>
    </div>
  );
}

// ── Golongan Horizontal Bars ──────────────────────────────────────────────────

function GolonganBars({ rows }: { rows: RekapGolonganRow[] }) {
  const maxTotal = Math.max(...rows.map((r) => r.total), 1);
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.golru} className="flex items-center gap-3">
          <span className="w-14 text-sm font-medium text-zinc-600">Gol. {r.golru}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 h-5">
            <div
              className="h-5 rounded-full transition-all duration-500"
              style={{
                width: `${(r.total / maxTotal) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <span className="w-14 text-right text-sm tabular-nums text-zinc-700 font-medium">
            {r.total.toLocaleString('id-ID')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Jenjang Bars ──────────────────────────────────────────────────────────────

function JenjangBars({ rows, total }: { rows: RekapJenjangRow[]; total: number }) {
  const COLORS: Record<string, string> = {
    STRUKTURAL: '#10b981',
    FUNGSIONAL: '#3b82f6',
    PELAKSANA:  '#f59e0b',
    LAINNYA:    '#6b7280',
  };
  const ASN_GROUPS = [
    { key: 'PNS', label: 'PNS' },
    { key: 'PPPK', label: 'PPPK' },
    { key: 'PPPK_PARUH_WAKTU', label: 'PPPK Paruh Waktu' },
  ];
  const JABATAN_GROUPS = [
    { key: 'STRUKTURAL', label: 'Struktural' },
    { key: 'FUNGSIONAL', label: 'Fungsional' },
    { key: 'PELAKSANA', label: 'Pelaksana' },
  ];
  const rowByGroup = new Map(
    rows.map((row) => [`${row.jenisAsn ?? 'PNS'}:${row.jabatan}`, row]),
  );

  return (
    <div className="space-y-5">
      {ASN_GROUPS.map((group) => {
        const groupRows = JABATAN_GROUPS.map((jabatan) => ({
          ...jabatan,
          data: rowByGroup.get(`${group.key}:${jabatan.key}`),
        }));
        const groupTotal = groupRows.reduce((sum, row) => sum + (row.data?.total ?? 0), 0);

        return (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
              <span className="text-sm font-semibold text-zinc-700">{group.label}</span>
              <span className="text-xs font-medium tabular-nums text-zinc-500">
                {groupTotal.toLocaleString('id-ID')} ASN
              </span>
            </div>
            <div className="space-y-2">
              {groupRows.map((r) => {
                const value = r.data?.total ?? 0;
                return (
                  <div key={`${group.key}-${r.key}`} className="flex items-center gap-3">
                    <span className="w-28 text-sm font-medium text-zinc-600">{r.label}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-5 rounded-full transition-all duration-500"
                        style={{
                          width: total > 0 ? `${(value / total) * 100}%` : '0%',
                          backgroundColor: COLORS[r.key] ?? '#6b7280',
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-sm font-medium tabular-nums text-zinc-700">
                      {value.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Golongan Tab ──────────────────────────────────────────────────────────────

function GolonganTab({
  rekap,
}: {
  rekap: AsyncState<RekapAsnResponse>;
}) {
  if (rekap.status === 'loading' || rekap.status === 'idle') {
    return <LoadingState label="Memuat data golongan..." />;
  }
  if (rekap.status === 'error') return <ErrorAlert message={rekap.message} />;

  const data = rekap.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContentCard title="Golongan PNS (Detail)">
          <RekapTable
            headers={['Gol. / Ruang', 'Pria', 'Wanita', 'Total']}
            rows={data.pnsGolonganDetail.map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
        <ContentCard title="Golongan PNS (Kelompok)">
          <GolonganBars rows={data.pnsGolonganGroup} />
        </ContentCard>
        <ContentCard title="Golongan PPPK">
          <RekapTable
            headers={['Golongan', 'Pria', 'Wanita', 'Total']}
            rows={data.pppkGolongan.map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
        <ContentCard title="Golongan PPPK Paruh Waktu">
          <RekapTable
            headers={['Golongan', 'Pria', 'Wanita', 'Total']}
            rows={(data.pppkParuhWaktuGolongan ?? []).map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
      </div>
    </div>
  );
}

// ── Pendidikan Tab ────────────────────────────────────────────────────────────

function PendidikanTab({
  rekap,
}: {
  rekap: AsyncState<RekapAsnResponse>;
}) {
  if (rekap.status === 'loading' || rekap.status === 'idle') {
    return <LoadingState label="Memuat data pendidikan..." />;
  }
  if (rekap.status === 'error') return <ErrorAlert message={rekap.message} />;

  const data = rekap.data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ContentCard title="Pendidikan PNS (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={data.pnsPendidikanGroup.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PPPK (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={data.pppkPendidikanGroup.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PPPK Paruh Waktu (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={(data.pppkParuhWaktuPendidikanGroup ?? []).map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PNS (Detail)" className="lg:col-span-2">
        <RekapTable
          headers={['Tingkat Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={data.pnsPendidikanDetail.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
    </div>
  );
}

// ── Jabatan Tab ───────────────────────────────────────────────────────────────

const FILTER_CHIPS = ['Semua', 'Kesehatan', 'Pendidikan', 'Teknis', 'Administrasi'];
const FILTER_KW: Record<string, string[]> = {
  Kesehatan:    ['perawat', 'bidan', 'dokter', 'farmasi', 'kesehatan', 'sanitasi', 'gizi', 'apoteker', 'radiografer'],
  Pendidikan:   ['guru', 'pengawas', 'penilik', 'pamong', 'instruktur'],
  Teknis:       ['teknis', 'pranata', 'analis', 'penyuluh', 'statistisi', 'perencana', 'auditor', 'widyaiswara'],
  Administrasi: ['administrasi', 'arsiparis', 'pustakawan', 'pengelola'],
};

function JabatanTab({
  rekap,
  search,
  onSearch,
  filter,
  onFilter,
}: {
  rekap: AsyncState<RekapAsnResponse>;
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
}) {
  if (rekap.status === 'loading' || rekap.status === 'idle') {
    return <LoadingState label="Memuat data jabatan..." />;
  }
  if (rekap.status === 'error') return <ErrorAlert message={rekap.message} />;

  const rows = rekap.data.fungsionalJabatan;
  const strukturalEselon = rekap.data.strukturalEselonDetail;

  const filtered = rows.filter((r) => {
    const nm = r.namaJabatan.toLowerCase();
    const matchSearch = !search || nm.includes(search.toLowerCase());
    const matchFilter =
      filter === 'Semua' || FILTER_KW[filter]?.some((kw) => nm.includes(kw));
    return matchSearch && matchFilter;
  });

  const totalJenis = filtered.length;
  const totalPegawai = filtered.reduce((s, r) => s + r.jumlahTotal, 0);

  return (
    <div className="space-y-4">
      {/* Jabatan Fungsional */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-emerald-700 px-4 py-3">
          <h3 className="font-semibold text-white">Jabatan fungsional</h3>
          <p className="text-xs text-emerald-200">
            {totalJenis} jenis · {totalPegawai.toLocaleString('id-ID')} pegawai
          </p>
        </div>
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama jabatan..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-4 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onFilter(chip)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === chip
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
        {/* List */}
        <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada jabatan ditemukan</p>
          ) : (
            filtered.map((r) => <JabatanListItem key={r.namaJabatan} row={r} />)
          )}
        </div>
      </div>

      {/* Gender per Jabatan Struktural */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-emerald-700 px-4 py-3">
            <h3 className="font-semibold text-white">Komposisi gender jabatan struktural</h3>
            <p className="text-xs text-emerald-200">
              Struktural — {strukturalEselon.reduce((s, r) => s + r.terisi, 0).toLocaleString('id-ID')} orang
            </p>
          </div>
          <div className="p-4">
            <GenderEselonTable rows={strukturalEselon} />
          </div>
        </div>

        {/* Struktural Pendidikan */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-zinc-700">Jumlah jabatan struktural per eselon</h3>
          </div>
          <div className="p-4">
            <EselonGroupBars rows={rekap.data.strukturalEselonGroup} />
          </div>
        </div>
      </div>
    </div>
  );
}

function JabatanListItem({ row }: { row: RekapFungsionalRow }) {
  const BADGE_COLORS = [
    'bg-emerald-50 text-emerald-700',
    'bg-blue-50 text-blue-700',
    'bg-violet-50 text-violet-700',
    'bg-amber-50 text-amber-700',
  ];
  const colorIdx = Math.abs(row.namaJabatan.charCodeAt(0) + row.namaJabatan.length) % BADGE_COLORS.length;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 truncate">{row.namaJabatan}</p>
        <p className="text-xs text-zinc-400">
          Ahli {row.jumlahAhli.toLocaleString('id-ID')} · Terampil {row.jumlahTerampil.toLocaleString('id-ID')}
        </p>
      </div>
      <span className={`rounded-full px-3 py-0.5 text-sm font-bold tabular-nums ${BADGE_COLORS[colorIdx]}`}>
        {row.jumlahTotal.toLocaleString('id-ID')}
      </span>
    </div>
  );
}

// ── Gender Eselon Table ───────────────────────────────────────────────────────

function GenderEselonTable({ rows }: { rows: RekapStrukturalEselonRow[] }) {
  const totalTerisi = rows.reduce((s, r) => s + r.terisi, 0);
  const totalWanita = rows.reduce((s, r) => s + r.wanita, 0);
  const rasioWanitaPct = totalTerisi > 0
    ? Math.round((totalWanita / totalTerisi) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {totalTerisi === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Belum ada jabatan struktural/eselon yang terbaca dari data ASN.
        </div>
      ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="pb-2 text-left text-xs font-semibold text-zinc-500 uppercase">Eselon</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-500 uppercase">Total</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-500 uppercase">Pria</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-500 uppercase">Wanita</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-500 uppercase">% Wanita</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => {
            const pct = r.terisi > 0 ? Math.round((r.wanita / r.terisi) * 100) : 0;
            return (
              <tr key={r.eselon}>
                <td className="py-2 font-medium text-zinc-700">{r.eselon}</td>
                <td className="py-2 text-right tabular-nums text-zinc-600">{r.terisi}</td>
                <td className="py-2 text-right tabular-nums text-zinc-600">{r.pria}</td>
                <td className="py-2 text-right tabular-nums text-zinc-600">{r.wanita}</td>
                <td className={`py-2 text-right font-semibold tabular-nums ${pct < 30 ? 'text-red-500' : pct < 40 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Progress bar rasio wanita */}
      <div>
        <p className="mb-1 text-xs text-zinc-500">Total rasio wanita jabatan struktural</p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-2.5 rounded-full bg-rose-400 transition-all duration-700"
            style={{ width: `${rasioWanitaPct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {rasioWanitaPct}% dari {totalTerisi.toLocaleString('id-ID')} posisi
        </p>
      </div>
    </div>
  );
}

// ── Eselon Group Bars ─────────────────────────────────────────────────────────

function EselonGroupBars({ rows }: { rows: RekapStrukturalEselonRow[] }) {
  const maxTerisi = Math.max(...rows.map((r) => r.terisi), 1);
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.eselon} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span className="font-medium">Eselon {r.eselon}</span>
            <span className="tabular-nums">{r.terisi.toLocaleString('id-ID')} posisi</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-4 rounded-full transition-all duration-500"
              style={{
                width: `${(r.terisi / maxTerisi) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <div className="flex gap-3 text-xs text-zinc-400">
            <span>Pria: {r.pria}</span>
            <span>Wanita: {r.wanita}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Rekap Table (generic) ─────────────────────────────────────────────────────

function RekapTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) return (
    <p className="py-4 text-center text-sm text-zinc-400">Tidak ada data</p>
  );
  const totals = rows.reduce<number[]>((acc, row) => {
    row.forEach((cell, i) => {
      if (typeof cell === 'number') acc[i] = (acc[i] ?? 0) + cell;
    });
    return acc;
  }, []);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-emerald-700 bg-emerald-700">
          {headers.map((h, i) => (
            <th
              key={h}
              className={`px-2 py-2 text-xs font-semibold text-white ${i === 0 ? 'text-left' : 'text-right'}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {rows.map((row, ri) => (
          <tr key={ri} className="hover:bg-zinc-50 transition-colors">
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={`px-2 py-1.5 ${ci === 0 ? 'text-left text-zinc-700' : 'text-right tabular-nums text-zinc-600'}`}
              >
                {typeof cell === 'number' ? cell.toLocaleString('id-ID') : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-emerald-200 bg-emerald-50/60">
          {headers.map((_, i) => (
            <td
              key={i}
              className={`px-2 py-2 font-bold ${i === 0 ? 'text-left text-zinc-800' : 'text-right tabular-nums text-zinc-800'}`}
            >
              {i === 0 ? 'TOTAL' : (totals[i] ?? 0).toLocaleString('id-ID')}
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}

// ── Ekspor Section ────────────────────────────────────────────────────────────

function EksporSection({
  data,
  lastUpdate,
}: {
  data: RekapAsnResponse | null;
  lastUpdate: string;
}) {
  const canExport = !!data;
  const formatNumber = (value: number) => value.toLocaleString('id-ID');
  const ringkasan = data ? getReportMetrics(data) : [];

  function downloadWorkbook() {
    if (!data) return;

    const workbook = buildExcelWorkbook([
      {
        name: 'Ringkasan',
        rows: [
          ['REKAPITULASI DATA ASN - KABUPATEN TOLITOLI'],
          [`Data per ${lastUpdate}`],
          [],
          ['Indikator', 'Jumlah'],
          ...ringkasan.map((item): SheetRow => [item.label, item.value]),
        ],
      },
      {
        name: 'Jenis Kelamin',
        rows: [
          ['Jenis Kelamin', 'Jumlah', 'Persentase'],
          ['Pria', data.allJk.pria, `${data.allJk.persenPria}%`],
          ['Wanita', data.allJk.wanita, `${data.allJk.persenWanita}%`],
          ['Belum terbaca', data.allJk.lainnya, data.allJk.total > 0 ? `${Number(((data.allJk.lainnya / data.allJk.total) * 100).toFixed(2))}%` : '0%'],
          ['Total', data.allJk.total, '100%'],
        ],
      },
      {
        name: 'Jenis ASN Jabatan',
        rows: [
          ['Jenis ASN', 'Jenjang Jabatan', 'Pria', 'Wanita', 'Total', '% Pria', '% Wanita'],
          ...data.allJenjangJabatan.map((r): SheetRow => [
            formatJenisAsnLabel(r.jenisAsn),
            formatJabatanLabel(r.jabatan),
            r.pria,
            r.wanita,
            r.total,
            `${r.persenPria}%`,
            `${r.persenWanita}%`,
          ]),
        ],
      },
      {
        name: 'Golongan PNS',
        rows: [
          ['Golongan', 'Pria', 'Wanita', 'Total'],
          ...data.pnsGolonganDetail.map((r): SheetRow => [r.golru, r.pria, r.wanita, r.total]),
        ],
      },
      {
        name: 'Pendidikan PNS',
        rows: [
          ['Pendidikan', 'Pria', 'Wanita', 'Total'],
          ...data.pnsPendidikanDetail.map((r): SheetRow => [r.pddkn, r.pria, r.wanita, r.total]),
        ],
      },
      {
        name: 'Struktural Eselon',
        rows: [
          ['Eselon', 'Total', 'Pria', 'Wanita'],
          ...data.strukturalEselonDetail.map((r): SheetRow => [r.eselon, r.terisi, r.pria, r.wanita]),
        ],
      },
      {
        name: 'Jabatan Fungsional',
        rows: [
          ['Nama Jabatan', 'Ahli Pria', 'Ahli Wanita', 'Jumlah Ahli', 'Terampil Pria', 'Terampil Wanita', 'Jumlah Terampil', 'Total'],
          ...data.fungsionalJabatan.map((r): SheetRow => [
            r.namaJabatan,
            r.ahliPria,
            r.ahliWanita,
            r.jumlahAhli,
            r.terampilPria,
            r.terampilWanita,
            r.jumlahTerampil,
            r.jumlahTotal,
          ]),
        ],
      },
      {
        name: 'Golongan PPPK',
        rows: [
          ['Golongan', 'Pria', 'Wanita', 'Total'],
          ...data.pppkGolongan.map((r): SheetRow => [r.golru, r.pria, r.wanita, r.total]),
        ],
      },
      {
        name: 'Golongan PPPK PW',
        rows: [
          ['Golongan', 'Pria', 'Wanita', 'Total'],
          ...(data.pppkParuhWaktuGolongan ?? []).map((r): SheetRow => [r.golru, r.pria, r.wanita, r.total]),
        ],
      },
      {
        name: 'Pendidikan PPPK',
        rows: [
          ['Pendidikan', 'Pria', 'Wanita', 'Total'],
          ...data.pppkPendidikanDetail.map((r): SheetRow => [r.pddkn, r.pria, r.wanita, r.total]),
        ],
      },
      {
        name: 'Pendidikan PPPK PW',
        rows: [
          ['Pendidikan', 'Pria', 'Wanita', 'Total'],
          ...(data.pppkParuhWaktuPendidikanDetail ?? []).map((r): SheetRow => [r.pddkn, r.pria, r.wanita, r.total]),
        ],
      },
    ]);

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-asn-tolitoli-${new Date().toISOString().slice(0, 7)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-emerald-700 px-4 py-3">
        <h3 className="font-semibold text-white">Laporan dan ekspor</h3>
        <p className="text-xs text-emerald-200">Rekap utama per {lastUpdate}</p>
      </div>
      {data ? (
        <div className="border-b border-zinc-100 p-4">
          <h4 className="mb-3 text-sm font-semibold text-zinc-700">Ringkasan laporan</h4>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ringkasan.map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-800">
                  {formatNumber(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-zinc-100">
        <ExportRow
          label="Unduh Excel rekap lengkap"
          desc="Multi-sheet: ringkasan, jenis ASN, golongan, pendidikan, dan jabatan"
          disabled={!canExport}
          onClick={downloadWorkbook}
        />
        <ExportRow
          label="Cetak / simpan PDF laporan"
          desc="Layout laporan lengkap siap cetak A4"
          disabled={!canExport}
          onClick={() => window.print()}
        />
      </div>
      <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
        Terakhir diperbarui: <span className="font-medium text-zinc-600">{lastUpdate}</span>
      </div>
    </div>
  );
}

function formatJenisAsnLabel(value: string | null | undefined) {
  if (value === 'PPPK_PARUH_WAKTU') return 'PPPK Paruh Waktu';
  return value ?? '-';
}

function getReportMetrics(data: RekapAsnResponse): ReportMetric[] {
  const totalByJenis = (jenisAsn: string) =>
    data.allJenjangJabatan
      .filter((row) => row.jenisAsn === jenisAsn)
      .reduce((sum, row) => sum + row.total, 0);
  const totalByJabatan = (jabatan: string) =>
    data.allJenjangJabatan
      .filter((row) => row.jabatan === jabatan)
      .reduce((sum, row) => sum + row.total, 0);

  return [
    { label: 'Total ASN', value: data.allJk.total },
    { label: 'PNS', value: totalByJenis('PNS') },
    { label: 'PPPK', value: totalByJenis('PPPK') },
    { label: 'PPPK Paruh Waktu', value: totalByJenis('PPPK_PARUH_WAKTU') },
    { label: 'Struktural', value: totalByJabatan('STRUKTURAL') },
    { label: 'Fungsional', value: totalByJabatan('FUNGSIONAL') },
    { label: 'Pelaksana', value: totalByJabatan('PELAKSANA') },
    { label: 'Wanita', value: data.allJk.wanita },
  ];
}

function formatJabatanLabel(value: string | null | undefined) {
  if (!value) return '-';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function escapeXml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toSheetName(value: string) {
  return value.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
}

function buildExcelWorkbook(sheets: Array<{ name: string; rows: SheetRow[] }>) {
  const worksheets = sheets.map((sheet) => {
    const rows = sheet.rows.map((row) => {
      const cells = row.map((cell) => {
        const type = typeof cell === 'number' ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('');

    return `<Worksheet ss:Name="${escapeXml(toSheetName(sheet.name))}"><Table>${rows}</Table></Worksheet>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${worksheets}
</Workbook>`;
}

function PrintableRekapReport({
  data,
  lastUpdate,
  ringkasan,
}: {
  data: RekapAsnResponse;
  lastUpdate: string;
  ringkasan: ReportMetric[];
}) {
  const jenisAsnRows = data.allJenjangJabatan.map((row) => [
    formatJenisAsnLabel(row.jenisAsn),
    formatJabatanLabel(row.jabatan),
    row.pria,
    row.wanita,
    row.total,
  ]);
  const genderRows: (string | number)[][] = [
    ['Pria', data.allJk.pria, `${data.allJk.persenPria}%`],
    ['Wanita', data.allJk.wanita, `${data.allJk.persenWanita}%`],
    ['Belum terbaca', data.allJk.lainnya, data.allJk.total > 0 ? `${Number(((data.allJk.lainnya / data.allJk.total) * 100).toFixed(2))}%` : '0%'],
    ['Total', data.allJk.total, '100%'],
  ];

  return (
    <div className="hidden print:block" id="sidata-print-report">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #sidata-print-report, #sidata-print-report * { visibility: visible; }
            #sidata-print-report {
              display: block !important;
              position: absolute;
              inset: 0 auto auto 0;
              width: 100%;
              padding: 18mm;
              color: #111827;
              background: white;
              font-family: Arial, sans-serif;
            }
            #sidata-print-report table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 10px;
            }
            #sidata-print-report th {
              background: #047857;
              color: white;
              text-align: left;
              padding: 6px;
              border: 1px solid #d1d5db;
            }
            #sidata-print-report td {
              padding: 5px 6px;
              border: 1px solid #d1d5db;
            }
            #sidata-print-report .num { text-align: right; }
            #sidata-print-report .page-break { break-before: page; }
          }
        `}
      </style>

      <header className="mb-5 border-b-2 border-emerald-700 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Kabupaten Tolitoli</p>
        <h1 className="text-2xl font-bold text-zinc-900">Laporan Rekapitulasi ASN</h1>
        <p className="mt-1 text-sm text-zinc-600">Data per {lastUpdate}</p>
      </header>

      <section className="mb-5">
        <h2 className="text-base font-bold text-zinc-800">Ringkasan Eksekutif</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ringkasan.map((item) => (
            <div key={item.label} className="border border-zinc-300 p-2">
              <p className="text-[10px] text-zinc-500">{item.label}</p>
              <p className="mt-1 text-lg font-bold">{item.value.toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      </section>

      <PrintTable
        title="Komposisi Jenis Kelamin"
        headers={['Jenis Kelamin', 'Jumlah', 'Persentase']}
        rows={genderRows}
      />

      <PrintTable
        title="Jenis ASN dan Jenjang Jabatan"
        headers={['Jenis ASN', 'Jenjang Jabatan', 'Pria', 'Wanita', 'Total']}
        rows={jenisAsnRows}
      />

      <div className="page-break" />

      <PrintTable
        title="Golongan PNS"
        headers={['Golongan', 'Pria', 'Wanita', 'Total']}
        rows={data.pnsGolonganDetail.map((row) => [row.golru, row.pria, row.wanita, row.total])}
      />

      <PrintTable
        title="Pendidikan PNS"
        headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
        rows={data.pnsPendidikanDetail.map((row) => [row.pddkn, row.pria, row.wanita, row.total])}
      />

      <PrintTable
        title="Eselon Struktural"
        headers={['Eselon', 'Total', 'Pria', 'Wanita']}
        rows={data.strukturalEselonDetail.map((row) => [row.eselon, row.terisi, row.pria, row.wanita])}
      />

      <div className="page-break" />

      <PrintTable
        title="Jabatan Fungsional"
        headers={['Nama Jabatan', 'Ahli', 'Terampil', 'Total']}
        rows={data.fungsionalJabatan.map((row) => [
          row.namaJabatan,
          row.jumlahAhli,
          row.jumlahTerampil,
          row.jumlahTotal,
        ])}
      />

      <PrintTable
        title="PPPK"
        headers={['Kategori', 'Pria', 'Wanita', 'Total']}
        rows={[
          ...data.pppkGolongan.map((row): SheetRow => [`Golongan ${row.golru}`, row.pria, row.wanita, row.total]),
          ...data.pppkPendidikanDetail.map((row): SheetRow => [`Pendidikan ${row.pddkn}`, row.pria, row.wanita, row.total]),
        ]}
      />

      <PrintTable
        title="PPPK Paruh Waktu"
        headers={['Kategori', 'Pria', 'Wanita', 'Total']}
        rows={[
          ...(data.pppkParuhWaktuGolongan ?? []).map((row): SheetRow => [`Golongan ${row.golru}`, row.pria, row.wanita, row.total]),
          ...(data.pppkParuhWaktuPendidikanDetail ?? []).map((row): SheetRow => [`Pendidikan ${row.pddkn}`, row.pria, row.wanita, row.total]),
        ]}
      />
    </div>
  );
}

function PrintTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <section className="mb-5">
      <h2 className="text-base font-bold text-zinc-800">{title}</h2>
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={header} className={index === 0 ? '' : 'num'}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cellIndex === 0 ? '' : 'num'}>
                  {typeof cell === 'number' ? cell.toLocaleString('id-ID') : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ExportRow({
  label,
  desc,
  onClick,
  disabled,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400">{desc}</p>
      </div>
      <Download className="h-4 w-4 text-zinc-400" />
    </button>
  );
}
