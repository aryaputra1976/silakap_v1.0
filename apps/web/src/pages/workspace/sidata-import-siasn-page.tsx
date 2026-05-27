import { useMemo, useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  FileSpreadsheet,
  GitCompareArrows,
  Loader2,
  Network,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
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
  type PaginatedIssues,
  type SiasnImportBatch,
  type SiasnImportIssueRow,
  type SiasnImportSummary,
} from '@/lib/api/sidata-import';
import { sidataApi, type SidataUnitKerja } from '@/lib/api/sidata';
import { SidataSopPanel } from '@/components/workspace/sidata/sidata-sop-panel';
import { SidataSyncStatusPanel } from '@/components/workspace/sidata/sidata-sync-status-panel';
import { SIDATA_SOP_LIST } from '@/lib/sidata/sidata-sop-data';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeUnitSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\bsubbag\b/g, 'sub bagian')
    .replace(/\bsub\s+bag\b/g, 'sub bagian')
    .replace(/kepegawiaan/g, 'kepegawaian')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildUnitPath(unit: SidataUnitKerja, unitById: Map<string, SidataUnitKerja>) {
  const names: string[] = [];
  const visited = new Set<string>();
  let current: SidataUnitKerja | undefined = unit;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.nama);
    current = current.parentId ? unitById.get(current.parentId) : undefined;
  }

  return names.join(' / ');
}

function normalizeIssueErrors(value: SiasnImportIssueRow['validationErrors']) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(value)];
  } catch {
    return [String(value)];
  }
}

function canResolveUnitKerja(issue: SiasnImportIssueRow) {
  return normalizeIssueErrors(issue.validationErrors).some((error) =>
    error.toLowerCase().includes('unit organisasi'),
  );
}

type IssueTab = 'issues' | 'needs-review' | 'invalid';
type TipePegawai = 'PNS' | 'PPPK' | 'PPPK_PARUH_WAKTU';

const ISSUE_TABS: Array<{ key: IssueTab; label: string }> = [
  { key: 'issues', label: 'Semua Masalah' },
  { key: 'needs-review', label: 'Perlu Review' },
  { key: 'invalid', label: 'Tidak Valid' },
];

const TIPE_PEGAWAI_OPTIONS: Array<{
  value: TipePegawai;
  label: string;
  activeClass: string;
  inactiveClass: string;
}> = [
  {
    value: 'PNS',
    label: 'PNS',
    activeClass: 'border-blue-600 bg-blue-600 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
  },
  {
    value: 'PPPK',
    label: 'PPPK',
    activeClass: 'border-violet-600 bg-violet-600 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
  },
  {
    value: 'PPPK_PARUH_WAKTU',
    label: 'PPPK Paruh Waktu',
    activeClass: 'border-orange-500 bg-orange-500 text-white',
    inactiveClass:
      'border-border bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
  },
];

const BLOCKED_COMMIT_STATUSES = ['PROCESSING', 'COMMITTED', 'FAILED', 'CANCELLED'];
const PAGE_SIZE = 20;

function getTipePegawaiLabel(importType: string): string {
  if (importType === 'SIASN_ASN_PNS') return 'PNS';
  if (importType === 'SIASN_ASN_PPPK') return 'PPPK';
  if (importType === 'SIASN_ASN_PPPK_PARUH_WAKTU') return 'PPPK Paruh Waktu';
  return 'ASN';
}

function getTipePegawaiBadgeClass(importType: string): string {
  if (importType === 'SIASN_ASN_PNS') return 'bg-blue-100 text-blue-800';
  if (importType === 'SIASN_ASN_PPPK') return 'bg-violet-100 text-violet-800';
  if (importType === 'SIASN_ASN_PPPK_PARUH_WAKTU') return 'bg-orange-100 text-orange-800';
  return 'bg-zinc-100 text-zinc-700';
}

function normalizeStatus(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? '';
}

function isCommittedStatus(summary: SiasnImportSummary | null): boolean {
  return normalizeStatus(summary?.status) === 'COMMITTED';
}

