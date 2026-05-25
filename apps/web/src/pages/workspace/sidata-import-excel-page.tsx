import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  GitCompareArrows,
  Loader2,
  RefreshCw,
  Table2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
  formatDateTime,
  inputClass,
} from '@/components/workspace/ui';
import {
  sidataImportApi,
  type SiasnImportBatch,
  type SiasnImportSummary,
} from '@/lib/api/sidata-import';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TipePegawai = 'PNS' | 'PPPK' | 'PPPK_PARUH_WAKTU';

const TIPE_PEGAWAI_OPTIONS: Array<{
  value: TipePegawai;
  label: string;
  description: string;
  activeClass: string;
  inactiveClass: string;
}> = [
  {
    value: 'PNS',
    label: 'PNS',
    description: 'Pegawai Negeri Sipil',
    activeClass: 'border-blue-600 bg-blue-600 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
  },
  {
    value: 'PPPK',
    label: 'PPPK',
    description: 'Pegawai Pemerintah dengan Perjanjian Kerja',
    activeClass: 'border-violet-600 bg-violet-600 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
  },
  {
    value: 'PPPK_PARUH_WAKTU',
    label: 'PPPK Paruh Waktu',
    description: 'PPPK dengan jam kerja paruh waktu',
    activeClass: 'border-orange-500 bg-orange-500 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
  },
];

// Kolom wajib yang harus ada di file Excel
const REQUIRED_COLUMNS = [
  { header: 'NIP', alternates: 'NIP / No Induk Pegawai', note: 'Wajib, 18 digit' },
  { header: 'NAMA', alternates: 'Nama / Nama Lengkap', note: 'Wajib' },
  { header: 'UNIT ORGANISASI', alternates: 'Unit Kerja / Nama Unit', note: 'Wajib untuk mapping' },
  { header: 'JABATAN', alternates: 'Nama Jabatan / Jabatan', note: 'Wajib untuk mapping' },
  { header: 'GOLONGAN', alternates: 'Gol. Ruang / Golongan', note: 'Wajib untuk PNS' },
  { header: 'JENIS KELAMIN', alternates: 'JK / L/P / Gender', note: 'Opsional' },
  { header: 'PENDIDIKAN', alternates: 'Tingkat Pendidikan / Ijazah', note: 'Opsional' },
  { header: 'STATUS ASN', alternates: 'Status Kepegawaian', note: 'Opsional' },
];

const BLOCKED_COMMIT_STATUSES = ['PROCESSING', 'COMMITTED', 'FAILED', 'CANCELLED'];

