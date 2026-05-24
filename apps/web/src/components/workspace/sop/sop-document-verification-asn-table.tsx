import { useNavigate } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { ActionButton, DataTable, StatusBadge } from '@/components/workspace/ui';
import {
  formatVerificationDate,
  verificationStatusLabel,
  verificationStatusTone,
  type SopDocumentVerificationRow,
} from '@/lib/api/sop-document-verification';

export function SopDocumentVerificationAsnTable({
  rows,
}: {
  rows: SopDocumentVerificationRow[];
}) {
  const navigate = useNavigate();

  return (
    <DataTable<SopDocumentVerificationRow>
      items={rows}
      empty="Belum ada dokumen DMS yang terkait ASN sesuai filter"
      rowKey={(item) => item.asnId}
      columns={[
        {
          key: 'asn',
          header: 'ASN',
          render: (item) => (
            <div>
              <div className="font-semibold text-[#18343a]">{item.name}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">NIP. {item.nip}</div>
              <div className="mt-1 text-xs text-[#6d7e68]">{item.unitKerjaName}</div>
            </div>
          ),
        },
        {
          key: 'total',
          header: 'Dokumen',
          render: (item) => item.totalDocuments,
        },
        {
          key: 'verified',
          header: 'Verified',
          render: (item) => item.verifiedDocuments,
        },
        {
          key: 'rejected',
          header: 'Rejected',
          render: (item) => item.rejectedDocuments,
        },
        {
          key: 'waiting',
          header: 'Uploaded/Submitted',
          render: (item) => item.uploadedOrSubmittedDocuments,
        },
        {
          key: 'file',
          header: 'File',
          render: (item) => (
            <div className="space-y-1 text-xs">
              <div>Ada: {item.documentsWithFile}</div>
              <div>Tanpa: {item.documentsWithoutFile}</div>
            </div>
          ),
        },
        {
          key: 'progress',
          header: 'Kelengkapan',
          render: (item) => (
            <div className="min-w-36">
              <div className="mb-1 text-xs font-semibold text-[#18343a]">{item.completenessPercent}%</div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dce8d6]">
                <div
                  className="h-full rounded-full bg-[#0e7c86]"
                  style={{ width: `${item.completenessPercent}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={verificationStatusLabel(item.status)}
              tone={verificationStatusTone(item.status)}
            />
          ),
        },
        {
          key: 'latest',
          header: 'Update',
          render: (item) => formatVerificationDate(item.latestUpdatedAt),
        },
        {
          key: 'action',
          header: 'Aksi',
          className: 'text-right',
          render: (item) => {
            const firstDocument = item.documents[0];

            if (!firstDocument) {
              return '-';
            }

            return (
              <div className="flex justify-end">
                <ActionButton
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => navigate(`/dms/documents/${firstDocument.id}`)}
                >
                  DMS
                </ActionButton>
              </div>
            );
          },
        },
      ]}
    />
  );
}
