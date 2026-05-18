export type OpdSubmissionSlaStatus =
  | 'NOT_STARTED'
  | 'ON_TRACK'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'PAUSED_FOR_CORRECTION'
  | 'COMPLETED'
  | 'CANCELLED';

export type OpdSlaSubject = {
  status: string;
  moduleKey: string;
  serviceType: string;
  slaStartedAt?: Date | null;
  slaPausedAt?: Date | null;
  slaDueAt?: Date | null;
  slaStoppedAt?: Date | null;
};

const HOUR_MS = 60 * 60 * 1000;

export function getSlaTargetHours(moduleKey: string, serviceType?: string | null) {
  const normalizedModule = moduleKey.toUpperCase();
  const normalizedService = (serviceType ?? '').toUpperCase();

  if (normalizedModule === 'SIPENSIUN' || normalizedService.includes('PENSIUN')) {
    return 120;
  }

  if (normalizedModule === 'DMS') {
    return 48;
  }

  if (normalizedModule === 'SIDATA') {
    return 72;
  }

  return 72;
}

export function calculateSlaDueAt(startDate: Date, targetHours: number) {
  return new Date(startDate.getTime() + targetHours * HOUR_MS);
}

export function calculateSlaStatus(
  submission: OpdSlaSubject,
  now = new Date(),
): OpdSubmissionSlaStatus {
  if (submission.status === 'CANCELLED') {
    return 'CANCELLED';
  }

  if (isFinalStatus(submission.status)) {
    return 'COMPLETED';
  }

  if (!submission.slaStartedAt || !submission.slaDueAt) {
    return 'NOT_STARTED';
  }

  if (isCorrectionStatus(submission.status) || submission.slaPausedAt) {
    return 'PAUSED_FOR_CORRECTION';
  }

  const remainingHours = (submission.slaDueAt.getTime() - now.getTime()) / HOUR_MS;

  if (remainingHours < 0) {
    return 'OVERDUE';
  }

  if (remainingHours <= 24) {
    return 'DUE_SOON';
  }

  return 'ON_TRACK';
}

export function isFinalStatus(status: string) {
  return status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED';
}

export function isCorrectionStatus(status: string) {
  return status === 'NEEDS_CORRECTION';
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function diffHours(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / HOUR_MS));
}

export function calculateElapsedHours(input: {
  startedAt?: Date | null;
  stoppedAt?: Date | null;
  pausedAt?: Date | null;
  pausedHours?: number | null;
  now?: Date;
}) {
  if (!input.startedAt) {
    return 0;
  }

  const end = input.stoppedAt ?? input.pausedAt ?? input.now ?? new Date();
  const totalHours = diffHours(input.startedAt, end);
  return Math.max(0, totalHours - (input.pausedHours ?? 0));
}

// ─── Business-hours variants (Sprint 29) ───────────────────────────────────

import type { WorkingCalendarConfig } from '../working-calendar/business-time.util';
import {
  addBusinessHours,
  calculateBusinessElapsedHours,
  calculateBusinessRemainingHours,
} from '../working-calendar/business-time.util';

export { addBusinessHours, calculateBusinessElapsedHours };

const DUE_SOON_BUSINESS_HOURS = 8;

export function calculateSlaStatusBusiness(
  submission: OpdSlaSubject,
  cal: WorkingCalendarConfig,
  now = new Date(),
): OpdSubmissionSlaStatus {
  if (submission.status === 'CANCELLED') return 'CANCELLED';
  if (isFinalStatus(submission.status)) return 'COMPLETED';
  if (!submission.slaStartedAt || !submission.slaDueAt) return 'NOT_STARTED';
  if (isCorrectionStatus(submission.status) || submission.slaPausedAt) {
    return 'PAUSED_FOR_CORRECTION';
  }

  if (submission.slaDueAt <= now) return 'OVERDUE';

  const remaining = calculateBusinessRemainingHours(now, submission.slaDueAt, cal);
  return remaining <= DUE_SOON_BUSINESS_HOURS ? 'DUE_SOON' : 'ON_TRACK';
}

export function calculateSlaDueAtBusiness(
  startDate: Date,
  targetHours: number,
  cal: WorkingCalendarConfig,
): Date {
  return addBusinessHours(startDate, targetHours, cal);
}
