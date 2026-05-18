import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ActionButton, ErrorAlert, LoadingState, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdSummaryCards } from '@/components/workspace/opd/opd-summary-cards';
import { emptyOpdSummary } from '@/lib/opd/opd-portal-data';
import type { OpdSubmission, OpdSubmissionStatus } from '@/lib/opd-submissions/types';

type OpdLayananMode = 'list' | 'revision' | 'history';

const pageCopy: Record<
  OpdLayananMode,
  { title: string; description: string; empty: string; status?: OpdSubmissionStatus }
> = {
  list: {
    title: 'Permohonan Saya',
    description: 'Daftar permohonan layanan kepegawaian milik OPD.',
    empty: 'Belum ada permohonan layanan',
  },
  revision: {
    title: 'Perbaikan Berkas',
    description: 'Permohonan OPD yang membutuhkan perbaikan dokumen.',
    empty: 'Belum ada berkas yang perlu diperbaiki',
    status: 'NEEDS_CORRECTION',
  },
  history: {
    title: 'Riwayat Layanan',
    description: 'Permohonan OPD yang sudah selesai diproses.',
    empty: 'Belum ada riwayat layanan selesai',
    status: 'COMPLETED',
  },
};

export function OpdLayananPage({ mode = 'list' }: { mode?: OpdLayananMode }) {
  const copy = pageCopy[mode];
  const [requests, setRequests] = useState<OpdSubmission[]>([]);
  const [summary, setSummary] = useState(emptyOpdSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      opdSubmissionsApi.fetchMyOpdSubmissionSummary({
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
      }),
      opdSubmissionsApi.fetchMyOpdSubmissions({
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        status: copy.status,
        limit: 30,
      }),
    ])
      .then(([summaryResult, listResult]) => {
        if (!active) {
          return;
        }

        setSummary(summaryResult);
        setRequests(listResult.items);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }

        setSummary(emptyOpdSummary);
        setRequests([]);
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal memuat permohonan OPD',
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [copy.status]);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Link to="/opd/layanan/ajukan">
            <ActionButton icon={Plus}>Ajukan Layanan</ActionButton>
          </Link>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <OpdSummaryCards summary={summary} />

      <SectionCard
        title={copy.title}
        description="Tabel ini disiapkan untuk data OPD sendiri dari endpoint layanan OPD."
        actions={<StatusBadge value={`${requests.length} permohonan`} />}
      >
        {loading ? (
          <LoadingState label="Memuat permohonan OPD" />
        ) : (
          <OpdRequestTable items={requests} empty={copy.empty} />
        )}
      </SectionCard>
    </div>
  );
}
