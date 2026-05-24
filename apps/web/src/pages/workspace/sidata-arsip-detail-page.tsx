import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  RefreshCcw,
  Users,
} from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  formatDate,
  formatDateTime,
} from '@/components/workspace/ui';
import {
  ASN_CHANGE_TYPE_LABEL,
  finalizeArchive,
  getArchive,
  getChanges,
  getMendekatiPensiun,
  type ArchiveListItem,
  type ChangeRow,
  type MendekatiPensiunRow,
  type PaginatedChanges,
} from '@/lib/api/asn-archive';

type TabKey =
  | 'MUTASI_JABATAN'
  | 'MUTASI_UNIT'
  | 'NAIK_PANGKAT'
  | 'PENSIUN'
  | 'ASN_BARU'
  | 'ASN_KELUAR'
  | 'TUGAS_BELAJAR'
  | 'KGB'
  | 'ALIH_JABATAN'
  | 'STATUS_BERUBAH'
  | 'MENDEKATI_PENSIUN';

const CHANGE_TABS: { key: TabKey; label: string; countKey?: keyof ArchiveListItem }[] = [
  { key: 'MUTASI_JABATAN', label: 'Mutasi Jabatan', countKey: 'countMutasiJabatan' },
  { key: 'MUTASI_UNIT', label: 'Mutasi Unit', countKey: 'countMutasiUnit' },
  { key: 'NAIK_PANGKAT', label: 'Naik Pangkat', countKey: 'countNaikPangkat' },
  { key: 'PENSIUN', label: 'Pensiun', countKey: 'countPensiun' },
  { key: 'ASN_BARU', label: 'ASN Baru', countKey: 'countAsnBaru' },
  { key: 'ASN_KELUAR', label: 'ASN Keluar', countKey: 'countAsnKeluar' },
  { key: 'TUGAS_BELAJAR', label: 'Tugas Belajar', countKey: 'countTugasBelajar' },
  { key: 'KGB', label: 'KGB', countKey: 'countKgb' },
  { key: 'ALIH_JABATAN', label: 'Alih Jabatan', countKey: 'countAlihJabatan' },
  { key: 'STATUS_BERUBAH', label: 'Status Berubah', countKey: 'countStatusBerubah' },
  { key: 'MENDEKATI_PENSIUN', label: 'Mendekati Pensiun' },
];

