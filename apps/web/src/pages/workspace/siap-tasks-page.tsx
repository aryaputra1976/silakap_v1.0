import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Play,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  PaginatedResult,
  SiapTask,
  SlaProcessOverdueResult,
} from '@/lib/api/types';
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
import { useAuth } from '@/lib/auth/session';

const taskStatuses = [
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING',
  'RETURNED',
  'OVERDUE',
  'COMPLETED',
  'CANCELLED',
];

export function SiapTasksPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [processingSla, setProcessingSla] = useState(false);
  const [lastSlaResult, setLastSlaResult] =
    useState<SlaProcessOverdueResult | null>(null);

  const canProcessSla =
    user?.roles.some((role) =>
      ['SUPER_ADMIN', 'ADMIN_BKPSDM'].includes(role),
    ) ?? false;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [tasks, overdue] = await Promise.all([
        apiClient.get<PaginatedResult<SiapTask>>('/siap/tasks', {
          status,
          page: 1,
          limit: 20,
        }),
        apiClient.get<PaginatedResult<SiapTask>>('/siap/tasks', {
          status: 'OVERDUE',
          page: 1,
          limit: 1,
        }),
      ]);

      setData(tasks);
      setOverdueTotal(overdue.total);
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

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);

    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) {
      nextParams.set('status', nextStatus);
    } else {
      nextParams.delete('status');
    }

    setSearchParams(nextParams);
  }

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

  async function processSlaOverdue() {
    setProcessingSla(true);
    setError('');

    try {
      const result = await apiClient.post<SlaProcessOverdueResult>(
        '/sla/process-overdue',
        { limit: 100 },
      );

      setLastSlaResult(result);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memproses SLA overdue',
      );
    } finally {
      setProcessingSla(false);
    }
  }

  const visibleTasks = data?.items ?? [];
  const activeVisible = visibleTasks.filter((item) =>
    ['ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RETURNED'].includes(item.status),
  ).length;
  const dueSoonVisible = visibleTasks.filter((item) => isDueSoon(item)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIAP Tasks"
        description="Task workflow aktif yang dapat diproses berdasarkan user, assignee, dan role."
        meta={<StatusBadge value={`${data?.total ?? 0} TASK`} tone="info" />}
        actions={
          <>
            {canProcessSla ? (
              <ActionButton
                disabled={processingSla}
                icon={ShieldAlert}
                onClick={() => void processSlaOverdue()}
                variant={overdueTotal > 0 ? 'danger' : 'secondary'}
              >
                Process SLA Overdue
              </ActionButton>
            ) : null}

            <ActionButton icon={RefreshCcw} onClick={load} variant="secondary">
              Refresh
            </ActionButton>
          </>
        }
      />
      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-3 md:grid-cols-3">
        <SlaSummaryTile
          icon={AlertTriangle}
          label="SLA Overdue"
          value={overdueTotal}
          tone={overdueTotal > 0 ? 'danger' : 'success'}
        />
        <SlaSummaryTile
          icon={Clock3}
          label="Due <= 24 Jam"
          value={dueSoonVisible}
          tone={dueSoonVisible > 0 ? 'warning' : 'success'}
        />
        <SlaSummaryTile
          icon={CheckCircle2}
          label="Task Aktif Terlihat"
          value={activeVisible}
          tone="neutral"
        />
      </section>

      {lastSlaResult ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          SLA processor: {lastSlaResult.total} kandidat,{' '}
          {lastSlaResult.escalated} dieskalasi, {lastSlaResult.failed} gagal.
        </div>
      ) : null}

      <Toolbar>
        <FilterBar>
          <select
            className={inputClass}
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            <option value="">Semua status</option>
            {taskStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
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

function SlaSummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'border-zinc-200 bg-white text-zinc-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {new Intl.NumberFormat('id-ID').format(value)}
          </p>
        </div>
        <Icon className="size-5" />
      </div>
    </div>
  );
}

function isDueSoon(task: SiapTask) {
  if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'OVERDUE') {
    return false;
  }

  const dueAt = new Date(task.dueDate).getTime();
  const now = Date.now();

  return dueAt >= now && dueAt <= now + 24 * 60 * 60 * 1000;
}
