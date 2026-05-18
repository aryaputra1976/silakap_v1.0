import type { AppRole } from '@/lib/rbac/roles';
import type { SopModuleKey } from '@/lib/dms/sop-taxonomy';

// ─── Item status ──────────────────────────────────────────────────────────────

export type SopChecklistItemStatus =
  | 'PENDING'
  | 'TERPENUHI'
  | 'TIDAK_TERPENUHI'
  | 'TIDAK_RELEVAN'
  | 'PERLU_PERBAIKAN';

export const SOP_CHECKLIST_ITEM_STATUSES: SopChecklistItemStatus[] = [
  'PENDING',
  'TERPENUHI',
  'TIDAK_TERPENUHI',
  'TIDAK_RELEVAN',
  'PERLU_PERBAIKAN',
];

export const CHECKLIST_STATUS_LABELS: Record<SopChecklistItemStatus, string> = {
  PENDING: 'Belum Dicek',
  TERPENUHI: 'Terpenuhi',
  TIDAK_TERPENUHI: 'Tidak Terpenuhi',
  TIDAK_RELEVAN: 'Tidak Relevan',
  PERLU_PERBAIKAN: 'Perlu Perbaikan',
};

export type ChecklistStatusTone =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

export function checklistStatusLabel(
  status: SopChecklistItemStatus,
): string {
  return CHECKLIST_STATUS_LABELS[status];
}

export function checklistStatusTone(
  status: SopChecklistItemStatus,
): ChecklistStatusTone {
  switch (status) {
    case 'TERPENUHI':
      return 'success';
    case 'TIDAK_TERPENUHI':
      return 'danger';
    case 'PERLU_PERBAIKAN':
      return 'warning';
    case 'TIDAK_RELEVAN':
      return 'info';
    default:
      return 'neutral';
  }
}

// ─── Overall checklist status ─────────────────────────────────────────────────

export type SopChecklistOverallStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export const CHECKLIST_OVERALL_LABELS: Record<
  SopChecklistOverallStatus,
  string
> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'Dalam Review',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

// ─── Template definition ──────────────────────────────────────────────────────

export interface SopChecklistTemplateItem {
  /** Unique key within the template */
  id: string;
  label: string;
  description?: string;
  /** Grouping label for display */
  category?: string;
  required: boolean;
  /** If true, UI shows a note field for this item */
  allowNotes?: boolean;
  /** If true, UI shows a DMS document link picker for this item */
  allowDmsLink?: boolean;
}

/**
 * Minimum role permission a user needs to interact with this template.
 * Applied independently: viewer < editor < approver.
 */
export interface SopChecklistRolePolicy {
  viewers: AppRole[];
  editors: AppRole[];
  approvers: AppRole[];
}

export interface SopChecklistTemplate {
  sopCode: string;
  title: string;
  moduleKey: SopModuleKey;
  description: string;
  items: SopChecklistTemplateItem[];
  rolePolicy: SopChecklistRolePolicy;
  /** Whether this checklist requires at least one DMS document linked */
  relatedDmsRequired: boolean;
  defaultOverallStatus: SopChecklistOverallStatus;
}

// ─── Instance (runtime state) ─────────────────────────────────────────────────

export interface SopChecklistItemState {
  itemId: string;
  status: SopChecklistItemStatus;
  notes: string;
  /** Optional DMS document ID linked as evidence */
  dmsDocumentId?: string;
}

export interface SopChecklistInstance {
  templateSopCode: string;
  /** Optional: case ID, document ID, or any relevant context */
  contextId?: string;
  items: SopChecklistItemState[];
  overallStatus: SopChecklistOverallStatus;
  approvedBy?: string;
  approvalNote?: string;

  // ── Backend-aligned fields (populated when persistenceMode = "api") ──
  /** Backend instance id (cuid) — undefined in local mode */
  instanceId?: string;
  /** entity type sent to backend, e.g. "sipensiun_case" */
  entityType?: string;
  /** entity row id sent to backend */
  entityId?: string;
  /** progress 0-100 from backend */
  progress?: number;
  approvedAt?: string;
  rejectedById?: string;
  rejectedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildInitialInstance(
  template: SopChecklistTemplate,
  contextId?: string,
): SopChecklistInstance {
  return {
    templateSopCode: template.sopCode,
    contextId,
    items: template.items.map((item) => ({
      itemId: item.id,
      status: 'PENDING',
      notes: '',
    })),
    overallStatus: template.defaultOverallStatus,
  };
}

export function countItemsByStatus(
  items: SopChecklistItemState[],
): Record<SopChecklistItemStatus, number> {
  const counts: Record<SopChecklistItemStatus, number> = {
    PENDING: 0,
    TERPENUHI: 0,
    TIDAK_TERPENUHI: 0,
    TIDAK_RELEVAN: 0,
    PERLU_PERBAIKAN: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

export function isChecklistComplete(
  template: SopChecklistTemplate,
  items: SopChecklistItemState[],
): boolean {
  const requiredIds = new Set(
    template.items.filter((t) => t.required).map((t) => t.id),
  );

  return items
    .filter((item) => requiredIds.has(item.itemId))
    .every(
      (item) =>
        item.status === 'TERPENUHI' || item.status === 'TIDAK_RELEVAN',
    );
}
