import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Play,
  RefreshCcw,
  ShieldAlert,
  X,
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
} from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';
import {
  priorityLabel,
  priorityTone,
  taskStatusLabel,
  taskStatusTone,
  taskTypeLabel,
} from '@/lib/siap/siap-labels';

const taskStatuses = [
  { value: 'ASSIGNED', label: 'Belum Dikerjakan' },
  { value: 'IN_PROGRESS', label: 'Sedang Dikerjakan' },
  { value: 'WAITING', label: 'Menunggu' },
  { value: 'RETURNED', label: 'Dikembalikan' },
  { value: 'OVERDUE', label: 'Terlambat' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Batal' },
];

export function SiapTasksPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [taskType, setTaskType] = useState(searchParams.get('type') ?? '');
  const [data, setData] = useState<PaginatedResult<SiapTask> | null>(null);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [processingSla, setProcessingSla] = useState(false);
  const [lastSlaResult, setLastSlaResult] =
    useState<SlaProcessOverdueResult | null>(null);
  const [selectedTask, setSelectedTask] = useState<SiapTask | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

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
          status: status || undefined,
          taskType: taskType || undefined,
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
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat tugas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, taskType]);

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

  function changeTaskType(nextType: string) {
    setTaskType(nextType);

    const nextParams = new URLSearchParams(searchParams);
    if (nextType) {
      nextParams.set('type', nextType);
    } else {
      nextParams.delete('type');
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
      setError(caught instanceof ApiError ? caught.message : 'Aksi tugas gagal');
    } finally {
      setWorkingId('');
    }
  }

  function openVerifyModal(task: SiapTask) {
    setSelectedTask(task);
    setVerifyModalOpen(true);
  }

  function closeVerifyModal() {
    setVerifyModalOpen(false);
    setSelectedTask(null);
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
        title={taskType === 'DISPOSISI' ? 'Disposisi & Arahan' : taskType === 'TINDAK_LANJUT' ? 'Tindak Lanjut' : 'Tugas SIAP'}
        description="Daftar pekerjaan yang perlu diproses."
        meta={<StatusBadge value={`${data?.total ?? 0} tugas`} tone="info" />}
        actions={
          <>
            {canProcessSla ? (
              <ActionButton
                disabled={processingSla}
                icon={ShieldAlert}
                onClick={() => void processSlaOverdue()}
                variant={overdueTotal > 0 ? 'danger' : 'secondary'}
              >
                Cek Keterlambatan
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
          label="Terlambat"
          value={overdueTotal}
          tone={overdueTotal > 0 ? 'danger' : 'success'}
        />
        <SlaSummaryTile
          icon={Clock3}
          label="Batas <= 24 Jam"
          value={dueSoonVisible}
          tone={dueSoonVisible > 0 ? 'warning' : 'success'}
        />
        <SlaSummaryTile
          icon={CheckCircle2}
          label="Tugas Aktif"
          value={activeVisible}
          tone="neutral"
        />
      </section>

      {lastSlaResult ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Hasil pengecekan keterlambatan: {lastSlaResult.total} kandidat,{' '}
          {lastSlaResult.escalated} dieskalasi, {lastSlaResult.failed} gagal.
        </div>
      ) : null}

      <Toolbar>
        <FilterBar>
          <select
            className={inputClass}
            value={taskType}
            onChange={(event) => changeTaskType(event.target.value)}
          >
            <option value="">Semua jenis tugas</option>
            <option value="DISPOSISI">Disposisi</option>
            <option value="TINDAK_LANJUT">Tindak Lanjut</option>
            <option value="VERIFIKASI">Verifikasi</option>
            <option value="APPROVAL">Persetujuan</option>
          </select>
          <select
            className={inputClass}
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            <option value="">Semua status</option>
            {taskStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FilterBar>
      </Toolbar>

      <SectionCard title="Daftar Tugas">
        {loading ? (
          <LoadingState label="Memuat tugas SIAP" />
        ) : (
          <DataTable
            items={data?.items ?? []}
            rowKey={(item) => item.id}
            empty="Belum ada tugas"
            columns={[
              {
                key: 'title',
                header: 'Tugas',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{taskTypeLabel(item.taskType)}</div>
                  </div>
                ),
              },
              {
                key: 'case',
                header: 'Kasus',
                render: (item) => (
                  <div>
                    <div className="font-medium text-zinc-900">{item.case?.caseNumber ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{item.case?.asn?.nama ?? '-'}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={taskStatusLabel(item.status)}
                    tone={taskStatusTone(item.status)}
                  />
                ),
              },
              { key: 'sla', header: 'SLA', render: (item) => <SlaBadge dueDate={item.dueDate} status={item.status} /> },
              {
                key: 'priority',
                header: 'Prioritas',
                render: (item) => (
                  <StatusBadge
                    value={priorityLabel(item.priority)}
                    tone={priorityTone(item.priority)}
                  />
                ),
              },
              { key: 'due', header: 'Batas Waktu', render: (item) => formatDate(item.dueDate) },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item) => (
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'ASSIGNED' ? (
                      <ActionButton disabled={workingId === item.id} icon={Play} onClick={() => mutateTask(item.id, 'start')} variant="secondary">
                        Mulai
                      </ActionButton>
                    ) : null}
                    {item.status === 'IN_PROGRESS' ? (
                      <ActionButton disabled={workingId === item.id} icon={CheckCircle2} onClick={() => mutateTask(item.id, 'complete')}>
                        Selesai
                      </ActionButton>
                    ) : null}
                    {item.caseId ? (
                      <ActionButton icon={FileText} onClick={() => openVerifyModal(item)} variant="secondary">
                        Verifikasi
                      </ActionButton>
                    ) : null}
                    {!item.caseId && item.status !== 'ASSIGNED' && item.status !== 'IN_PROGRESS' ? <StatusBadge value="-" /> : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {verifyModalOpen && selectedTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <button
              type="button"
              onClick={closeVerifyModal}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-700"
              aria-label="Tutup"
            >
              <X className="size-5" />
            </button>

            <div className="mb-6 space-y-4">
              <h2 className="text-xl font-bold text-zinc-950">Verifikasi Tugas</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">Nomor Kasus</p>
                  <p className="mt-1 font-medium text-zinc-900">{selectedTask.case?.caseNumber ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">ASN</p>
                  <p className="mt-1 font-medium text-zinc-900">{selectedTask.case?.asn?.nama ?? '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-zinc-500">Tugas</p>
                  <p className="mt-1 font-medium text-zinc-900">{selectedTask.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">Jenis</p>
                  <p className="mt-1 font-medium text-zinc-900">{taskTypeLabel(selectedTask.taskType)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">Status</p>
                  <p className="mt-1">
                    <StatusBadge
                      value={taskStatusLabel(selectedTask.status)}
                      tone={taskStatusTone(selectedTask.status)}
                    />
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">Batas Waktu</p>
                  <p className="mt-1 font-medium text-zinc-900">{formatDate(selectedTask.dueDate)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="italic">📄 Dokumen belum dimuat di modal ini</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {selectedTask.status === 'ASSIGNED' ? (
                <ActionButton
                  disabled={workingId === selectedTask.id}
                  icon={Play}
                  onClick={() => {
                    mutateTask(selectedTask.id, 'start');
                  }}
                  variant="secondary"
                >
                  Mulai
                </ActionButton>
              ) : null}
              {selectedTask.status === 'IN_PROGRESS' ? (
                <ActionButton
                  disabled={workingId === selectedTask.id}
                  icon={CheckCircle2}
                  onClick={() => {
                    mutateTask(selectedTask.id, 'complete');
                  }}
                >
                  Selesai
                </ActionButton>
              ) : null}
              <ActionButton onClick={closeVerifyModal} variant="secondary">
                Tutup
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
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
