import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import type { SiapSlaTracking, SiapTask } from '@/lib/api/types';
import {
  SectionCard,
  StatusBadge,
  formatDate,
} from '@/components/workspace/ui';
import {
  slaStatusLabel,
  slaStatusTone,
  taskStatusTone,
  taskStatusLabel,
  timelineTitleLabel,
  workflowStateLabel,
} from '@/lib/siap/siap-labels';

export function SiapCaseProgressPanel({
  currentState,
  tasks,
  slaTracking,
}: {
  caseId: string;
  currentState: string;
  tasks: SiapTask[];
  slaTracking: SiapSlaTracking[];
}) {
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const activeTasks = tasks.filter(
    (task) => !['COMPLETED', 'CANCELLED'].includes(task.status),
  ).length;
  const overdueTasks = tasks.filter((task) => task.status === 'OVERDUE').length;
  const overdueSla = slaTracking.filter((item) => item.status === 'OVERDUE').length;
  const warningSla = slaTracking.filter((item) => item.status === 'WARNING').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const currentSla =
    slaTracking.find((item) => item.status === 'OVERDUE') ??
    slaTracking.find((item) => item.status === 'WARNING') ??
    slaTracking.find((item) => item.status === 'ON_TRACK') ??
    slaTracking[0];

  return (
    <SectionCard
      title="Progress Layanan"
      description="Ringkasan cepat posisi kasus, tugas aktif, dan batas waktu layanan."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <ProgressTile
          icon={ListChecks}
          label="Progress"
          value={`${progress}%`}
          description={`${completedTasks} dari ${tasks.length} tugas selesai`}
          tone={progress === 100 ? 'success' : 'neutral'}
        />
        <ProgressTile
          icon={Clock3}
          label="Tugas Aktif"
          value={activeTasks}
          description="Masih perlu diproses"
          tone={activeTasks > 0 ? 'warning' : 'success'}
        />
        <ProgressTile
          icon={AlertTriangle}
          label="Terlambat"
          value={overdueTasks + overdueSla}
          description={`${overdueTasks} tugas, ${overdueSla} SLA`}
          tone={overdueTasks + overdueSla > 0 ? 'danger' : 'success'}
        />
        <ProgressTile
          icon={CheckCircle2}
          label="Peringatan SLA"
          value={warningSla}
          description="Perlu dipantau"
          tone={warningSla > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Tahap Saat Ini
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-950">
              {workflowStateLabel(currentSla?.workflowState ?? currentState)}
            </span>
            {currentSla ? (
              <StatusBadge
                value={slaStatusLabel(currentSla.status)}
                tone={slaStatusTone(currentSla.status)}
              />
            ) : null}
          </div>
          {currentSla ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Batas: {formatDate(currentSla.dueAt)}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Tugas Terakhir
          </div>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Belum ada tugas.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-950">
                      {timelineTitleLabel(task.title)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.dueDate ? `Batas ${formatDate(task.dueDate)}` : 'Tanpa batas waktu'}
                    </div>
                  </div>
                  <StatusBadge value={taskStatusLabel(task.status)} tone={taskStatusTone(task.status)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function ProgressTile({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof ListChecks;
  label: string;
  value: string | number;
  description: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'border-zinc-200 bg-white text-zinc-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase opacity-75">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs opacity-75">{description}</p>
        </div>
        <Icon className="size-5 shrink-0" />
      </div>
    </div>
  );
}
