import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileCheck,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatusBadge,
  inputClass,
} from '@/components/workspace/ui';
import {
  buildInitialInstance,
  checklistStatusLabel,
  checklistStatusTone,
  countItemsByStatus,
  isChecklistComplete,
  SOP_CHECKLIST_ITEM_STATUSES,
  type SopChecklistInstance,
  type SopChecklistItemState,
  type SopChecklistItemStatus,
  type SopChecklistOverallStatus,
} from '@/lib/sop-checklist/checklist-types';
import {
  getChecklistTemplateBySopCode,
  getChecklistCapability,
} from '@/lib/sop-checklist/checklist-policy';
import {
  sopChecklistsApi,
  type SopChecklistInstanceApi,
} from '@/lib/api/sop-checklists';
import type { AppRole } from '@/lib/rbac/roles';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SopChecklistPanelProps {
  sopCode: string;
  userRole: AppRole;
  contextId?: string;
  readOnly?: boolean;
  /**
   * "local"  — state in React useState only; data lost on refresh (Sprint 13 default)
   * "api"    — load/save via backend REST endpoints (Sprint 14)
   */
  persistenceMode?: 'local' | 'api';
  /** Required when persistenceMode = "api" */
  entityType?: string;
  /** Required when persistenceMode = "api" */
  entityId?: string;
  onSaved?: (instance: SopChecklistInstance) => void;
  onApproved?: (instance: SopChecklistInstance) => void;
  onRejected?: (instance: SopChecklistInstance) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopChecklistPanel({
  sopCode,
  userRole,
  contextId,
  readOnly = false,
  persistenceMode = 'local',
  entityType,
  entityId,
  onSaved,
  onApproved,
  onRejected,
}: SopChecklistPanelProps) {
  const template = getChecklistTemplateBySopCode(sopCode);
  if (!template) return null;

  const capability = getChecklistCapability(userRole, sopCode);
  if (!capability.canView) return null;

  const effectiveReadOnly = readOnly || !capability.canEdit;

  return (
    <ChecklistPanelInner
      template={template}
      capability={capability}
      contextId={contextId}
      readOnly={effectiveReadOnly}
      persistenceMode={persistenceMode}
      entityType={entityType}
      entityId={entityId}
      onSaved={onSaved}
      onApproved={onApproved}
      onRejected={onRejected}
    />
  );
}

// ─── Mapper: API response → local instance state ──────────────────────────────

function apiToInstance(api: SopChecklistInstanceApi): SopChecklistInstance {
  return {
    templateSopCode: api.sopCode,
    contextId: api.entityId,
    overallStatus: api.status as SopChecklistOverallStatus,
    approvedBy: api.approvedById ?? undefined,
    approvalNote: api.approvalNote ?? undefined,
    instanceId: api.id,
    entityType: api.entityType,
    entityId: api.entityId,
    progress: api.progress,
    approvedAt: api.approvedAt ?? undefined,
    rejectedById: api.rejectedById ?? undefined,
    rejectedAt: api.rejectedAt ?? undefined,
    items: api.items.map((it) => ({
      itemId: it.itemId,
      status: it.status as SopChecklistItemStatus,
      notes: it.notes ?? '',
      dmsDocumentId: it.dmsDocumentId ?? undefined,
    })),
  };
}

// ─── Inner stateful component ─────────────────────────────────────────────────

function ChecklistPanelInner({
  template,
  capability,
  contextId,
  readOnly,
  persistenceMode,
  entityType,
  entityId,
  onSaved,
  onApproved,
  onRejected,
}: {
  template: NonNullable<ReturnType<typeof getChecklistTemplateBySopCode>>;
  capability: ReturnType<typeof getChecklistCapability>;
  contextId?: string;
  readOnly: boolean;
  persistenceMode: 'local' | 'api';
  entityType?: string;
  entityId?: string;
  onSaved?: (instance: SopChecklistInstance) => void;
  onApproved?: (instance: SopChecklistInstance) => void;
  onRejected?: (instance: SopChecklistInstance) => void;
}) {
  const [instance, setInstance] = useState<SopChecklistInstance>(() =>
    buildInitialInstance(template, contextId),
  );
  const [approvalNote, setApprovalNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(persistenceMode === 'api');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track instanceId for API mode (avoid stale closure)
  const instanceIdRef = useRef<string | undefined>(undefined);

  // ── Load / create from API on mount ────────────────────────────────────────

  useEffect(() => {
    if (persistenceMode !== 'api') return;
    if (!entityType || !entityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    sopChecklistsApi
      .getOrCreateInstance({
        sopCode: template.sopCode,
        moduleKey: template.moduleKey,
        entityType,
        entityId,
      })
      .then((api) => {
        const mapped = apiToInstance(api);
        instanceIdRef.current = api.id;

        // Merge template items that have no server record yet (PENDING defaults)
        const serverItemIds = new Set(api.items.map((i) => i.itemId));
        const missingItems = template.items
          .filter((t) => !serverItemIds.has(t.id))
          .map((t): SopChecklistItemState => ({
            itemId: t.id,
            status: 'PENDING',
            notes: '',
          }));
        setInstance({
          ...mapped,
          items: [...mapped.items, ...missingItems],
        });
      })
      .catch(() => setError('Gagal memuat checklist dari server'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Item update ─────────────────────────────────────────────────────────────

  const updateItem = useCallback(
    async (
      itemId: string,
      patch: Partial<Omit<SopChecklistItemState, 'itemId'>>,
    ) => {
      // Optimistic local update
      setInstance((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.itemId === itemId ? { ...item, ...patch } : item,
        ),
      }));
      setSaved(false);

      if (persistenceMode !== 'api') return;

      const iid = instanceIdRef.current;
      if (!iid) return;

      const currentItem = instance.items.find((i) => i.itemId === itemId);
      if (!currentItem) return;

      const merged = { ...currentItem, ...patch };

      try {
        const api = await sopChecklistsApi.updateItem(iid, {
          itemId,
          status: merged.status,
          notes: merged.notes || undefined,
          dmsDocumentId: merged.dmsDocumentId,
        });
        const updated = apiToInstance(api);
        setInstance((prev) => ({
          ...updated,
          items: prev.items.map((item) => {
            const serverItem = updated.items.find((s) => s.itemId === item.itemId);
            return serverItem ?? item;
          }),
        }));
      } catch {
        setError('Gagal menyimpan perubahan item');
      }
    },
    [persistenceMode, instance.items],
  );

  // ── Save draft (local) ───────────────────────────────────────────────────

  function handleSaveDraft() {
    setSaved(true);
    onSaved?.(instance);
  }

  // ── Approve / Reject ────────────────────────────────────────────────────────

  async function handleApproveReject(action: 'APPROVED' | 'REJECTED') {
    if (persistenceMode === 'api') {
      const iid = instanceIdRef.current;
      if (!iid) return;

      setSaving(true);
      setError(null);
      try {
        const api = await sopChecklistsApi.approveReject(iid, {
          action,
          approvalNote: approvalNote || undefined,
        });
        const updated = apiToInstance(api);
        setInstance(updated);
        if (action === 'APPROVED') onApproved?.(updated);
        else onRejected?.(updated);
      } catch {
        setError(`Gagal ${action === 'APPROVED' ? 'menyetujui' : 'menolak'} checklist`);
      } finally {
        setSaving(false);
      }
    } else {
      const updated: SopChecklistInstance = {
        ...instance,
        overallStatus: action,
        approvedBy: action === 'APPROVED' ? 'current-user' : undefined,
        approvalNote,
      };
      setInstance(updated);
      setSaved(false);
      if (action === 'APPROVED') onApproved?.(updated);
      else onRejected?.(updated);
    }
  }

  const counts = countItemsByStatus(instance.items);
  const complete = isChecklistComplete(template, instance.items);
  const grouped = groupByCategory(template.items);
  const isFinal =
    instance.overallStatus === 'APPROVED' || instance.overallStatus === 'REJECTED';

  return (
    <SectionCard
      title={`Checklist SOP: ${template.title}`}
      description={template.description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <OverallStatusBadge status={instance.overallStatus} />
          {!readOnly && !isFinal ? (
            <ActionButton
              icon={saving ? Loader2 : FileCheck}
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saved ? 'Tersimpan' : 'Simpan Draft'}
            </ActionButton>
          ) : null}
        </div>
      }
    >
      {/* Loading state */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat checklist...
        </div>
      ) : null}

      {/* Error banner */}
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading ? (
        <>
          {/* Progress */}
          <ChecklistProgress counts={counts} total={template.items.length} complete={complete} />

          {/* Local-only notice */}
          {persistenceMode === 'local' ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Checklist ini bersifat frontend-only (belum persisten ke backend). Data akan hilang saat halaman direfresh.
            </div>
          ) : null}

          {/* Checklist items */}
          <div className="mt-4 space-y-5">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatCategory(category)}
                </h4>
                <div className="space-y-3">
                  {items.map((templateItem) => {
                    const state = instance.items.find(
                      (s) => s.itemId === templateItem.id,
                    );
                    if (!state) return null;

                    return (
                      <ChecklistItemRow
                        key={templateItem.id}
                        templateItem={templateItem}
                        state={state}
                        readOnly={readOnly || isFinal}
                        onStatusChange={(status) =>
                          updateItem(templateItem.id, { status })
                        }
                        onNotesChange={(notes) =>
                          updateItem(templateItem.id, { notes })
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Approval section */}
          {capability.canApprove && !isFinal ? (
            <div className="mt-5 space-y-3 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
              <p className="text-sm font-semibold text-[#173c36]">Persetujuan / Review</p>
              <textarea
                className={`${inputClass} min-h-20 py-2`}
                placeholder="Catatan persetujuan atau alasan penolakan (opsional)..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={saving ? Loader2 : CheckCircle2}
                  disabled={!complete || saving}
                  onClick={() => handleApproveReject('APPROVED')}
                >
                  Setujui Checklist
                </ActionButton>
                <ActionButton
                  icon={XCircle}
                  variant="secondary"
                  disabled={saving}
                  onClick={() => handleApproveReject('REJECTED')}
                >
                  Tolak / Kembalikan
                </ActionButton>
              </div>
              {!complete ? (
                <p className="text-xs text-amber-600">
                  Semua item wajib harus berstatus Terpenuhi atau Tidak Relevan sebelum dapat disetujui.
                </p>
              ) : null}
            </div>
          ) : null}

          {isFinal && instance.approvalNote ? (
            <div className="mt-4 rounded-lg border border-border bg-zinc-50 px-4 py-3 text-sm">
              <span className="font-semibold">Catatan: </span>
              {instance.approvalNote}
            </div>
          ) : null}
        </>
      ) : null}
    </SectionCard>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChecklistProgress({
  counts,
  total,
  complete,
}: {
  counts: Record<SopChecklistItemStatus, number>;
  total: number;
  complete: boolean;
}) {
  const done = counts.TERPENUHI + counts.TIDAK_RELEVAN;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {done}/{total} item selesai
        </span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-[#4a9b6f]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {SOP_CHECKLIST_ITEM_STATUSES.filter((s) => counts[s] > 0).map((status) => (
          <span key={status} className="flex items-center gap-1">
            <StatusBadge
              value={`${checklistStatusLabel(status)} (${counts[status]})`}
              tone={checklistStatusTone(status)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function ChecklistItemRow({
  templateItem,
  state,
  readOnly,
  onStatusChange,
  onNotesChange,
}: {
  templateItem: NonNullable<ReturnType<typeof getChecklistTemplateBySopCode>>['items'][number];
  state: SopChecklistItemState;
  readOnly: boolean;
  onStatusChange: (status: SopChecklistItemStatus) => void;
  onNotesChange: (notes: string) => void;
}) {
  const statusIcon =
    state.status === 'TERPENUHI' ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    ) : state.status === 'TIDAK_TERPENUHI' || state.status === 'PERLU_PERBAIKAN' ? (
      <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
    ) : (
      <Circle className="h-4 w-4 shrink-0 text-zinc-300" />
    );

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="mt-0.5">{statusIcon}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-zinc-900">
                {templateItem.label}
              </span>
              {!templateItem.required ? (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                  Opsional
                </span>
              ) : null}
            </div>
            {templateItem.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {templateItem.description}
              </p>
            ) : null}
          </div>
        </div>

        {!readOnly ? (
          <select
            className="shrink-0 rounded border border-border bg-background px-2 py-1 text-xs"
            value={state.status}
            onChange={(e) => onStatusChange(e.target.value as SopChecklistItemStatus)}
          >
            {SOP_CHECKLIST_ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {checklistStatusLabel(s)}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge
            value={checklistStatusLabel(state.status)}
            tone={checklistStatusTone(state.status)}
          />
        )}
      </div>

      {!readOnly && templateItem.allowNotes ? (
        <div className="mt-3">
          <input
            className={`${inputClass} text-xs`}
            placeholder="Catatan (opsional)..."
            value={state.notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      ) : state.notes ? (
        <p className="mt-2 text-xs italic text-muted-foreground">
          Catatan: {state.notes}
        </p>
      ) : null}
    </div>
  );
}

function OverallStatusBadge({ status }: { status: SopChecklistOverallStatus }) {
  const tone =
    status === 'APPROVED'
      ? 'success'
      : status === 'REJECTED'
        ? 'danger'
        : status === 'IN_REVIEW'
          ? 'warning'
          : 'neutral';

  const labels: Record<SopChecklistOverallStatus, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'Dalam Review',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };

  return <StatusBadge value={labels[status]} tone={tone} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GroupedItems = Array<{
  category: string;
  items: NonNullable<ReturnType<typeof getChecklistTemplateBySopCode>>['items'];
}>;

function groupByCategory(
  items: NonNullable<ReturnType<typeof getChecklistTemplateBySopCode>>['items'],
): GroupedItems {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    const cat = item.category ?? 'UMUM';
    map.set(cat, [...(map.get(cat) ?? []), item]);
  }
  return [...map.entries()].map(([category, catItems]) => ({
    category,
    items: catItems,
  }));
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ');
}

// ─── Convenience icon export ──────────────────────────────────────────────────

export { ClipboardList as SopChecklistIcon };
