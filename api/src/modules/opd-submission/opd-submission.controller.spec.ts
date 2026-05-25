import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import {
  OpdSubmissionController,
  InternalOpdSubmissionController,
} from './opd-submission.controller';
import { OpdSubmissionService } from './opd-submission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

// ─── fake auth guards ───────────────────────────────────────────────────────

function makeJwtGuard(user: AuthUser | null): CanActivate {
  return {
    canActivate(ctx: ExecutionContext) {
      if (!user) return false;
      const req = ctx.switchToHttp().getRequest();
      req.user = user;
      return true;
    },
  };
}

function makeOpdUser(): AuthUser {
  return {
    id: 'opd-user-1',
    username: 'opduser',
    name: 'OPD User',
    email: null,
    roles: ['OPD'],
    unitKerjaId: 'unit-1',
    unitKerja: { id: 'unit-1', kode: 'U01', nama: 'Dinas Test' },
  };
}

function makeInternalUser(roles = ['KABID']): AuthUser {
  return {
    id: 'staff-1',
    username: 'staff',
    name: 'Staff PPIK',
    email: null,
    roles,
    unitKerjaId: null,
    unitKerja: null,
  };
}

// ─── stub response ──────────────────────────────────────────────────────────

const stubSubmission = {
  id: 'sub-1',
  submissionNumber: null,
  moduleKey: 'LAYANAN_KEPEGAWAIAN',
  serviceType: 'mutasi',
  title: 'Mutasi — Budi',
  status: 'DRAFT',
  slaStatus: 'NOT_STARTED',
  documents: [],
  auditLogs: [],
  timelines: [],
};

// ─── test bootstrap helper ───────────────────────────────────────────────────

async function createApp(user: AuthUser | null) {
  const mockService: Partial<OpdSubmissionService> = {
    createDraft: jest.fn().mockResolvedValue(stubSubmission),
    updateMine: jest.fn().mockResolvedValue(stubSubmission),
    submitMine: jest.fn().mockResolvedValue(stubSubmission),
    cancelMine: jest.fn().mockResolvedValue(stubSubmission),
    listMine: jest.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 }),
    getMine: jest.fn().mockResolvedValue(stubSubmission),
    getMySummary: jest.fn().mockResolvedValue({}),
    getMyTimeline: jest.fn().mockResolvedValue([]),
    addDocumentMine: jest.fn().mockResolvedValue(stubSubmission),
    receive: jest.fn().mockResolvedValue(stubSubmission),
    startVerification: jest.fn().mockResolvedValue(stubSubmission),
    verify: jest.fn().mockResolvedValue(stubSubmission),
    reject: jest.fn().mockResolvedValue(stubSubmission),
    complete: jest.fn().mockResolvedValue(stubSubmission),
    requestCorrection: jest.fn().mockResolvedValue(stubSubmission),
    listInternal: jest.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 }),
    getInternal: jest.fn().mockResolvedValue(stubSubmission),
    getInternalSummary: jest.fn().mockResolvedValue({}),
    getInternalTimeline: jest.fn().mockResolvedValue([]),
    getInternalSlaSummary: jest.fn().mockResolvedValue({}),
    getInternalSlaQueue: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [OpdSubmissionController, InternalOpdSubmissionController],
    providers: [
      { provide: OpdSubmissionService, useValue: mockService },
      Reflector,
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(makeJwtGuard(user))
    .overrideGuard(RolesGuard)
    .useClass(RolesGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return { app, service: mockService as jest.Mocked<OpdSubmissionService> };
}

// ─── OPD controller ──────────────────────────────────────────────────────────

describe('OpdSubmissionController — OPD endpoints', () => {
  let app: INestApplication;
  let service: jest.Mocked<OpdSubmissionService>;

  beforeAll(async () => {
    ({ app, service } = await createApp(makeOpdUser()));
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/v1/opd/submissions', () => {
    it('201 with valid LAYANAN payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'mutasi',
          title: 'Mutasi Budi',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(service.createDraft).toHaveBeenCalledTimes(1);
    });

    it('400 when moduleKey is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({ serviceType: 'mutasi', title: 'Test' });

      expect(res.status).toBe(400);
      expect(service.createDraft).not.toHaveBeenCalled();
    });

    it('400 when moduleKey is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({ moduleKey: 'UNKNOWN_MODULE', serviceType: 'mutasi', title: 'Test' });

      expect(res.status).toBe(400);
    });

    it('400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({ moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'mutasi' });

      expect(res.status).toBe(400);
    });

    it('400 when title exceeds 200 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'mutasi',
          title: 'x'.repeat(201),
        });

      expect(res.status).toBe(400);
    });

    it('whitelist strips unknown fields before reaching service', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'mutasi',
          title: 'Test',
          hackerField: 'injected',
        });

      const dto = (service.createDraft as jest.Mock).mock.calls[0]?.[0];
      expect(dto).not.toHaveProperty('hackerField');
    });
  });

  describe('GET /api/v1/opd/submissions', () => {
    it('200 with valid OPD user', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/opd/submissions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/opd/submissions/:id', () => {
    it('200 for existing submission', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/opd/submissions/sub-1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('sub-1');
    });
  });
});

