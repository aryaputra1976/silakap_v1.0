import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AsnMonthlyArchiveRepository } from './asn-monthly-archive.repository';
import { ARCHIVE_STATUS } from './asn-monthly-archive.types';

@Injectable()
export class AsnMonthlyArchiveService {
  constructor(
    @Inject(AsnMonthlyArchiveRepository)
    private readonly repo: AsnMonthlyArchiveRepository,
  ) {}

  async createArchive(params: {
    bulan: number;
    tahun: number;
    batchId?: string;
    userId?: string;
  }) {
    const { bulan, tahun } = params;
    if (bulan < 1 || bulan > 12) throw new BadRequestException('Bulan harus antara 1–12');
    if (tahun < 2000 || tahun > 2100) throw new BadRequestException('Tahun tidak valid');

    const existing = await this.repo.findArchiveByMonth(bulan, tahun);
    if (existing?.status === ARCHIVE_STATUS.FINAL) {
      throw new BadRequestException(`Arsip ${existing.label} sudah FINAL dan tidak dapat diperbarui`);
    }

    return this.repo.createOrRegenerateArchive(params);
  }

  async createArchiveFromBatch(params: {
    bulan: number;
    tahun: number;
    batchId: string;
    userId?: string;
  }) {
    const { bulan, tahun } = params;
    if (bulan < 1 || bulan > 12) throw new BadRequestException('Bulan harus antara 1–12');
    if (tahun < 2000 || tahun > 2100) throw new BadRequestException('Tahun tidak valid');
    if (!params.batchId) throw new BadRequestException('batchId wajib diisi');

    const existing = await this.repo.findArchiveByMonth(bulan, tahun);
    if (existing?.status === ARCHIVE_STATUS.FINAL) {
      throw new BadRequestException(`Arsip ${existing.label} sudah FINAL dan tidak dapat diperbarui`);
    }

    return this.repo.createOrRegenerateArchiveFromBatch(params);
  }

  async listEligibleBatches() {
    return this.repo.listEligibleBatches();
  }

  async finalizeArchive(archiveId: string, userId: string) {
    const archive = await this.repo.findArchiveById(archiveId);
    if (!archive) throw new NotFoundException('Arsip tidak ditemukan');
    if (archive.status === ARCHIVE_STATUS.FINAL) {
      throw new BadRequestException(`Arsip ${archive.label} sudah berstatus FINAL`);
    }
    return this.repo.finalizeArchive(archiveId, userId);
  }

  async listArchives() {
    return this.repo.listArchives();
  }

  async getArchiveDetail(archiveId: string) {
    const archive = await this.repo.findArchiveById(archiveId);
    if (!archive) throw new NotFoundException('Arsip tidak ditemukan');
    return archive;
  }

  async getChanges(params: {
    archiveId: string;
    changeType?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const archive = await this.repo.findArchiveById(params.archiveId);
    if (!archive) throw new NotFoundException('Arsip tidak ditemukan');
    return this.repo.getChanges(params);
  }

  async getMendekatiPensiun(bulanKedepan = 6) {
    if (bulanKedepan < 1 || bulanKedepan > 24) {
      throw new BadRequestException('bulanKedepan harus antara 1–24');
    }
    return this.repo.getMendekatiPensiun(bulanKedepan);
  }
}
