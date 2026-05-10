import { useEffect, useState } from 'react';
import { CheckCircle2, Play, RefreshCcw } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type { PaginatedResult, SiapTask } from '@/lib/api/types';
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
  SlaBadge,
  StatusBadge,
  Toolbar,
  WorkflowBadge,
} from '@/components/workspace/ui';

export function SiapTasksPage() {
  const [status, setStatus] = useState('');
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await apiClient.get<PaginatedResult<SiapTask>>('/siap/tasks', { status, page: 1, limit: 20 }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat task');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function mutateTask(id: string, action: 'start' | 'complete') {
    setWorkingId(id);
    setError('');
    try {
      await apiClient.post(`/siap/tasks/${id}/${action}`, action === 'complete' ? { note: 'Selesai dari workspace' } : undefined);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Aksi task gagal');
    } finally {
      setWorkingId('');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIAP Tasks"
        description="Task workflow aktif yang dapat diproses berdasarkan user, assignee, dan role."
        meta={<StatusBadge value={`${data?.total ?? 0} TASK`} tone="info" />}
        actions={
          <ActionButton icon={RefreshCcw} onClick={load} variant="secondary">
            Refresh
          </ActionButton>
        }
      />
      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <FilterBar>
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Semua status</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </FilterBar>
      </Toolbar>

      <SectionCard title="Task Queue" description="Gunakan aksi hanya pada status yang valid.">
        {loading ? (
          <LoadingState label="Memuat task SIAP" />
        ) : (
          <DataTable
            items={data?.items ?? []}
            rowKey={(item) => item.id}
            empty="Belum ada task"
            columns={[
              {
                key: 'title',
                header: 'Task',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.taskType}</div>
                  </div>
                ),
              },
              {
                key: 'case',
                header: 'Case',
                render: (item) => (
                  <div>
                    <div className="font-medium text-zinc-900">{item.case?.caseNumber ?? item.caseId}</div>
                    <div className="text-xs text-muted-foreground">{item.case?.asn?.nama ?? '-'}</div>
                  </div>
                ),
              },
              { key: 'status', header: 'Status', render: (item) => <WorkflowBadge value={item.status} /> },
              { key: 'sla', header: 'SLA', render: (item) => <SlaBadge dueDate={item.dueDate} status={item.status} /> },
              { key: 'priority', header: 'Priority', render: (item) => <StatusBadge value={item.priority} /> },
              { key: 'due', header: 'Due Date', render: (item) => formatDate(item.dueDate) },
              {
                key: 'actions',
                header: 'Action',
                render: (item) => (
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'ASSIGNED' ? (
                      <ActionButton disabled={workingId === item.id} icon={Play} onClick={() => mutateTask(item.id, 'start')} variant="secondary">
                        Start
                      </ActionButton>
                    ) : null}
                    {item.status === 'IN_PROGRESS' ? (
                      <ActionButton disabled={workingId === item.id} icon={CheckCircle2} onClick={() => mutateTask(item.id, 'complete')}>
                        Complete
                      </ActionButton>
                    ) : null}
                    {item.status !== 'ASSIGNED' && item.status !== 'IN_PROGRESS' ? <StatusBadge value="NO ACTION" /> : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
