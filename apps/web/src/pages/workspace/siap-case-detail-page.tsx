import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  Send,
  UserCheck,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { siapApi } from '@/lib/api/siap';
import type { SiapCaseDetail, SiapTask, SiapSlaTracking, TimelineEntry, WorkflowLog } from '@/lib/api/types';
import {
  ActionButton,
  ErrorAlert,
  formatDate,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Timeline,
  inputClass,
} from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';
import {
  caseStatusLabel,
  caseStatusTone,
  priorityLabel,
  priorityTone,
  serviceTypeLabel,
  taskStatusLabel,
  taskStatusTone,
  taskTypeLabel,
  workflowActionLabel,
  workflowStateLabel,
} from '@/lib/siap/siap-labels';

const ASSIGN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA'];
const CREATE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPD_OPERATOR', 'ASN'];

type ModalState =
  | { type: 'complete'; taskId: string; note: string }
  | { type: 'assign'; taskId: string; assignedTo: string; note: string }
  | { type: 'return'; taskId: string; reason: string; targetRole: string }
  | null;

const SLA_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ON_TRACK: 'success',
  WARNING: 'warning',
  OVERDUE: 'danger',
  COMPLETED: 'neutral',
};

export function SiapCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<SiapCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [working, setWorking] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  const canAssign = user?.roles.some((r) => ASSIGN_ROLES.includes(r)) ?? false;
  const canCreate = user?.roles.some((r) => CREATE_ROLES.includes(r)) ?? false;

  const loadCase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await siapApi.fetchCaseById(id);
      setCaseData(res);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat detail kasus');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  async function handleSubmitCase() {
    if (!id) return;
    setWorking('submit');
    setActionError('');
    try {
      const res = await siapApi.submitCase(id);
      setCaseData(res);
    } catch (caught) {
      setActionError(caught instanceof ApiError ? caught.message : 'Gagal mengirim kasus');
    } finally {
      setWorking('');
    }
  }

  async function handleStartTask(taskId: string) {
    setWorking(taskId);
    setActionError('');
    try {
      await siapApi.startTask(taskId);
      await loadCase();
    } catch (caught) {
      setActionError(caught instanceof ApiError ? caught.message : 'Gagal memulai task');
    } finally {
      setWorking('');
    }
  }

  async function handleModalConfirm() {
    if (!modal) return;
    setWorking(modal.taskId);
    setActionError('');
    try {
      if (modal.type === 'complete') {
        await siapApi.completeTask(modal.taskId, modal.note || undefined);
      } else if (modal.type === 'assign') {
        if (!modal.assignedTo.trim()) {
          setActionError('ID user harus diisi');
          setWorking('');
          return;
        }
        await siapApi.assignTask(modal.taskId, {
          assignedTo: modal.assignedTo.trim(),
          note: modal.note || undefined,
        });
      } else if (modal.type === 'return') {
        if (!modal.reason.trim()) {
          setActionError('Alasan pengembalian harus diisi');
          setWorking('');
          return;
        }
        await siapApi.returnTask(modal.taskId, {
          reason: modal.reason.trim(),
          targetRole: modal.targetRole || undefined,
        });
      }
      setModal(null);
      await loadCase();
    } catch (caught) {
      setActionError(caught instanceof ApiError ? caught.message : 'Aksi gagal');
    } finally {
      setWorking('');
    }
  }

  if (loading) return <LoadingState message="Memuat detail kasus..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!caseData) return null;

  const activeTasks = caseData.tasks.filter(
    (t) => !['COMPLETED', 'CANCELLED'].includes(t.status),
  );

  const timelineItems = (caseData.timelines as TimelineEntry[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.eventType,
    timestamp: t.createdAt,
    actor: t.performedBy ?? undefined,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={caseData.caseNumber}
        description={caseData.title}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={caseStatusLabel(caseData.status)} tone={caseStatusTone(caseData.status)} />
            <StatusBadge
              value={priorityLabel(caseData.priority)}
              tone={priorityTone(caseData.priority)}
            />
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {workflowStateLabel(caseData.currentState)}
            </span>
          </div>
        }
        actions={
          <ActionButton
            icon={ArrowLeft}
            variant="secondary"
            onClick={() => navigate('/siap/cases')}
          >
            Kembali
          </ActionButton>
        }
      />

      {actionError ? <ErrorAlert message={actionError} /> : null}

      {/* Case info */}
      <SectionCard title="Ringkasan Kasus">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Jenis Layanan">
            {serviceTypeLabel(caseData.serviceType)}
          </InfoField>
          <InfoField label="Status">{caseStatusLabel(caseData.status)}</InfoField>
          <InfoField label="Prioritas">{priorityLabel(caseData.priority)}</InfoField>
          {caseData.asn && (
            <InfoField label="ASN Terkait">
              <div>{caseData.asn.nama}</div>
              <div className="text-xs text-muted-foreground">{caseData.asn.nip}</div>
            </InfoField>
          )}
          <InfoField label="Dibuat">{formatDateTime(caseData.createdAt)}</InfoField>
          {caseData.submittedAt && (
            <InfoField label="Dikirim">{formatDateTime(caseData.submittedAt)}</InfoField>
          )}
          {caseData.completedAt && (
            <InfoField label="Diselesaikan">{formatDateTime(caseData.completedAt)}</InfoField>
          )}
          {caseData.description && (
            <div className="sm:col-span-2 lg:col-span-3">
              <InfoField label="Deskripsi">{caseData.description}</InfoField>
            </div>
          )}
        </div>

        {caseData.status === 'DRAFT' && canCreate && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Kasus belum dikirim. Kirim untuk memulai proses.
            </p>
            <ActionButton
              icon={Send}
              disabled={working === 'submit'}
              onClick={() => void handleSubmitCase()}
            >
              {working === 'submit' ? 'Memproses...' : 'Kirim Kasus'}
            </ActionButton>
          </div>
        )}
      </SectionCard>

      {/* Tasks */}
      <SectionCard
        title={`Tugas (${caseData.tasks.length})`}
        description={activeTasks.length > 0 ? `${activeTasks.length} tugas aktif` : 'Semua tugas selesai'}
      >
        {caseData.tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada tugas. Kirim kasus terlebih dahulu.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {caseData.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                userId={user?.id ?? ''}
                canAssign={canAssign}
                working={working}
                onStart={() => void handleStartTask(task.id)}
                onComplete={() =>
                  setModal({ type: 'complete', taskId: task.id, note: '' })
                }
                onAssign={() =>
                  setModal({ type: 'assign', taskId: task.id, assignedTo: '', note: '' })
                }
                onReturn={() =>
                  setModal({ type: 'return', taskId: task.id, reason: '', targetRole: '' })
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* SLA Tracking */}
      {caseData.slaTracking.length > 0 && (
        <SectionCard title="Batas Waktu">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="pb-2 pr-4">Tahap</th>
                  <th className="pb-2 pr-4">Mulai</th>
                  <th className="pb-2 pr-4">Batas</th>
                  <th className="pb-2 pr-4">Selesai</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(caseData.slaTracking as SiapSlaTracking[]).map((sla) => (
                  <tr key={sla.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-xs">{workflowStateLabel(sla.workflowState)}</td>
                    <td className="py-2 pr-4 text-xs">{formatDate(sla.startedAt)}</td>
                    <td className="py-2 pr-4 text-xs">{formatDate(sla.dueAt)}</td>
                    <td className="py-2 pr-4 text-xs">
                      {sla.completedAt ? formatDate(sla.completedAt) : '—'}
                    </td>
                    <td className="py-2">
                      <StatusBadge
                        value={sla.status}
                        tone={SLA_TONE[sla.status] ?? 'neutral'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Timeline */}
      <SectionCard title="Riwayat Kasus">
        <Timeline items={timelineItems} empty="Belum ada riwayat" />
      </SectionCard>

      {/* Workflow log */}
      {caseData.workflowLogs.length > 0 && (
        <SectionCard title="Catatan Proses">
          <div className="space-y-2">
            {(caseData.workflowLogs as WorkflowLog[]).map((log) => (
              <div key={log.id} className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{workflowActionLabel(log.action)}</span>
                  {log.fromState && (
                    <>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{workflowStateLabel(log.fromState)}</span>
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{workflowStateLabel(log.toState)}</span>
                </div>
                {log.note && <p className="mt-1 text-muted-foreground">{log.note}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(log.performedAt)}
                  {log.performedBy ? ` · oleh ${log.performedBy}` : ''}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Modal overlay */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            {modal.type === 'complete' && (
              <>
                <h2 className="mb-4 text-base font-semibold">Selesaikan Tugas</h2>
                <label className="mb-1 block text-sm font-medium">Catatan (opsional)</label>
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={modal.note}
                  onChange={(e) => setModal({ ...modal, note: e.target.value })}
                  placeholder="Contoh: Berkas sudah diverifikasi"
                  rows={3}
                />
              </>
            )}

            {modal.type === 'assign' && (
              <>
                <h2 className="mb-4 text-base font-semibold">Tugaskan</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      ID Pengguna <span className="text-destructive">*</span>
                    </label>
                    <input
                      className={inputClass}
                      value={modal.assignedTo}
                      onChange={(e) => setModal({ ...modal, assignedTo: e.target.value })}
                      placeholder="Tempel ID pengguna penerima tugas"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Catatan</label>
                    <input
                      className={inputClass}
                      value={modal.note}
                      onChange={(e) => setModal({ ...modal, note: e.target.value })}
                      placeholder="Catatan singkat bila perlu"
                    />
                  </div>
                </div>
              </>
            )}

            {modal.type === 'return' && (
              <>
                <h2 className="mb-4 text-base font-semibold">Kembalikan Tugas</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Alasan <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      className={`${inputClass} min-h-[80px] resize-y`}
                      value={modal.reason}
                      onChange={(e) => setModal({ ...modal, reason: e.target.value })}
                      placeholder="Jelaskan alasan pengembalian"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Role tujuan</label>
                    <input
                      className={inputClass}
                      value={modal.targetRole}
                      onChange={(e) => setModal({ ...modal, targetRole: e.target.value })}
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              </>
            )}

            {actionError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <ActionButton
                disabled={!!working}
                onClick={() => void handleModalConfirm()}
              >
                {working ? 'Memproses...' : 'Simpan'}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => {
                  setModal(null);
                  setActionError('');
                }}
              >
                Batal
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  userId,
  canAssign,
  working,
  onStart,
  onComplete,
  onAssign,
  onReturn,
}: {
  task: SiapTask;
  userId: string;
  canAssign: boolean;
  working: string;
  onStart: () => void;
  onComplete: () => void;
  onAssign: () => void;
  onReturn: () => void;
}) {
  const isAssignee = task.assignedTo === userId;
  const isActive = !['COMPLETED', 'CANCELLED'].includes(task.status);
  const canStart = isActive && ['ASSIGNED', 'OVERDUE'].includes(task.status) && isAssignee;
  const canComplete = isActive && ['IN_PROGRESS', 'OVERDUE'].includes(task.status) && isAssignee;
  const canReturn = isActive && canAssign;

  return (
    <div className="flex flex-wrap items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{task.title}</span>
          <StatusBadge value={taskStatusLabel(task.status)} tone={taskStatusTone(task.status)} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{taskTypeLabel(task.taskType)}</span>
        </div>
        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {task.dueDate && <span>Batas: {formatDate(task.dueDate)}</span>}
          {task.assignedTo && (
            <span>
              Ditugaskan ke:{' '}
              <span className="font-medium text-foreground">{task.assignedTo}</span>
            </span>
          )}
          {task.completedAt && <span>Selesai: {formatDate(task.completedAt)}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {canStart && (
          <ActionButton
            icon={Play}
            variant="secondary"
            disabled={!!working}
            onClick={onStart}
          >
            Mulai
          </ActionButton>
        )}
        {canComplete && (
          <ActionButton
            icon={CheckCircle2}
            disabled={!!working}
            onClick={onComplete}
          >
            Selesai
          </ActionButton>
        )}
        {canAssign && isActive && (
          <ActionButton
            icon={UserCheck}
            variant="secondary"
            disabled={!!working}
            onClick={onAssign}
          >
            Tugaskan
          </ActionButton>
        )}
        {canReturn && (
          <ActionButton
            icon={RotateCcw}
            variant="danger"
            disabled={!!working}
            onClick={onReturn}
          >
            Kembalikan
          </ActionButton>
        )}
        {!isActive && (
          <StatusBadge value={taskStatusLabel(task.status)} tone={taskStatusTone(task.status)} />
        )}
      </div>
    </div>
  );
}

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}
