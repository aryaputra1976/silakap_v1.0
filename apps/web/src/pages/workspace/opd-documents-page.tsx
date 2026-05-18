import { Link } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  formatDate,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import {
  filterDocumentsByStatus,
  opdDocuments,
  type OpdDocument,
} from '@/lib/opd/opd-portal-data';

type OpdDocumentsMode = 'list' | 'revision';

export function OpdDocumentsPage({
  mode = 'list',
}: {
  mode?: OpdDocumentsMode;
}) {
  const documents = filterDocumentsByStatus(
    opdDocuments,
    mode === 'revision' ? 'PERLU_PERBAIKAN' : undefined,
  );
  const title =
    mode === 'revision' ? 'Dokumen Perlu Perbaikan' : 'Dokumen Saya';

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title={title}
        description="Daftar dokumen pendukung milik OPD dan status verifikasinya."
        actions={
          <Link to="/opd/dokumen/upload">
            <ActionButton icon={Plus}>Upload Bukti Dukung</ActionButton>
          </Link>
        }
      />

      <SectionCard
        title={title}
        description="Dokumen OPD tidak membuka akses ke arsip internal PPIK."
        actions={<StatusBadge value={`${documents.length} dokumen`} />}
      >
        <DataTable<OpdDocument>
          items={documents}
          rowKey={(item) => item.id}
          empty="Belum ada dokumen OPD"
          columns={[
            {
              key: 'nama',
              header: 'Dokumen',
              render: (item) => (
                <div>
                  <div className="font-semibold text-[#173c36]">
                    {item.nama}
                  </div>
                  <div className="mt-1 text-xs text-[#687967]">
                    {item.kategori}
                  </div>
                </div>
              ),
            },
            {
              key: 'tanggal',
              header: 'Tanggal Upload',
              render: (item) => formatDate(item.tanggalUnggah),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => <StatusBadge value={item.status} />,
            },
            {
              key: 'catatan',
              header: 'Catatan Verifikator',
              render: (item) => item.catatanVerifikator || '-',
            },
            {
              key: 'aksi',
              header: 'Aksi',
              render: () => (
                <ActionButton icon={Download} variant="secondary" disabled>
                  Unduh
                </ActionButton>
              ),
            },
          ]}
        />
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
