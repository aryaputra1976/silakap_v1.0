import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { DocumentRecord, PaginatedResult } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  formatDateTime,
  formatFileSize,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';

export function SiarsipPage() {
  const [q, setQ] = useState('');
  const [caseId, setCaseId] = useState('');
  const [data, setData] = useState<PaginatedResult<DocumentRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<DocumentRecord>>('/siarsip/documents', { q, caseId, page: 1, limit: 20 })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : 'Gagal memuat dokumen');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [caseId, q]);

  async function download(document: DocumentRecord) {
    setDownloadingId(document.id);
    setError('');
    try {
      const blob = await apiClient.download(`/siarsip/documents/${document.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.originalFileName ?? document.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal download dokumen');
    } finally {
      setDownloadingId('');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIARSIP"
        description="Daftar metadata dokumen case, lengkap dengan tipe dokumen dan akses download."
        meta={<StatusBadge value={`${data?.total ?? 0} DOCUMENTS`} tone="info" />}
      />
      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input className={`${inputClass} w-full pl-10`} placeholder="Cari tipe/file" value={q} onChange={(event) => setQ(event.target.value)} />
          </div>
          <input className={`${inputClass} md:col-span-2`} placeholder="Filter caseId" value={caseId} onChange={(event) => setCaseId(event.target.value)} />
        </FilterBar>
      </Toolbar>

      <SectionCard title="Document Vault" description="Dokumen yang sudah diunggah melalui checklist layanan.">
        {loading ? (
          <LoadingState label="Memuat dokumen SIARSIP" />
        ) : (
          <DataTable
            items={data?.items ?? []}
            rowKey={(item) => item.id}
            empty="Belum ada dokumen"
            columns={[
              {
                key: 'file',
                header: 'Original File Name',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">{item.originalFileName ?? item.fileName}</div>
                    <div className="text-xs text-muted-foreground">{item.fileName}</div>
                  </div>
                ),
              },
              { key: 'type', header: 'Document Type', render: (item) => <StatusBadge value={item.documentType} /> },
              { key: 'case', header: 'Case', render: (item) => item.case?.caseNumber ?? item.caseId ?? '-' },
              { key: 'mime', header: 'Mime Type', render: (item) => item.mimeType ?? '-' },
              { key: 'size', header: 'Size', render: (item) => formatFileSize(item.fileSize) },
              { key: 'uploaded', header: 'Uploaded', render: (item) => formatDateTime(item.uploadedAt) },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <ActionButton
                    disabled={downloadingId === item.id}
                    icon={Download}
                    onClick={() => download(item)}
                    variant="secondary"
                  >
                    Download
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
