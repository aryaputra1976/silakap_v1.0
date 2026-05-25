import {
  calculateElapsedHours,
  calculateSlaStatus,
  calculateSlaDueAt,
  diffHours,
  getSlaTargetHours,
  isCorrectionStatus,
  isFinalStatus,
} from './opd-sla.policy';

// ─── helpers ───────────────────────────────────────────────────────────────

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

// ─── getSlaTargetHours ──────────────────────────────────────────────────────

describe('getSlaTargetHours', () => {
  it('returns 120 for SIPENSIUN module', () => {
    expect(getSlaTargetHours('SIPENSIUN')).toBe(120);
  });

  it('returns 120 when serviceType contains "pensiun"', () => {
    expect(getSlaTargetHours('LAYANAN_KEPEGAWAIAN', 'pemberhentian_pensiun')).toBe(120);
  });

  it('returns 48 for DMS module', () => {
    expect(getSlaTargetHours('DMS')).toBe(48);
  });

  it('returns 72 for SIDATA module', () => {
    expect(getSlaTargetHours('SIDATA')).toBe(72);
  });

  it('returns 72 for LAYANAN_KEPEGAWAIAN (default)', () => {
    expect(getSlaTargetHours('LAYANAN_KEPEGAWAIAN', 'mutasi')).toBe(72);
  });

  it('is case-insensitive for module key', () => {
    expect(getSlaTargetHours('sipensiun')).toBe(120);
    expect(getSlaTargetHours('dms')).toBe(48);
  });
});

// ─── isFinalStatus / isCorrectionStatus ────────────────────────────────────

describe('isFinalStatus', () => {
  it.each(['COMPLETED', 'REJECTED', 'CANCELLED'])('returns true for %s', (s) => {
    expect(isFinalStatus(s)).toBe(true);
  });

  it.each(['SUBMITTED', 'RECEIVED', 'IN_VERIFICATION', 'VERIFIED', 'NEEDS_CORRECTION'])(
    'returns false for %s',
    (s) => {
      expect(isFinalStatus(s)).toBe(false);
    },
  );
});

describe('isCorrectionStatus', () => {
  it('returns true for NEEDS_CORRECTION', () => {
    expect(isCorrectionStatus('NEEDS_CORRECTION')).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isCorrectionStatus('RECEIVED')).toBe(false);
    expect(isCorrectionStatus('SUBMITTED')).toBe(false);
  });
});

// ─── diffHours ──────────────────────────────────────────────────────────────

describe('diffHours', () => {
  it('returns positive hours between two dates', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T11:30:00Z');
    expect(diffHours(start, end)).toBe(4); // ceil(3.5) = 4
  });

  it('returns 0 when end is before start', () => {
    const start = new Date('2026-01-02T00:00:00Z');
    const end = new Date('2026-01-01T00:00:00Z');
    expect(diffHours(start, end)).toBe(0);
  });

  it('returns 0 for identical dates', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    expect(diffHours(d, d)).toBe(0);
  });
});

// ─── calculateElapsedHours ──────────────────────────────────────────────────

describe('calculateElapsedHours', () => {
  it('returns 0 when no startedAt', () => {
    expect(calculateElapsedHours({ startedAt: null })).toBe(0);
  });

  it('counts from startedAt to now when no stopped/paused', () => {
    const startedAt = hoursAgo(10);
    const result = calculateElapsedHours({ startedAt });
    // ceil(10h) = 10, allow ±1 for timing
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it('uses stoppedAt when provided', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const stoppedAt = new Date('2026-01-01T05:00:00Z');
    expect(calculateElapsedHours({ startedAt, stoppedAt })).toBe(5);
  });

  it('subtracts paused hours', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const stoppedAt = new Date('2026-01-01T10:00:00Z');
    expect(calculateElapsedHours({ startedAt, stoppedAt, pausedHours: 3 })).toBe(7);
  });

  it('returns 0 when paused hours exceed total', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const stoppedAt = new Date('2026-01-01T02:00:00Z');
    expect(calculateElapsedHours({ startedAt, stoppedAt, pausedHours: 5 })).toBe(0);
  });
});

// ─── calculateSlaDueAt ──────────────────────────────────────────────────────

describe('calculateSlaDueAt', () => {
  it('adds target hours to start date', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const due = calculateSlaDueAt(start, 72);
    expect(due).toEqual(new Date('2026-01-04T00:00:00Z'));
  });
});

// ─── calculateSlaStatus ─────────────────────────────────────────────────────

describe('calculateSlaStatus', () => {
  const base = {
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    serviceType: 'mutasi',
  };

  it('returns CANCELLED for CANCELLED status', () => {
    expect(calculateSlaStatus({ ...base, status: 'CANCELLED' })).toBe('CANCELLED');
  });

  it('returns COMPLETED for final statuses', () => {
    expect(calculateSlaStatus({ ...base, status: 'COMPLETED' })).toBe('COMPLETED');
    expect(calculateSlaStatus({ ...base, status: 'REJECTED' })).toBe('COMPLETED');
  });

  it('returns NOT_STARTED when SLA not started', () => {
    expect(
      calculateSlaStatus({ ...base, status: 'SUBMITTED', slaStartedAt: null, slaDueAt: null }),
    ).toBe('NOT_STARTED');
  });

  it('returns PAUSED_FOR_CORRECTION when status is NEEDS_CORRECTION', () => {
    expect(
      calculateSlaStatus({
        ...base,
        status: 'NEEDS_CORRECTION',
        slaStartedAt: hoursAgo(5),
        slaDueAt: hoursFromNow(20),
      }),
    ).toBe('PAUSED_FOR_CORRECTION');
  });

  it('returns PAUSED_FOR_CORRECTION when slaPausedAt is set', () => {
    expect(
      calculateSlaStatus({
        ...base,
        status: 'RECEIVED',
        slaStartedAt: hoursAgo(5),
        slaDueAt: hoursFromNow(20),
        slaPausedAt: hoursAgo(1),
      }),
    ).toBe('PAUSED_FOR_CORRECTION');
  });

  it('returns OVERDUE when due date has passed', () => {
    expect(
      calculateSlaStatus({
        ...base,
        status: 'RECEIVED',
        slaStartedAt: hoursAgo(80),
        slaDueAt: hoursAgo(8), // already overdue
      }),
    ).toBe('OVERDUE');
  });

  it('returns DUE_SOON when within 24 calendar hours', () => {
    expect(
      calculateSlaStatus({
        ...base,
        status: 'RECEIVED',
        slaStartedAt: hoursAgo(50),
        slaDueAt: hoursFromNow(12), // within 24h
      }),
    ).toBe('DUE_SOON');
  });

  it('returns ON_TRACK when plenty of time remains', () => {
    expect(
      calculateSlaStatus({
        ...base,
        status: 'RECEIVED',
        slaStartedAt: hoursAgo(10),
        slaDueAt: hoursFromNow(48),
      }),
    ).toBe('ON_TRACK');
  });

  it('accepts explicit now parameter', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    const dueAt = new Date('2026-01-10T10:00:00Z'); // 2h before now → OVERDUE
    expect(
      calculateSlaStatus(
        { ...base, status: 'RECEIVED', slaStartedAt: new Date('2026-01-07T12:00:00Z'), slaDueAt: dueAt },
        now,
      ),
    ).toBe('OVERDUE');
  });
});
