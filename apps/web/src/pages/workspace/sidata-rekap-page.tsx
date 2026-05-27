import { useEffect, useState } from 'react';
import { Download, Loader2, Printer, Search, X } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ErrorAlert, LoadingState } from '@/components/workspace/ui';
import {
  sidataApi,
  type RekapAsnResponse,
  type RekapFungsionalRow,
  type RekapGolonganRow,
  type RekapIkhtisarResponse,
  type RekapJabatanAsnResponse,
  type RekapJabatanAsnRow,
  type RekapJenjangRow,
  type RekapPnsResponse,
  type RekapPppkResponse,
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
type JabatanDetailTarget =
  | { type: 'jabatan'; title: string; jabatanNama: string }
  | { type: 'eselon'; title: string; eselon: string };

const WANITA_COLOR = '#10b981';
const PRIA_COLOR   = '#f97316';
const UNKNOWN_COLOR = '#94a3b8';

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SidataRekapPage() {
  const [activeTab, setActiveTab]   = useState<ActiveTab>('ikhtisar');
  const [jabSearch, setJabSearch]   = useState('');
  const [jabFilter, setJabFilter]   = useState('Semua');
  const [selectedJabatan, setSelectedJabatan] = useState<JabatanDetailTarget | null>(null);

  const [ikhtisar, setIkhtisar] = useState<AsyncState<RekapIkhtisarResponse>>({ status: 'idle' });
  const [pns, setPns] = useState<AsyncState<RekapPnsResponse>>({ status: 'idle' });
  const [pppk, setPppk] = useState<AsyncState<RekapPppkResponse>>({ status: 'idle' });
  const [fullRekap, setFullRekap] = useState<AsyncState<RekapAsnResponse>>({ status: 'idle' });
  const [reportError, setReportError] = useState<string | null>(null);

  async function loadIkhtisar() {
    if (ikhtisar.status === 'loading' || ikhtisar.status === 'done') return;
    setIkhtisar({ status: 'loading' });
    try {
      setIkhtisar({ status: 'done', data: await sidataApi.getRekapIkhtisar() });
    } catch (e) {
      setIkhtisar({ status: 'error', message: getErrorMessage(e, 'Gagal memuat ikhtisar rekap ASN') });
    }
  }

  async function loadPns() {
    if (pns.status === 'loading' || pns.status === 'done') return;
    setPns({ status: 'loading' });
    try {
      setPns({ status: 'done', data: await sidataApi.getRekapPns() });
    } catch (e) {
      setPns({ status: 'error', message: getErrorMessage(e, 'Gagal memuat rekap PNS') });
    }
  }

  async function loadPppk() {
    if (pppk.status === 'loading' || pppk.status === 'done') return;
    setPppk({ status: 'loading' });
    try {
      setPppk({ status: 'done', data: await sidataApi.getRekapPppk() });
    } catch (e) {
      setPppk({ status: 'error', message: getErrorMessage(e, 'Gagal memuat rekap PPPK') });
    }
  }

  useEffect(() => {
    void loadIkhtisar();
  }, []);

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
  }

  useEffect(() => {
    if (activeTab === 'golongan' || activeTab === 'pendidikan') {
      void loadPns();
      void loadPppk();
    }
    if (activeTab === 'jabatan') {
      void loadPns();
    }
  }, [activeTab]);

  const ikhtisarData = ikhtisar.status === 'done' ? ikhtisar.data : null;
  const fullRekapData = fullRekap.status === 'done' ? fullRekap.data : null;

  const today = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'ikhtisar',  label: 'Ikhtisar'   },
    { key: 'golongan',  label: 'Golongan'   },
    { key: 'pendidikan',label: 'Pendidikan' },
    { key: 'jabatan',   label: 'Jabatan'    },
  ];

  function isTabLoading(tab: ActiveTab) {
    if (tab === 'ikhtisar') return ikhtisar.status === 'loading';
    if (tab === 'jabatan') return pns.status === 'loading';
    if (tab === 'golongan' || tab === 'pendidikan') {
      return pns.status === 'loading' || pppk.status === 'loading';
    }
    return false;
  }

  async function getCompleteRekap() {
    if (fullRekap.status === 'done') return fullRekap.data;

    setReportError(null);
    setFullRekap({ status: 'loading' });
    try {
      const data = await sidataApi.getRekapAsn();
      setFullRekap({ status: 'done', data });
      return data;
    } catch (e) {
      const message = getErrorMessage(e, 'Gagal memuat rekap lengkap');
      setFullRekap({ status: 'error', message });
      setReportError(message);
      return null;
    }
  }

  async function handleDownloadReport() {
    const data = await getCompleteRekap();
    if (data) downloadWorkbook(data, today);
  }

  async function handlePrintReport() {
    const data = await getCompleteRekap();
    if (data) window.setTimeout(() => window.print(), 100);
  }

  return (
    <div className="space-y-4">
      {/* ── Green Header ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Rekap ASN</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan data ASN aktif per {today}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={fullRekap.status === 'loading'}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fullRekap.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Excel
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              disabled={fullRekap.status === 'loading'}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {fullRekap.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak
            </button>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {TABS.map((tab) => {
            const isLoading = isTabLoading(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </button>
            );
          })}
        </div>
      </div>

      {reportError ? <ErrorAlert message={reportError} /> : null}

      {/* ── Tab Content ───────────────────────────────────────────────── */}
      <div className="mt-4 space-y-4">

        {/* IKHTISAR */}
        {activeTab === 'ikhtisar' && (
          <>
            {ikhtisar.status === 'error' ? <ErrorAlert message={ikhtisar.message} /> : null}
            {ikhtisarData ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="grid grid-cols-2 gap-3 lg:col-span-2 md:grid-cols-4">
                  {getIkhtisarMetrics(ikhtisarData).map((item) => (
                    <MetricCard key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>

                <ContentCard title="Komposisi jenis kelamin">
                  <GenderDonut row={ikhtisarData.allJk} />
                </ContentCard>

                <ContentCard title="Jenis jabatan">
                  <JenjangBars rows={ikhtisarData.allJenjangJabatan} total={ikhtisarData.allJk.total} />
                </ContentCard>

                <div className="lg:col-span-2">
                  <EksporSection
                    reportData={fullRekapData}
                    loading={fullRekap.status === 'loading'}
                    lastUpdate={today}
                    onDownload={handleDownloadReport}
                    onPrint={handlePrintReport}
                  />
                </div>
              </div>
            ) : ikhtisar.status === 'loading' ? (
              <LoadingState label="Memuat ikhtisar..." />
            ) : null}
          </>
        )}

        {/* GOLONGAN */}
        {activeTab === 'golongan' && (
          <GolonganTab pns={pns} pppk={pppk} />
        )}

        {/* PENDIDIKAN */}
        {activeTab === 'pendidikan' && (
          <PendidikanTab pns={pns} pppk={pppk} />
        )}

        {/* JABATAN */}
        {activeTab === 'jabatan' && (
          <JabatanTab
            pns={pns}
            search={jabSearch}
            onSearch={setJabSearch}
            filter={jabFilter}
            onFilter={setJabFilter}
            onOpenJabatan={(jabatanNama) => setSelectedJabatan({ type: 'jabatan', title: jabatanNama, jabatanNama })}
            onOpenEselon={(eselon) => setSelectedJabatan({ type: 'eselon', title: `Eselon ${eselon}`, eselon })}
          />
        )}

      </div>
      {fullRekapData ? (
        <PrintableRekapReport
          data={fullRekapData}
          lastUpdate={today}
          ringkasan={getReportMetrics(fullRekapData)}
        />
      ) : null}
      {selectedJabatan ? (
        <JabatanAsnModal
          target={selectedJabatan}
          onClose={() => setSelectedJabatan(null)}
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

function MetricCard({ label, value }: ReportMetric) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {value.toLocaleString('id-ID')}
      </p>
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
  const hasJenisAsn = rows.some((row) => row.jenisAsn);

  if (!hasJenisAsn) {
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.jabatan} className="flex items-center gap-3">
            <span className="w-28 text-sm font-medium text-zinc-600">{formatJabatanLabel(row.jabatan)}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-5 rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: total > 0 ? `${(row.total / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-16 text-right text-sm font-medium tabular-nums text-zinc-700">
              {row.total.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    );
  }

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
  pns,
  pppk,
}: {
  pns: AsyncState<RekapPnsResponse>;
  pppk: AsyncState<RekapPppkResponse>;
}) {
  if (pns.status === 'loading' || pppk.status === 'loading' || pns.status === 'idle' || pppk.status === 'idle') {
    return <LoadingState label="Memuat data golongan..." />;
  }
  if (pns.status === 'error') return <ErrorAlert message={pns.message} />;
  if (pppk.status === 'error') return <ErrorAlert message={pppk.message} />;

  const pnsData = pns.data;
  const pppkData = pppk.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContentCard title="Golongan PNS (Detail)">
          <RekapTable
            headers={['Gol. / Ruang', 'Pria', 'Wanita', 'Total']}
            rows={pnsData.pnsGolonganDetail.map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
        <ContentCard title="Golongan PNS (Kelompok)">
          <GolonganBars rows={pnsData.pnsGolonganGroup} />
        </ContentCard>
        <ContentCard title="Golongan PPPK">
          <RekapTable
            headers={['Golongan', 'Pria', 'Wanita', 'Total']}
            rows={pppkData.pppkGolongan.map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
        <ContentCard title="Golongan PPPK Paruh Waktu">
          <RekapTable
            headers={['Golongan', 'Pria', 'Wanita', 'Total']}
            rows={(pppkData.pppkParuhWaktuGolongan ?? []).map((r) => [r.golru, r.pria, r.wanita, r.total])}
          />
        </ContentCard>
      </div>
    </div>
  );
}

// ── Pendidikan Tab ────────────────────────────────────────────────────────────

function PendidikanTab({
  pns,
  pppk,
}: {
  pns: AsyncState<RekapPnsResponse>;
  pppk: AsyncState<RekapPppkResponse>;
}) {
  if (pns.status === 'loading' || pppk.status === 'loading' || pns.status === 'idle' || pppk.status === 'idle') {
    return <LoadingState label="Memuat data pendidikan..." />;
  }
  if (pns.status === 'error') return <ErrorAlert message={pns.message} />;
  if (pppk.status === 'error') return <ErrorAlert message={pppk.message} />;

  const pnsData = pns.data;
  const pppkData = pppk.data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ContentCard title="Pendidikan PNS (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={pnsData.pnsPendidikanGroup.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PPPK (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={pppkData.pppkPendidikanGroup.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PPPK Paruh Waktu (Kelompok)">
        <RekapTable
          headers={['Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={(pppkData.pppkParuhWaktuPendidikanGroup ?? []).map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
        />
      </ContentCard>
      <ContentCard title="Pendidikan PNS (Detail)" className="lg:col-span-2">
        <RekapTable
          headers={['Tingkat Pendidikan', 'Pria', 'Wanita', 'Total']}
          rows={pnsData.pnsPendidikanDetail.map((r) => [r.pddkn, r.pria, r.wanita, r.total])}
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
  pns,
  search,
  onSearch,
  filter,
  onFilter,
  onOpenJabatan,
  onOpenEselon,
}: {
  pns: AsyncState<RekapPnsResponse>;
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
  onOpenJabatan: (jabatanNama: string) => void;
  onOpenEselon: (eselon: string) => void;
}) {
  if (pns.status === 'loading' || pns.status === 'idle') {
    return <LoadingState label="Memuat data jabatan..." />;
  }
  if (pns.status === 'error') return <ErrorAlert message={pns.message} />;

  const rows = pns.data.fungsionalJabatan;
  const strukturalEselon = pns.data.strukturalEselonDetail;

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
      {/* Gender per Jabatan Struktural */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <h3 className="font-semibold text-zinc-800">Komposisi gender jabatan struktural</h3>
            <p className="text-xs text-zinc-500">
              Klik eselon untuk melihat daftar ASN struktural.
            </p>
          </div>
          <div className="p-4">
            <GenderEselonTable rows={strukturalEselon} onOpenEselon={onOpenEselon} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-zinc-700">Jumlah jabatan struktural per eselon</h3>
          </div>
          <div className="p-4">
            <EselonGroupBars rows={pns.data.strukturalEselonGroup} onOpenEselon={onOpenEselon} />
          </div>
        </div>
      </div>

      {/* Jabatan Fungsional */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
          <h3 className="font-semibold text-zinc-800">Jabatan fungsional</h3>
          <p className="text-xs text-zinc-500">
            {totalJenis} jenis - {totalPegawai.toLocaleString('id-ID')} pegawai
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
        <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada jabatan ditemukan</p>
          ) : (
            filtered.map((r) => (
              <JabatanListItem
                key={r.namaJabatan}
                row={r}
                onOpen={() => onOpenJabatan(r.namaJabatan)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function JabatanListItem({ row, onOpen }: { row: RekapFungsionalRow; onOpen: () => void }) {
  const BADGE_COLORS = [
    'bg-emerald-50 text-emerald-700',
    'bg-blue-50 text-blue-700',
    'bg-violet-50 text-violet-700',
    'bg-amber-50 text-amber-700',
  ];
  const colorIdx = Math.abs(row.namaJabatan.charCodeAt(0) + row.namaJabatan.length) % BADGE_COLORS.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 truncate">{row.namaJabatan}</p>
        <p className="text-xs text-zinc-400">
          Ahli {row.jumlahAhli.toLocaleString('id-ID')} · Terampil {row.jumlahTerampil.toLocaleString('id-ID')}
        </p>
      </div>
      <span className={`rounded-full px-3 py-0.5 text-sm font-bold tabular-nums ${BADGE_COLORS[colorIdx]}`}>
        {row.jumlahTotal.toLocaleString('id-ID')}
      </span>
    </button>
  );
}

type JabatanAsnGroupKey = 'pns' | 'pppk' | 'pppkParuhWaktu';

const JABATAN_ASN_GROUPS: Array<{ key: JabatanAsnGroupKey; label: string }> = [
  { key: 'pns', label: 'PNS' },
  { key: 'pppk', label: 'PPPK' },
  { key: 'pppkParuhWaktu', label: 'PPPK Paruh Waktu' },
];

function JabatanAsnModal({
  target,
  onClose,
}: {
  target: JabatanDetailTarget;
  onClose: () => void;
}) {
  const [activeGroup, setActiveGroup] = useState<JabatanAsnGroupKey>('pns');
  const [state, setState] = useState<AsyncState<RekapJabatanAsnResponse>>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;

    async function load() {
      setState({ status: 'loading' });
      try {
        const data = target.type === 'eselon'
          ? await sidataApi.getRekapEselonAsn(target.eselon)
          : await sidataApi.getRekapJabatanAsn(target.jabatanNama);
        if (!ignore) setState({ status: 'done', data });
      } catch (e) {
        if (!ignore) {
          setState({ status: 'error', message: getErrorMessage(e, 'Gagal memuat daftar ASN jabatan') });
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [target]);

  const data = state.status === 'done' ? state.data : null;
  const rows = data?.groups[activeGroup] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{target.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.total.toLocaleString('id-ID')} ASN` : 'Memuat daftar ASN...'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => data && downloadJabatanAsnWorkbook(data)}
              disabled={!data}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => data && printJabatanAsnReport(data)}
              disabled={!data}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {JABATAN_ASN_GROUPS.map((group) => {
              const total = data?.groups[group.key].length ?? 0;
              const active = activeGroup === group.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveGroup(group.key)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {group.label} ({total.toLocaleString('id-ID')})
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {state.status === 'loading' ? <LoadingState label="Memuat daftar ASN..." /> : null}
          {state.status === 'error' ? <ErrorAlert message={state.message} /> : null}
          {data && rows.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Tidak ada ASN pada kelompok ini.
            </p>
          ) : null}
          {data && rows.length > 0 ? <JabatanAsnTable rows={rows} /> : null}
        </div>
      </div>
    </div>
  );
}

function JabatanAsnTable({ rows }: { rows: RekapJabatanAsnRow[] }) {
  return (
    <table className="w-full min-w-[920px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="px-3 py-2 text-left font-semibold text-slate-600">NIP/Nama</th>
          <th className="px-3 py-2 text-left font-semibold text-slate-600">Gol/TMT Gol</th>
          <th className="px-3 py-2 text-left font-semibold text-slate-600">Jabatan/TMT Jabatan</th>
          <th className="px-3 py-2 text-left font-semibold text-slate-600">OPD/Unit Kerja</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => {
          const unitDetail = row.unitKerjaNama && row.unitKerjaNama !== row.opdNama
            ? row.unitKerjaNama
            : null;

          return (
            <tr key={row.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 align-top">
                <p className="font-medium text-slate-800">{row.nip}</p>
                <p className="text-slate-600">{row.nama}</p>
              </td>
              <td className="px-3 py-2 align-top text-slate-600">
                <p>{row.golonganNama ?? '-'}</p>
                <p className="text-xs text-slate-400">{formatShortDate(row.tmtGolongan)}</p>
              </td>
              <td className="px-3 py-2 align-top text-slate-600">
                <p>{row.jabatanNama ?? '-'}</p>
                <p className="text-xs text-slate-400">{formatShortDate(row.tmtJabatan)}</p>
              </td>
              <td className="px-3 py-2 align-top text-slate-600">
                <p className="font-medium text-slate-700">{row.opdNama ?? '-'}</p>
                {unitDetail ? <p className="text-xs text-slate-400">{unitDetail}</p> : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Gender Eselon Table ───────────────────────────────────────────────────────

function GenderEselonTable({
  rows,
  onOpenEselon,
}: {
  rows: RekapStrukturalEselonRow[];
  onOpenEselon: (eselon: string) => void;
}) {
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
              <tr
                key={r.eselon}
                className={r.terisi > 0 ? 'cursor-pointer hover:bg-zinc-50' : ''}
                onClick={() => r.terisi > 0 && onOpenEselon(r.eselon)}
              >
                <td className="py-2 font-medium text-zinc-700">Eselon {r.eselon}</td>
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

function EselonGroupBars({
  rows,
  onOpenEselon,
}: {
  rows: RekapStrukturalEselonRow[];
  onOpenEselon: (eselon: string) => void;
}) {
  const maxTerisi = Math.max(...rows.map((r) => r.terisi), 1);
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <button
          key={r.eselon}
          type="button"
          disabled={r.terisi === 0}
          onClick={() => onOpenEselon(r.eselon)}
          className="block w-full space-y-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
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
        </button>
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
        <tr className="border-b border-zinc-200 bg-zinc-50">
          {headers.map((h, i) => (
            <th
              key={h}
              className={`px-2 py-2 text-xs font-semibold text-zinc-600 ${i === 0 ? 'text-left' : 'text-right'}`}
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
        <tr className="border-t border-zinc-200 bg-zinc-50">
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

function downloadWorkbook(data: RekapAsnResponse, lastUpdate: string) {
  const ringkasan = getReportMetrics(data);
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

function EksporSection({
  reportData,
  loading,
  lastUpdate,
  onDownload,
  onPrint,
}: {
  reportData: RekapAsnResponse | null;
  loading: boolean;
  lastUpdate: string;
  onDownload: () => void;
  onPrint: () => void;
}) {
  const ringkasan = reportData ? getReportMetrics(reportData) : [];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <h3 className="font-semibold text-zinc-800">Laporan dan ekspor</h3>
        <p className="text-xs text-zinc-500">Rekap lengkap dimuat saat Excel atau cetak dijalankan.</p>
      </div>
      {reportData ? (
        <div className="border-b border-zinc-100 p-4">
          <h4 className="mb-3 text-sm font-semibold text-zinc-700">Ringkasan laporan</h4>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ringkasan.map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-zinc-800">
                  {item.value.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-b border-zinc-100 px-4 py-3 text-sm text-zinc-500">
          Tampilan tab tetap ringan. Rekap lengkap hanya diambil ketika dibutuhkan untuk laporan.
        </div>
      )}
      <div className="divide-y divide-zinc-100">
        <ExportRow
          label="Unduh Excel rekap lengkap"
          desc="Multi-sheet: ringkasan, jenis ASN, golongan, pendidikan, dan jabatan"
          disabled={loading}
          loading={loading}
          onClick={onDownload}
        />
        <ExportRow
          label="Cetak / simpan PDF laporan"
          desc="Layout laporan lengkap siap cetak A4"
          disabled={loading}
          loading={loading}
          onClick={onPrint}
        />
      </div>
      <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
        Terakhir diperbarui: <span className="font-medium text-zinc-600">{lastUpdate}</span>
      </div>
    </div>
  );
}

function toJabatanSheetRows(rows: RekapJabatanAsnRow[]): SheetRow[] {
  return rows.map((row) => [
    row.nip,
    row.nama,
    row.golonganNama ?? '-',
    formatShortDate(row.tmtGolongan),
    row.jabatanNama ?? '-',
    formatShortDate(row.tmtJabatan),
    row.opdNama ?? '-',
    row.unitKerjaNama && row.unitKerjaNama !== row.opdNama ? row.unitKerjaNama : '-',
  ]);
}

function downloadJabatanAsnWorkbook(data: RekapJabatanAsnResponse) {
  const headers: SheetRow = ['NIP', 'Nama', 'Gol', 'TMT Gol', 'Jabatan', 'TMT Jabatan', 'OPD', 'Unit Kerja'];
  const columns = [130, 180, 54, 82, 280, 92, 260, 320];
  const buildRows = (rows: RekapJabatanAsnRow[]): SheetRow[] => [
    [data.jabatanNama],
    [`Total ${rows.length.toLocaleString('id-ID')} ASN`],
    [],
    headers,
    ...toJabatanSheetRows(rows),
  ];

  const workbook = buildExcelWorkbook([
    {
      name: 'PNS',
      columns,
      titleRowIndexes: [0],
      headerRowIndexes: [3],
      freezeRowCount: 4,
      rows: buildRows(data.groups.pns),
    },
    {
      name: 'PPPK',
      columns,
      titleRowIndexes: [0],
      headerRowIndexes: [3],
      freezeRowCount: 4,
      rows: buildRows(data.groups.pppk),
    },
    {
      name: 'PPPK Paruh Waktu',
      columns,
      titleRowIndexes: [0],
      headerRowIndexes: [3],
      freezeRowCount: 4,
      rows: buildRows(data.groups.pppkParuhWaktu),
    },
  ]);

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `asn-jabatan-${slugifyFileName(data.jabatanNama)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function printJabatanAsnReport(data: RekapJabatanAsnResponse) {
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) return;

  const renderRows = (rows: RekapJabatanAsnRow[]) => rows.map((row) => {
    const unitDetail = row.unitKerjaNama && row.unitKerjaNama !== row.opdNama
      ? `<br><span>${escapeHtml(row.unitKerjaNama)}</span>`
      : '';

    return `
      <tr>
        <td><strong>${escapeHtml(row.nip)}</strong><br>${escapeHtml(row.nama)}</td>
        <td>${escapeHtml(row.golonganNama ?? '-')}<br><span>${escapeHtml(formatShortDate(row.tmtGolongan))}</span></td>
        <td>${escapeHtml(row.jabatanNama ?? '-')}<br><span>${escapeHtml(formatShortDate(row.tmtJabatan))}</span></td>
        <td><strong>${escapeHtml(row.opdNama ?? '-')}</strong>${unitDetail}</td>
      </tr>
    `;
  }).join('');

  const renderGroup = (label: string, rows: RekapJabatanAsnRow[]) => `
    <h2>${escapeHtml(label)} (${rows.length.toLocaleString('id-ID')})</h2>
    <table>
      <thead>
        <tr>
          <th>NIP/NAMA</th>
          <th>Gol/TMT Gol</th>
          <th>Jabatan/TMT Jabatan</th>
          <th>OPD/Unit Kerja</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length > 0 ? renderRows(rows) : '<tr><td colspan="4">Tidak ada data</td></tr>'}
      </tbody>
    </table>
  `;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(data.jabatanNama)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          h2 { break-before: auto; font-size: 14px; margin: 18px 0 8px; }
          p { color: #475569; margin: 0 0 14px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; }
          span { color: #64748b; }
        </style>
      </head>
      <body>
        <h1>Daftar ASN Jabatan</h1>
        <p>${escapeHtml(data.jabatanNama)} - Total ${data.total.toLocaleString('id-ID')} ASN</p>
        ${renderGroup('PNS', data.groups.pns)}
        ${renderGroup('PPPK', data.groups.pppk)}
        ${renderGroup('PPPK Paruh Waktu', data.groups.pppkParuhWaktu)}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function formatJenisAsnLabel(value: string | null | undefined) {
  if (value === 'PPPK_PARUH_WAKTU') return 'PPPK Paruh Waktu';
  return value ?? '-';
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getIkhtisarMetrics(data: RekapIkhtisarResponse): ReportMetric[] {
  const totalPppk = data.pppkJk.total;
  return [
    { label: 'Total ASN', value: data.allJk.total },
    { label: 'PNS', value: Math.max(data.allJk.total - totalPppk, 0) },
    { label: 'PPPK', value: totalPppk },
    { label: 'Wanita', value: data.allJk.wanita },
  ];
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

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'jabatan';
}

function toSheetName(value: string) {
  return value.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
}

function buildExcelWorkbook(sheets: Array<{
  name: string;
  rows: SheetRow[];
  columns?: number[];
  headerRowIndexes?: number[];
  titleRowIndexes?: number[];
  freezeRowCount?: number;
}>) {
  const worksheets = sheets.map((sheet) => {
    const headerRows = new Set(sheet.headerRowIndexes ?? []);
    const titleRows = new Set(sheet.titleRowIndexes ?? []);
    const columns = sheet.columns
      ? sheet.columns.map((width) => `<Column ss:Width="${width}"/>`).join('')
      : '';

    const rows = sheet.rows.map((row, rowIndex) => {
      const cells = row.map((cell) => {
        const type = typeof cell === 'number' ? 'Number' : 'String';
        const styleId = titleRows.has(rowIndex)
          ? 'Title'
          : headerRows.has(rowIndex) ? 'Header' : 'Cell';
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
      }).join('');
      return `<Row ss:AutoFitHeight="1">${cells}</Row>`;
    }).join('');
    const worksheetOptions = sheet.freezeRowCount
      ? `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
          <FreezePanes/>
          <FrozenNoSplit/>
          <SplitHorizontal>${sheet.freezeRowCount}</SplitHorizontal>
          <TopRowBottomPane>${sheet.freezeRowCount}</TopRowBottomPane>
          <ActivePane>2</ActivePane>
        </WorksheetOptions>`
      : '';

    return `<Worksheet ss:Name="${escapeXml(toSheetName(sheet.name))}">
      <Table>${columns}${rows}</Table>
      ${worksheetOptions}
    </Worksheet>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Cell">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
    </Style>
    <Style ss:ID="Title">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:Bold="1" ss:Size="12"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
    </Style>
  </Styles>
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
  loading,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
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
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : (
        <Download className="h-4 w-4 text-zinc-400" />
      )}
    </button>
  );
}
