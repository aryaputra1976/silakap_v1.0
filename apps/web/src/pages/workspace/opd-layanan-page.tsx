import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdSummaryCards } from '@/components/workspace/opd/opd-summary-cards';
import {
  emptyOpdSummary,
  filterRequestsByStatus,
  opdRequests,
} from '@/lib/opd/opd-portal-data';

type OpdLayananMode = 'list' | 'revision' | 'history';

const pageCopy: Record<
  OpdLayananMode,
  { title: string; description: string; empty: string; status?: 'PERLU_PERBAIKAN' | 'SELESAI' }
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
    status: 'PERLU_PERBAIKAN',
  },
  history: {
    title: 'Riwayat Layanan',
    description: 'Permohonan OPD yang sudah selesai diproses.',
    empty: 'Belum ada riwayat layanan selesai',
    status: 'SELESAI',
  },
};

export function OpdLayananPage({ mode = 'list' }: { mode?: OpdLayananMode }) {
  const copy = pageCopy[mode];
  const requests = filterRequestsByStatus(opdRequests, copy.status);

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

      <OpdSummaryCards summary={emptyOpdSummary} />

      <SectionCard
        title={copy.title}
        description="Tabel ini disiapkan untuk data OPD sendiri dari endpoint layanan OPD."
        actions={<StatusBadge value={`${requests.length} permohonan`} />}
      >
        <OpdRequestTable items={requests} empty={copy.empty} />
      </SectionCard>
    </div>
  );
}
