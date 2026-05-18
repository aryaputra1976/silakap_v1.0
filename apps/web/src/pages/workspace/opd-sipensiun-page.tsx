import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import { opdTimeline } from '@/lib/opd/opd-portal-data';
import type { OpdSubmission, OpdSubmissionStatus } from '@/lib/opd-submissions/types';

type OpdSipensiunMode = 'list' | 'status' | 'revision';

const pageCopy: Record<
  OpdSipensiunMode,
  { title: string; description: string; empty: string; status?: OpdSubmissionStatus }
> = {
  list: {
    title: 'Usulan Pensiun Saya',
    description: 'Daftar usulan pensiun ASN yang diajukan oleh OPD.',
    empty: 'Belum ada usulan pensiun',
  },
  status: {
    title: 'Status Usulan Pensiun',
    description: 'Pelacakan status usulan pensiun OPD.',
    empty: 'Belum ada status usulan pensiun',
  },
  revision: {
    title: 'Perbaikan Berkas Pensiun',
    description: 'Usulan pensiun yang membutuhkan perbaikan dari OPD.',
    empty: 'Belum ada berkas pensiun yang perlu diperbaiki',
    status: 'NEEDS_CORRECTION',
  },
};

export function OpdSipensiunPage({
  mode = 'list',
}: {
  mode?: OpdSipensiunMode;
}) {
  const copy = pageCopy[mode];
  const [requests, setRequests] = useState<OpdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    opdSubmissionsApi
      .fetchMyOpdSubmissions({
        moduleKey: 'SIPENSIUN',
        status: copy.status,
        limit: 30,
      })
      .then((result) => {
        if (active) {
          setRequests(result.items);
        }
      })
      .catch((caught) => {
        if (active) {
          setRequests([]);
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat usulan pensiun OPD',
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
  }, [copy.status]);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Link to="/opd/sipensiun/ajukan">
            <ActionButton icon={Plus}>Ajukan Usulan</ActionButton>
          </Link>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title={copy.title}
          description="Data usulan pensiun dibatasi untuk OPD yang sedang login."
          actions={<StatusBadge value={`${requests.length} usulan`} />}
        >
          {loading ? (
            <LoadingState label="Memuat usulan pensiun OPD" />
          ) : (
            <OpdRequestTable items={requests} empty={copy.empty} />
          )}
        </SectionCard>

        <SectionCard
          title="Timeline Status"
          description="Status usulan akan tampil setelah backend OPD aktif."
        >
          <OpdStatusTimeline items={opdTimeline} />
        </SectionCard>
      </div>
    </div>
  );
}
