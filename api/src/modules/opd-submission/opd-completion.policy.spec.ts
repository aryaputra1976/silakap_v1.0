import {
  assessCompletionReadiness,
  calculateCompletionScores,
} from './opd-completion.policy';
import type { OpdSubmissionRecord } from './opd-submission.repository';

function makeRecord(
  docs: Array<{ id: string; status: string }> = [],
  slaStatus: string | null = 'ON_TRACK',
): OpdSubmissionRecord {
  return {
    id: 'sub-1',
    slaStatus,
    documents: docs.map((d) => ({
      id: d.id,
      status: d.status,
      submissionId: 'sub-1',
    })),
    auditLogs: [],
    timelines: [],
  } as unknown as OpdSubmissionRecord;
}

// ─── assessCompletionReadiness ──────────────────────────────────────────────

describe('assessCompletionReadiness', () => {
  it('canComplete=true when no documents at all', () => {
    const result = assessCompletionReadiness(makeRecord([]));
    expect(result.canComplete).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('canComplete=true when all documents are verified', () => {
    const result = assessCompletionReadiness(
      makeRecord([
        { id: 'doc-1', status: 'VERIFIED' },
        { id: 'doc-2', status: 'VERIFIED' },
      ]),
    );
    expect(result.canComplete).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('canComplete=false when at least one document is rejected', () => {
    const result = assessCompletionReadiness(
      makeRecord([
        { id: 'doc-1', status: 'VERIFIED' },
        { id: 'doc-2', status: 'REJECTED' },
      ]),
    );
    expect(result.canComplete).toBe(false);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain('1 dokumen ditolak');
  });

  it('canComplete=false when documents exist but none verified', () => {
    const result = assessCompletionReadiness(
      makeRecord([
        { id: 'doc-1', status: 'UPLOADED' },
        { id: 'doc-2', status: 'NEEDS_CORRECTION' },
      ]),
    );
    expect(result.canComplete).toBe(false);
    expect(result.reasons.some((r) => r.includes('terverifikasi'))).toBe(true);
  });

  it('canComplete=false and 2 reasons when both rejected and none verified', () => {
    const result = assessCompletionReadiness(
      makeRecord([{ id: 'doc-1', status: 'REJECTED' }]),
    );
    expect(result.reasons).toHaveLength(2);
    expect(result.requiresOverride).toBe(true);
  });

  it('evidenceStatus counts correctly', () => {
    const result = assessCompletionReadiness(
      makeRecord([
        { id: 'doc-1', status: 'VERIFIED' },
        { id: 'doc-2', status: 'REJECTED' },
        { id: 'doc-3', status: 'UPLOADED' },
        { id: 'doc-4', status: 'NEEDS_CORRECTION' },
      ]),
    );
    expect(result.evidenceStatus.total).toBe(4);
    expect(result.evidenceStatus.verified).toBe(1);
    expect(result.evidenceStatus.rejected).toBe(1);
    expect(result.evidenceStatus.pending).toBe(2);
  });

  it('isOnTime=false when slaStatus is OVERDUE', () => {
    const result = assessCompletionReadiness(makeRecord([], 'OVERDUE'));
    expect(result.isOnTime).toBe(false);
  });

  it('isOnTime=true when slaStatus is ON_TRACK', () => {
    const result = assessCompletionReadiness(makeRecord([], 'ON_TRACK'));
    expect(result.isOnTime).toBe(true);
  });

  it('isOnTime=true when slaStatus is null (NOT_STARTED)', () => {
    const result = assessCompletionReadiness(makeRecord([], null));
    expect(result.isOnTime).toBe(true);
  });
});

// ─── calculateCompletionScores ──────────────────────────────────────────────

describe('calculateCompletionScores', () => {
  it('returns 0 evidenceScore when no documents', () => {
    const result = calculateCompletionScores(makeRecord([]));
    expect(result.evidenceScore).toBe(0);
  });

  it('returns 100 evidenceScore when all verified', () => {
    const result = calculateCompletionScores(
      makeRecord([
        { id: 'doc-1', status: 'VERIFIED' },
        { id: 'doc-2', status: 'VERIFIED' },
      ]),
    );
    expect(result.evidenceScore).toBe(100);
  });

  it('returns 50 evidenceScore when half verified', () => {
    const result = calculateCompletionScores(
      makeRecord([
        { id: 'doc-1', status: 'VERIFIED' },
        { id: 'doc-2', status: 'UPLOADED' },
      ]),
    );
    expect(result.evidenceScore).toBe(50);
  });

  it('reduces timeScore to 70 when OVERDUE', () => {
    const result = calculateCompletionScores(makeRecord([], 'OVERDUE'));
    expect(result.timeScore).toBe(70);
  });

  it('timeScore is 100 when ON_TRACK', () => {
    const result = calculateCompletionScores(makeRecord([], 'ON_TRACK'));
    expect(result.timeScore).toBe(100);
  });

  it('uses checklist quality score in overall calculation', () => {
    const perfect = calculateCompletionScores(
      makeRecord([{ id: 'doc-1', status: 'VERIFIED' }]),
      100,
    );
    const noneChecklist = calculateCompletionScores(
      makeRecord([{ id: 'doc-1', status: 'VERIFIED' }]),
      0,
    );
    expect(perfect.overallScore).toBeGreaterThan(noneChecklist.overallScore);
  });

  it('overallScore is between 0 and 100', () => {
    const result = calculateCompletionScores(
      makeRecord([{ id: 'doc-1', status: 'REJECTED' }], 'OVERDUE'),
      0,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('clamps qualityScore between 0 and 100', () => {
    const result = calculateCompletionScores(makeRecord([]), 150);
    expect(result.qualityScore).toBe(100);
  });
});
