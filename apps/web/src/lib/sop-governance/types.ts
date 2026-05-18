// ─── Status ───────────────────────────────────────────────────────────────────

export type SopGovernanceStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'NEEDS_REVIEW'
  | 'REVISION'
  | 'ARCHIVED';

// ─── Core models ──────────────────────────────────────────────────────────────

export interface SopGovernanceRecord {
  id: string;
  sopCode: string;
  title: string;
  moduleKey: string;
  version: string;
  status: SopGovernanceStatus;
  isCurrent: boolean;
  effectiveDate: string | null;
  reviewDueDate: string | null;
  dmsDocumentId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  ownerRole: string | null;
  notes: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SopGovernanceChangeLog {
  id: string;
  governanceId: string;
  action: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  actorId: string | null;
  actorRole: string | null;
  note: string | null;
  createdAt: string;
  sopCode?: string;
  title?: string;
}

export interface GovernanceSummaryByModule {
  moduleKey: string;
  total: number;
  active: number;
}

export interface SopGovernanceSummary {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  revision: number;
  archived: number;
  dueIn30Days: number;
  overdueReview: number;
  byModule: GovernanceSummaryByModule[];
  recentChanges: SopGovernanceChangeLog[];
}

// ─── Label / tone helpers ─────────────────────────────────────────────────────

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'dark';

export const GOVERNANCE_STATUS_LABELS: Record<SopGovernanceStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Aktif',
  NEEDS_REVIEW: 'Perlu Review',
  REVISION: 'Revisi',
  ARCHIVED: 'Arsip',
};

export const GOVERNANCE_STATUS_TONES: Record<SopGovernanceStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  NEEDS_REVIEW: 'warning',
  REVISION: 'info',
  ARCHIVED: 'dark',
};

export const GOVERNANCE_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Dibuat',
  UPDATED: 'Diperbarui',
  ACTIVATED: 'Diaktifkan',
  ARCHIVED: 'Diarsipkan',
  MARKED_REVIEW: 'Ditandai Review',
  SET_REVISION: 'Set Revisi',
  STATUS_CHANGED: 'Status Berubah',
  REVIEW_STARTED: 'Review Dimulai',
  REVIEW_COMPLETED: 'Review Selesai',
  KEPT_ACTIVE: 'Tetap Berlaku',
  REVISION_REQUESTED: 'Revisi Diminta',
};

export function governanceStatusLabel(status: string): string {
  return GOVERNANCE_STATUS_LABELS[status as SopGovernanceStatus] ?? status;
}

export function governanceStatusTone(status: string): BadgeTone {
  return GOVERNANCE_STATUS_TONES[status as SopGovernanceStatus] ?? 'neutral';
}

export function governanceActionLabel(action: string): string {
  return GOVERNANCE_ACTION_LABELS[action] ?? action;
}

export function governanceActionTone(action: string): BadgeTone {
  if (action === 'ACTIVATED' || action === 'KEPT_ACTIVE' || action === 'REVIEW_COMPLETED') return 'success';
  if (action === 'ARCHIVED') return 'dark';
  if (action === 'MARKED_REVIEW' || action === 'REVIEW_STARTED') return 'warning';
  if (action === 'SET_REVISION' || action === 'REVISION_REQUESTED') return 'info';
  return 'neutral';
}

// ─── Review workflow types ────────────────────────────────────────────────────

export type SopReviewReminderType =
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'MANUAL_REVIEW'
  | 'REVISION_REQUIRED';

export type SopReviewReminderStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export type SopReviewDecision = 'KEEP_ACTIVE' | 'REVISION_REQUIRED' | 'ARCHIVED';

export interface SopReviewReminder {
  id: string;
  governanceId: string;
  sopCode: string;
  title: string;
  moduleKey: string;
  reminderType: SopReviewReminderType;
  status: SopReviewReminderStatus;
  dueDate: string | null;
  sentToRole: string | null;
  sentToUserId: string | null;
  message: string | null;
  createdById: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  sopCode: string;
  title: string;
  moduleKey: string;
  version: string;
  status: string;
  isCurrent: boolean;
  reviewDueDate: string | null;
  effectiveDate: string | null;
}

export interface SopReviewQueue {
  dueSoon: ReviewQueueItem[];
  overdue: ReviewQueueItem[];
  needsReview: ReviewQueueItem[];
  inRevision: ReviewQueueItem[];
  recentReviewActions: SopGovernanceChangeLog[];
}

export const REMINDER_TYPE_LABELS: Record<SopReviewReminderType, string> = {
  DUE_SOON: 'Due Soon',
  OVERDUE: 'Overdue',
  MANUAL_REVIEW: 'Review Manual',
  REVISION_REQUIRED: 'Revisi Diperlukan',
};

export const REMINDER_TYPE_TONES: Record<SopReviewReminderType, BadgeTone> = {
  DUE_SOON: 'warning',
  OVERDUE: 'danger',
  MANUAL_REVIEW: 'info',
  REVISION_REQUIRED: 'info',
};

export function reminderTypeLabel(type: string): string {
  return REMINDER_TYPE_LABELS[type as SopReviewReminderType] ?? type;
}

export function reminderTypeTone(type: string): BadgeTone {
  return REMINDER_TYPE_TONES[type as SopReviewReminderType] ?? 'neutral';
}
