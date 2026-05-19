import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { PaginatedResult } from '@/lib/api/types';
import type {
  ReconciliationBpkadPayrollRow,
  ReconciliationImportBatch,
} from '@/lib/reconciliation-bpkad/types';
import {
  getImportStatusTone,
  getRowStatusTone,
} from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  Field,
  formatDate,
  formatDateTime,
  formatFileSize,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';

const ACCEPTED_EXCEL =
  '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

function formatCurrency(value: string | null | undefined) {
  const parsed = Number(value ?? '');
  if (!Number.isFinite(parsed)) return '-';
  return parsed.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
}

function jsonList(value: unknown) {
  if (!Array.isArray(value)) return '-';
  return value.map((item) => String(item)).join(', ') || '-';
}

export function RekonsiliasiBpkadImportSimgajiPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batches, setBatches] =
    useState<PaginatedResult<ReconciliationImportBatch> | null>(null);
  const [rows, setRows] =
    useState<PaginatedResult<ReconciliationBpkadPayrollRow> | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadRows = useCallback(async (batchId: string, nextQuery: string) => {
    setLoadingRows(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.fetchBpkadSimgajiRows(batchId, {
        page: 1,
        limit: 25,
        q: nextQuery.trim() || undefined,
      });
      setRows(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat preview baris Simgaji',
      );
    } finally {
      setLoadingRows(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.fetchBpkadSimgajiImports({
        page: 1,
        limit: 20,
      });
      setBatches(result);
      setSelectedBatchId((current) => current ?? result.items[0]?.id ?? null);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat riwayat import Simgaji',
      );
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (!selectedBatchId) {
      setRows(null);
      return;
    }

    void loadRows(selectedBatchId, '');
  }, [loadRows, selectedBatchId]);

  async function uploadFile() {
    if (!selectedFile) {
      setError('Pilih file Simgaji terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.set('file', selectedFile);
    setUploading(true);
    setError('');

    try {
      const batch = await reconciliationBpkadApi.uploadBpkadSimgaji(formData);
      setSelectedBatchId(batch.id);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadBatches();
      await loadRows(batch.id, '');
      setQuery('');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Upload Simgaji gagal diproses',
      );
    } finally {
      setUploading(false);
    }
  }

  const selectedBatch = batches?.items.find((item) => item.id === selectedBatchId) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import Data Simgaji BPKAD"
        description="Upload dan preview ekspor Simgaji sebagai sumber data BPKAD untuk rekonsiliasi. Tahap ini belum menjalankan matching atau finalisasi temuan."
        actions={
          <ActionButton
            disabled={loadingBatches}
            icon={RefreshCw}
            onClick={() => void loadBatches()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Upload File Simgaji"
        description="Format .xlsx/.xls maksimal 25 MB. Kolom wajib: tglgaji, nip, nama, kdskpd, kdsatker, kdstapeg, kdpangkat, gapok, kotor, potongan, bersih."
        actions={
          <ActionButton
            disabled={!selectedFile || uploading}
            icon={uploading ? Loader2 : Upload}
            onClick={() => void uploadFile()}
          >
            {uploading ? 'Mengunggah' : 'Upload'}
          </ActionButton>
        }
      >
        <Field label="File ekspor Simgaji">
          <input
            ref={fileInputRef}
            className={inputClass}
            disabled={uploading}
            type="file"
            accept={ACCEPTED_EXCEL}
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        {selectedFile ? (
          <p className="mt-2 text-sm text-[#6d7e68]">
            Dipilih: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        ) : null}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={FileSpreadsheet}
          label="Total Baris"
          value={selectedBatch?.totalRows ?? 0}
          description="Jumlah baris dari file Simgaji."
          tone="info"
        />
        <StatCard
          icon={FileSpreadsheet}
          label="Valid"
          value={selectedBatch?.validRows ?? 0}
          description="Baris lolos validasi awal."
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Warning"
          value={selectedBatch?.warningRows ?? 0}
          description="Termasuk NIP duplikat dalam file."
          tone="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Invalid"
          value={selectedBatch?.invalidRows ?? 0}
          description="Baris atau header belum memenuhi syarat."
          tone="danger"
        />
      </div>

      <SectionCard title="Riwayat Import Simgaji" description="Pilih batch untuk melihat preview baris.">
        {loadingBatches ? (
          <LoadingState label="Memuat batch import" />
        ) : (
          <DataTable
            empty="Belum ada import Simgaji"
            items={batches?.items ?? []}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'file',
                header: 'File',
                render: (item) => (
                  <button
                    className="text-left font-semibold text-[#0f766e] hover:underline"
                    onClick={() => setSelectedBatchId(item.id)}
                    type="button"
                  >
                    {item.originalFileName ?? item.fileName ?? item.id}
                  </button>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={item.status}
                    tone={getImportStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'rows',
                header: 'Baris',
                render: (item) => `${item.validRows}/${item.totalRows} valid`,
              },
              {
                key: 'issues',
                header: 'Issue',
                render: (item) =>
                  `${item.invalidRows} invalid, ${item.warningRows} warning`,
              },
              {
                key: 'uploaded',
                header: 'Upload',
                render: (item) => formatDateTime(item.uploadedAt ?? item.createdAt),
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Preview Baris Simgaji"
        description={
          selectedBatch
            ? `Batch ${selectedBatch.originalFileName ?? selectedBatch.id}`
            : 'Pilih batch import untuk melihat preview.'
        }
        actions={
          <div className="relative min-w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Cari NIP, nama, SKPD"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && selectedBatchId) {
                  void loadRows(selectedBatchId, query);
                }
              }}
            />
          </div>
        }
      >
        {!selectedBatchId ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Belum ada batch dipilih"
            description="Upload atau pilih batch Simgaji untuk melihat preview data."
          />
        ) : loadingRows ? (
          <LoadingState label="Memuat preview Simgaji" />
        ) : (
          <DataTable
            empty="Preview Simgaji kosong"
            items={rows?.items ?? []}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'row',
                header: 'Baris',
                render: (item) => item.rowNumber,
                className: 'w-20',
              },
              {
                key: 'asn',
                header: 'ASN',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">{item.nama ?? '-'}</div>
                    <div className="text-xs text-[#6d7e68]">{item.nip ?? '-'}</div>
                  </div>
                ),
              },
              {
                key: 'unit',
                header: 'SKPD/Satker',
                render: (item) => (
                  <div>
                    <div>{item.nmSkpd ?? item.kdSkpd ?? '-'}</div>
                    <div className="text-xs text-[#6d7e68]">{item.nmSatker ?? item.kdSatker ?? '-'}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <div className="space-y-1">
                    <StatusBadge
                      value={item.validationStatus}
                      tone={getRowStatusTone(item.validationStatus)}
                    />
                    <div className="text-xs text-[#6d7e68]">{jsonList(item.validationErrors)}</div>
                  </div>
                ),
              },
              {
                key: 'period',
                header: 'Tgl Gaji',
                render: (item) => formatDate(item.tglGaji),
              },
              {
                key: 'pay',
                header: 'Bersih',
                render: (item) => formatCurrency(item.bersih),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
