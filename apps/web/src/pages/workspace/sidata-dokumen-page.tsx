import { useRef, useState } from 'react';
import { Download, FileText, Search, Trash2, UploadCloud, UserRoundSearch } from 'lucide-react';
import { toast } from 'sonner';
import { sidataApi } from '@/lib/api/sidata';
import type { AsnRecord, SidataAsnDocument } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';

const DOCUMENT_TYPES = [
  'SK',
  'SK CPNS',
  'SK PNS',
  'SK PPPK',
  'SK Pangkat',
  'SK Jabatan',
  'Ijazah',
  'KTP',
  'Kartu Keluarga',
  'Lainnya',
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(value: number | null) {
  if (!value) return '-';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function SidataDokumenPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [q, setQ] = useState('');
  const [asnList, setAsnList] = useState<AsnRecord[]>([]);
  const [selectedAsn, setSelectedAsn] = useState<AsnRecord | null>(null);
  const [documents, setDocuments] = useState<SidataAsnDocument[]>([]);
  const [documentType, setDocumentType] = useState('SK');
  const [file, setFile] = useState<File | null>(null);
  const [loadingAsn, setLoadingAsn] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const canUpload = Boolean(selectedAsn && file && documentType.trim());

  async function loadAsn() {
    const search = q.trim();
    if (!search) {
      setError('Masukkan NIP atau nama ASN terlebih dahulu.');
      return;
    }

    setLoadingAsn(true);
    setError('');

    try {
      const result = await sidataApi.getAsnList({ q: search, page: 1, limit: 15 });
      setAsnList(result.items);
      setSelectedAsn(null);
      setDocuments([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat ASN');
    } finally {
      setLoadingAsn(false);
    }
  }

  async function selectAsn(asn: AsnRecord) {
    setSelectedAsn(asn);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadDocuments(asn.id);
  }

  async function loadDocuments(asnId = selectedAsn?.id) {
    if (!asnId) return;

    setLoadingDocuments(true);
    setError('');

    try {
      setDocuments(await sidataApi.getAsnDocuments(asnId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat dokumen ASN');
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function uploadDocument() {
    if (!selectedAsn || !file) return;

    setWorking(true);

    try {
      await sidataApi.uploadAsnDocument(selectedAsn.id, file, documentType.trim());
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Dokumen ASN berhasil diupload');
      await loadDocuments(selectedAsn.id);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Gagal upload dokumen ASN');
    } finally {
      setWorking(false);
    }
  }

  async function deleteDocument(item: SidataAsnDocument) {
    if (!selectedAsn) return;

    const confirmed = window.confirm(`Nonaktifkan dokumen ${item.originalFileName ?? item.fileName}?`);
    if (!confirmed) return;

    setWorking(true);

    try {
      await sidataApi.deleteAsnDocument(selectedAsn.id, item.id);
      toast.success('Dokumen ASN dinonaktifkan');
      await loadDocuments(selectedAsn.id);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Gagal menonaktifkan dokumen ASN');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dokumen ASN"
        description="Cari ASN, pilih profil, lalu kelola dokumen kepegawaian yang terkait."
        meta={<StatusBadge value="SIDATA DMS" tone="dark" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Cari ASN" description="Gunakan NIP atau nama agar dokumen tidak memuat semua data sekaligus.">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadAsn();
              }}
              placeholder="Cari NIP atau nama ASN"
            />
          </div>
          <ActionButton icon={Search} onClick={() => void loadAsn()} disabled={loadingAsn}>
            Cari
          </ActionButton>
        </div>

        {loadingAsn ? (
          <div className="mt-4">
            <LoadingState label="Memuat ASN" />
          </div>
        ) : asnList.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={UserRoundSearch}
              title="Belum ada ASN dipilih"
              description="Cari ASN terlebih dahulu untuk melihat dokumen."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {asnList.map((asn) => (
              <button
                key={asn.id}
                type="button"
                onClick={() => void selectAsn(asn)}
                className={`rounded-lg border p-3 text-left ${
                  selectedAsn?.id === asn.id
                    ? 'border-[#0e7c86] bg-[#eef8f6]'
                    : 'border-border bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="truncate text-sm font-semibold text-zinc-900">{asn.nama}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{asn.nip}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {asn.unitKerja?.nama ?? '-'}
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={selectedAsn ? `Dokumen ${selectedAsn.nama}` : 'Dokumen ASN'}
        description={selectedAsn ? `NIP ${selectedAsn.nip}` : 'Pilih ASN terlebih dahulu.'}
      >
        {selectedAsn ? (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-[200px_1fr_auto]">
              <select
                className={inputClass}
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                className={inputClass}
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <ActionButton
                icon={UploadCloud}
                disabled={!canUpload || working}
                onClick={() => void uploadDocument()}
              >
                {working ? 'Memproses...' : 'Upload'}
              </ActionButton>
            </div>

            {file ? (
              <div className="mb-4 rounded-lg border border-[#cfe1da] bg-[#f7fbf8] p-3 text-sm text-[#4c625c]">
                File dipilih: <span className="font-semibold">{file.name}</span> ({formatSize(file.size)})
              </div>
            ) : null}

            {loadingDocuments ? (
              <LoadingState label="Memuat dokumen ASN" />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Belum ada dokumen"
                description="Upload dokumen pertama untuk ASN yang dipilih."
              />
            ) : (
              <DataTable
                items={documents}
                rowKey={(item) => item.id}
                columns={[
                  { key: 'type', header: 'Jenis', className: 'w-[140px]', render: (item) => item.documentType },
                  {
                    key: 'name',
                    header: 'File',
                    render: (item) => (
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-zinc-900">
                          {item.originalFileName ?? item.fileName}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatSize(item.fileSize)}
                        </div>
                      </div>
                    ),
                  },
                  { key: 'uploaded', header: 'Upload', className: 'w-[170px]', render: (item) => formatDateTime(item.uploadedAt) },
                  {
                    key: 'actions',
                    header: '',
                    className: 'w-[110px]',
                    render: (item) => (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border p-2 hover:bg-zinc-50"
                          onClick={() => sidataApi.downloadAsnDocument(selectedAsn.id, item)}
                          title="Download"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border p-2 text-red-600 hover:bg-red-50"
                          onClick={() => void deleteDocument(item)}
                          title="Nonaktifkan"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="Pilih ASN terlebih dahulu"
            description="Dokumen akan tampil setelah satu ASN dipilih dari hasil pencarian."
          />
        )}
      </SectionCard>
    </div>
  );
}
