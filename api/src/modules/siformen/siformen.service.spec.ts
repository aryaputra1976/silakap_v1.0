import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { FormasiJenis } from './dto/formasi.dto';
import { SiformenService } from './siformen.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(roles: string[], id = 'user-1'): AuthUser {
  return { id, username: 'test', name: 'Test', email: null, roles, unitKerjaId: null, unitKerja: null };
}

function makeFormasi(status: string, id = 'formasi-1') {
  return { id, status, namaJabatan: 'Analis', unitKerja: 'BKPSDM', jabatan: null };
}

function makeJabatan(id = 'jabatan-1') {
  return { id, kodeJabatan: 'K001', namaJabatan: 'Analis', isActive: true, deletedAt: null, jabatanFungsionalRef: null };
}

// ── Mock Repository ───────────────────────────────────────────────────────────

const mockRepo = {
  findManyJabatanFungsionalRef: jest.fn(),
  findJabatanFungsionalRefById: jest.fn(),
  createJabatanFungsionalRef: jest.fn(),
  bulkUpsertJabatanFungsionalRef: jest.fn(),
  updateJabatanFungsionalRef: jest.fn(),
  deleteJabatanFungsionalRef: jest.fn(),
  listRumpunJabatan: jest.fn(),
  listInstansiPembina: jest.fn(),
  getDashboardSummary: jest.fn(),
  findManyJabatan: jest.fn(),
  findJabatanById: jest.fn(),
  findJabatanByKode: jest.fn(),
  createJabatan: jest.fn(),
  updateJabatan: jest.fn(),
  softDeleteJabatan: jest.fn(),
  countActiveReferencesByJabatan: jest.fn(),
  findManyBezetting: jest.fn(),
  findBezettingById: jest.fn(),
  createBezetting: jest.fn(),
  updateBezetting: jest.fn(),
  deleteBezetting: jest.fn(),
  findManyFormasi: jest.fn(),
  findFormasiById: jest.fn(),
  createFormasi: jest.fn(),
  updateFormasi: jest.fn(),
  updateFormasiConditional: jest.fn(),
  softDeleteFormasi: jest.fn(),
  findManyAbk: jest.fn(),
  findAbkById: jest.fn(),
  createAbk: jest.fn(),
  updateAbk: jest.fn(),
  deleteAbk: jest.fn(),
  countFilledBezetting: jest.fn(),
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('SiformenService', () => {
  let service: SiformenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SiformenService(mockRepo as any);
  });

  // ── RBAC ─────────────────────────────────────────────────────────────────

  describe('RBAC enforcement', () => {
    it('rejects createFormasi for read-only role', async () => {
      const user = makeUser(['ANALIS_PERTAMA']); // READ_ROLES only
      await expect(
        service.createFormasi(
          { namaJabatan: 'X', unitKerja: 'Y', jenisFormasi: FormasiJenis.CPNS, tahun: 2025, jumlahKebutuhan: 1 },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects approveFormasi for write-only role (not APPROVE_ROLES)', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      const user = makeUser(['ANALIS_MADYA']); // WRITE but not APPROVE
      await expect(service.approveFormasi('formasi-1', {}, user)).rejects.toThrow(ForbiddenException);
    });

    it('rejects deleteJabatan for non-admin role', async () => {
      const user = makeUser(['KABID']); // WRITE_ROLES but not ADMIN_ROLES
      await expect(service.deleteJabatan('jabatan-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('allows createFormasi for ANALIS_MADYA', async () => {
      mockRepo.createFormasi.mockResolvedValue(makeFormasi('DRAFT'));
      const user = makeUser(['ANALIS_MADYA']);
      await expect(
        service.createFormasi(
          { namaJabatan: 'X', unitKerja: 'Y', jenisFormasi: FormasiJenis.PPPK, tahun: 2025, jumlahKebutuhan: 2 },
          user,
        ),
      ).resolves.toBeDefined();
    });

    it('allows approveFormasi for KEPALA_BADAN', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(makeFormasi('APPROVED'));
      const user = makeUser(['KEPALA_BADAN']);
      await expect(service.approveFormasi('formasi-1', {}, user)).resolves.toBeDefined();
    });
  });

  // ── Formasi Workflow ──────────────────────────────────────────────────────

  describe('submitFormasi', () => {
    it('throws NotFoundException when formasi not found', async () => {
      mockRepo.findFormasiById.mockResolvedValue(null);
      await expect(service.submitFormasi('missing', makeUser(['ADMIN_BKPSDM']))).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when status already changed', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(null); // status no longer DRAFT
      await expect(service.submitFormasi('formasi-1', makeUser(['ADMIN_BKPSDM']))).rejects.toThrow(ConflictException);
    });

    it('returns updated formasi on success', async () => {
      const submitted = makeFormasi('SUBMITTED');
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('DRAFT'));
      mockRepo.updateFormasiConditional.mockResolvedValue(submitted);
      const result = await service.submitFormasi('formasi-1', makeUser(['ADMIN_BKPSDM']));
      expect(result).toBe(submitted);
      expect(mockRepo.updateFormasiConditional).toHaveBeenCalledWith(
        'formasi-1',
        'DRAFT',
        expect.objectContaining({ status: 'SUBMITTED' }),
      );
    });
  });

  describe('approveFormasi', () => {
    it('throws ConflictException when status no longer SUBMITTED', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(null);
      await expect(service.approveFormasi('formasi-1', {}, makeUser(['KEPALA_BADAN']))).rejects.toThrow(ConflictException);
    });

    it('sets approvedById and approvedAt', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(makeFormasi('APPROVED'));
      await service.approveFormasi('formasi-1', { catatanVerifikasi: 'OK' }, makeUser(['KEPALA_BADAN'], 'approver-1'));
      expect(mockRepo.updateFormasiConditional).toHaveBeenCalledWith(
        'formasi-1',
        'SUBMITTED',
        expect.objectContaining({ status: 'APPROVED', approvedById: 'approver-1' }),
      );
    });
  });

  describe('rejectFormasi', () => {
    it('throws ConflictException when status no longer SUBMITTED', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('APPROVED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(null);
      await expect(service.rejectFormasi('formasi-1', {}, makeUser(['KEPALA_BADAN']))).rejects.toThrow(ConflictException);
    });

    it('sets status REJECTED with catatan', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      mockRepo.updateFormasiConditional.mockResolvedValue(makeFormasi('REJECTED'));
      await service.rejectFormasi('formasi-1', { catatanVerifikasi: 'Kurang data' }, makeUser(['KEPALA_BADAN']));
      expect(mockRepo.updateFormasiConditional).toHaveBeenCalledWith(
        'formasi-1',
        'SUBMITTED',
        expect.objectContaining({ status: 'REJECTED', catatanVerifikasi: 'Kurang data' }),
      );
    });
  });

  describe('updateFormasi', () => {
    it('throws BadRequestException when status is not DRAFT', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('SUBMITTED'));
      await expect(
        service.updateFormasi('formasi-1', { namaJabatan: 'X' }, makeUser(['ADMIN_BKPSDM'])),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows update when status is DRAFT', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('DRAFT'));
      mockRepo.updateFormasi.mockResolvedValue(makeFormasi('DRAFT'));
      await expect(
        service.updateFormasi('formasi-1', { namaJabatan: 'Y' }, makeUser(['ADMIN_BKPSDM'])),
      ).resolves.toBeDefined();
    });
  });

  describe('deleteFormasi', () => {
    it('throws BadRequestException when formasi is APPROVED', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('APPROVED'));
      await expect(service.deleteFormasi('formasi-1', makeUser(['ADMIN_BKPSDM']))).rejects.toThrow(BadRequestException);
    });

    it('soft deletes DRAFT formasi', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('DRAFT'));
      mockRepo.softDeleteFormasi.mockResolvedValue({});
      await service.deleteFormasi('formasi-1', makeUser(['ADMIN_BKPSDM']));
      expect(mockRepo.softDeleteFormasi).toHaveBeenCalledWith('formasi-1');
    });

    it('soft deletes REJECTED formasi', async () => {
      mockRepo.findFormasiById.mockResolvedValue(makeFormasi('REJECTED'));
      mockRepo.softDeleteFormasi.mockResolvedValue({});
      await service.deleteFormasi('formasi-1', makeUser(['ADMIN_BKPSDM']));
      expect(mockRepo.softDeleteFormasi).toHaveBeenCalledWith('formasi-1');
    });
  });

  // ── Jabatan Cascade Check ─────────────────────────────────────────────────

  describe('deleteJabatan', () => {
    it('throws NotFoundException when jabatan not found', async () => {
      mockRepo.findJabatanById.mockResolvedValue(null);
      await expect(service.deleteJabatan('jabatan-1', makeUser(['ADMIN_BKPSDM']))).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException when jabatan has active references', async () => {
      mockRepo.findJabatanById.mockResolvedValue(makeJabatan());
      mockRepo.countActiveReferencesByJabatan.mockResolvedValue(3);
      await expect(service.deleteJabatan('jabatan-1', makeUser(['ADMIN_BKPSDM']))).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('soft deletes jabatan with zero references', async () => {
      mockRepo.findJabatanById.mockResolvedValue(makeJabatan());
      mockRepo.countActiveReferencesByJabatan.mockResolvedValue(0);
      mockRepo.softDeleteJabatan.mockResolvedValue({});
      await service.deleteJabatan('jabatan-1', makeUser(['ADMIN_BKPSDM']));
      expect(mockRepo.softDeleteJabatan).toHaveBeenCalledWith('jabatan-1');
    });
  });

  // ── Jabatan Duplicate Check ───────────────────────────────────────────────

  describe('createJabatan', () => {
    it('throws ConflictException when kodeJabatan already exists', async () => {
      mockRepo.findJabatanByKode.mockResolvedValue(makeJabatan());
      await expect(
        service.createJabatan(
          { kodeJabatan: 'K001', namaJabatan: 'Analis', jenisJabatan: 'FUNGSIONAL', unitKerja: 'BKPSDM' },
          makeUser(['ADMIN_BKPSDM']),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('creates jabatan when kode is unique', async () => {
      mockRepo.findJabatanByKode.mockResolvedValue(null);
      mockRepo.createJabatan.mockResolvedValue(makeJabatan());
      await expect(
        service.createJabatan(
          { kodeJabatan: 'K002', namaJabatan: 'Analis Baru', jenisJabatan: 'FUNGSIONAL', unitKerja: 'BKPSDM' },
          makeUser(['ADMIN_BKPSDM']),
        ),
      ).resolves.toBeDefined();
    });
  });

  // ── ABK Auto-kalkulasi ────────────────────────────────────────────────────

  describe('createAbk', () => {
    it('auto-calculates bebanKerja, kebutuhanPegawai, dan selisih', async () => {
      mockRepo.createAbk.mockImplementation((data: any) => Promise.resolve(data));
      const user = makeUser(['ADMIN_BKPSDM']);
      const result: any = await service.createAbk(
        { namaJabatan: 'X', unitKerja: 'Y', tahun: 2025, volumeKerja: 500, normaWaktu: 2, pegawaiAda: 1 },
        user,
      );
      expect(result.bebanKerja).toBe(1000);       // 500 * 2
      expect(result.kebutuhanPegawai).toBeCloseTo(0.8); // 1000 / 1250
      expect(result.selisih).toBeCloseTo(-0.2);   // 0.8 - 1
    });

    it('uses custom waktuEfektif when provided', async () => {
      mockRepo.createAbk.mockImplementation((data: any) => Promise.resolve(data));
      const user = makeUser(['ADMIN_BKPSDM']);
      const result: any = await service.createAbk(
        { namaJabatan: 'X', unitKerja: 'Y', tahun: 2025, volumeKerja: 1000, normaWaktu: 1, waktuEfektif: 500 },
        user,
      );
      expect(result.kebutuhanPegawai).toBe(2); // 1000 / 500
    });
  });

  describe('updateAbk', () => {
    it('recalculates derived fields from existing values when partial update', async () => {
      const existing = {
        volumeKerja: 400,
        normaWaktu: 2,
        waktuEfektif: 1000,
        pegawaiAda: 0,
        jabatan: null,
      };
      mockRepo.findAbkById.mockResolvedValue(existing);
      mockRepo.updateAbk.mockImplementation((_id: string, data: any) => Promise.resolve(data));
      const result: any = await service.updateAbk(
        'abk-1',
        { volumeKerja: 800 }, // only change volume
        makeUser(['ADMIN_BKPSDM']),
      );
      expect(result.bebanKerja).toBe(1600);        // 800 * 2
      expect(result.kebutuhanPegawai).toBeCloseTo(1.6); // 1600 / 1000
    });
  });

  // ── Bezetting ─────────────────────────────────────────────────────────────

  describe('getBezetting', () => {
    it('throws NotFoundException when not found', async () => {
      mockRepo.findBezettingById.mockResolvedValue(null);
      await expect(service.getBezetting('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBezetting', () => {
    it('soft deletes (repo.deleteBezetting is called)', async () => {
      mockRepo.findBezettingById.mockResolvedValue({ id: 'b1' });
      mockRepo.deleteBezetting.mockResolvedValue({});
      await service.deleteBezetting('b1', makeUser(['ADMIN_BKPSDM']));
      expect(mockRepo.deleteBezetting).toHaveBeenCalledWith('b1');
    });
  });
});
