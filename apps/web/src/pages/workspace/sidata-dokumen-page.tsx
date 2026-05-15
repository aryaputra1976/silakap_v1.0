import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Search, Trash2, UploadCloud } from 'lucide-react';
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
  Toolbar,
} from '@/components/workspace/ui';

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
  const [q, setQ] = useState('');
  const [asnList, setAsnList] = useState<AsnRecord[]>([]);
  const [selectedAsn, setSelectedAsn] = useState<AsnRecord | null>(null);
  const [documents, setDocuments] = useState<SidataAsnDocument[]>([]);
  const [documentType, setDocumentType] = useState('SK');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const canUpload = useMemo(() => selectedAsn && file && documentType.trim(), [documentType, file, selectedAsn]);

  useEffect(() => {
    void loadAsn();
  }, []);

  async function loadAsn(search = q) {
    setLoading(true);
    setError('');
    try {
      const result = await sidataApi.getAsnList({ q: search, page: 1, limit: 25 });
      setAsnList(result.items);
      if (!selectedAsn && result.items[0]) {
        setSelectedAsn(result.items[0]);
        await loadDocuments(result.items[0].id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat ASN');
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(asnId = selectedAsn?.id) {
    if (!asnId) return;
    setError('');
    try {
      setDocuments(await sidataApi.getAsnDocuments(asnId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memuat dokumen ASN');
    }
  }

  async function uploadDocument() {
    if (!selectedAsn || !file) return;
    setWorking(true);
    try {
      await sidataApi.uploadAsnDocument(selectedAsn.id, file, documentType);
      setFile(null);
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
        description="Upload dan kelola dokumen kepegawaian yang tertaut langsung ke profil ASN."
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard title="Pilih ASN" description="Cari ASN lalu pilih profil untuk melihat dokumennya.">
        <Toolbar
          left={
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                className={inputClass}
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void loadAsn();
                }}
                placeholder="Cari NIP, nama, jabatan"
              />
            </div>
          }
          right={<ActionButton icon={Search} onClick={() => void loadAsn()}>Cari</ActionButton>}
        />
        {loading ? (
          <LoadingState label="Memuat ASN" />
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {asnList.map((asn) => (
              <button
                key={asn.id}
                type="button"
                onClick={() => {
                  setSelectedAsn(asn);
                  void loadDocuments(asn.id);
                }}
                className={`rounded-lg border p-3 text-left ${
                  selectedAsn?.id === asn.id ? 'border-zinc-900 bg-zinc-50' : 'border-border bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="text-sm font-semibold text-zinc-900">{asn.nama}</div>
                <div className="mt-1 text-xs text-muted-foreground">{asn.nip}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{asn.unitKerja?.nama ?? '-'}</div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={selectedAsn ? `Dokumen ${selectedAsn.nama}` : 'Dokumen'} description="Upload SK, ijazah, atau dokumen lain per ASN.">
        <div className="mb-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input className={inputClass} value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Jenis dokumen" />
          <input className={inputClass} type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <ActionButton icon={UploadCloud} disabled={!canUpload || working} onClick={() => void uploadDocument()}>
            {working ? 'Memproses...' : 'Upload'}
          </ActionButton>
        </div>

        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada dokumen" description="Upload dokumen pertama untuk ASN yang dipilih." />
        ) : (
          <DataTable
            items={documents}
            rowKey={(item) => item.id}
            columns={[
              { key: 'type', header: 'Jenis', render: (item) => item.documentType },
              { key: 'name', header: 'File', render: (item) => item.originalFileName ?? item.fileName },
              { key: 'size', header: 'Ukuran', render: (item) => formatSize(item.fileSize) },
              { key: 'uploaded', header: 'Upload', render: (item) => formatDateTime(item.uploadedAt) },
              {
                key: 'actions',
                header: '',
                render: (item) => (
                  <div className="flex justify-end gap-2">
                    <button type="button" className="rounded-md border p-2 hover:bg-zinc-50" onClick={() => selectedAsn && sidataApi.downloadAsnDocument(selectedAsn.id, item)}>
                      <Download className="size-4" />
                    </button>
                    <button type="button" className="rounded-md border p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteDocument(item)}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
