import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, ExternalLink } from 'lucide-react';
import { ActionButton, DataTable, ErrorAlert, StatusBadge } from '@/components/workspace/ui';
import {
  dmsApi,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocument,
} from '@/lib/api/dms';
import { ApiError } from '@/lib/api/client';

export function SopDocumentVerificationDmsTable({
  documents,
}: {
  documents: DmsDocument[];
}) {
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  async function downloadDocument(document: DmsDocument) {
    if (!document.fileName) {
      return;
    }

    setDownloadingId(document.id);
    setError('');

    try {
      await dmsApi.downloadDocument(document.id, document.originalFileName ?? document.fileName);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal mengunduh dokumen DMS');
    } finally {
      setDownloadingId('');
    }
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorAlert message={error} /> : null}

      <DataTable<DmsDocument>
        items={documents}
        empty="Belum ada dokumen DMS sesuai filter"
        rowKey={(item) => item.id}
        columns={[
          {
            key: 'document',
            header: 'Dokumen',
            render: (item) => (
              <div>
                <div className="font-semibold text-[#173c36]">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-[#6d7e68]">
                  {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
                </div>
              </div>
            ),
          },
          {
            key: 'asn',
            header: 'ASN',
            render: (item) => (
              <div>
                <div className="font-semibold text-[#173c36]">{item.asn?.nama ?? '-'}</div>
                <div className="mt-1 text-xs text-[#6d7e68]">{item.asn?.nip ?? item.asnId ?? '-'}</div>
              </div>
            ),
          },
          {
            key: 'unit',
            header: 'Unit',
            render: (item) => item.unitKerja?.nama ?? item.asn?.unitKerjaId ?? '-',
          },
          {
            key: 'category',
            header: 'Kategori',
            render: (item) => <StatusBadge value={dmsCategoryLabel(item.category)} tone="info" />,
          },
          {
            key: 'period',
            header: 'Periode',
            render: (item) => (
              <span>
                {item.periodMonth ? `Bulan ${item.periodMonth} ` : ''}
                {item.periodQuarter ? `Triwulan ${item.periodQuarter} ` : ''}
                {item.periodYear ?? '-'}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge value={dmsStatusLabel(item.status)} />,
          },
          {
            key: 'file',
            header: 'File',
            render: (item) => (
              <StatusBadge
                value={item.fileName ? 'Ada File' : 'Tanpa File'}
                tone={item.fileName ? 'success' : 'warning'}
              />
            ),
          },
          {
            key: 'action',
            header: 'Aksi',
            className: 'text-right',
            render: (item) => (
              <div className="flex justify-end gap-2">
                <ActionButton
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => navigate(`/dms/documents/${item.id}`)}
                >
                  Detail
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  icon={Download}
                  disabled={!item.fileName || downloadingId === item.id}
                  onClick={() => void downloadDocument(item)}
                >
                  Unduh
                </ActionButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
