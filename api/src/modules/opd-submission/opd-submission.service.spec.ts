import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OpdSubmissionService } from './opd-submission.service';
import { OpdSubmissionRepository } from './opd-submission.repository';
import { AuditService } from '../audit/audit.service';
import { DmsService } from '../dms/dms.service';
import { KinerjaRhkCandidateService } from '../kinerja-rhk-candidate/kinerja-rhk-candidate.service';
import { WorkingCalendarService } from '../working-calendar/working-calendar.service';
import type { AuthUser } from '../auth/auth.types';
import type { OpdSubmissionRecord } from './opd-submission.repository';

// ─── mock factory helpers ───────────────────────────────────────────────────

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@test.com',
    roles: ['OPD'],
    unitKerjaId: 'unit-1',
    unitKerja: { id: 'unit-1', kode: 'U01', nama: 'Dinas Test' },
    ...overrides,
  };
}

function makeInternalUser(roles: string[] = ['KABID']): AuthUser {
  return makeUser({ id: 'staff-1', name: 'Staff PPIK', roles });
}

function makeRecord(overrides: Partial<OpdSubmissionRecord> = {}): OpdSubmissionRecord {
  return {
    id: 'sub-1',
    submissionNumber: 'OPD-20260525-0001',
    opdUserId: 'user-1',
    opdUnitId: 'unit-1',
    opdName: 'Dinas Test',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    serviceType: 'mutasi',
    title: 'Mutasi — Budi',
    description: null,
    subjectName: 'Budi',
    subjectNip: '123456789012345678',
    status: 'SUBMITTED',
    correctionNote: null,
    submittedAt: new Date(),
    receivedAt: null,
    verifiedAt: null,
    completedAt: null,
    rejectedAt: null,
    createdById: 'user-1',
    updatedById: 'user-1',
    assignedToId: null,
    assignedToName: null,
    slaStartedAt: new Date(),
    slaPausedAt: null,
    slaResumedAt: null,
    slaStoppedAt: null,
    slaDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    slaTargetHours: 72,
    slaElapsedHours: 0,
    slaPausedHours: 0,
    slaStatus: 'ON_TRACK',
    lastStatusChangedAt: new Date(),
    lastStatusChangedById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    documents: [],
    auditLogs: [],
    timelines: [],
    ...overrides,
  } as unknown as OpdSubmissionRecord;
}

// ─── mock calendar ──────────────────────────────────────────────────────────

const mockCalendar = {
  workStart: 8,
  workEnd: 17,
  workDays: [1, 2, 3, 4, 5],
  holidays: [],
};

// ─── test suite ─────────────────────────────────────────────────────────────

