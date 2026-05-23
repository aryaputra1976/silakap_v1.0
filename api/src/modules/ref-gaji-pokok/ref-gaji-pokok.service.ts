import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RefGajiPokokRepository } from './ref-gaji-pokok.repository';
import { GOLONGAN_ORDER, ImportGajiPokokPayload } from './ref-gaji-pokok.types';

@Injectable()
export class RefGajiPokokService {
  constructor(
    @Inject(RefGajiPokokRepository)
    private readonly repo: RefGajiPokokRepository,
  ) {}

  async listPeriodes() {
    return this.repo.listPeriodes();
  }

  async listAll(golonganKode?: string, berlakuSejak?: string) {
    return this.repo.listAll(golonganKode, berlakuSejak);
  }

  async getMatrix(berlakuSejak?: string) {
    return this.repo.getMatrix(berlakuSejak);
  }

  async lookup(golonganKode: string, masaKerja: number, berlakuSejak?: string) {
    if (!golonganKode) throw new BadRequestException('golonganKode wajib diisi');
    if (isNaN(masaKerja) || masaKerja < 0 || masaKerja > 40) {
      throw new BadRequestException('masaKerja harus antara 0–40');
    }
    const result = await this.repo.lookup(golonganKode, masaKerja, berlakuSejak);
    if (!result) throw new NotFoundException(`Gaji pokok untuk ${golonganKode} masa kerja ${masaKerja} tidak ditemukan`);
    return result;
  }

  async updateById(id: number, gajiPokok: number) {
    if (!id || isNaN(id)) throw new BadRequestException('id tidak valid');
    if (gajiPokok === undefined || isNaN(gajiPokok) || gajiPokok <= 0) {
      throw new BadRequestException('gajiPokok harus berupa angka > 0');
    }
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Data gaji pokok id ${id} tidak ditemukan`);
    return this.repo.updateById(id, gajiPokok);
  }

  async bulkImport(records: ImportGajiPokokPayload[], berlakuSejak: string) {
    if (!berlakuSejak) throw new BadRequestException('berlakuSejak wajib diisi');
    const date = new Date(berlakuSejak);
    if (isNaN(date.getTime())) throw new BadRequestException('berlakuSejak tidak valid, format: YYYY-MM-DD');

    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('Data tidak boleh kosong');
    }
    if (records.length > 1000) {
      throw new BadRequestException('Maksimal 1000 record per request');
    }
    records.forEach((r, i) => {
      try {
        this.validateRecord(r);
      } catch (e) {
        throw new BadRequestException(`Record #${i + 1}: ${(e as Error).message}`);
      }
    });
    return this.repo.bulkCreateForPeriode(records, date);
  }

  async getSummary() {
    return this.repo.getSummary();
  }

  private validateRecord(p: ImportGajiPokokPayload) {
    if (!p.golonganKode) throw new BadRequestException('golonganKode wajib diisi');
    if (!(p.golonganKode in GOLONGAN_ORDER)) {
      throw new BadRequestException(`golonganKode "${p.golonganKode}" tidak valid`);
    }
    if (p.masaKerja === undefined || isNaN(p.masaKerja) || p.masaKerja < 0 || p.masaKerja > 40) {
      throw new BadRequestException('masaKerja harus antara 0–40');
    }
    if (p.gajiPokok === undefined || isNaN(p.gajiPokok) || p.gajiPokok <= 0) {
      throw new BadRequestException('gajiPokok harus berupa angka > 0');
    }
  }
}
