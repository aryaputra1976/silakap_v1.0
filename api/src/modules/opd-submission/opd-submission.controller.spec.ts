import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import request from 'supertest';

import {
  InternalOpdSubmissionController,
  OpdSubmissionController,
} from './opd-submission.controller';
import { OpdSubmissionService } from './opd-submission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';

function makeJwtGuard(user: AuthUser | null): CanActivate {
  return {
    canActivate(ctx: ExecutionContext) {
      if (!user) {
        return false;
      }

      const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
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
    unitKerja: {
      id: 'unit-1',
      kode: 'U01',
      nama: 'Dinas Test',
    },
  };
}

function makeInternalUser(roles: string[] = ['KABID']): AuthUser {
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

const stubSubmission = {
  id: 'sub-1',
  submissionNumber: null,
  moduleKey: 'LAYANAN_KEPEGAWAIAN',
  serviceType: 'PEREMAJAAN_NIK',
  title: 'Peremajaan NIK — Budi',
  status: 'DRAFT',
  slaStatus: 'NOT_STARTED',
  documents: [
    {
      id: 'doc-1',
      submissionId: 'sub-1',
      documentType: 'KTP',
      title: 'KTP',
      status: 'UPLOADED',
      note: null,
      originalFileName: 'ktp.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12345,
      storageKey: 'storage/opd-submissions/sub-1/ktp.pdf',
      uploadedAt: new Date('2026-05-30T00:00:00.000Z'),
      uploadedById: 'opd-user-1',
      uploadedByRole: 'OPD',
      verifiedAt: null,
      verifiedById: null,
      rejectionReason: null,
      dmsDocumentId: null,
      createdAt: new Date('2026-05-30T00:00:00.000Z'),
      updatedAt: new Date('2026-05-30T00:00:00.000Z'),
    },
  ],
  auditLogs: [],
  timelines: [],
};

const stubFile = {
  buffer: Buffer.from('dummy pdf content'),
  fileName: 'ktp.pdf',
  mimeType: 'application/pdf',
};

function createMockService() {
  return {
    createDraft: jest.fn(async () => stubSubmission),
    updateMine: jest.fn(async () => stubSubmission),
    submitMine: jest.fn(async () => stubSubmission),
    cancelMine: jest.fn(async () => stubSubmission),

    listMine: jest.fn(async () => ({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    })),
    getMine: jest.fn(async () => stubSubmission),
    getMySummary: jest.fn(async () => ({})),
    getMyTimeline: jest.fn(async () => []),
    addDocumentMine: jest.fn(async () => stubSubmission),
    uploadDocumentFileMine: jest.fn(async () => stubSubmission),

    listInternal: jest.fn(async () => ({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    })),
    getInternal: jest.fn(async () => stubSubmission),
    getInternalSummary: jest.fn(async () => ({})),
    getInternalTimeline: jest.fn(async () => []),
    getInternalSlaSummary: jest.fn(async () => ({})),
    getInternalSlaQueue: jest.fn(async () => ({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    })),

    receive: jest.fn(async () => stubSubmission),
    startVerification: jest.fn(async () => stubSubmission),
    verify: jest.fn(async () => stubSubmission),
    reject: jest.fn(async () => stubSubmission),
    complete: jest.fn(async () => stubSubmission),
    requestCorrection: jest.fn(async () => stubSubmission),

    uploadInternalDocumentFile: jest.fn(async () => stubSubmission),
    verifyDocument: jest.fn(async () => stubSubmission),
    requestDocumentCorrection: jest.fn(async () => stubSubmission),
    rejectDocument: jest.fn(async () => stubSubmission),

    getInternalDocumentFile: jest.fn(async () => stubFile),
  };
}

type OpdSubmissionServiceMock = ReturnType<typeof createMockService>;

async function createApp(user: AuthUser | null): Promise<{
  app: INestApplication;
  service: OpdSubmissionServiceMock;
}> {
  const mockService = createMockService();

  const moduleRef = await Test.createTestingModule({
    controllers: [OpdSubmissionController, InternalOpdSubmissionController],
    providers: [
      {
        provide: OpdSubmissionService,
        useValue: mockService,
      },
      Reflector,
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(makeJwtGuard(user))
    .overrideGuard(RolesGuard)
    .useClass(RolesGuard)
    .compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    service: mockService,
  };
}

describe('OpdSubmissionController — OPD endpoints', () => {
  let app: INestApplication;
  let service: OpdSubmissionServiceMock;

  beforeAll(async () => {
    ({ app, service } = await createApp(makeOpdUser()));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/opd/submissions', () => {
    it('201 with valid LAYANAN payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'PEREMAJAAN_NIK',
          title: 'Peremajaan NIK Budi',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(service.createDraft).toHaveBeenCalledTimes(1);
    });

    it('400 when moduleKey is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          serviceType: 'PEREMAJAAN_NIK',
          title: 'Test',
        });

      expect(res.status).toBe(400);
      expect(service.createDraft).not.toHaveBeenCalled();
    });

    it('400 when moduleKey is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'UNKNOWN_MODULE',
          serviceType: 'PEREMAJAAN_NIK',
          title: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('400 when serviceType is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'mutasi',
          title: 'Mutasi lama',
        });

      expect(res.status).toBe(400);
      expect(service.createDraft).not.toHaveBeenCalled();
    });

    it('400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'PEREMAJAAN_NIK',
        });

      expect(res.status).toBe(400);
    });

    it('400 when title exceeds 200 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opd/submissions')
        .send({
          moduleKey: 'LAYANAN_KEPEGAWAIAN',
          serviceType: 'PEREMAJAAN_NIK',
          title: 'x'.repeat(201),
        });

      expect(res.status).toBe(400);
    });

