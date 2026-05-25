import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { ApiError, apiClient } from '@/lib/api/client';
import type { PaginatedResult, SiapCaseListItem } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Toolbar,
  WorkflowBadge,
} from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';

const SERVICE_TYPES = [
  'KENAIKAN_PANGKAT',
  'MUTASI',
  'PENSIUN',
  'CUTI',
  'IZIN_BELAJAR',
  'SURAT_KETERANGAN',
  'PEMBUATAN_KARPEG',
  'LAIN_LAIN',
];

const CASE_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED'];

const PRIORITY_TONE: Record<string, 'neutral' | 'warning' | 'danger'> = {
  NORMAL: 'neutral',
  URGENT: 'warning',
  CRITICAL: 'danger',
};

const CREATE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPD_OPERATOR', 'ASN'];

export function SiapCasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState<PaginatedResult<SiapCaseListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = user?.roles.some((r) => CREATE_ROLES.includes(r)) ?? false;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<PaginatedResult<SiapCaseListItem>>('/siap/cases', {
        q: q || undefined,
        serviceType: serviceType || undefined,
        status: status || undefined,
        page: 1,
        limit: 30,
      });
      setData(res);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat daftar kasus');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, serviceType, status]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar Kasus SIAP"
        description="Manajemen kasus layanan kepegawaian berbasis prosedur workflow."
        meta={<StatusBadge value={`${data?.total ?? 0} KASUS`} tone="info" />}
        actions={
          canCreate ? (
            <ActionButton icon={FilePlus} onClick={() => navigate('/siap/cases/new')}>
              Buat Kasus
            </ActionButton>
          ) : null
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <input
            className={inputClass}
            placeholder="Cari nomor/judul kasus..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={inputClass}
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="">Semua jenis layanan</option>
            {SERVICE_TYPES.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua status</option>
            {CASE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterBar>
      </Toolbar>

      <SectionCard title="Kasus">
        {loading ? (
          <LoadingState label="Memuat kasus..." />
        ) : (
          <DataTable
            items={data?.items ?? []}
            rowKey={(item) => item.id}
            empty="Belum ada kasus"
            onRowClick={(item) => navigate(`/siap/cases/${item.id}`)}
            columns={[
              {
                key: 'caseNumber',
                header: 'No. Kasus',
                render: (item) => (
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.caseNumber}
                  </span>
                ),
              },
              {
                key: 'title',
                header: 'Judul / Jenis',
                render: (item) => (
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.serviceType.replace(/_/g, ' ')}
                    </div>
                  </div>
                ),
              },
              {
                key: 'asn',
                header: 'ASN',
                render: (item) =>
                  item.asn ? (
                    <div>
                      <div className="font-medium">{item.asn.nama}</div>
                      <div className="text-xs text-muted-foreground">{item.asn.nip}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
              {
                key: 'currentState',
                header: 'State',
                render: (item) => (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {item.currentState}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <WorkflowBadge value={item.status} />,
              },
              {
                key: 'priority',
                header: 'Prioritas',
                render: (item) => (
                  <StatusBadge
                    value={item.priority}
                    tone={PRIORITY_TONE[item.priority] ?? 'neutral'}
                  />
                ),
              },
              {
                key: 'createdAt',
                header: 'Dibuat',
                render: (item) => formatDate(item.createdAt),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
