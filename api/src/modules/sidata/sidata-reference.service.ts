import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JabatanRecord, JenisJabatanRecord, SidataReferenceRepository } from './sidata-reference.repository';
import { NormalizedJabatanFilters, SidataJabatanQueryDto } from './sidata-reference.types';

type JenisJabatanResponse = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
};

type JabatanJenisRef = {
  id: string;
  kode: string;
  nama: string;
};

type JabatanResponse = {
  id: string;
  jenisJabatan: JabatanJenisRef;
  kode: string | null;
  nama: string;
  namaNormalized: string | null;
  siasnId: string | null;
  siasnKode: string | null;
  siasnNama: string | null;
  rumpun: string | null;
  jenjang: string | null;
  kelasJabatan: number | null;
  source: string | null;
  isActive: boolean;
};

type PaginatedJabatanResponse = {
  items: JabatanResponse[];
  page: number;
  limit: number;
  total: number;
};

@Injectable()
export class SidataReferenceService {
  constructor(
    @Inject(SidataReferenceRepository)
    private readonly referenceRepository: SidataReferenceRepository,
  ) {}

  async findJenisJabatan(): Promise<JenisJabatanResponse[]> {
    const items = await this.referenceRepository.findJenisJabatan();
    return items.map((item) => this.toJenisJabatanResponse(item));
  }

  async findJabatanList(query: SidataJabatanQueryDto): Promise<PaginatedJabatanResponse> {
    const filters = this.normalizeJabatanFilters(query);
    const result = await this.referenceRepository.findJabatanList(filters);

    return {
      items: result.items.map((item) => this.toJabatanResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findJabatanById(id: string): Promise<JabatanResponse> {
    const jabatan = await this.referenceRepository.findJabatanById(id.trim());

    if (!jabatan) {
      throw new NotFoundException('Data jabatan tidak ditemukan');
    }

    return this.toJabatanResponse(jabatan);
  }

  private normalizeJabatanFilters(query: SidataJabatanQueryDto): NormalizedJabatanFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      jenisJabatanKode: this.normalizeOptionalText(query.jenisJabatanKode),
      rumpun: this.normalizeOptionalText(query.rumpun),
      kelasJabatan: this.normalizeOptionalText(query.kelasJabatan),
      isActive: query.isActive,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 20, 1, 100),
    };
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private toJenisJabatanResponse(item: JenisJabatanRecord): JenisJabatanResponse {
    return {
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi,
      isActive: item.isActive,
    };
  }

  private toJabatanResponse(item: JabatanRecord): JabatanResponse {
    return {
      id: item.id,
      jenisJabatan: {
        id: item.jenisJabatan.id,
        kode: item.jenisJabatan.kode,
        nama: item.jenisJabatan.nama,
      },
      kode: item.kode,
      nama: item.nama,
      namaNormalized: item.namaNormalized,
      siasnId: item.siasnId,
      siasnKode: item.siasnKode,
      siasnNama: item.siasnNama,
      rumpun: item.rumpun,
      jenjang: item.jenjang,
      kelasJabatan: item.kelasJabatan,
      source: item.source,
      isActive: item.isActive,
    };
  }
}