it('whitelist strips unknown fields before reaching service', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/opd/submissions')
    .send({
      moduleKey: 'LAYANAN_KEPEGAWAIAN',
      serviceType: 'PEREMAJAAN_NIK',
      title: 'Test',
      hackerField: 'injected',
    });

  expect(res.status).toBe(201);
  expect(service.createDraft).toHaveBeenCalledTimes(1);

  const firstCall = service.createDraft.mock.calls[0];

  expect(firstCall).toBeDefined();

  expect(service.createDraft).toHaveBeenCalledWith(
    expect.not.objectContaining({
      hackerField: 'injected',
    }),
    expect.any(Object),
    expect.anything(),
  );
});
  });

  describe('GET /api/v1/opd/submissions', () => {
    it('200 with valid OPD user', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/opd/submissions',
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/opd/submissions/:id', () => {
    it('200 for existing submission', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/opd/submissions/sub-1',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('sub-1');
    });
  });
});

describe('OpdSubmissionController — unauthenticated', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createApp(null));
  });

  afterAll(async () => {
    await app.close();
  });

  it('403 POST when not authenticated', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/opd/submissions')
      .send({
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        serviceType: 'PEREMAJAAN_NIK',
        title: 'Test',
      });

    expect(res.status).toBe(403);
  });
});

describe('InternalOpdSubmissionController — role guard', () => {
  it('403 when OPD user calls internal endpoint', async () => {
    const { app } = await createApp(makeOpdUser());

    const res = await request(app.getHttpServer()).get(
      '/api/v1/internal/opd-submissions',
    );

    expect(res.status).toBe(403);

    await app.close();
  });

  it('200 when KABID calls internal endpoint', async () => {
    const { app } = await createApp(makeInternalUser(['KABID']));

    const res = await request(app.getHttpServer()).get(
      '/api/v1/internal/opd-submissions',
    );

    expect(res.status).toBe(200);

    await app.close();
  });
});

describe('InternalOpdSubmissionController — actions', () => {
  let app: INestApplication;
  let service: OpdSubmissionServiceMock;

  beforeAll(async () => {
    ({ app, service } = await createApp(makeInternalUser(['KABID'])));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
      .send({
        note: 'Dokumen tidak lengkap',
      });

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
      .send({
        note: 'Dokumen lengkap',
      });

    expect(res.status).toBe(201);
  });

  it('GET /:id — 200 with correct response shape', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/internal/opd-submissions/sub-1',
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: 'sub-1',
        status: 'DRAFT',
      }),
    });
  });

  it('GET /:id/documents/:documentId/download — 200 streams file inline', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/internal/opd-submissions/sub-1/documents/doc-1/download',
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline');
    expect(service.getInternalDocumentFile).toHaveBeenCalledWith(
      'sub-1',
      'doc-1',
      expect.objectContaining({ roles: ['KABID'] }),
    );
  });
});