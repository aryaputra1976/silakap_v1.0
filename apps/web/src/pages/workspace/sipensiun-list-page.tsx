import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SipensiunCaseListItem } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  StatusBadge,
  Toolbar,
  WorkflowBadge,
} from '@/components/workspace/ui';

const jenisOptions = ['BUP', 'APS', 'JDU', 'TWS', 'SAK', 'HLG', 'PTDH', 'YATIM_PIATU'];
const stateOptions = ['DRAFT', 'SUBMITTED', 'VERIFICATION', 'APPROVAL', 'COMPLETED', 'CANCELLED'];

export function SipensiunListPage() {
  const [q, setQ] = useState('');
  const [jenisPensiun, setJenisPensiun] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [data, setData] = useState<PaginatedResult<SipensiunCaseListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<PaginatedResult<SipensiunCaseListItem>>('/sipensiun/cases', {
        q,
        jenisPensiun,
        currentState,
        page: 1,
        limit: 20,
      })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : 'Gagal memuat SIPENSIUN');
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
  }, [currentState, jenisPensiun, q]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIPENSIUN"
        description="Daftar usulan pensiun yang berjalan melalui SIAP Workflow Engine."
        meta={<StatusBadge value={`${data?.total ?? 0} CASE`} tone="info" />}
      />
      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-10`}
              placeholder="Cari case, ASN, NIP"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <select className={inputClass} value={jenisPensiun} onChange={(event) => setJenisPensiun(event.target.value)}>
            <option value="">Semua jenis pensiun</option>
            {jenisOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className={inputClass} value={currentState} onChange={(event) => setCurrentState(event.target.value)}>
            <option value="">Semua state</option>
            {stateOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FilterBar>
      </Toolbar>

      {loading ? (
        <LoadingState label="Memuat daftar SIPENSIUN" />
      ) : (
        <DataTable
          items={data?.items ?? []}
          rowKey={(item) => item.id}
          empty="Belum ada usulan pensiun"
          columns={[
            {
              key: 'case',
              header: 'Nomor Case',
              render: (item) => (
                <Link className="font-semibold text-zinc-950 underline-offset-4 hover:underline" to={`/sipensiun/${item.id}`}>
                  {item.siapCase.caseNumber}
                </Link>
              ),
            },
            { key: 'nama', header: 'Nama ASN', render: (item) => <span className="font-medium text-zinc-900">{item.asn.nama}</span> },
            { key: 'nip', header: 'NIP', render: (item) => <span className="font-mono text-xs">{item.asn.nip}</span> },
            { key: 'jenis', header: 'Jenis Pensiun', render: (item) => <StatusBadge value={item.jenisPensiun} tone="info" /> },
            { key: 'tmt', header: 'TMT Pensiun', render: (item) => formatDate(item.tmtPensiun) },
            { key: 'state', header: 'State', render: (item) => <WorkflowBadge value={item.siapCase.currentState} /> },
            { key: 'status', header: 'Status', render: (item) => <StatusBadge value={item.siapCase.status} /> },
            {
              key: 'action',
              header: 'Action',
              render: (item) => (
                <Link to={`/sipensiun/${item.id}`}>
                  <ActionButton icon={Eye} variant="secondary">
                    Detail
                  </ActionButton>
                </Link>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
