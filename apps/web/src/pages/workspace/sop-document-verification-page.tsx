import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Database, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  SopDocumentVerificationFilters,
  type SopDocumentVerificationFilterValue,
} from '@/components/workspace/sop/sop-document-verification-filters';
import { SopDocumentVerificationSummary } from '@/components/workspace/sop/sop-document-verification-summary';
import { SopDocumentVerificationAsnTable } from '@/components/workspace/sop/sop-document-verification-asn-table';
import { SopDocumentVerificationDmsTable } from '@/components/workspace/sop/sop-document-verification-dms-table';
import {
  getSopDocumentVerification,
  getTemporaryRequiredDocumentCount,
  type SopDocumentVerificationResult,
} from '@/lib/api/sop-document-verification';
import { ApiError } from '@/lib/api/client';

type VerificationView = 'asn' | 'documents';

const initialFilter: SopDocumentVerificationFilterValue = {
  q: '',
  year: String(new Date().getFullYear()),
  month: '',
  quarter: '',
  category: '',
  status: '',
  unitKerjaId: '',
  asnId: '',
};

export function SopDocumentVerificationPage() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<SopDocumentVerificationFilterValue>(initialFilter);
  const [result, setResult] = useState<SopDocumentVerificationResult | null>(null);
  const [activeView, setActiveView] = useState<VerificationView>('asn');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadVerification() {
    setLoading(true);
    setError('');

    try {
      const nextResult = await getSopDocumentVerification({
        q: filter.q,
        year: filter.year,
        month: filter.month,
        quarter: filter.quarter,
        category: filter.category,
        status: filter.status,
        unitKerjaId: filter.unitKerjaId,
        asnId: filter.asnId,
        page: 1,
        limit: 100,
      });

      setResult(nextResult);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat data DMS dan data kepegawaian ASN',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = result?.summary;
  const rows = result?.rows ?? [];
  const documents = result?.documents ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengelolaan DMS & Data Kepegawaian"
        description="Halaman kerja untuk mendukung kegiatan pengelolaan dokumen dan data kepegawaian ASN, termasuk pemantauan kelengkapan, status verifikasi, dan tindak lanjut data/dokumen ASN."
        meta={
          <>
            <StatusBadge value="SIDATA ASN" tone="dark" />
            <StatusBadge value="DMS Kepegawaian" tone="info" />
            <StatusBadge value="Read-only DMS" tone="success" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => navigate('/sidata/dashboard')}
            >
              Dashboard SIDATA
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={RefreshCw}
              disabled={loading}
              onClick={() => void loadVerification()}
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      <SectionCard
        title="Filter Verifikasi"
        description="Filter ini membaca dokumen DMS existing untuk pemantauan dokumen dan data kepegawaian ASN."
        actions={
          <ActionButton
            icon={Database}
            disabled={loading}
            onClick={() => void loadVerification()}
          >
            Terapkan Filter
          </ActionButton>
        }
      >
        <SopDocumentVerificationFilters
          value={filter}
          disabled={loading}
          onChange={setFilter}
        />
      </SectionCard>

      {error ? <ErrorAlert message={error} /> : null}

      {loading && !result ? (
        <LoadingState label="Memuat data DMS dan data kepegawaian ASN" />
      ) : (
        <>
          {summary ? <SopDocumentVerificationSummary summary={summary} /> : null}

          <SectionCard title="Catatan Perhitungan Sementara">
            <div className="space-y-3 text-sm leading-6 text-[#51614c]">
              <p>
                Modul ini belum memakai master persyaratan dokumen ASN. Persentase kelengkapan sementara dihitung dari
                jumlah dokumen DMS berstatus <strong>Verified</strong> dibanding target sementara{' '}
                <strong>{getTemporaryRequiredDocumentCount()} dokumen per ASN</strong>.
              </p>
              <p>
                Dokumen yang belum memiliki <strong>asnId</strong> tetap dihitung pada ringkasan sebagai dokumen belum
                terkait ASN. Pada tahap berikutnya, relasi ASN dan jenis dokumen wajib bisa diperkuat dari backend.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Hasil Pengelolaan Dokumen ASN"
            description="Tampilan rekap per ASN dan daftar dokumen DMS yang terbaca sesuai filter."
            actions={
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    activeView === 'asn'
                      ? 'border-[#0f766e] bg-[#0f766e] text-white'
                      : 'border-[#c9d9c4] bg-white text-[#173c36] hover:bg-[#eef7ec]'
                  }`}
                  onClick={() => setActiveView('asn')}
                  type="button"
                >
                  Rekap per ASN ({rows.length})
                </button>
                <button
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    activeView === 'documents'
                      ? 'border-[#0f766e] bg-[#0f766e] text-white'
                      : 'border-[#c9d9c4] bg-white text-[#173c36] hover:bg-[#eef7ec]'
                  }`}
                  onClick={() => setActiveView('documents')}
                  type="button"
                >
                  Dokumen DMS ({documents.length})
                </button>
              </div>
            }
          >
            {activeView === 'asn' ? (
              <SopDocumentVerificationAsnTable rows={rows} />
            ) : (
              <SopDocumentVerificationDmsTable documents={documents} />
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
