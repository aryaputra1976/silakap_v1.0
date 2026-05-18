import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import {
  filterRequestsByStatus,
  opdRequests,
  opdTimeline,
} from '@/lib/opd/opd-portal-data';

type OpdSipensiunMode = 'list' | 'status' | 'revision';

const pageCopy: Record<
  OpdSipensiunMode,
  { title: string; description: string; empty: string; status?: 'PERLU_PERBAIKAN' }
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
    status: 'PERLU_PERBAIKAN',
  },
};

export function OpdSipensiunPage({
  mode = 'list',
}: {
  mode?: OpdSipensiunMode;
}) {
  const copy = pageCopy[mode];
  const requests = filterRequestsByStatus(opdRequests, copy.status);

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title={copy.title}
          description="Data usulan pensiun dibatasi untuk OPD yang sedang login."
          actions={<StatusBadge value={`${requests.length} usulan`} />}
        >
          <OpdRequestTable items={requests} empty={copy.empty} />
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
