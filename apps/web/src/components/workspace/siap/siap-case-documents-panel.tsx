import { useEffect, useState } from 'react';
import { Download, FolderArchive, RefreshCcw, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import { dmsApi, type DmsDocument } from '@/lib/api/dms';
import type { DocumentRecord } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  formatDateTime,
  formatFileSize,
  LoadingState,
  SectionCard,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

export function SiapCaseDocumentsPanel({
  caseId,
  caseNumber,
  asnId,
}: {
  caseId: string;
  caseNumber: string;
  asnId?: string | null;
}) {
  const navigate = useNavigate();
  const [dmsDocuments, setDmsDocuments] = useState<DmsDocument[]>([]);
  const [legacyDocuments, setLegacyDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [dmsResult, legacyResult] = await Promise.all([
        dmsApi.listDocuments({ caseId, page: 1, limit: 25 }),
        apiClient.get<DocumentRecord[]>(`/siarsip/cases/${caseId}/documents`),
      ]);

      setDmsDocuments(dmsResult.items);
      setLegacyDocuments(legacyResult);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dokumen kasus',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  function openDmsUpload() {
    const params = new URLSearchParams();
    params.set('caseId', caseId);
    if (asnId) params.set('asnId', asnId);
    navigate(`/dms/upload?${params.toString()}`);
  }

  async function downloadLegacyDocument(item: DocumentRecord) {
    setDownloadingId(item.id);
    setError('');

    try {
      await apiClient.download(
        `/siarsip/documents/${item.id}/download`,
        item.originalFileName ?? item.fileName,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengunduh dokumen',
      );
    } finally {
      setDownloadingId('');
    }
  }

  async function downloadDmsDocument(item: DmsDocument) {
    if (!item.fileName) return;
    setDownloadingId(item.id);
    setError('');

    try {
      await dmsApi.downloadDocument(
        item.id,
        item.originalFileName ?? item.fileName,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengunduh dokumen DMS',
      );
    } finally {
      setDownloadingId('');
    }
  }

  return (
    <SectionCard
      title="Dokumen & Bukti Dukung"
      description={`Dokumen yang terhubung dengan kasus ${caseNumber}.`}
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Upload} onClick={openDmsUpload}>
            Upload DMS
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void load()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        </div>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat dokumen kasus" />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Dokumen DMS
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Sumber utama bukti dukung yang dipakai untuk arsip dan verifikasi.
              </p>
            </div>
            <DataTable
              items={dmsDocuments}
              rowKey={(item) => item.id}
              empty="Belum ada dokumen DMS untuk kasus ini"
              columns={[
                {
                  key: 'document',
                  header: 'Dokumen',
                  render: (item) => (
                    <div className="max-w-lg">
                      <div className="font-semibold text-zinc-950">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
                      </div>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'category',
                  header: 'Kategori',
                  render: (item) => <DmsCategoryBadge category={item.category} />,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => <DmsStatusBadge status={item.status} />,
                },
                {
                  key: 'createdAt',
                  header: 'Tanggal',
                  render: (item) => formatDateTime(item.createdAt),
                },
                {
                  key: 'actions',
                  header: 'Aksi',
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        icon={FolderArchive}
                        onClick={() => navigate(`/dms/documents/${item.id}`)}
                        variant="secondary"
                      >
                        Buka
                      </ActionButton>
                      {item.fileName ? (
                        <ActionButton
                          disabled={downloadingId === item.id}
                          icon={Download}
                          onClick={() => void downloadDmsDocument(item)}
                          variant="ghost"
                        >
                          Unduh
                        </ActionButton>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          </section>

          <section className="grid gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Dokumen SIARSIP Lama
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Arsip lama tetap ditampilkan agar dokumen existing tidak hilang.
              </p>
            </div>
            <DataTable
              items={legacyDocuments}
              rowKey={(item) => item.id}
              empty="Belum ada dokumen SIARSIP untuk kasus ini"
              columns={[
                {
                  key: 'document',
                  header: 'Dokumen',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-zinc-950">
                        {item.originalFileName ?? item.fileName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.documentType} - {formatFileSize(item.fileSize)}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'date',
                  header: 'Diunggah',
                  render: (item) => formatDateTime(item.uploadedAt),
                },
                {
                  key: 'actions',
                  header: 'Aksi',
                  render: (item) => (
                    <ActionButton
                      disabled={downloadingId === item.id}
                      icon={Download}
                      onClick={() => void downloadLegacyDocument(item)}
                      variant="secondary"
                    >
                      Unduh
                    </ActionButton>
                  ),
                },
              ]}
            />
          </section>
        </div>
      )}
    </SectionCard>
  );
}
