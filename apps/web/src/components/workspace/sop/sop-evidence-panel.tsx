import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, ExternalLink, RefreshCw, UploadCloud } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocument,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import { ApiError } from '@/lib/api/client';
import { dmsApi } from '@/lib/api/dms';
import {
  buildSopEvidenceUploadUrl,
  listSopEvidenceDocuments,
  summarizeSopEvidence,
} from '@/lib/api/sop-evidence';
import { type SopDetail } from '@/lib/sop/sop-data';
import { SopEvidenceFilters, type SopEvidenceFilterValue } from './sop-evidence-filters';
import { SopEvidenceSummary } from './sop-evidence-summary';

const initialFilter: SopEvidenceFilterValue = {
  year: String(new Date().getFullYear()),
  month: '',
  quarter: '',
  category: '',
  status: '',
};

export function SopEvidencePanel({ sop }: { sop: SopDetail }) {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<SopEvidenceFilterValue>(initialFilter);
  const [response, setResponse] = useState<DmsDocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  const primaryRhkCode = sop.rhkCodes[0] ?? '';

  const summary = useMemo(() => summarizeSopEvidence(response?.items ?? []), [response]);

  async function loadEvidence() {
    setLoading(true);
    setError('');

    try {
      const result = await listSopEvidenceDocuments({
        sopCode: sop.code,
        rhkCode: primaryRhkCode,
        year: filter.year,
        month: filter.month,
        quarter: filter.quarter,
        category: filter.category,
        status: filter.status,
        page: 1,
        limit: 20,
      });

      setResponse(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat bukti dukung SOP/RHK dari DMS');
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocument(document: DmsDocument) {
    if (!document.fileName) {
      return;
    }

    setDownloadingId(document.id);
    setError('');

    try {
      await dmsApi.downloadDocument(document.id, document.originalFileName ?? document.fileName);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal mengunduh dokumen bukti dukung');
    } finally {
      setDownloadingId('');
    }
  }

  function openUploadPage() {
    navigate(
      buildSopEvidenceUploadUrl({
        sopCode: sop.code,
        sopTitle: sop.title,
        rhkCode: primaryRhkCode,
        year: filter.year,
        month: filter.month,
        quarter: filter.quarter,
      }),
    );
  }

  useEffect(() => {
    void loadEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sop.code, primaryRhkCode]);

  return (
    <div className="space-y-5">
      <SectionCard
        title="Bukti Dukung SOP/RHK dari DMS"
        description="Panel ini membaca dokumen DMS menggunakan tag SOP/RHK pada judul atau deskripsi. Tidak ada perubahan database pada Phase 2A."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={RefreshCw}
              disabled={loading}
              onClick={() => void loadEvidence()}
            >
              Refresh
            </ActionButton>
            <ActionButton icon={UploadCloud} onClick={openUploadPage}>
              Upload ke DMS
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-[#cfe1da] bg-white p-4 text-sm leading-6 text-[#51614c]">
            <div className="mb-2 font-semibold text-[#18343a]">Format tagging bukti dukung:</div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={`[SOP:${sop.code}]`} tone="dark" />
              {primaryRhkCode ? <StatusBadge value={`[RHK:${primaryRhkCode}]`} tone="info" /> : null}
            </div>
            <p className="mt-3">
              Saat upload dokumen dari tombol di atas, form DMS akan otomatis diisi dengan konteks SOP/RHK agar
              dokumen bisa ditemukan kembali dari halaman ini.
            </p>
          </div>

          <SopEvidenceFilters value={filter} disabled={loading} onChange={setFilter} />

          <div className="flex justify-end">
            <ActionButton variant="secondary" icon={RefreshCw} disabled={loading} onClick={() => void loadEvidence()}>
              Terapkan Filter
            </ActionButton>
          </div>
        </div>
      </SectionCard>

      {error ? <ErrorAlert message={error} /> : null}

      {loading && !response ? (
        <LoadingState label="Memuat bukti dukung SOP/RHK dari DMS" />
      ) : (
        <>
          <SopEvidenceSummary summary={summary} />

          <SectionCard
            title="Daftar Bukti Dukung"
            description="Dokumen berasal dari DMS existing. Klik detail untuk membuka halaman dokumen DMS."
          >
            <DataTable<DmsDocument>
              items={response?.items ?? []}
              empty="Belum ada bukti dukung DMS yang cocok dengan tag SOP/RHK ini"
              rowKey={(item) => item.id}
              columns={[
                {
                  key: 'title',
                  header: 'Dokumen',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-[#18343a]">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-[#6d7e68]">
                        {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
                      </div>
                    </div>
                  ),
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
                    <StatusBadge value={item.fileName ? 'Ada File' : 'Tanpa File'} tone={item.fileName ? 'success' : 'warning'} />
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
          </SectionCard>
        </>
      )}
    </div>
  );
}