function isAsnCommitSafe(summary: SiasnImportSummary | null): boolean {
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

function getAsnCommitBlockReason(summary: SiasnImportSummary | null): string {
  if (!summary) {
    return 'Ringkasan batch belum tersedia.';
  }

  const status = normalizeStatus(summary.status);

  if (status === 'PROCESSING') {
    return 'Batch sedang diproses. Tunggu proses selesai sebelum tindak lanjut.';
  }

  if (status === 'COMMITTED') {
    return 'Batch sudah pernah dimasukkan ke Master ASN.';
  }

  if (status === 'FAILED') {
    return 'Batch berstatus gagal dan tidak dapat dimasukkan ke Master ASN.';
  }

  if (status === 'CANCELLED') {
    return 'Batch sudah dibatalkan dan tidak dapat dimasukkan ke Master ASN.';
  }

  if (summary.mappedRows <= 0) {
    return 'Belum ada baris yang berhasil dipetakan. Jalankan Petakan Referensi terlebih dahulu.';
  }

  if (summary.invalidRows > 0) {
    return `Masih ada ${summary.invalidRows} baris tidak valid yang harus diperbaiki.`;
  }

  if (summary.needsReviewRows > 0) {
    return `Masih ada ${summary.needsReviewRows} baris yang perlu diperiksa manual.`;
  }

  if (summary.unmappedRows > 0) {
    return `Masih ada ${summary.unmappedRows} baris yang belum terpetakan.`;
  }

  return 'Batch belum siap dimasukkan ke Master ASN.';
}

function ImportFlowStep({
  description,
  state,
  title,
}: {
  description: string;
  state: 'done' | 'active' | 'pending' | 'blocked';
  title: string;
}) {
  const stateClass = {
    done: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    active: 'border-sky-200 bg-sky-50 text-sky-800',
    pending: 'border-[#cfe1da] bg-white text-[#4c625c]',
    blocked: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  const dotClass = {
    done: 'bg-emerald-600',
    active: 'bg-sky-600',
    pending: 'bg-zinc-300',
    blocked: 'bg-amber-500',
  };

  return (
    <div className={`rounded-lg border p-3 ${stateClass[state]}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotClass[state]}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="mt-1 text-xs leading-5 text-current/75">{description}</div>
    </div>
  );
}

function getFlowState(
  step: 'upload' | 'mapping' | 'validasi' | 'preview' | 'commit',
  summary: SiasnImportSummary | null,
  previewChecked: boolean,
) {
  const committed = isCommittedStatus(summary);
  const safe = isAsnCommitSafe(summary);
  const status = normalizeStatus(summary?.status);
  const processing = status === 'PROCESSING';

  if (committed) return 'done';

  if (step === 'upload') return summary ? 'done' : 'active';
  if (!summary) return 'pending';

  if (step === 'mapping') {
    if (summary.mappedRows > 0) return 'done';
    return processing ? 'active' : 'blocked';
  }

  if (step === 'validasi') {
    if (safe) return 'done';
    if (summary.mappedRows > 0) return 'blocked';
    return 'pending';
  }

  if (step === 'preview') {
    if (previewChecked) return 'done';
    return safe ? 'active' : 'pending';
  }

  if (safe && previewChecked) return 'active';
  return 'pending';
}

export function SidataImportSiasnPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipePegawai, setTipePegawai] = useState<TipePegawai | null>(null);
  const [uploading, setUploading] = useState(false);

  const [batches, setBatches] = useState<SiasnImportBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SiasnImportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [previewChecked, setPreviewChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<IssueTab>('issues');
  const [issues, setIssues] = useState<PaginatedIssues | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesPage, setIssuesPage] = useState(1);
  const [issuesSearch, setIssuesSearch] = useState('');

  const [mapping, setMapping] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [unitOptions, setUnitOptions] = useState<SidataUnitKerja[]>([]);
  const [unitSearch, setUnitSearch] = useState('');
  const [resolvingIssue, setResolvingIssue] = useState<SiasnImportIssueRow | null>(null);
  const [selectedUnitKerjaId, setSelectedUnitKerjaId] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const asnPollRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSummary(null);
      setIssues(null);
      return;
    }

    void loadSummary(selectedId);
    void loadIssues(selectedId, activeTab, 1, '');
    setIssuesPage(1);
    setIssuesSearch('');
    setPreviewChecked(false);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    void loadIssues(selectedId, activeTab, issuesPage, issuesSearch);
  }, [activeTab, issuesPage]);

  const summaryStatus = summary?.status ?? null;

  const unitById = useMemo(
    () => new Map(unitOptions.map((unit) => [unit.id, unit])),
    [unitOptions],
  );

  const unitPathById = useMemo(
    () => new Map(unitOptions.map((unit) => [unit.id, buildUnitPath(unit, unitById)])),
    [unitById, unitOptions],
  );

  const filteredUnitOptions = useMemo(() => {
    const q = normalizeUnitSearchText(unitSearch);
    const tokens = q.split(' ').filter(Boolean);

    return unitOptions
      .map((unit) => {
        const path = unitPathById.get(unit.id) ?? unit.nama;
        const normalizedName = normalizeUnitSearchText(unit.nama);
        const normalizedPath = normalizeUnitSearchText(path);
        const haystack = normalizeUnitSearchText(`${unit.kode} ${unit.nama} ${path} level ${unit.level}`);

        let rank = 4;
        if (!q) rank = 4;
        else if (normalizedName === q || normalizedPath.endsWith(q)) rank = 0;
        else if (normalizedName.includes(q)) rank = 1;
        else if (normalizedPath.includes(q)) rank = 2;
        else if (tokens.every((token) => haystack.includes(token))) rank = 3;

        return { unit, rank };
      })
      .filter(({ rank }) => !q || rank < 4)
      .sort((a, b) => a.rank - b.rank || a.unit.level - b.unit.level || a.unit.nama.localeCompare(b.unit.nama))
      .map(({ unit }) => unit)
      .slice(0, 40);
  }, [unitOptions, unitPathById, unitSearch]);

  async function silentRefreshSummary() {
    if (!selectedId) return;

    try {
      const [freshSummary, freshBatches] = await Promise.all([
        sidataImportApi.getAsnBatchSummary(selectedId),
        sidataImportApi.listAsnBatches(),
      ]);

      setSummary(freshSummary);
      setBatches(freshBatches);
    } catch {
      // Silent polling refresh.
    }
  }

  asnPollRef.current = silentRefreshSummary;

  useEffect(() => {
    if (summaryStatus !== 'PROCESSING') return;

    const timer = setInterval(() => {
      void asnPollRef.current?.();
    }, 4_000);

    return () => clearInterval(timer);
  }, [summaryStatus]);

  async function loadBatches() {
    setBatchesLoading(true);
    setBatchesError(null);

    try {
      const data = await sidataImportApi.listAsnBatches();
      setBatches(data);
    } catch (err) {
      setBatchesError(err instanceof Error ? err.message : 'Gagal memuat riwayat batch');
    } finally {
      setBatchesLoading(false);
    }
  }

  async function loadSummary(id: string) {
    setSummaryLoading(true);

    try {
      const data = await sidataImportApi.getAsnBatchSummary(id);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadIssues(id: string, tab: IssueTab, page: number, search: string) {
    setIssuesLoading(true);

    try {
      const params = { page, limit: PAGE_SIZE, q: search || undefined };
      const data =
        tab === 'needs-review'
          ? await sidataImportApi.getAsnNeedsReview(id, params)
          : tab === 'invalid'
            ? await sidataImportApi.getAsnInvalid(id, params)
            : await sidataImportApi.getAsnIssues(id, params);

      setIssues(data);
    } catch {
      setIssues(null);
    } finally {
      setIssuesLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !tipePegawai) return;

    setUploading(true);

    try {
      const result = await sidataImportApi.uploadAsnFile(selectedFile, tipePegawai);

      toast.success(
        `Upload berhasil - ${result.totalRows} baris, ${result.validRows} valid, ${result.invalidRows} tidak valid`,
      );

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await loadBatches();
      setSelectedId(result.batchId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  }

  async function handleMap() {
    if (!selectedId) return;

    setMapping(true);

    try {
      const result = await sidataImportApi.mapAsnBatch(selectedId);

      toast.success(result.message ?? 'Pemetaan ASN diproses di background.');

      await Promise.all([loadSummary(selectedId), loadBatches()]);
      void loadIssues(selectedId, activeTab, issuesPage, issuesSearch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mapping batch');
    } finally {
      setMapping(false);
    }
  }

  async function handleRemap() {
    if (!selectedId) return;

    setMapping(true);

    try {
      const result = await sidataImportApi.remapAsnBatch(selectedId);

      toast.success(result.message ?? 'Pemetaan ulang ASN diproses di background.');

      await Promise.all([loadSummary(selectedId), loadBatches()]);
      void loadIssues(selectedId, activeTab, issuesPage, issuesSearch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal remap batch');
    } finally {
      setMapping(false);
    }
  }

  async function handleExtractReferences() {
    if (!selectedId) return;

    setExtracting(true);

    try {
      const result = await sidataImportApi.extractReferences(selectedId);
      const { extracted, totalExtracted } = result;

      toast.success(
        `Ekstrak referensi selesai - ${totalExtracted} data baru: Agama ${extracted.agama}, Golongan ${extracted.golongan}, Jenis Jabatan ${extracted.jenisJabatan}, Jenis ASN ${extracted.jenisAsn}, dan lainnya.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal ekstrak referensi dari Data ASN');
    } finally {
      setExtracting(false);
    }
  }

  async function handleCommit() {
    if (!selectedId || !summary) return;

    const confirmed = window.confirm(
      `Masukkan ${summary.totalRows} baris ASN ke Master ASN? Pastikan mapping dan hasil review sudah benar.`,
    );

    if (!confirmed) return;

    setCommitting(true);

    try {
      const result = await sidataImportApi.commitAsnBatch(selectedId);

      toast.success(result.message ?? 'Penyimpanan final ASN diproses di background.');

      await Promise.all([
        loadSummary(selectedId),
        loadBatches(),
        loadIssues(selectedId, activeTab, issuesPage, issuesSearch),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan final ASN');
    } finally {
      setCommitting(false);
    }
  }

  async function handleCancel() {
    if (!selectedId) return;

    const confirmed = window.confirm(
      'Batalkan batch import ini? Data staging akan dihapus dan batch tidak dapat dilanjutkan.',
    );

    if (!confirmed) return;

    setCancelling(true);

    try {
      await sidataImportApi.cancelAsnBatch(selectedId);

      toast.success('Batch ASN berhasil dibatalkan.');

      await Promise.all([loadSummary(selectedId), loadBatches()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membatalkan batch');
    } finally {
      setCancelling(false);
    }
  }

  async function openUnitResolver(issue: SiasnImportIssueRow) {
    setResolvingIssue(issue);
    setSelectedUnitKerjaId('');
    setResolutionNote('');
    setUnitSearch(issue.unitOrganisasiNama ?? '');

    try {
      if (unitOptions.length === 0) {
        setUnitOptions(await sidataApi.getUnits());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat daftar unit kerja');
    }
  }

  async function saveUnitResolution() {
    if (!selectedId || !resolvingIssue?.id || !selectedUnitKerjaId) {
      toast.error('Pilih unit kerja target terlebih dahulu.');
      return;
    }

    setSavingResolution(true);

    try {
      await sidataImportApi.resolveUnitKerjaMapping(selectedId, resolvingIssue.id, {
        unitKerjaId: selectedUnitKerjaId,
        note: resolutionNote.trim() || undefined,
      });

      toast.success('Mapping unit kerja disimpan.');
      setResolvingIssue(null);
      setSelectedUnitKerjaId('');
      setResolutionNote('');

      await Promise.all([
        loadSummary(selectedId),
        loadIssues(selectedId, activeTab, issuesPage, issuesSearch),
        loadBatches(),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan mapping unit kerja');
    } finally {
      setSavingResolution(false);
    }
  }

  function handleTabChange(tab: IssueTab) {
    setActiveTab(tab);
    setIssuesPage(1);
    setIssues(null);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setIssuesPage(1);

    if (selectedId) {
      void loadIssues(selectedId, activeTab, 1, issuesSearch);
    }
  }

  function openMappingReferensi() {
    navigate('/sidata/import/mapping-referensi');
  }

  function openRekonsiliasi() {
    navigate('/sidata/rekonsiliasi');
  }

  const blockedStatuses = ['COMMITTED', 'FAILED', 'CANCELLED', 'PROCESSING'];
  const currentStatus = normalizeStatus(summary?.status);

  const canMap = summary ? !blockedStatuses.includes(currentStatus) : false;

  const canRemap = summary
    ? !['PROCESSING', 'CANCELLED', 'FAILED'].includes(currentStatus) && summary.mappedRows > 0
    : false;

  const canExtract = summary
    ? !['PROCESSING', 'CANCELLED', 'FAILED'].includes(currentStatus)
    : false;

  const canCancel = summary
    ? !['COMMITTED', 'FAILED', 'CANCELLED', 'PROCESSING'].includes(currentStatus)
    : false;

  const isBusy = mapping || committing || cancelling || uploading || extracting;
  const commitSafe = isAsnCommitSafe(summary);
  const committed = isCommittedStatus(summary);
  const showQualityGateWarning = Boolean(summary && !commitSafe && !committed);
  const showPreviewGateWarning = Boolean(summary && commitSafe && !previewChecked && !committed);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import SIASN"
        description="Upload file ASN, cek hasil validasi, lalu commit jika datanya sudah aman."
      />

      <div className="grid gap-3 md:grid-cols-5">
        <ImportFlowStep
          title="1. Upload"
          description="Pilih jenis ASN dan unggah file SIASN."
          state={getFlowState('upload', summary, previewChecked)}
        />
        <ImportFlowStep
          title="2. Mapping"
          description="Petakan ASN ke referensi dan unit kerja."
          state={getFlowState('mapping', summary, previewChecked)}
        />
        <ImportFlowStep
          title="3. Validasi"
          description="Pastikan tidak ada invalid, review, atau unmapped."
          state={getFlowState('validasi', summary, previewChecked)}
        />
        <ImportFlowStep
          title="4. Preview"
          description="Cek rekonsiliasi sebelum data masuk master."
          state={getFlowState('preview', summary, previewChecked)}
        />
        <ImportFlowStep
          title="5. Simpan"
          description="Commit final ke Master ASN."
          state={getFlowState('commit', summary, previewChecked)}
        />
      </div>

      <SectionCard
        title="Upload File ASN"
        description="Pilih jenis ASN sesuai file SIASN. Format file: .xlsx."
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Jenis ASN</p>
            <div className="flex flex-wrap gap-2">
              {TIPE_PEGAWAI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setTipePegawai(opt.value)}
                  className={cn(
                    'rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
                    tipePegawai === opt.value ? opt.activeClass : opt.inactiveClass,
                    isBusy && 'pointer-events-none opacity-55',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Kolom minimal: NIP dan Nama. Jika TMT pensiun kosong, sistem menghitung dari tanggal lahir dan BUP jabatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              className={cn(
                'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50',
                isBusy && 'pointer-events-none opacity-55',
              )}
            >
              <FileSpreadsheet className="size-4" />
              {selectedFile ? selectedFile.name : 'Pilih File .xlsx'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={isBusy}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {selectedFile && (
              <>
                <ActionButton
                  icon={uploading ? Loader2 : Upload}
                  onClick={() => void handleUpload()}
                  disabled={isBusy || !tipePegawai}
                >
                  {uploading ? 'Mengupload...' : 'Upload'}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isBusy}
                >
                  Batal
                </ActionButton>
              </>
            )}
          </div>

          {selectedFile && !tipePegawai && (
            <p className="text-xs text-amber-600">
              Pilih jenis ASN (PNS / PPPK / PPPK Paruh Waktu) sebelum upload.
            </p>
          )}

          {selectedFile && tipePegawai && (
            <p className="text-xs text-muted-foreground">
              {selectedFile.name} - {(selectedFile.size / 1024 / 1024).toFixed(2)} MB - Jenis:{' '}
              <strong>{getTipePegawaiLabel(`SIASN_ASN_${tipePegawai}`)}</strong>
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Riwayat Import"
        actions={
          <ActionButton
            variant="ghost"
            icon={RefreshCw}
            onClick={() => void loadBatches()}
            disabled={batchesLoading}
          >
            Refresh
          </ActionButton>
        }
      >
        {batchesLoading ? (
          <LoadingState label="Memuat riwayat batch..." />
        ) : batchesError ? (
          <ErrorAlert message={batchesError} />
        ) : (
          <DataTable
            items={batches}
            rowKey={(item) => item.id}
            empty="Belum ada batch import ASN"
            columns={[
              {
                key: 'id',
                header: 'ID Import',
                render: (item) => (
                  <button
                    className={cn(
                      'font-mono text-xs underline transition-colors',
                      selectedId === item.id
                        ? 'text-zinc-900'
                        : 'text-sky-700 hover:text-sky-900',
                    )}
                    onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  >
                    {item.id.slice(0, 8)}...
                  </button>
                ),
                className: 'w-28',
              },
              {
                key: 'tipe',
                header: 'Jenis ASN',
                render: (item) => (
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-semibold',
                      getTipePegawaiBadgeClass(item.importType),
                    )}
                  >
                    {getTipePegawaiLabel(item.importType)}
                  </span>
                ),
                className: 'w-36',
              },
              {
                key: 'fileName',
                header: 'File',
                render: (item) => (
                  <span className="text-xs text-zinc-700">{item.fileName ?? '-'}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
                className: 'w-32',
              },
              {
                key: 'rows',
                header: 'Total / Valid / Tidak Valid',
                render: (item) => (
                  <span className="font-mono text-xs">
                    {item.totalRows} / {item.validRows} / {item.invalidRows}
                  </span>
                ),
                className: 'w-40',
              },
              {
                key: 'createdAt',
                header: 'Diupload',
                render: (item) => (
                  <span className="text-xs">{formatDateTime(item.createdAt)}</span>
                ),
                className: 'w-36',
              },
            ]}
          />
        )}
      </SectionCard>

      {selectedId && (
        <>
          {summaryLoading ? (
            <LoadingState label="Memuat ringkasan batch..." />
          ) : summary ? (
            <>
              <SectionCard
                title={`Ringkasan Batch - ${selectedId.slice(0, 8)}...`}
                description={`${summary.importType} - ${summary.fileName ?? 'tanpa nama file'}`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {summaryStatus === 'PROCESSING' && (
                      <span className="flex animate-pulse items-center gap-1.5 text-xs font-medium text-amber-600">
                        <Loader2 className="size-3 animate-spin" />
                        Memproses...
                      </span>
                    )}

                    <ActionButton
                      variant="secondary"
                      icon={ArrowRight}
                      onClick={openMappingReferensi}
                    >
                      Buka Pemetaan
                    </ActionButton>

                    <ActionButton
                      variant="secondary"
                      icon={GitCompareArrows}
                      onClick={openRekonsiliasi}
                    >
                      Buka Rekonsiliasi
                    </ActionButton>

                    {canExtract && (
                      <ActionButton
                        variant="secondary"
                        icon={extracting ? Loader2 : Sparkles}
                        onClick={() => void handleExtractReferences()}
                        disabled={isBusy}
                      >
                        {extracting ? 'Mengekstrak...' : 'Ekstrak Referensi'}
                      </ActionButton>
                    )}

                    {canMap && (
                      <ActionButton
                        icon={mapping ? Loader2 : Network}
                        onClick={() => void handleMap()}
                        disabled={isBusy}
                      >
                        {mapping ? 'Memetakan...' : 'Petakan Referensi'}
                      </ActionButton>
                    )}

                    {canRemap && (
                      <ActionButton
                        variant="secondary"
                        icon={mapping ? Loader2 : RefreshCw}
                        onClick={() => void handleRemap()}
                        disabled={isBusy}
                      >
                        {mapping ? 'Memetakan...' : 'Petakan Ulang'}
                      </ActionButton>
                    )}

                    {summary.mappedRows > 0 && !commitSafe && !committed && (
                      <StatusBadge value="Belum Siap Commit" tone="warning" />
                    )}

                    {summary && commitSafe && !committed && (
                      <ActionButton
                        icon={committing ? Loader2 : ShieldCheck}
                        onClick={() => void handleCommit()}
                        disabled={isBusy || !previewChecked}
                      >
                        {committing
                          ? 'Menyimpan...'
                          : previewChecked
                            ? 'Simpan ke Master'
                            : 'Cek Preview Dulu'}
                      </ActionButton>
                    )}

                    {canCancel && (
                      <ActionButton
                        variant="secondary"
                        icon={cancelling ? Loader2 : Ban}
                        onClick={() => void handleCancel()}
                        disabled={isBusy}
                      >
                        {cancelling ? 'Membatalkan...' : 'Batalkan'}
                      </ActionButton>
                    )}

                    {summary.status === 'COMMITTED' && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        Sudah masuk Master
                      </span>
                    )}
                  </div>
                }
              >
                {committed ? (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Sudah masuk Master ASN</div>
                        <div className="mt-1">
                          Data dari batch ini sudah masuk ke Master ASN.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showQualityGateWarning ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Belum siap commit</div>
                        <div className="mt-1">{getAsnCommitBlockReason(summary)}</div>
                        <div className="mt-2 text-xs text-amber-800">
                          Selesaikan data tidak valid, perlu review, atau belum terpetakan sebelum
                          memasukkan data ke Master ASN.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showPreviewGateWarning ? (
                  <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <div className="flex items-start gap-3">
                      <GitCompareArrows className="mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold">Perlu cek preview rekonsiliasi</div>
                        <div className="mt-1">
                          Data sudah valid dan terpetakan. Sebelum simpan ke Master ASN, buka preview
                          rekonsiliasi dan pastikan perubahan data sudah sesuai.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Siap commit</div>
                        <div className="mt-1">
                          Semua baris sudah valid dan terpetakan. Klik Simpan ke Master jika hasilnya
                          sudah dicek.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {summary && commitSafe && !committed ? (
                  <div className="mb-4 rounded-lg border border-[#cfe1da] bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#18343a]">
                        <input
                          checked={previewChecked}
                          className="mt-1"
                          onChange={(event) => setPreviewChecked(event.target.checked)}
                          type="checkbox"
                        />
                        <span>
                          <span className="font-semibold">Saya sudah cek preview rekonsiliasi.</span>
                          <span className="mt-1 block text-xs leading-5 text-[#62766f]">
                            Wajib dicentang sebelum Simpan ke Master agar commit final tidak dilakukan
                            tanpa pemeriksaan perubahan data.
                          </span>
                        </span>
                      </label>
                      <ActionButton
                        icon={GitCompareArrows}
                        onClick={openRekonsiliasi}
                        variant="secondary"
                      >
                        Buka Preview
                      </ActionButton>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Total Baris" value={summary.totalRows} />
                  <StatCard label="Valid" value={summary.validRows} tone="success" />
                  <StatCard label="Tidak Valid" value={summary.invalidRows} tone="danger" />
                  <StatCard label="Duplikat" value={summary.duplicateRows} tone="warning" />
                  <StatCard label="Terpetakan" value={summary.mappedRows} tone="success" />
                  <StatCard label="Perlu Review" value={summary.needsReviewRows} tone="warning" />
                  <StatCard label="Belum Terpetakan" value={summary.unmappedRows} tone="danger" />
                  <StatCard label="Committed" value={summary.committedRows} tone="info" />
                </div>
              </SectionCard>

              <SectionCard title="Daftar Masalah Data">
                <div className="mb-4 flex gap-1 rounded-lg border border-border bg-zinc-50 p-1">
                  {ISSUE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      className={cn(
                        'rounded-md px-4 py-2 text-sm font-semibold transition-colors',
                        activeTab === tab.key
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700',
                      )}
                      onClick={() => handleTabChange(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
                  <input
                    className={cn(inputClass, 'max-w-sm flex-1')}
                    placeholder="Cari NIP atau nama..."
                    value={issuesSearch}
                    onChange={(e) => setIssuesSearch(e.target.value)}
                  />
                  <ActionButton type="submit" variant="secondary">
                    Cari
                  </ActionButton>
                </form>

                {issuesLoading ? (
                  <LoadingState label="Memuat data..." />
                ) : issues ? (
                  <>
                    <DataTable
                      items={issues.items}
                      rowKey={(item) => item.id}
                      empty="Tidak ada data ditemukan"
                      columns={[
                        {
                          key: 'rowNumber',
                          header: '#',
                          render: (item) => (
                            <span className="font-mono text-xs text-zinc-500">
                              {item.rowNumber}
                            </span>
                          ),
                          className: 'w-12',
                        },
                        {
                          key: 'asn',
                          header: 'ASN',
                          render: (item) => (
                            <div className="min-w-0">
                              <div className="font-semibold text-zinc-900">{item.nama ?? '-'}</div>
                              <div className="mt-1 font-mono text-xs text-zinc-500">
                                NIP {item.nip ?? '-'}
                              </div>
                            </div>
                          ),
                          className: 'w-[260px]',
                        },
                        {
                          key: 'kepegawaian',
                          header: 'Golongan / Jabatan / Unit',
                          render: (item) => (
                            <div className="space-y-2 text-sm leading-5">
                              <div>
                                <div className="text-xs font-semibold uppercase text-zinc-500">Golongan</div>
                                <div className="font-semibold text-zinc-900">{item.golonganNama ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase text-zinc-500">Jabatan</div>
                                <div className="text-zinc-800">{item.jabatanNama ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase text-zinc-500">Unit</div>
                                <div className="text-zinc-700">{item.unitOrganisasiNama ?? '-'}</div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: 'errors',
                          header: 'Status',
                          render: (item) => {
                            const errors = normalizeIssueErrors(item.validationErrors);

                            return (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  <StatusBadge value={item.mappingStatus} />
                                  <StatusBadge value={item.validationStatus} />
                                </div>
                                {errors.length === 0 ? (
                                  <span className="text-xs text-zinc-400">-</span>
                                ) : (
                                  <ul className="space-y-0.5 text-xs leading-5 text-rose-700">
                                    {errors.slice(0, 3).map((error, index) => (
                                      <li key={`${item.id}-${index}`}>- {error}</li>
                                    ))}
                                    {errors.length > 3 && (
                                      <li className="text-zinc-500">
                                        +{errors.length - 3} lainnya
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            );
                          },
                          className: 'w-[260px]',
                        },
                        {
                          key: 'action',
                          header: 'Aksi',
                          render: (item) =>
                            canResolveUnitKerja(item) ? (
                              <ActionButton
                                icon={PencilLine}
                                onClick={() => void openUnitResolver(item)}
                                variant="secondary"
                              >
                                Mapping Unit
                              </ActionButton>
                            ) : (
                              <span className="text-xs text-zinc-400">-</span>
                            ),
                          className: 'w-40',
                        },
                      ]}
                    />

                    {issues.total > issues.limit && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                          Halaman {issues.page} dari {Math.ceil(issues.total / issues.limit)} -{' '}
                          {issues.total} total
                        </span>
                        <div className="flex gap-2">
                          <ActionButton
                            variant="secondary"
                            onClick={() => setIssuesPage((p) => Math.max(1, p - 1))}
                            disabled={issues.page <= 1 || issuesLoading}
                          >
                            Sebelumnya
                          </ActionButton>
                          <ActionButton
                            variant="secondary"
                            onClick={() => setIssuesPage((p) => p + 1)}
                            disabled={issues.page * issues.limit >= issues.total || issuesLoading}
                          >
                            Berikutnya
                          </ActionButton>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="Pilih tab untuk melihat data"
                    description="Data akan muncul setelah mapping dijalankan."
                  />
                )}
              </SectionCard>
            </>
          ) : null}
        </>
      )}

      {/* SOP SIK-002 + Sync Status */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <SidataSyncStatusPanel batches={batches} loading={batchesLoading} />
        <SidataSopPanel
          sops={SIDATA_SOP_LIST.filter((s) => s.key === 'SIK-002')}
          title="SOP Sinkronisasi SIASN"
        />
      </div>

      {resolvingIssue ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#cfe1da] bg-[#fbfdf8] shadow-2xl">
            <div className="border-b border-[#d8e4d3] p-5">
              <div className="text-lg font-semibold text-[#073b3a]">Mapping Unit Kerja</div>
              <div className="mt-1 text-sm text-[#5b6b58]">
                {resolvingIssue.nama ?? '-'} - {resolvingIssue.nip ?? '-'}
              </div>
              <div className="mt-3 rounded-md border border-[#d8e4d3] bg-white/70 p-3 text-sm text-[#445642]">
                Unit dari ASN: {resolvingIssue.unitOrganisasiNama ?? '-'}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <input
                className={inputClass}
                onChange={(event) => setUnitSearch(event.target.value)}
                placeholder="Cari kode, nama unit, atau induk OPD..."
                value={unitSearch}
              />
              <div className="rounded-md border border-[#d8e4d3] bg-white/70 p-3 text-xs leading-5 text-[#5b6b58]">
                Gunakan kata kunci berantai bila nama unit sama, misalnya
                <span className="font-semibold"> Sekretariat Keuangan</span>,
                <span className="font-semibold"> Dinas Pendidikan Sub Bagian Keuangan</span>, atau kode unit.
                Pilihan di bawah menampilkan jalur unit lengkap agar tidak tertukar antar OPD.
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-[#d8e4d3] bg-white">
                {filteredUnitOptions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Unit kerja tidak ditemukan.</div>
                ) : (
                  filteredUnitOptions.map((unit) => {
                    const path = unitPathById.get(unit.id) ?? unit.nama;

                    return (
                    <label
                      className="flex cursor-pointer items-start gap-3 border-b border-[#edf3ea] p-3 text-sm last:border-b-0 hover:bg-[#f1f7ed]"
                      key={unit.id}
                    >
                      <input
                        checked={selectedUnitKerjaId === unit.id}
                        className="mt-1"
                        name="unitKerjaTarget"
                        onChange={() => setSelectedUnitKerjaId(unit.id)}
                        type="radio"
                      />
                      <span>
                        <span className="block font-semibold text-[#073b3a]">{unit.nama}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#687761]">
                          {path}
                        </span>
                        <span className="mt-1 block font-mono text-xs text-[#687761]">
                          Kode {unit.kode} - Level {unit.level}
                        </span>
                      </span>
                    </label>
                    );
                  })
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#073b3a]">
                  Catatan Mapping
                </label>
                <textarea
                  className={`${inputClass} min-h-20 resize-y py-3`}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Contoh: Unit SIASN menggunakan nomenklatur lama, dipetakan ke unit kerja aktif yang sesuai."
                  value={resolutionNote}
                />
                <p className="mt-1 text-xs text-[#687761]">
                  Catatan ini membantu audit dan review ulang hasil mapping manual.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-[#d8e4d3] bg-[#fbfdf8] p-4 shadow-[0_-8px_18px_rgba(15,45,38,0.08)]">
              <ActionButton
                disabled={savingResolution}
                onClick={() => setResolvingIssue(null)}
                variant="secondary"
              >
                Batal
              </ActionButton>
              <ActionButton
                disabled={!selectedUnitKerjaId || savingResolution}
                icon={savingResolution ? Loader2 : ShieldCheck}
                onClick={() => void saveUnitResolution()}
              >
                {savingResolution ? 'Menyimpan...' : 'Simpan Mapping'}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
