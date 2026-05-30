import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
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

type VerificationDocument = {
  id: string;
  title: string;
  documentType: string;
  status: string;
  mimeType?: string | null;
  originalFileName?: string | null;
  storageKey?: string | null;
  uploadedAt?: string | null;
  source: 'DMS' | 'OPD_SUBMISSION';
  previewable?: boolean;
  previewUrl?: string | null;
  downloadUrl?: string | null;
};

type TaskVerificationDetail = {
  task: {
    id: string;
    title: string;
    status: string;
    taskType: string;
    dueDate?: string | null;
    createdAt?: string | null;
  };
  case: {
    id: string;
    caseNumber: string;
    serviceType: string;
    title: string;
    description?: string | null;
    asn?: {
      id: string;
      nip: string;
      nama: string;
    } | null;
  } | null;
  submission: {
    id: string;
    submissionNumber?: string | null;
    serviceType: string;
    subjectName?: string | null;
    subjectNip?: string | null;
    description?: string | null;
  } | null;
  documents: VerificationDocument[];
};

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
  const [verificationDetail, setVerificationDetail] =
    useState<TaskVerificationDetail | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

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
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal memuat tugas',
      );
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

  async function mutateTask(
    id: string,
    action: 'start' | 'complete' | 'return',
    note?: string,
  ) {
    setWorkingId(id);
    setError('');

    try {
      if (action === 'start') {
        await apiClient.post(`/siap/tasks/${id}/start`);
      } else if (action === 'complete') {
        const finalNote = note?.trim() || 'Verifikasi selesai dan diteruskan';
        await apiClient.post(`/siap/tasks/${id}/complete`, { note: finalNote });
      } else if (action === 'return') {
        await apiClient.post(`/siap/tasks/${id}/return`, {
          reason: note?.trim() || '',
          targetRole: 'OPD_OPERATOR',
        });
      }

      await load();

      if (verifyModalOpen && selectedTask?.id === id) {
        await loadVerificationDetail(id);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Aksi tugas gagal');
    } finally {
      setWorkingId('');
    }
  }

  async function loadVerificationDetail(taskId: string) {
    setVerificationLoading(true);
    setVerificationError('');

    try {
      const detail = await apiClient.get<TaskVerificationDetail>(
        `/siap/tasks/${taskId}/verification`,
      );

      setVerificationDetail(detail);
    } catch (caught) {
      setVerificationDetail(null);
      setVerificationError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat data verifikasi tugas',
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  function openVerifyModal(task: SiapTask) {
    setSelectedTask(task);
    setVerifyModalOpen(true);
    setVerificationDetail(null);
    setVerificationError('');
    void loadVerificationDetail(task.id);
  }

  function closeVerifyModal() {
    setVerifyModalOpen(false);
    setSelectedTask(null);
    setVerificationDetail(null);
    setVerificationError('');
    setVerificationLoading(false);
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
        title={
          taskType === 'DISPOSISI'
            ? 'Disposisi & Arahan'
            : taskType === 'TINDAK_LANJUT'
              ? 'Tindak Lanjut'
              : 'Tugas SIAP'
        }
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
                    <div className="font-semibold text-zinc-950">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {taskTypeLabel(item.taskType)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'case',
                header: 'Kasus',
                render: (item) => (
                  <div>
                    <div className="font-medium text-zinc-900">
                      {item.case?.caseNumber ?? '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.case?.asn?.nama ?? '-'}
                    </div>
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
              {
                key: 'sla',
                header: 'SLA',
                render: (item) => (
                  <SlaBadge dueDate={item.dueDate} status={item.status} />
                ),
              },
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
              {
                key: 'due',
                header: 'Batas Waktu',
                render: (item) => formatDate(item.dueDate),
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item) => (
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'ASSIGNED' ? (
                      <ActionButton
                        disabled={workingId === item.id}
                        icon={Play}
                        onClick={() => mutateTask(item.id, 'start')}
                        variant="secondary"
                      >
                        Mulai
                      </ActionButton>
                    ) : null}

                    {item.status === 'IN_PROGRESS' ? (
                      <ActionButton
                        disabled={workingId === item.id}
                        icon={CheckCircle2}
                        onClick={() => mutateTask(item.id, 'complete')}
                      >
                        Selesai
                      </ActionButton>
                    ) : null}

                    {item.caseId ? (
                      <ActionButton
                        icon={FileText}
                        onClick={() => openVerifyModal(item)}
                        variant="secondary"
                      >
                        Verifikasi
                      </ActionButton>
                    ) : null}

                    {!item.caseId &&
                    item.status !== 'ASSIGNED' &&
                    item.status !== 'IN_PROGRESS' ? (
                      <StatusBadge value="-" />
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

        {verifyModalOpen && selectedTask ? (
          <VerifyTaskModal
            detail={verificationDetail}
            error={verificationError}
            loading={verificationLoading}
            selectedTask={selectedTask}
            workingId={workingId}
            onClose={closeVerifyModal}
            onMutateTask={mutateTask}
          />
        ) : null}
    </div>
  );
}

function VerifyTaskModal({
  detail,
  error,
  loading,
  selectedTask,
  workingId,
  onClose,
  onMutateTask,
}: {
  detail: TaskVerificationDetail | null;
  error: string;
  loading: boolean;
  selectedTask: SiapTask;
  workingId: string;
  onClose: () => void;
  onMutateTask: (id: string, action: 'start' | 'complete' | 'return', note?: string) => void;
}) {
  const [verificationNote, setVerificationNote] = useState('');
  const [actionError, setActionError] = useState('');

  const currentStatus = detail?.task.status ?? selectedTask.status;

  const caseNumber =
    detail?.case?.caseNumber ?? selectedTask.case?.caseNumber ?? '-';

  const asnName =
    detail?.case?.asn?.nama ??
    detail?.submission?.subjectName ??
    selectedTask.case?.asn?.nama ??
    '-';

  const asnNip =
    detail?.case?.asn?.nip ?? detail?.submission?.subjectNip ?? '-';

  const serviceType =
    detail?.submission?.serviceType ?? detail?.case?.serviceType ?? '-';

  const documents = detail?.documents ?? [];

  function handleComplete() {
    onMutateTask(selectedTask.id, 'complete', verificationNote);
  }

  function handleReturn() {
    if (!verificationNote.trim()) {
      setActionError('Catatan wajib diisi untuk mengembalikan berkas.');
      return;
    }
    setActionError('');
    onMutateTask(selectedTask.id, 'return', verificationNote);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-xl">
<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-5">
  <div>
    <h2 className="text-2xl font-bold text-zinc-950">
      Verifikasi Tugas
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">
      {caseNumber} — {serviceType}
    </p>
  </div>

  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
    {currentStatus === 'ASSIGNED' ? (
      <ActionButton
        disabled={workingId === selectedTask.id}
        icon={Play}
        onClick={() => onMutateTask(selectedTask.id, 'start')}
        variant="secondary"
      >
        Mulai
      </ActionButton>
    ) : null}

    {currentStatus === 'IN_PROGRESS' ? (
      <>
        <ActionButton
          disabled={workingId === selectedTask.id}
          icon={CheckCircle2}
          onClick={handleComplete}
          variant="secondary"
        >
          Setujui / Teruskan
        </ActionButton>

        <ActionButton
          disabled={workingId === selectedTask.id}
          icon={FileText}
          onClick={handleReturn}
          variant="secondary"
        >
          Kembalikan Berkas
        </ActionButton>
      </>
    ) : null}

    <ActionButton onClick={onClose} variant="secondary">
      Tutup
    </ActionButton>

    <button
      type="button"
      onClick={onClose}
      className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      aria-label="Tutup"
    >
      <X className="size-6" />
    </button>
  </div>
</div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <LoadingState label="Memuat data verifikasi dan dokumen" />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
              <section className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                <div className="rounded-xl border border-zinc-200 p-4">
                  <h3 className="font-semibold text-zinc-950">
                    Data Pengajuan
                  </h3>

                  <div className="mt-4 grid gap-3 text-sm">
                    <InfoItem label="Nomor Kasus" value={caseNumber} />
                    <InfoItem label="Jenis Layanan" value={serviceType} />
                    <InfoItem label="ASN / Subjek" value={asnName} />
                    <InfoItem label="NIP" value={asnNip} />
                    <InfoItem label="Tugas" value={selectedTask.title} />
                    <InfoItem
                      label="Jenis Tugas"
                      value={taskTypeLabel(selectedTask.taskType)}
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">
                        Status
                      </p>
                      <div className="mt-1">
                        <StatusBadge
                          value={taskStatusLabel(currentStatus)}
                          tone={taskStatusTone(currentStatus)}
                        />
                      </div>
                    </div>
                    <InfoItem
                      label="Batas Waktu"
                      value={formatDate(selectedTask.dueDate)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4">
                  <h3 className="font-semibold text-zinc-950">
                    Catatan Verifikasi
                  </h3>
                  
                  {actionError ? (
                    <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      {actionError}
                    </div>
                  ) : null}

                  <textarea
                    className="w-full min-h-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Masukkan catatan verifikasi..."
                    value={verificationNote}
                    onChange={(e) => {
                      setVerificationNote(e.target.value);
                      if (actionError) setActionError('');
                    }}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      Dokumen Syarat
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Dokumen dari OPD/DMS yang terkait dengan tugas ini.
                    </p>
                  </div>
                  <StatusBadge value={`${documents.length} dokumen`} tone="info" />
                </div>

                <div className="mt-4">
                  {documents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
                      Belum ada dokumen yang terhubung dengan tugas ini.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <DocumentPreviewCard
                          document={document}
                          key={`${document.source}-${document.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-900">{value || '-'}</p>
    </div>
  );
}

function DocumentPreviewCard({
  document,
}: {
  document: VerificationDocument;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const title =
    document.title || document.originalFileName || document.documentType;

  const downloadUrl = document.downloadUrl ?? document.previewUrl ?? null;
  const mimeType = document.mimeType ?? '';

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const canPreview = Boolean(downloadUrl) && (isPdf || isImage);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadPreview() {
      if (!downloadUrl || !canPreview) {
        return;
      }

      setLoadingPreview(true);
      setPreviewError('');

      try {
        const response = await apiClient.raw(downloadUrl, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Gagal memuat dokumen (${response.status})`);
        }

        const blob = await response.blob();
        createdUrl = URL.createObjectURL(blob);

        if (active) {
          setObjectUrl(createdUrl);
        }
      } catch (caught) {
        if (active) {
          setPreviewError(
            caught instanceof Error
              ? caught.message
              : 'Gagal memuat preview dokumen',
          );
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      active = false;

      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [downloadUrl, canPreview]);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div>
          <div className="font-semibold text-zinc-950">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {document.documentType} • {document.source} • {document.status}
          </div>
        </div>

        {downloadUrl ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            onClick={async () => {
              const response = await apiClient.raw(downloadUrl, {
                method: 'GET',
              });

              const blob = await response.blob();
              const url = URL.createObjectURL(blob);

              const link = window.document.createElement('a');
              link.href = url;
              link.download = document.originalFileName ?? title;
              link.click();

              URL.revokeObjectURL(url);
            }}
          >
            <Download className="size-4" />
            Download
          </button>
        ) : null}
      </div>

      <div className="bg-white p-4">
        {loadingPreview ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-600">
            Memuat preview dokumen...
          </div>
        ) : null}

        {previewError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {previewError}
          </div>
        ) : null}

        {!loadingPreview && !previewError && objectUrl && isPdf ? (
          <iframe
            className="h-[520px] w-full rounded-lg border border-zinc-200"
            src={objectUrl}
            title={title}
          />
        ) : null}

        {!loadingPreview && !previewError && objectUrl && isImage ? (
          <img
            alt={title}
            className="max-h-[520px] w-full rounded-lg border border-zinc-200 object-contain"
            src={objectUrl}
          />
        ) : null}

        {!loadingPreview && !previewError && !objectUrl ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
            <FileText className="mb-2 size-8 text-zinc-400" />
            <div className="font-medium text-zinc-800">
              Preview belum tersedia
            </div>
            <div className="mt-1">
              Gunakan tombol download untuk membuka dokumen.
            </div>
          </div>
        ) : null}
      </div>
    </article>
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
  if (
    !task.dueDate ||
    task.status === 'COMPLETED' ||
    task.status === 'OVERDUE'
  ) {
    return false;
  }

  const dueAt = new Date(task.dueDate).getTime();
  const now = Date.now();

  return dueAt >= now && dueAt <= now + 24 * 60 * 60 * 1000;
}