// ─── OPD controller — unauthenticated ───────────────────────────────────────

describe('OpdSubmissionController — unauthenticated', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createApp(null));
  });

  afterAll(() => app.close());

  it('403 POST when not authenticated (JWT guard returns false)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/opd/submissions')
      .send({ moduleKey: 'LAYANAN_KEPEGAWAIAN', serviceType: 'mutasi', title: 'Test' });

    expect(res.status).toBe(403);
  });
});

// ─── Internal controller — role guard ───────────────────────────────────────

describe('InternalOpdSubmissionController — role guard', () => {
  it('403 when OPD user calls internal endpoint', async () => {
    const { app } = await createApp(makeOpdUser());
    const res = await request(app.getHttpServer()).get('/api/v1/internal/opd-submissions');
    expect(res.status).toBe(403);
    await app.close();
  });

  it('200 when KABID calls internal endpoint', async () => {
    const { app } = await createApp(makeInternalUser(['KABID']));
    const res = await request(app.getHttpServer()).get('/api/v1/internal/opd-submissions');
    expect(res.status).toBe(200);
    await app.close();
  });
});

// ─── Internal controller — action endpoints ──────────────────────────────────

describe('InternalOpdSubmissionController — actions', () => {
  let app: INestApplication;
  let service: jest.Mocked<OpdSubmissionService>;

  beforeAll(async () => {
    ({ app, service } = await createApp(makeInternalUser(['KABID'])));
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('POST /receive — 201 with empty body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/internal/opd-submissions/sub-1/receive')
      .send({});

    expect(res.status).toBe(201);
    expect(service.receive).toHaveBeenCalledWith(
      'sub-1',
      expect.any(Object),
      expect.objectContaining({ roles: ['KABID'] }),
      expect.anything(),
    );
  });

  it('POST /request-correction — 400 when note is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/internal/opd-submissions/sub-1/request-correction')
      .send({});

    expect(res.status).toBe(400);
    expect(service.requestCorrection).not.toHaveBeenCalled();
  });

  it('POST /request-correction — 201 with note', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/internal/opd-submissions/sub-1/request-correction')
      .send({ note: 'Dokumen tidak lengkap' });

    expect(res.status).toBe(201);
  });

  it('POST /complete — 201 with empty body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/internal/opd-submissions/sub-1/complete')
      .send({});

    expect(res.status).toBe(201);
    expect(service.complete).toHaveBeenCalledTimes(1);
  });

  it('POST /verify — 201 with optional note', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/internal/opd-submissions/sub-1/verify')
      .send({ note: 'Dokumen lengkap' });

    expect(res.status).toBe(201);
  });

  it('GET /:id — 200 with correct response shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/internal/opd-submissions/sub-1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: 'sub-1', status: 'DRAFT' }),
    });
  });
});
