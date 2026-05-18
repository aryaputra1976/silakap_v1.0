import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  formatDate,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import type { OpdSubmissionDocument } from '@/lib/opd-submissions/types';
import {
  opdSubmissionDocumentStatusLabel,
  opdSubmissionDocumentStatusTone,
} from '@/lib/opd-submissions/types';

type OpdDocumentsMode = 'list' | 'revision';

export function OpdDocumentsPage({
  mode = 'list',
}: {
  mode?: OpdDocumentsMode;
}) {
  const [documents, setDocuments] = useState<OpdSubmissionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const title =
    mode === 'revision' ? 'Dokumen Perlu Perbaikan' : 'Dokumen Saya';
  const visibleDocuments = useMemo(
    () =>
      mode === 'revision'
        ? documents.filter((document) => document.status === 'NEEDS_CORRECTION')
        : documents,
    [documents, mode],
  );

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    opdSubmissionsApi
      .fetchMyOpdSubmissions({ limit: 100 })
      .then((result) => {
        if (active) {
          setDocuments(result.items.flatMap((item) => item.documents));
        }
      })
      .catch((caught) => {
        if (active) {
          setDocuments([]);
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat dokumen OPD',
          );
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
  }, []);

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

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title={title}
        description="Dokumen OPD tidak membuka akses ke arsip internal PPIK."
        actions={<StatusBadge value={`${visibleDocuments.length} dokumen`} />}
      >
        {loading ? (
          <LoadingState label="Memuat dokumen OPD" />
        ) : (
          <DataTable<OpdSubmissionDocument>
            items={visibleDocuments}
            rowKey={(item) => item.id}
            empty="Belum ada dokumen OPD"
            columns={[
              {
                key: 'nama',
                header: 'Dokumen',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#173c36]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-[#687967]">
                      {item.documentType}
                    </div>
                    <div className="mt-1 text-xs text-[#687967]">
                      {item.originalFileName ?? 'Metadata tanpa file'} -{' '}
                      {formatSize(item.sizeBytes)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'tanggal',
                header: 'Tanggal Upload',
                render: (item) => formatDate(item.uploadedAt),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={opdSubmissionDocumentStatusLabel(item.status)}
                    tone={opdSubmissionDocumentStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'catatan',
                header: 'Catatan Verifikator',
                render: (item) => item.note || '-',
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
        )}
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}

function formatSize(value: number | null) {
  if (!value) {
    return '-';
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
