import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  AdminLayananSopConfigController,
  LayananSopConfigController,
} from './layanan-kepegawaian.controller';
import { LayananSopConfigRepository } from './layanan-sop-config.repository';

function makeJwtGuard(user: AuthUser | null): CanActivate {
  return {
    canActivate(ctx: ExecutionContext) {
      if (!user) return false;
      ctx.switchToHttp().getRequest().user = user;
      return true;
    },
  };
}

function makeAdmin(roles = ['KABID']): AuthUser {
  return { id: 'admin-1', username: 'admin', name: 'Admin PPIK', email: null, roles, unitKerjaId: null, unitKerja: null };
}

function makeOpd(): AuthUser {
  return { id: 'opd-1', username: 'opd', name: 'OPD User', email: null, roles: ['OPD'], unitKerjaId: 'u1', unitKerja: { id: 'u1', kode: 'U01', nama: 'Dinas Test' } };
}

const stubRow = {
  id: 'cfg-1',
  sopKey: 'LAY-001',
  code: 'SOP-BKPSDM-LAY-001',
  title: 'Penerimaan Permohonan',
  shortLabel: 'Permohonan Masuk',
  description: 'Deskripsi SOP 001',
  rhkCodes: ['RHK 1', 'RHK 3'],
  sortOrder: 1,
  isActive: true,
  updatedAt: new Date('2026-01-01'),
};

async function createApp(user: AuthUser | null) {
  const mockRepo: Partial<LayananSopConfigRepository> = {
    findAll: jest.fn().mockResolvedValue([stubRow]),
    findAllActive: jest.fn().mockResolvedValue([stubRow]),
    findBySopKey: jest.fn().mockImplementation((k) =>
      Promise.resolve(k === 'LAY-001' ? stubRow : null),
    ),
    partialUpdate: jest.fn().mockResolvedValue({ ...stubRow, title: 'Updated Title' }),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [LayananSopConfigController, AdminLayananSopConfigController],
    providers: [
      { provide: LayananSopConfigRepository, useValue: mockRepo },
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
  return { app, repo: mockRepo as jest.Mocked<LayananSopConfigRepository> };
}

// ─── Public SOP catalog ──────────────────────────────────────────────────────

describe('LayananSopConfigController — public catalog', () => {
  let app: INestApplication;
  let repo: jest.Mocked<LayananSopConfigRepository>;

  beforeAll(async () => ({ app, repo } = await createApp(null)));
  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('GET /api/v1/layanan-kepegawaian/sop-configs — 200, returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/layanan-kepegawaian/sop-configs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].key).toBe('LAY-001');
    expect(repo.findAllActive).toHaveBeenCalledTimes(1);
  });

  it('GET /sop-configs — response shape has required fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/layanan-kepegawaian/sop-configs');

    const item = res.body.data[0];
    expect(item).toMatchObject({
      key: 'LAY-001',
      code: 'SOP-BKPSDM-LAY-001',
      title: 'Penerimaan Permohonan',
      shortLabel: 'Permohonan Masuk',
      description: 'Deskripsi SOP 001',
      rhkCodes: ['RHK 1', 'RHK 3'],
      sortOrder: 1,
    });
  });
});

// ─── Admin SOP config ────────────────────────────────────────────────────────

describe('AdminLayananSopConfigController — GET all', () => {
  it('200 when KABID', async () => {
    const { app, repo } = await createApp(makeAdmin(['KABID']));
    const res = await request(app.getHttpServer())
      .get('/api/v1/internal/layanan-kepegawaian/sop-configs');
    expect(res.status).toBe(200);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('403 when OPD role', async () => {
    const { app } = await createApp(makeOpd());
    const res = await request(app.getHttpServer())
      .get('/api/v1/internal/layanan-kepegawaian/sop-configs');
    expect(res.status).toBe(403);
    await app.close();
  });

  it('403 when unauthenticated', async () => {
    const { app } = await createApp(null);
    const res = await request(app.getHttpServer())
      .get('/api/v1/internal/layanan-kepegawaian/sop-configs');
    expect(res.status).toBe(403);
    await app.close();
  });
});

describe('AdminLayananSopConfigController — PATCH /:sopKey', () => {
  let app: INestApplication;
  let repo: jest.Mocked<LayananSopConfigRepository>;

  beforeAll(async () => ({ app, repo } = await createApp(makeAdmin(['KABID']))));
  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('200 — updates title only', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(repo.partialUpdate).toHaveBeenCalledWith('LAY-001', { title: 'Updated Title' });
  });

  it('200 — updates multiple fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ shortLabel: 'Baru', description: 'Deskripsi baru', sortOrder: 2, isActive: false });

    expect(res.status).toBe(200);
    expect(repo.partialUpdate).toHaveBeenCalledWith(
      'LAY-001',
      expect.objectContaining({ shortLabel: 'Baru', sortOrder: 2, isActive: false }),
    );
  });

  it('200 — updates rhkCodes array', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ rhkCodes: ['RHK 5', 'RHK 9'] });

    expect(res.status).toBe(200);
    expect(repo.partialUpdate).toHaveBeenCalledWith('LAY-001', { rhkCodes: ['RHK 5', 'RHK 9'] });
  });

  it('404 when sopKey not found', async () => {
    repo.findBySopKey.mockResolvedValueOnce(null);
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-999')
      .send({ title: 'X' });

    expect(res.status).toBe(404);
    expect(repo.partialUpdate).not.toHaveBeenCalled();
  });

  it('400 — rejects sortOrder below 0', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ sortOrder: -1 });

    expect(res.status).toBe(400);
    expect(repo.partialUpdate).not.toHaveBeenCalled();
  });

  it('400 — rejects title over 255 chars', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ title: 'x'.repeat(256) });

    expect(res.status).toBe(400);
  });

  it('whitelist strips unknown fields', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({ title: 'OK', hackerField: 'injected' });

    const callArgs = (repo.partialUpdate as jest.Mock).mock.calls[0]?.[1];
    expect(callArgs).not.toHaveProperty('hackerField');
  });

  it('200 — empty body (no-op patch) still succeeds', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/internal/layanan-kepegawaian/sop-configs/LAY-001')
      .send({});

    expect(res.status).toBe(200);
  });
});
