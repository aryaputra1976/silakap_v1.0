import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Archive, Database, Eye, Loader2, Plus, RefreshCcw } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  formatDateTime,
  inputClass,
} from '@/components/workspace/ui';
import {
  createArchive,
  createArchiveFromBatch,
  listArchives,
  listEligibleBatches,
  type ArchiveListItem,
  type EligibleBatchItem,
} from '@/lib/api/asn-archive';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type ArchiveMode = 'live' | 'batch';

function importTypeLabel(importType: string): string {
  const map: Record<string, string> = {
    SIASN_ASN: 'ASN (Semua)',
    SIASN_ASN_PNS: 'ASN PNS',
    SIASN_ASN_PPPK: 'ASN PPPK',
    SIASN_ASN_PPPK_PARUH_WAKTU: 'ASN PPPK Paruh Waktu',
  };
  return map[importType] ?? importType;
}

function CreateArchiveModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<ArchiveMode>('live');
  const [bulan, setBulan] = useState(CURRENT_MONTH);
  const [tahun, setTahun] = useState(CURRENT_YEAR);
  const [batches, setBatches] = useState<EligibleBatchItem[]>([]);
  const [batchId, setBatchId] = useState('');
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load eligible batches when mode switches to batch
  useEffect(() => {
    if (!open || mode !== 'batch') return;
    setLoadingBatches(true);
    setBatches([]);
    listEligibleBatches()
      .then(data => {
        setBatches(data);
        if (data.length > 0) setBatchId(data[0].id);
        else setBatchId('');
      })
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [open, mode]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('live');
      setBulan(CURRENT_MONTH);
      setTahun(CURRENT_YEAR);
      setBatches([]);
      setBatchId('');
      setError('');
    }
  }, [open]);

  function handleSubmit() {
    if (mode === 'batch' && !batchId) {
      setError('Pilih batch import terlebih dahulu');
      return;
    }
    setLoading(true);
    setError('');
    const req = mode === 'live'
      ? createArchive({ bulan, tahun })
      : createArchiveFromBatch({ bulan, tahun, batchId });
    req
      .then(() => { onSuccess(); onClose(); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Gagal membuat arsip'))
      .finally(() => setLoading(false));
  }

  if (!open) return null;

  const years = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
  const selectedBatch = batches.find(b => b.id === batchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#d8e5d3] bg-white shadow-xl">
        <div className="border-b border-[#d8e5d3] px-6 py-4">
          <h2 className="text-base font-semibold text-[#102f2b]">Buat Arsip Bulanan ASN</h2>
          <p className="mt-1 text-sm text-[#6d7e68]">
            Pilih sumber data dan periode arsip yang akan dibuat.
          </p>
        </div>
        <div className="space-y-5 p-6">
          {error ? <ErrorAlert message={error} /> : null}

          {/* Mode toggle */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-[#173c36]">Sumber Data</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  mode === 'live'
                    ? 'border-[#2f7a5e] bg-[#eaf5ef] text-[#173c36] font-semibold'
                    : 'border-[#d8e5d3] bg-white text-[#6d7e68] hover:border-[#9dc4b0]'
                }`}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span>Data ASN Live</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('batch')}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  mode === 'batch'
                    ? 'border-[#2f7a5e] bg-[#eaf5ef] text-[#173c36] font-semibold'
                    : 'border-[#d8e5d3] bg-white text-[#6d7e68] hover:border-[#9dc4b0]'
                }`}
              >
                <Archive className="h-4 w-4 shrink-0" />
                <span>Dari Import Batch</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-[#73816e]">
              {mode === 'live'
                ? 'Snapshot diambil dari data ASN yang aktif saat ini di sistem.'
                : 'Snapshot dibangun dari data staging batch import SIASN yang sudah di-commit.'}
            </p>
          </div>

          {/* Periode */}
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-[#173c36]">Bulan</span>
              <select
                className={inputClass}
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
              >
                {BULAN_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-[#173c36]">Tahun</span>
              <select
                className={inputClass}
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>

          {/* Batch picker — hanya tampil di mode batch */}
          {mode === 'batch' && (
            <div className="grid gap-1.5 text-sm">
              <span className="font-semibold text-[#173c36]">Batch Import</span>
              {loadingBatches ? (
                <div className="flex items-center gap-2 text-[#73816e]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat daftar batch…</span>
                </div>
              ) : batches.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Tidak ada batch SIASN ASN berstatus COMMITTED. Pastikan sudah melakukan import dan commit data SIASN ASN terlebih dahulu.
                </p>
              ) : (
                <>
                  <select
                    className={inputClass}
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {importTypeLabel(b.importType)} — {b.validRows.toLocaleString('id-ID')} ASN
                        {b.fileName ? ` · ${b.fileName}` : ''}
                        {b.finishedAt ? ` · ${new Date(b.finishedAt).toLocaleDateString('id-ID')}` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedBatch && (
                    <div className="rounded-lg border border-[#d8e5d3] bg-[#f5faf7] px-3 py-2 text-xs text-[#4a6356]">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span><span className="font-medium">Tipe:</span> {importTypeLabel(selectedBatch.importType)}</span>
                        <span><span className="font-medium">Total baris:</span> {selectedBatch.totalRows.toLocaleString('id-ID')}</span>
                        <span><span className="font-medium">Valid:</span> {selectedBatch.validRows.toLocaleString('id-ID')}</span>
                        {selectedBatch.finishedAt && (
                          <span><span className="font-medium">Selesai:</span> {new Date(selectedBatch.finishedAt).toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#d8e5d3] px-6 py-4">
          <ActionButton variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </ActionButton>
          <ActionButton
            icon={loading ? Loader2 : Archive}
            onClick={handleSubmit}
            disabled={loading || (mode === 'batch' && (loadingBatches || batches.length === 0))}
          >
            {loading ? 'Memproses...' : 'Buat Arsip'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function SidataArsipPage() {
  const [items, setItems] = useState<ArchiveListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    listArchives()
      .then((data) => { if (mounted) setItems(data); })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat arsip'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => load(), [load]);

  const totalChanges = (item: ArchiveListItem) =>
    item.countMutasiJabatan + item.countMutasiUnit + item.countNaikPangkat +
    item.countPensiun + item.countAsnBaru + item.countAsnKeluar +
    item.countTugasBelajar + item.countKgb + item.countAlihJabatan + item.countStatusBerubah;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Arsip Bulanan ASN"
        description="Snapshot data kepegawaian per bulan beserta deteksi perubahan: mutasi, kenaikan pangkat, pensiun, dan lainnya."
        meta={<StatusBadge value="SIDATA" tone="dark" />}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton icon={loading ? Loader2 : RefreshCcw} variant="secondary" disabled={loading} onClick={load}>
              Refresh
            </ActionButton>
            <ActionButton icon={Plus} onClick={() => setShowCreate(true)}>
              Buat Arsip
            </ActionButton>
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading && items.length === 0 ? (
        <LoadingState label="Memuat daftar arsip" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada arsip"
          description="Klik tombol 'Buat Arsip' untuk membuat snapshot data ASN bulan ini."
          icon={Archive}
        />
      ) : (
        <SectionCard title={`${items.length} Arsip Tersedia`}>
          <DataTable
            items={items}
            keyField="id"
            columns={[
              {
                key: 'label',
                header: 'Periode',
                className: 'w-36',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">{item.label}</div>
                    <div className="mt-0.5 text-xs text-[#73816e]">
                      {formatDateTime(item.archivedAt) !== '-' ? `Diarsipkan ${formatDateTime(item.archivedAt)}` : 'Belum diarsipkan'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                className: 'w-24',
                render: (item) => (
                  <StatusBadge
                    value={item.status}
                    tone={item.status === 'FINAL' ? 'success' : 'warning'}
                  />
                ),
              },
              {
                key: 'totalAsn',
                header: 'Total ASN',
                className: 'w-32',
                render: (item) => (
                  <div>
                    <div className="font-semibold">{item.totalAsn.toLocaleString('id-ID')}</div>
                    <div className="mt-0.5 text-xs text-[#73816e]">
                      PNS {item.totalPns.toLocaleString('id-ID')} · PPPK {item.totalPppk.toLocaleString('id-ID')}
                    </div>
                  </div>
                ),
              },
              {
                key: 'perubahan',
                header: 'Perubahan Terdeteksi',
                render: (item) => (
                  <div className="flex flex-wrap gap-1">
                    {item.countAsnBaru > 0 && <span className="rounded bg-[#e6f6ee] px-1.5 py-0.5 text-xs text-[#087052]">+{item.countAsnBaru} Baru</span>}
                    {item.countAsnKeluar > 0 && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700">-{item.countAsnKeluar} Keluar</span>}
                    {item.countMutasiJabatan > 0 && <span className="rounded bg-[#fff6d7] px-1.5 py-0.5 text-xs text-[#7d5a00]">{item.countMutasiJabatan} Mutasi Jabatan</span>}
                    {item.countNaikPangkat > 0 && <span className="rounded bg-[#e7f6f5] px-1.5 py-0.5 text-xs text-[#096672]">{item.countNaikPangkat} Naik Pangkat</span>}
                    {item.countPensiun > 0 && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700">{item.countPensiun} Pensiun</span>}
                    {totalChanges(item) === 0 && <span className="text-xs text-[#73816e]">Tidak ada perubahan</span>}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'w-24',
                render: (item) => (
                  <ActionButton
                    icon={Eye}
                    variant="ghost"
                    onClick={() => navigate(`/sidata/arsip/${item.id}`)}
                  >
                    Detail
                  </ActionButton>
                ),
              },
            ]}
          />
        </SectionCard>
      )}

      <CreateArchiveModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={load}
      />
    </div>
  );
}