function normalizeStatus(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

function isCommitSafe(summary: SiasnImportSummary | null): boolean {
  if (!summary) return false;
  const status = normalizeStatus(summary.status);
  return (
    summary.mappedRows > 0 &&
    summary.invalidRows === 0 &&
    summary.needsReviewRows === 0 &&
    summary.unmappedRows === 0 &&
    !BLOCKED_COMMIT_STATUSES.includes(status)
  );
}

function getCommitBlockReason(summary: SiasnImportSummary | null): string {
  if (!summary) return 'Ringkasan batch belum tersedia.';
  const status = normalizeStatus(summary.status);
  if (status === 'PROCESSING') return 'Batch sedang diproses. Tunggu proses selesai.';
  if (status === 'COMMITTED') return 'Batch sudah dicommit ke database.';
  if (status === 'FAILED') return 'Batch berstatus gagal.';
  if (status === 'CANCELLED') return 'Batch sudah dibatalkan.';
  if (summary.mappedRows <= 0) return 'Belum ada baris termapping. Jalankan Map terlebih dahulu.';
  if (summary.invalidRows > 0) return `Masih ada ${summary.invalidRows} baris invalid.`;
  if (summary.needsReviewRows > 0) return `Masih ada ${summary.needsReviewRows} baris perlu review.`;
  if (summary.unmappedRows > 0) return `Masih ada ${summary.unmappedRows} baris belum termapping.`;
  return 'Batch belum memenuhi syarat quality gate.';
}

function getTipePegawaiLabel(importType: string): string {
  if (importType === 'SIASN_ASN_PNS') return 'PNS';
  if (importType === 'SIASN_ASN_PPPK') return 'PPPK';
  if (importType === 'SIASN_ASN_PPPK_PARUH_WAKTU') return 'PPPK Paruh Waktu';
  return importType;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SidataImportExcelPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipePegawai, setTipePegawai] = useState<TipePegawai | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [batches, setBatches] = useState<SiasnImportBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SiasnImportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [mapping, setMapping] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedId) { setSummary(null); return; }
    void loadSummary(selectedId);
  }, [selectedId]);

  async function loadBatches() {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const all = await sidataImportApi.listAsnBatches();
      setBatches(all.slice(0, 10));
    } catch {
      setBatchesError('Gagal memuat daftar batch import.');
    } finally {
      setBatchesLoading(false);
    }
  }

  async function loadSummary(id: string) {
    setSummaryLoading(true);
    try {
      const s = await sidataImportApi.getAsnBatchSummary(id);
      setSummary(s);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile || !tipePegawai) return;

    setUploading(true);
    try {
      const result = await sidataImportApi.uploadAsnFile(selectedFile, tipePegawai);
      toast.success(`Upload berhasil — ${result.totalRows} baris dideteksi.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadBatches();
      setSelectedId(result.batchId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload gagal.');
    } finally {
      setUploading(false);
    }
  }

  async function handleMap() {
    if (!selectedId) return;
    setMapping(true);
    try {
      await sidataImportApi.mapAsnBatch(selectedId);
      toast.success('Map referensi dimulai. Refresh untuk melihat hasil.');
      await loadSummary(selectedId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjalankan map.');
    } finally {
      setMapping(false);
    }
  }

  async function handleCommit() {
    if (!selectedId || !isCommitSafe(summary)) return;
    setCommitting(true);
    try {
      await sidataImportApi.commitAsnBatch(selectedId);
      toast.success('Commit dimulai. Data master ASN akan diperbarui.');
      await loadSummary(selectedId);
      await loadBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal commit.');
    } finally {
      setCommitting(false);
    }
  }

  async function handleCancel() {
    if (!selectedId) return;
    setCancelling(true);
    try {
      await sidataImportApi.cancelAsnBatch(selectedId);
      toast.success('Batch dibatalkan.');
      await loadSummary(selectedId);
      await loadBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membatalkan batch.');
    } finally {
      setCancelling(false);
    }
  }

  const commitSafe = isCommitSafe(summary);
  const summaryStatus = normalizeStatus(summary?.status);
  const isProcessing = summaryStatus === 'PROCESSING';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Excel ASN"
        description="Unggah data ASN dari file spreadsheet Excel yang disiapkan secara manual."
      />

      {/* ── Panduan format kolom ─────────────────────────────────────── */}
      <SectionCard
        title="Format Kolom Excel"
        icon={Table2}
        description="Pastikan file Excel memiliki kolom-kolom berikut. Header tidak harus sama persis — sistem akan mendeteksi otomatis berdasarkan variasi nama yang umum."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Kolom Utama</th>
                <th className="pb-2 pr-4 font-medium">Variasi yang Diterima</th>
                <th className="pb-2 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {REQUIRED_COLUMNS.map((col) => (
                <tr key={col.header}>
                  <td className="py-2 pr-4 font-mono font-medium text-foreground">
                    {col.header}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{col.alternates}</td>
                  <td className="py-2 text-muted-foreground">{col.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Baris pertama harus berisi header kolom. Data dimulai dari baris kedua. Maksimal 50.000 baris per upload.
        </p>
      </SectionCard>

      {/* ── Form upload ───────────────────────────────────────────────── */}
      <SectionCard title="Upload File Excel" icon={Upload}>
        <form onSubmit={(e) => void handleUpload(e)} className="space-y-5">
          {/* Tipe pegawai */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis ASN *</label>
            <div className="flex flex-wrap gap-3">
              {TIPE_PEGAWAI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipePegawai(opt.value)}
                  className={[
                    'flex flex-col rounded-lg border-2 px-4 py-2.5 text-left transition-colors',
                    tipePegawai === opt.value ? opt.activeClass : opt.inactiveClass,
                  ].join(' ')}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-80">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">File Excel (.xlsx) *</label>
            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-emerald-800">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="shrink-0 text-emerald-600 hover:text-emerald-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Klik untuk pilih file <span className="font-medium text-foreground">.xlsx</span>
                </p>
                <p className="text-xs text-muted-foreground">Maksimal 25 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <ActionButton
            type="submit"
            icon={uploading ? Loader2 : Upload}
            disabled={!selectedFile || !tipePegawai || uploading}
            variant="primary"
          >
            {uploading ? 'Mengupload…' : 'Upload & Validasi'}
          </ActionButton>
        </form>
      </SectionCard>

      {/* ── Status batch terpilih ─────────────────────────────────────── */}
      {selectedId && (
        <SectionCard
          title="Status Batch"
          icon={GitCompareArrows}
          actions={
            <ActionButton
              icon={RefreshCw}
              variant="secondary"
              onClick={() => void loadSummary(selectedId)}
            >
              Refresh
            </ActionButton>
          }
        >
          {summaryLoading ? (
            <LoadingState message="Memuat ringkasan batch…" />
          ) : summary ? (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Baris" value={summary.totalRows} />
                <StatCard label="Valid" value={summary.validRows} tone="success" />
                <StatCard label="Invalid" value={summary.invalidRows} tone={summary.invalidRows > 0 ? 'danger' : 'neutral'} />
                <StatCard label="Perlu Review" value={summary.needsReviewRows} tone={summary.needsReviewRows > 0 ? 'warning' : 'neutral'} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Termapping" value={summary.mappedRows} tone={summary.mappedRows > 0 ? 'success' : 'neutral'} />
                <StatCard label="Belum Mapping" value={summary.unmappedRows} tone={summary.unmappedRows > 0 ? 'warning' : 'neutral'} />
                <StatCard label="Status" value={<StatusBadge status={summary.status} />} />
              </div>

              {/* Commit gate info */}
              {!commitSafe && summaryStatus !== 'COMMITTED' && summaryStatus !== 'CANCELLED' && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{getCommitBlockReason(summary)}</span>
                </div>
              )}

              {summaryStatus === 'COMMITTED' && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Batch sudah dicommit ke Master ASN.</span>
                </div>
              )}

              {/* Actions */}
              {summaryStatus !== 'COMMITTED' && summaryStatus !== 'CANCELLED' && (
                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    icon={mapping ? Loader2 : GitCompareArrows}
                    disabled={mapping || isProcessing}
                    onClick={() => void handleMap()}
                  >
                    {mapping ? 'Mapping…' : summary.mappedRows > 0 ? 'Remap Referensi' : 'Map Referensi'}
                  </ActionButton>

                  <ActionButton
                    icon={committing ? Loader2 : CheckCircle2}
                    variant="primary"
                    disabled={!commitSafe || committing || isProcessing}
                    onClick={() => void handleCommit()}
                  >
                    {committing ? 'Committing…' : 'Commit ke Master ASN'}
                  </ActionButton>

                  <ActionButton
                    icon={X}
                    variant="secondary"
                    disabled={cancelling || isProcessing}
                    onClick={() => void handleCancel()}
                  >
                    {cancelling ? 'Membatalkan…' : 'Batalkan Batch'}
                  </ActionButton>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Lihat detail issue per baris di{' '}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => navigate('/sidata/import/riwayat')}
                >
                  Riwayat Import
                </button>
                .
              </p>
            </div>
          ) : (
            <EmptyState message="Gagal memuat ringkasan batch." />
          )}
        </SectionCard>
      )}

      {/* ── Daftar batch terbaru ─────────────────────────────────────── */}
      <SectionCard
        title="Batch Import Terbaru"
        icon={FileSpreadsheet}
        description="10 batch terakhir. Klik baris untuk lihat status detail."
        actions={
          <ActionButton icon={RefreshCw} variant="secondary" onClick={() => void loadBatches()}>
            Refresh
          </ActionButton>
        }
      >
        {batchesError ? (
          <ErrorAlert message={batchesError} />
        ) : batchesLoading ? (
          <LoadingState message="Memuat daftar batch…" />
        ) : batches.length === 0 ? (
          <EmptyState message="Belum ada batch import." />
        ) : (
          <DataTable
            columns={[
              { key: 'id', label: 'Batch ID', render: (b: SiasnImportBatch) => (
                <span className="font-mono text-xs">{b.id.slice(0, 8)}…</span>
              )},
              { key: 'tipe', label: 'Jenis ASN', render: (b: SiasnImportBatch) => getTipePegawaiLabel(b.importType) },
              { key: 'total', label: 'Baris', render: (b: SiasnImportBatch) => b.totalRows },
              { key: 'status', label: 'Status', render: (b: SiasnImportBatch) => <StatusBadge status={b.status} /> },
              { key: 'at', label: 'Diunggah', render: (b: SiasnImportBatch) => formatDateTime(b.createdAt) },
            ]}
            data={batches}
            rowKey={(b) => b.id}
            onRowClick={(b) => setSelectedId(b.id)}
            selectedRowKey={selectedId ?? undefined}
          />
        )}
      </SectionCard>
    </div>
  );
}