function FieldDiff({ sebelum, sesudah }: {
  sebelum: Record<string, unknown> | null;
  sesudah: Record<string, unknown> | null;
}) {
  const keys = Array.from(new Set([
    ...Object.keys(sebelum ?? {}),
    ...Object.keys(sesudah ?? {}),
  ]));

  if (keys.length === 0) return <span className="text-[#73816e]">-</span>;

  return (
    <div className="space-y-1">
      {keys.map((k) => {
        const before = sebelum?.[k];
        const after = sesudah?.[k];
        const beforeStr = before != null ? String(before) : '-';
        const afterStr = after != null ? String(after) : '-';
        return (
          <div key={k} className="text-xs">
            <span className="font-medium text-[#496247]">{k}: </span>
            {before !== after ? (
              <>
                <span className="text-rose-600 line-through">{beforeStr}</span>
                {' → '}
                <span className="font-medium text-[#12815f]">{afterStr}</span>
              </>
            ) : (
              <span>{afterStr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChangesTab({ archiveId, changeType }: { archiveId: string; changeType: string }) {
  const [data, setData] = useState<PaginatedChanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    getChanges(archiveId, { changeType, search: search || undefined, page, limit: 20 })
      .then((d) => { if (mounted) setData(d); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat data'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [archiveId, changeType, search, page]);

  useEffect(() => load(), [load]);

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="h-9 w-64 rounded-md border border-[#cfe1da] bg-[#fbfdf8] px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#8fd8df]"
          placeholder="Cari NIP / Nama..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <ActionButton variant="secondary" onClick={handleSearch}>Cari</ActionButton>
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label={`Memuat ${ASN_CHANGE_TYPE_LABEL[changeType] ?? changeType}`} />
      ) : data && data.items.length > 0 ? (
        <>
          <DataTable<ChangeRow>
            items={data.items}
            keyField="id"
            columns={[
              {
                key: 'nip',
                header: 'NIP',
                className: 'w-36',
                render: (item) => (
                  <div>
                    <div className="font-mono text-xs">{item.nip}</div>
                    <div className="mt-0.5 font-semibold text-[#18343a]">{item.nama}</div>
                  </div>
                ),
              },
              {
                key: 'sebelum',
                header: 'Sebelum',
                render: (item) => <FieldDiff sebelum={item.fieldSebelum} sesudah={null} />,
              },
              {
                key: 'sesudah',
                header: 'Sesudah',
                render: (item) => <FieldDiff sebelum={null} sesudah={item.fieldSesudah} />,
              },
              {
                key: 'detectedAt',
                header: 'Terdeteksi',
                className: 'w-36',
                render: (item) => (
                  <span className="text-xs text-[#73816e]">{formatDateTime(item.detectedAt)}</span>
                ),
              },
            ]}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#73816e]">
                {data.total.toLocaleString('id-ID')} data · Halaman {page}/{totalPages}
              </span>
              <div className="flex gap-1">
                <ActionButton variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </ActionButton>
                <ActionButton variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </ActionButton>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="Tidak ada data" description="Tidak ada perubahan jenis ini pada periode ini." />
      )}
    </div>
  );
}

function MendekatiPensiunTab() {
  const [items, setItems] = useState<MendekatiPensiunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulanKedepan, setBulanKedepan] = useState(6);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    getMendekatiPensiun(bulanKedepan)
      .then((d) => { if (mounted) setItems(d); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat data'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [bulanKedepan]);

  useEffect(() => load(), [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#18343a]">Tampilkan ASN pensiun dalam</span>
        <select
          className="h-9 rounded-md border border-[#cfe1da] bg-[#fbfdf8] px-2 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
          value={bulanKedepan}
          onChange={(e) => setBulanKedepan(Number(e.target.value))}
        >
          {[3, 6, 9, 12, 18, 24].map((n) => (
            <option key={n} value={n}>{n} bulan ke depan</option>
          ))}
        </select>
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat data mendekati pensiun" />
      ) : items.length > 0 ? (
        <DataTable<MendekatiPensiunRow>
          items={items}
          keyField="id"
          columns={[
            {
              key: 'asn',
              header: 'ASN',
              render: (item) => (
                <div>
                  <div className="font-mono text-xs">{item.nip}</div>
                  <div className="mt-0.5 font-semibold text-[#18343a]">{item.nama}</div>
                </div>
              ),
            },
            {
              key: 'jabatan',
              header: 'Jabatan',
              render: (item) => (
                <div>
                  <div>{item.jabatanNama ?? '-'}</div>
                  <div className="mt-0.5 text-xs text-[#73816e]">{item.unitKerjaNama ?? '-'}</div>
                </div>
              ),
            },
            {
              key: 'golongan',
              header: 'Golongan',
              className: 'w-32',
              render: (item) => item.golonganNama ?? '-',
            },
            {
              key: 'tmtPensiun',
              header: 'TMT Pensiun',
              className: 'w-36',
              render: (item) => (
                <div>
                  <div>{formatDate(item.tmtPensiun)}</div>
                  <div className="mt-0.5">
                    <StatusBadge
                      tone={item.sisaBulan <= 3 ? 'danger' : item.sisaBulan <= 6 ? 'warning' : 'info'}
                      value={`${item.sisaBulan} bulan lagi`}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="Tidak ada ASN mendekati pensiun"
          description={`Tidak ada ASN yang akan pensiun dalam ${bulanKedepan} bulan ke depan.`}
          icon={Clock}
        />
      )}
    </div>
  );
}

export function SidataArsipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<ArchiveListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('MUTASI_JABATAN');
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  const loadArchive = useCallback(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError('');
    getArchive(id)
      .then((d) => { if (mounted) setArchive(d); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat arsip'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => { loadArchive(); }, [loadArchive]);

  function handleFinalize() {
    if (!id || !archive) return;
    if (!window.confirm(`Finalisasi arsip ${archive.label}? Data tidak akan dapat diubah setelah finalisasi.`)) return;
    setFinalizing(true);
    setFinalizeError('');
    finalizeArchive(id)
      .then((updated) => setArchive(updated))
      .catch((e: unknown) => setFinalizeError(e instanceof Error ? e.message : 'Gagal finalisasi'))
      .finally(() => setFinalizing(false));
  }

  if (loading) return <LoadingState label="Memuat detail arsip" />;
  if (error) return <ErrorAlert message={error} />;
  if (!archive) return null;

  const totalChanges =
    archive.countMutasiJabatan + archive.countMutasiUnit + archive.countNaikPangkat +
    archive.countPensiun + archive.countAsnBaru + archive.countAsnKeluar +
    archive.countTugasBelajar + archive.countKgb + archive.countAlihJabatan + archive.countStatusBerubah;

  function getCount(tab: typeof CHANGE_TABS[number]): number {
    if (!tab.countKey || !archive) return 0;
    return archive[tab.countKey] as number;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Arsip ${archive.label}`}
        description={`Snapshot data ASN dan perubahan terdeteksi · Total ${totalChanges.toLocaleString('id-ID')} perubahan`}
        meta={
          <div className="flex gap-2">
            <StatusBadge value="SIDATA" tone="dark" />
            <StatusBadge
              value={archive.status}
              tone={archive.status === 'FINAL' ? 'success' : 'warning'}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <ActionButton icon={ArrowLeft} variant="secondary" onClick={() => navigate('/sidata/arsip')}>
              Kembali
            </ActionButton>
            {archive.status === 'DRAFT' && (
              <ActionButton
                icon={finalizing ? Loader2 : Lock}
                variant="primary"
                disabled={finalizing}
                onClick={handleFinalize}
              >
                {finalizing ? 'Memproses...' : 'Finalisasi'}
              </ActionButton>
            )}
            {archive.status === 'FINAL' && (
              <div className="flex items-center gap-1.5 rounded-md border border-[#91d9bf] bg-[#e4f8ef] px-3 py-2 text-sm font-semibold text-[#12815f]">
                <CheckCircle2 className="size-4" />
                Final {formatDate(archive.finalizedAt)}
              </div>
            )}
          </div>
        }
      />

      {finalizeError ? <ErrorAlert message={finalizeError} /> : null}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total ASN" value={archive.totalAsn.toLocaleString('id-ID')} icon={Users} tone="info" />
        <StatCard label="PNS" value={archive.totalPns.toLocaleString('id-ID')} tone="neutral" />
        <StatCard label="PPPK" value={archive.totalPppk.toLocaleString('id-ID')} tone="neutral" />
        <StatCard label="Total Perubahan" value={totalChanges.toLocaleString('id-ID')} tone="warning" icon={AlertTriangle} />
      </div>

      {/* Change summary row */}
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CHANGE_TABS.filter((t) => t.countKey).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`min-w-0 rounded-lg border px-4 py-3 text-left transition-colors hover:border-[#0e7c86] hover:bg-[#f0f9f7] ${
              activeTab === tab.key ? 'border-[#0e7c86] bg-[#e7f6f5]' : 'border-[#cfe1da] bg-[#fbfdf8]'
            }`}
          >
            <div className="text-xl font-semibold text-[#18343a]">{getCount(tab)}</div>
            <div className="mt-0.5 text-xs font-medium text-[#73816e]">{tab.label}</div>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('MENDEKATI_PENSIUN')}
          className={`min-w-0 rounded-lg border px-4 py-3 text-left transition-colors hover:border-[#0e7c86] hover:bg-[#f0f9f7] ${
            activeTab === 'MENDEKATI_PENSIUN' ? 'border-[#0e7c86] bg-[#e7f6f5]' : 'border-[#cfe1da] bg-[#fbfdf8]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[#18343a]">
            <Clock className="size-4" />
          </div>
          <div className="mt-0.5 text-xs font-medium text-[#73816e]">Mendekati Pensiun</div>
        </button>
      </div>

      {/* Tab header */}
      <div className="flex overflow-x-auto border-b border-[#cfe1da]">
        {CHANGE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-[#0e7c86] text-[#0e7c86]'
                : 'border-transparent text-[#73816e] hover:text-[#18343a]'
            }`}
          >
            {tab.label}
            {tab.countKey && archive[tab.countKey] ? (
              <span className="ml-1.5 rounded bg-[#d8f0e8] px-1.5 py-0.5 text-xs text-[#12815f]">
                {archive[tab.countKey] as number}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <SectionCard>
        {activeTab === 'MENDEKATI_PENSIUN' ? (
          <MendekatiPensiunTab />
        ) : (
          <ChangesTab key={`${id}-${activeTab}`} archiveId={id!} changeType={activeTab} />
        )}
      </SectionCard>
    </div>
  );
}
