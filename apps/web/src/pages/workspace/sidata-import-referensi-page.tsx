import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  BookOpen,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileUp,
  Layers3,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  formatDateTime,
  formatFileSize,
} from '@/components/workspace/ui';

type SidataReferenceType =
  | 'UNIT_ORGANISASI'
  | 'GOLONGAN'
  | 'PANGKAT'
  | 'PENDIDIKAN'
  | 'AGAMA'
  | 'JENIS_KELAMIN'
  | 'STATUS_KAWIN'
  | 'KEDUDUKAN_HUKUM'
  | 'JENIS_ASN';

type SidataJabatanType = 'STRUKTURAL' | 'FUNGSIONAL' | 'PELAKSANA';

type SidataImportBatch = {
  id: string;
  fileName?: string | null;
  originalFileName?: string | null;
  importType?: string | null;
  referenceType?: SidataReferenceType | string | null;
  jenisJabatan?: SidataJabatanType | string | null;
  status?: string | null;
  totalRows?: number | null;
  validRows?: number | null;
  invalidRows?: number | null;
  warningRows?: number | null;
  mappedRows?: number | null;
  needsReviewRows?: number | null;
  unmappedRows?: number | null;
  committedRows?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SidataImportSummary = {
  totalRows?: number | null;
  validRows?: number | null;
  invalidRows?: number | null;
  warningRows?: number | null;
  mappedRows?: number | null;
  needsReviewRows?: number | null;
  unmappedRows?: number | null;
  committedRows?: number | null;
};

type SidataUploadResponse = {
  batch?: SidataImportBatch;
  id?: string;
  batchId?: string;
  fileName?: string;
  status?: string;
  message?: string;
};

type SidataActionResult = {
  success?: boolean;
  message?: string;
  batch?: SidataImportBatch;
  summary?: SidataImportSummary;
  updated?: number;
  committed?: number;
  skipped?: number;
};

type BatchListResponse = SidataImportBatch[] | PaginatedResult<SidataImportBatch>;
type JabatanUploadState = Record<SidataJabatanType, File | null>;
type JabatanUploadLoading = Record<SidataJabatanType, boolean>;

const EXCEL_ACCEPT =
  '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

const JABATAN_TYPES: Array<{ value: SidataJabatanType; title: string; description: string }> = [
  {
    value: 'STRUKTURAL',
    title: 'Jabatan Struktural',
    description: 'Upload referensi jabatan pimpinan tinggi, administrator, dan pengawas.',
  },
  {
    value: 'FUNGSIONAL',
    title: 'Jabatan Fungsional',
    description: 'Upload referensi jabatan fungsional sesuai data SIASN.',
  },
  {
    value: 'PELAKSANA',
    title: 'Jabatan Pelaksana',
    description: 'Upload referensi jabatan pelaksana sebagai dasar mapping ASN.',
  },
];

const REFERENCE_TYPES: Array<{ value: SidataReferenceType; label: string; description: string }> =
  [
    {
      value: 'UNIT_ORGANISASI',
      label: 'Unit Organisasi',
      description: 'Referensi OPD, unit kerja, dan struktur organisasi.',
    },
    { value: 'GOLONGAN', label: 'Golongan', description: 'Referensi golongan ASN.' },
    { value: 'PANGKAT', label: 'Pangkat', description: 'Referensi pangkat dan ruang.' },
    {
      value: 'PENDIDIKAN',
      label: 'Pendidikan',
      description: 'Referensi tingkat dan nama pendidikan.',
    },
    { value: 'AGAMA', label: 'Agama', description: 'Referensi agama.' },
    { value: 'JENIS_KELAMIN', label: 'Jenis Kelamin', description: 'Referensi jenis kelamin.' },
    {
      value: 'STATUS_KAWIN',
      label: 'Status Kawin',
      description: 'Referensi status perkawinan.',
    },
    {
      value: 'KEDUDUKAN_HUKUM',
      label: 'Kedudukan Hukum',
      description: 'Referensi status kedudukan hukum ASN.',
    },
    {
      value: 'JENIS_ASN',
      label: 'Jenis ASN',
      description: 'Referensi jenis ASN, seperti PNS dan PPPK.',
    },
  ];

function normalizeList<T>(response: T[] | PaginatedResult<T>): T[] {
  return Array.isArray(response) ? response : response.items;
}

function toNumber(value: number | null | undefined) {
  return value ?? 0;
}

function shortId(id: string) {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

function getBatchFileName(batch: SidataImportBatch) {
  return batch.originalFileName ?? batch.fileName ?? '-';
}

function getBatchReferenceLabel(batch: SidataImportBatch) {
  return batch.jenisJabatan ?? batch.referenceType ?? batch.importType ?? '-';
}

function isCommitted(batch: SidataImportBatch) {
  return (batch.status ?? '').toUpperCase() === 'COMMITTED';
}

function isCancellable(batch: SidataImportBatch) {
  const s = (batch.status ?? '').toUpperCase();
  return !['COMMITTED', 'FAILED', 'CANCELLED', 'PROCESSING'].includes(s);
}

const JABATAN_IMPORT_TYPE_PREFIXES = [
  'SIASN_REFERENCE_JABATAN_STRUKTURAL',
  'SIASN_REFERENCE_JABATAN_FUNGSIONAL',
  'SIASN_REFERENCE_JABATAN_PELAKSANA',
];

function isJabatanBatch(batch: SidataImportBatch) {
  if (batch.jenisJabatan) return true;
  const t = (batch.importType ?? '').toUpperCase();
  return JABATAN_IMPORT_TYPE_PREFIXES.some((prefix) => t === prefix);
}

function isJfProfileBatch(batch: SidataImportBatch) {
  return (batch.importType ?? '').toUpperCase() === 'SIASN_REFERENCE_JF_PROFILE';
}

function getErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

export function SidataImportReferensiPage() {
  const [jabatanFiles, setJabatanFiles] = useState<JabatanUploadState>({
    STRUKTURAL: null,
    FUNGSIONAL: null,
    PELAKSANA: null,
  });

  const [jabatanLoading, setJabatanLoading] = useState<JabatanUploadLoading>({
    STRUKTURAL: false,
    FUNGSIONAL: false,
    PELAKSANA: false,
  });

  const [referenceType, setReferenceType] = useState<SidataReferenceType>('UNIT_ORGANISASI');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);

  const [jfProfileFile, setJfProfileFile] = useState<File | null>(null);
  const [jfProfileUploading, setJfProfileUploading] = useState(false);

  const [batches, setBatches] = useState<SidataImportBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SidataImportBatch | null>(null);
  const [summary, setSummary] = useState<SidataImportSummary | null>(null);

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  const selectedBatchRef = useRef(selectedBatch);
  selectedBatchRef.current = selectedBatch;

  const selectedReferenceInfo = useMemo(
    () => REFERENCE_TYPES.find((item) => item.value === referenceType),
    [referenceType],
  );

  const hasProcessingBatch = useMemo(
    () => batches.some((b) => (b.status ?? '').toUpperCase() === 'PROCESSING'),
    [batches],
  );

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setSummary(null);
      setSummaryError('');
      return;
    }
    void loadSummary(selectedBatch.id);
  }, [selectedBatch]);

  const pollRef = useRef<(() => Promise<void>) | null>(null);

  async function silentRefreshBatches() {
    try {
      const result = await apiClient.get<BatchListResponse>('/sidata/import/reference-batches');
      const normalized = normalizeList(result);
      setBatches(normalized);
      const current = selectedBatchRef.current;
      if (current) {
        const updated = normalized.find((item) => item.id === current.id);
        setSelectedBatch(updated ?? null);
      }
    } catch {
      // silent
    }
  }

  pollRef.current = silentRefreshBatches;

  useEffect(() => {
    if (!hasProcessingBatch) return;
    const timer = setInterval(() => { void pollRef.current?.(); }, 4_000);
    return () => clearInterval(timer);
  }, [hasProcessingBatch]);

  async function loadBatches() {
    setLoadingBatches(true);
    setError('');
    try {
      const result = await apiClient.get<BatchListResponse>('/sidata/import/reference-batches');
      const normalized = normalizeList(result);
      setBatches(normalized);
      if (selectedBatch) {
        const updated = normalized.find((item) => item.id === selectedBatch.id);
        setSelectedBatch(updated ?? null);
      }
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat riwayat batch referensi'));
    } finally {
      setLoadingBatches(false);
    }
  }

  async function loadSummary(batchId: string) {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const result = await apiClient.get<SidataImportSummary>(
        `/sidata/import/reference-batches/${batchId}/summary`,
      );
      setSummary(result);
    } catch (caught) {
      setSummary(null);
      setSummaryError(getErrorMessage(caught, 'Gagal memuat summary batch'));
    } finally {
      setLoadingSummary(false);
    }
  }

  function handleJabatanFileChange(
    jenisJabatan: SidataJabatanType,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    setJabatanFiles((current) => ({ ...current, [jenisJabatan]: file }));
  }

  function resetJabatanFile(jenisJabatan: SidataJabatanType) {
    setJabatanFiles((current) => ({ ...current, [jenisJabatan]: null }));
  }

  function handleReferenceFileChange(event: ChangeEvent<HTMLInputElement>) {
    setReferenceFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = '';
  }

  async function uploadJabatan(jenisJabatan: SidataJabatanType) {
    const file = jabatanFiles[jenisJabatan];
    if (!file) {
      toast.error('Pilih file Excel terlebih dahulu.');
      return;
    }
    setJabatanLoading((current) => ({ ...current, [jenisJabatan]: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenisJabatan', jenisJabatan);
    try {
      const result = await apiClient.upload<SidataUploadResponse>(
        '/sidata/import/reference-jabatan/upload',
        formData,
      );
      toast.success(result.message ?? `Referensi jabatan ${jenisJabatan} berhasil diupload.`);
      resetJabatanFile(jenisJabatan);
      await loadBatches();
    } catch (caught) {
      toast.error(getErrorMessage(caught, `Gagal upload jabatan ${jenisJabatan}`));
    } finally {
      setJabatanLoading((current) => ({ ...current, [jenisJabatan]: false }));
    }
  }

  async function uploadReference() {
    if (!referenceFile) {
      toast.error('Pilih file Excel terlebih dahulu.');
      return;
    }
    setReferenceUploading(true);
    const formData = new FormData();
    formData.append('file', referenceFile);
    formData.append('referenceType', referenceType);
    try {
      const result = await apiClient.upload<SidataUploadResponse>(
        '/sidata/import/reference/upload',
        formData,
      );
      toast.success(
        result.message ??
          `Referensi ${selectedReferenceInfo?.label ?? referenceType} berhasil diupload.`,
      );
      setReferenceFile(null);
      await loadBatches();
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal upload referensi umum'));
    } finally {
      setReferenceUploading(false);
    }
  }

  async function uploadJfProfile() {
    if (!jfProfileFile) {
      toast.error('Pilih file Excel terlebih dahulu.');
      return;
    }
    setJfProfileUploading(true);
    const formData = new FormData();
    formData.append('file', jfProfileFile);
    try {
      const result = await apiClient.upload<SidataUploadResponse>(
        '/sidata/import/reference-jf-profile/upload',
        formData,
      );
      toast.success(result.message ?? 'Profil jabatan fungsional berhasil diupload.');
      setJfProfileFile(null);
      await loadBatches();
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal upload profil jabatan fungsional'));
    } finally {
      setJfProfileUploading(false);
    }
  }

  async function commitBatch(batch: SidataImportBatch) {
    if (isCommitted(batch)) {
      toast.info('Batch ini sudah committed.');
      return;
    }
    const confirmed = window.confirm(
      `Commit batch ${shortId(batch.id)} ke master referensi SIDATA? Proses ini akan menyimpan data valid ke tabel referensi utama.`,
    );
    if (!confirmed) return;

    setActionLoadingId(batch.id);
    const endpoint = isJabatanBatch(batch)
      ? `/sidata/import/reference-batches/${batch.id}/commit`
      : isJfProfileBatch(batch)
        ? `/sidata/import/reference-batches/${batch.id}/commit-jf-profile`
        : `/sidata/import/reference-batches/${batch.id}/commit-generic`;
    try {
      const result = await apiClient.post<SidataActionResult>(endpoint);
      toast.success(result.message ?? 'Commit referensi berhasil.');
      await loadBatches();
      if (selectedBatch?.id === batch.id) {
        await loadSummary(batch.id);
      }
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal commit batch referensi'));
    } finally {
      setActionLoadingId('');
    }
  }

  async function cancelBatch(batch: SidataImportBatch) {
    if (!isCancellable(batch)) {
      toast.info('Batch ini tidak dapat dibatalkan.');
      return;
    }
    const confirmed = window.confirm(
      `Batalkan batch ${shortId(batch.id)}? Data staging akan dihapus dan batch tidak dapat dilanjutkan.`,
    );
    if (!confirmed) return;

    setActionLoadingId(batch.id);
    try {
      await apiClient.post<SidataActionResult>(
        `/sidata/import/reference-batches/${batch.id}/cancel`,
      );
      toast.success('Batch referensi berhasil dibatalkan.');
      await loadBatches();
      if (selectedBatch?.id === batch.id) setSelectedBatch(null);
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'Gagal membatalkan batch referensi'));
    } finally {
      setActionLoadingId('');
    }
  }

  function toggleSelectedBatch(batch: SidataImportBatch) {
    setSelectedBatch(selectedBatch?.id === batch.id ? null : batch);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import Referensi SIDATA"
        description="Upload, validasi, dan commit master referensi SIDATA sebagai dasar mapping data ASN."
        meta={
          <>
            <StatusBadge value="SIDATA Referensi" tone="info" />
            <StatusBadge value="Jabatan" tone="dark" />
            <StatusBadge value="Referensi Umum" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loadingBatches}
            icon={RefreshCcw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {/* Upload Jabatan */}
      <SectionCard
        title="Upload Jabatan SIASN"
        description="Upload referensi jabatan struktural, fungsional, dan pelaksana dari Excel SIASN."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {JABATAN_TYPES.map((item) => {
            const file = jabatanFiles[item.value];
            const loading = jabatanLoading[item.value];

            return (
              <div
                key={item.value}
                className="flex min-h-[250px] flex-col justify-between rounded-lg border border-border bg-zinc-50/60 p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-zinc-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600">
                      <Layers3 className="size-5" />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-white p-4">
                    {file ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                          <FileSpreadsheet className="size-4 text-emerald-600" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-semibold text-zinc-700">
                          <FileUp className="size-4" />
                          Pilih file Excel
                        </div>
                        <p className="text-xs">Format .xlsx, .xls, atau .csv</p>
                      </div>
                    )}

                    <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
                      <Upload className="size-4" />
                      Pilih File
                      <input
                        accept={EXCEL_ACCEPT}
                        className="sr-only"
                        disabled={loading}
                        type="file"
                        onChange={(event) => handleJabatanFileChange(item.value, event)}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    disabled={!file || loading}
                    icon={loading ? Loader2 : CheckCircle2}
                    onClick={() => void uploadJabatan(item.value)}
                  >
                    {loading ? 'Mengupload…' : 'Upload'}
                  </ActionButton>
                  <ActionButton
                    disabled={!file || loading}
                    icon={RotateCcw}
                    onClick={() => resetJabatanFile(item.value)}
                    variant="secondary"
                  >
                    Batal
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Upload Profil Jabatan Fungsional BKN */}
      <SectionCard
        title="Upload Profil Jabatan Fungsional BKN"
        description="Upload data profil JF dari BKN (Database_Profil_JF_2024_BKN.xlsx) untuk mengisi detail jabatan fungsional seperti dasar hukum, tugas, tunjangan, dan persyaratan."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-lg border border-border bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600">
                <BookOpen className="size-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-950">Profil JF BKN</div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  File Excel dari BKN berisi nama jabatan, jenjang, dasar hukum, tugas jabatan,
                  persyaratan pendidikan, instansi pembina, besaran tunjangan, dan lainnya.
                  Data ini memperkaya referensi jabatan fungsional yang sudah ada.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
            {jfProfileFile ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  <span className="truncate">{jfProfileFile.name}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatFileSize(jfProfileFile.size)}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-zinc-700">
                  <FileUp className="size-4" />
                  Belum ada file dipilih
                </div>
                <p className="mt-1 text-xs">Pilih file .xlsx atau .xls dari BKN.</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
                <Upload className="size-4" />
                Pilih File
                <input
                  accept={EXCEL_ACCEPT}
                  className="sr-only"
                  disabled={jfProfileUploading}
                  type="file"
                  onChange={(event) => {
                    setJfProfileFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <ActionButton
                disabled={!jfProfileFile || jfProfileUploading}
                icon={jfProfileUploading ? Loader2 : CheckCircle2}
                onClick={() => void uploadJfProfile()}
              >
                {jfProfileUploading ? 'Mengupload…' : 'Upload Profil JF'}
              </ActionButton>
              <ActionButton
                disabled={!jfProfileFile || jfProfileUploading}
                icon={RotateCcw}
                onClick={() => setJfProfileFile(null)}
                variant="secondary"
              >
                Batal
              </ActionButton>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Upload Referensi Umum */}
      <SectionCard
        title="Upload Referensi Umum"
        description="Upload master referensi umum yang digunakan untuk validasi dan mapping data ASN."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-zinc-800">Jenis Referensi</span>
              <select
                className={inputClass}
                disabled={referenceUploading}
                value={referenceType}
                onChange={(event) => setReferenceType(event.target.value as SidataReferenceType)}
              >
                {REFERENCE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600">
                  <Database className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-950">
                    {selectedReferenceInfo?.label ?? referenceType}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {selectedReferenceInfo?.description ??
                      'Referensi umum untuk kebutuhan mapping SIDATA.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
            {referenceFile ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  <span className="truncate">{referenceFile.name}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatFileSize(referenceFile.size)}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-zinc-700">
                  <FileUp className="size-4" />
                  Belum ada file dipilih
                </div>
                <p className="mt-1 text-xs">Pilih file .xlsx, .xls, atau .csv.</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
                <Upload className="size-4" />
                Pilih File
                <input
                  accept={EXCEL_ACCEPT}
                  className="sr-only"
                  disabled={referenceUploading}
                  type="file"
                  onChange={handleReferenceFileChange}
                />
              </label>
              <ActionButton
                disabled={!referenceFile || referenceUploading}
                icon={referenceUploading ? Loader2 : CheckCircle2}
                onClick={() => void uploadReference()}
              >
                {referenceUploading ? 'Mengupload…' : 'Upload Referensi'}
              </ActionButton>
              <ActionButton
                disabled={!referenceFile || referenceUploading}
                icon={RotateCcw}
                onClick={() => setReferenceFile(null)}
                variant="secondary"
              >
                Batal
              </ActionButton>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Batch History */}
      <SectionCard
        title="Riwayat Batch Referensi"
        description="Daftar batch import referensi yang sudah diupload dan siap divalidasi atau dicommit."
        actions={
          <div className="flex items-center gap-2">
            {hasProcessingBatch && (
              <span className="flex animate-pulse items-center gap-1.5 text-xs font-medium text-amber-600">
                <Loader2 className="size-3 animate-spin" />
                Auto-refresh aktif
              </span>
            )}
            <StatusBadge value={`${batches.length} Batch`} tone="info" />
          </div>
        }
      >
        {loadingBatches ? (
          <LoadingState label="Memuat riwayat batch referensi" />
        ) : (
          <DataTable
            empty="Belum ada batch referensi"
            items={batches}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'id',
                header: 'Batch',
                render: (item) => (
                  <button
                    className="font-mono text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
                    type="button"
                    onClick={() => toggleSelectedBatch(item)}
                  >
                    {shortId(item.id)}
                  </button>
                ),
              },
              {
                key: 'file',
                header: 'File',
                render: (item) => (
                  <div className="max-w-[260px]">
                    <div className="truncate font-semibold text-zinc-900">
                      {getBatchFileName(item)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.importType ?? 'REFERENCE'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'type',
                header: 'Referensi',
                render: (item) => (
                  <div className="w-40 space-y-1">
                    <div className="truncate rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {getBatchReferenceLabel(item)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isJabatanBatch(item)
                        ? 'Jabatan SIASN'
                        : isJfProfileBatch(item)
                          ? 'Profil JF BKN'
                          : 'Referensi Umum'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'rows',
                header: 'Rows',
                render: (item) => (
                  <div className="grid gap-1 text-xs">
                    <span>Total: {toNumber(item.totalRows)}</span>
                    <span className="text-emerald-700">Valid: {toNumber(item.validRows)}</span>
                    <span className="text-rose-700">Invalid: {toNumber(item.invalidRows)}</span>
                    <span className="text-amber-700">Warning: {toNumber(item.warningRows)}</span>
                  </div>
                ),
              },
              {
                key: 'createdAt',
                header: 'Tanggal',
                render: (item) => (
                  <span className="text-xs">{formatDateTime(item.createdAt)}</span>
                ),
              },
              {
                key: 'action',
                header: 'Aksi',
                render: (item) => {
                  const committed = isCommitted(item);
                  const cancellable = isCancellable(item);
                  const loading = actionLoadingId === item.id;
                  const selected = selectedBatch?.id === item.id;
                  return (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        disabled={loading}
                        onClick={() => toggleSelectedBatch(item)}
                        variant={selected ? 'primary' : 'secondary'}
                      >
                        {selected ? 'Tutup' : 'Detail'}
                      </ActionButton>
                      {!committed ? (
                        <ActionButton
                          disabled={loading}
                          icon={loading ? Loader2 : ShieldCheck}
                          onClick={() => void commitBatch(item)}
                        >
                          {loading ? 'Memproses…' : 'Commit'}
                        </ActionButton>
                      ) : null}
                      {cancellable ? (
                        <ActionButton
                          disabled={loading}
                          icon={loading ? Loader2 : Ban}
                          onClick={() => void cancelBatch(item)}
                          variant="secondary"
                        >
                          Batalkan
                        </ActionButton>
                      ) : null}
                    </div>
                  );
                },
              },
            ]}
          />
        )}
      </SectionCard>

      {/* Summary */}
      <SectionCard
        title="Summary Batch Referensi"
        description="Ringkasan hasil validasi batch referensi yang dipilih."
      >
        {!selectedBatch ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Pilih batch referensi"
            description="Klik batch pada tabel riwayat untuk melihat ringkasan validasi dan status commit."
          />
        ) : loadingSummary ? (
          <LoadingState label="Memuat summary batch referensi" />
        ) : summaryError ? (
          <ErrorAlert message={summaryError} />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-zinc-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Batch Terpilih
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-zinc-900">
                    {selectedBatch.id}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={selectedBatch.status} />
                  <StatusBadge value={getBatchReferenceLabel(selectedBatch)} tone="info" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Database}
                label="Total Rows"
                value={toNumber(summary?.totalRows)}
                description="Jumlah seluruh baris pada file referensi."
              />
              <StatCard
                icon={CheckCircle2}
                label="Valid"
                value={toNumber(summary?.validRows)}
                tone="success"
                description="Baris yang lolos validasi."
              />
              <StatCard
                icon={ShieldCheck}
                label="Invalid"
                value={toNumber(summary?.invalidRows)}
                tone="danger"
                description="Baris yang tidak dapat diproses."
              />
              <StatCard
                icon={ShieldCheck}
                label="Warning"
                value={toNumber(summary?.warningRows)}
                tone="warning"
                description="Baris dengan catatan validasi."
              />
              <StatCard
                icon={Layers3}
                label="Mapped"
                value={toNumber(summary?.mappedRows)}
                tone="info"
                description="Baris yang berhasil dimapping."
              />
              <StatCard
                icon={RefreshCcw}
                label="Needs Review"
                value={toNumber(summary?.needsReviewRows)}
                tone="warning"
                description="Baris yang perlu pemeriksaan lanjutan."
              />
              <StatCard
                icon={RotateCcw}
                label="Unmapped"
                value={toNumber(summary?.unmappedRows)}
                tone="neutral"
                description="Baris yang belum memiliki pasangan referensi."
              />
              <StatCard
                icon={ShieldCheck}
                label="Committed"
                value={toNumber(summary?.committedRows)}
                tone="success"
                description="Baris yang sudah masuk master referensi."
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