describe('OpdSubmissionService', () => {
  let service: OpdSubmissionService;

  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateAtomic: jest.fn(),
    findMany: jest.fn(),
    findTimeline: jest.fn(),
    getSummary: jest.fn(),
    findSlaItems: jest.fn(),
    countSubmittedOnDay: jest.fn(),
    createAuditLog: jest.fn(),
    createTimeline: jest.fn(),
    addDocument: jest.fn(),
    findDocumentById: jest.fn(),
    updateDocument: jest.fn(),
  };

  const mockAudit = { record: jest.fn() };
  const mockDms = { createUploadedOpdSubmissionDocument: jest.fn() };
  const mockCandidateService = { generateFromSubmission: jest.fn() };
  const mockWorkingCalendar = { getEffectiveCalendar: jest.fn().mockResolvedValue(mockCalendar) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        OpdSubmissionService,
        { provide: OpdSubmissionRepository, useValue: mockRepo },
        { provide: AuditService, useValue: mockAudit },
        { provide: DmsService, useValue: mockDms },
        { provide: KinerjaRhkCandidateService, useValue: mockCandidateService },
        { provide: WorkingCalendarService, useValue: mockWorkingCalendar },
      ],
    }).compile();

    service = module.get(OpdSubmissionService);
  });

  // ── createDraft ───────────────────────────────────────────────────────────

  describe('createDraft', () => {
    const opdUser = makeUser();

    it('rejects non-OPD user', async () => {
      const internalUser = makeInternalUser();
      await expect(
        service.createDraft(
          { moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'mutasi', title: 'Test' },
          internalUser,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it.each(['kenaikan_pangkat', 'pengangkatan', 'mutasi', 'cuti', 'penghargaan', 'disiplin', 'pemberhentian'])(
      'accepts valid LAYANAN serviceType: %s',
      async (serviceType) => {
        const record = makeRecord({ serviceType });
        mockRepo.create.mockResolvedValue(record);
        mockRepo.createAuditLog.mockResolvedValue({});
        mockRepo.createTimeline.mockResolvedValue({});
        mockAudit.record.mockResolvedValue({});

        await expect(
          service.createDraft(
            { moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType, title: 'Test' },
            opdUser,
          ),
        ).resolves.toBeDefined();
      },
    );

    it('rejects invalid serviceType for LAYANAN_KEPEGAWAIAN', async () => {
      await expect(
        service.createDraft(
          { moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'KENAIKAN_PANGKAT', title: 'Test' },
          opdUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects free-form serviceType for LAYANAN_KEPEGAWAIAN', async () => {
      await expect(
        service.createDraft(
          { moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'random_value', title: 'Test' },
          opdUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts any serviceType for non-LAYANAN modules', async () => {
      const record = makeRecord({ moduleKey: 'SIDATA', serviceType: 'ANYTHING' });
      mockRepo.create.mockResolvedValue(record);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      await expect(
        service.createDraft(
          { moduleKey: 'SIDATA', serviceType: 'ANYTHING', title: 'Test' },
          opdUser,
        ),
      ).resolves.toBeDefined();
    });

    it('stores opdName from unitKerja nama', async () => {
      const record = makeRecord();
      mockRepo.create.mockResolvedValue(record);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      await service.createDraft(
        { moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'mutasi', title: 'Test' },
        opdUser,
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ opdName: 'Dinas Test' }),
      );
    });
  });

  // ── updateMine ────────────────────────────────────────────────────────────

  describe('updateMine', () => {
    it('rejects invalid serviceType on update for LAYANAN module', async () => {
      const record = makeRecord({ status: 'DRAFT' });
      mockRepo.findById.mockResolvedValue(record);

      await expect(
        service.updateMine('sub-1', { serviceType: 'INVALID_TYPE' }, makeUser()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts valid serviceType on update', async () => {
      const record = makeRecord({ status: 'DRAFT' });
      const updated = makeRecord({ serviceType: 'cuti' });
      mockRepo.findById.mockResolvedValue(record);
      mockRepo.update.mockResolvedValue(updated);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      await expect(
        service.updateMine('sub-1', { serviceType: 'cuti' }, makeUser()),
      ).resolves.toBeDefined();
    });

    it('rejects update when status is not DRAFT/NEEDS_CORRECTION', async () => {
      const record = makeRecord({ status: 'RECEIVED' });
      mockRepo.findById.mockResolvedValue(record);

      await expect(
        service.updateMine('sub-1', { serviceType: 'mutasi' }, makeUser()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects update from wrong OPD owner', async () => {
      const record = makeRecord({ status: 'DRAFT', opdUserId: 'other-user' });
      mockRepo.findById.mockResolvedValue(record);

      await expect(
        service.updateMine('sub-1', { serviceType: 'mutasi' }, makeUser({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ── receive (changeInternalStatus) ───────────────────────────────────────

  describe('receive', () => {
    const staff = makeInternalUser(['KABID']);

    it('succeeds when submission is SUBMITTED', async () => {
      const before = makeRecord({ status: 'SUBMITTED' });
      const after = makeRecord({ status: 'RECEIVED', assignedToId: 'staff-1', assignedToName: 'Staff PPIK' });
      mockRepo.findById.mockResolvedValue(before);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      const result = await service.receive('sub-1', {}, staff);
      expect(result.status).toBe('RECEIVED');
    });

    it('uses updateAtomic — throws BadRequestException when race condition detected (null return)', async () => {
      const before = makeRecord({ status: 'SUBMITTED' });
      mockRepo.findById.mockResolvedValue(before);
      // Simulate race condition: status changed between read and write
      mockRepo.updateAtomic.mockResolvedValue(null);

      await expect(service.receive('sub-1', {}, staff)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when status is DRAFT (not allowed for receive)', async () => {
      const before = makeRecord({ status: 'DRAFT' });
      mockRepo.findById.mockResolvedValue(before);

      await expect(service.receive('sub-1', {}, staff)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when user lacks RECEIVE_ROLES', async () => {
      const before = makeRecord({ status: 'SUBMITTED' });
      mockRepo.findById.mockResolvedValue(before);

      const lowRoleUser = makeInternalUser(['PPPK']);
      // PPPK is in RECEIVE_ROLES — use OPD which is not
      const opdStaff = makeUser({ roles: ['OPD'] });
      await expect(service.receive('sub-1', {}, opdStaff)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('stores assignedToName from user', async () => {
      const before = makeRecord({ status: 'SUBMITTED' });
      const after = makeRecord({ status: 'RECEIVED' });
      mockRepo.findById.mockResolvedValue(before);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      await service.receive('sub-1', {}, staff);

      expect(mockRepo.updateAtomic).toHaveBeenCalledWith(
        'sub-1',
        expect.any(Array),
        expect.objectContaining({
          assignedToId: 'staff-1',
          assignedToName: 'Staff PPIK',
        }),
      );
    });
  });

  // ── verify ────────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('succeeds from RECEIVED status', async () => {
      const before = makeRecord({ status: 'RECEIVED' });
      const after = makeRecord({ status: 'VERIFIED' });
      mockRepo.findById.mockResolvedValue(before);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      const result = await service.verify('sub-1', {}, makeInternalUser(['KABID']));
      expect(result.status).toBe('VERIFIED');
    });

    it('rejects ANALIS_PERTAMA for verify (not in VERIFY_ROLES)', async () => {
      const before = makeRecord({ status: 'RECEIVED' });
      mockRepo.findById.mockResolvedValue(before);

      await expect(
        service.verify('sub-1', {}, makeInternalUser(['ANALIS_PERTAMA'])),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when submission not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.verify('nonexistent', {}, makeInternalUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── complete ──────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('succeeds when all documents are verified', async () => {
      const before = makeRecord({
        status: 'VERIFIED',
        documents: [
          { id: 'doc-1', status: 'VERIFIED' } as any,
          { id: 'doc-2', status: 'VERIFIED' } as any,
        ],
      });
      const after = makeRecord({ status: 'COMPLETED' });
      // complete() calls findById 3x: own getSubmission, changeInternalStatus's getSubmission, post-complete fetch
      mockRepo.findById.mockResolvedValueOnce(before).mockResolvedValueOnce(before).mockResolvedValue(after);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});
      mockCandidateService.generateFromSubmission.mockResolvedValue(undefined);

      const result = await service.complete('sub-1', {}, makeInternalUser(['KABID']));
      expect(result.status).toBe('COMPLETED');
    });

    it('throws when rejected documents exist and no overrideNote', async () => {
      const before = makeRecord({
        status: 'VERIFIED',
        documents: [
          { id: 'doc-1', status: 'REJECTED' } as any,
        ],
      });
      mockRepo.findById.mockResolvedValue(before);

      await expect(
        service.complete('sub-1', {}, makeInternalUser(['KABID'])),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows complete with overrideNote even when documents rejected', async () => {
      const before = makeRecord({
        status: 'VERIFIED',
        documents: [{ id: 'doc-1', status: 'REJECTED' } as any],
      });
      const after = makeRecord({ status: 'COMPLETED' });
      mockRepo.findById.mockResolvedValueOnce(before).mockResolvedValueOnce(before).mockResolvedValue(after);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});
      mockCandidateService.generateFromSubmission.mockResolvedValue(undefined);

      await expect(
        service.complete('sub-1', { overrideNote: 'Dikecualikan pimpinan' }, makeInternalUser(['KABID'])),
      ).resolves.toBeDefined();
    });

    it('rejects ANALIS_PERTAMA for complete (not in FINAL_ROLES)', async () => {
      const before = makeRecord({ status: 'VERIFIED', documents: [] });
      mockRepo.findById.mockResolvedValue(before);

      await expect(
        service.complete('sub-1', {}, makeInternalUser(['ANALIS_PERTAMA'])),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects race condition on complete (updateAtomic returns null)', async () => {
      const before = makeRecord({ status: 'VERIFIED', documents: [] });
      mockRepo.findById.mockResolvedValueOnce(before).mockResolvedValue(before);
      mockRepo.updateAtomic.mockResolvedValue(null);

      await expect(
        service.complete('sub-1', {}, makeInternalUser(['KABID'])),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ── requestCorrection ─────────────────────────────────────────────────────

  describe('requestCorrection', () => {
    it('requires a note', async () => {
      const before = makeRecord({ status: 'RECEIVED' });
      mockRepo.findById.mockResolvedValue(before);

      await expect(
        service.requestCorrection('sub-1', { note: '' }, makeInternalUser()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('pauses SLA when requesting correction', async () => {
      const before = makeRecord({ status: 'RECEIVED' });
      const after = makeRecord({ status: 'NEEDS_CORRECTION', slaStatus: 'PAUSED_FOR_CORRECTION' });
      mockRepo.findById.mockResolvedValue(before);
      mockRepo.updateAtomic.mockResolvedValue(after);
      mockRepo.createAuditLog.mockResolvedValue({});
      mockRepo.createTimeline.mockResolvedValue({});
      mockAudit.record.mockResolvedValue({});

      const result = await service.requestCorrection(
        'sub-1',
        { note: 'Dokumen kurang lengkap' },
        makeInternalUser(),
      );

      expect(result.slaStatus).toBe('PAUSED_FOR_CORRECTION');
    });
  });

  // ── getInternal ───────────────────────────────────────────────────────────

  describe('getInternal', () => {
    it('returns submission for internal user', async () => {
      const record = makeRecord();
      mockRepo.findById.mockResolvedValue(record);

      const result = await service.getInternal('sub-1', makeInternalUser());
      expect(result.id).toBe('sub-1');
    });

    it('throws NotFoundException for unknown ID', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getInternal('nonexistent', makeInternalUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException for OPD user calling internal endpoint', async () => {
      await expect(
        service.getInternal('sub-1', makeUser({ roles: ['OPD'] })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
