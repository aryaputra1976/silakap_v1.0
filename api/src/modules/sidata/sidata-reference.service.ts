import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { GenericRefRow, JabatanRecord, JenisJabatanRecord, SidataReferenceRepository } from './sidata-reference.repository';
import {
  SidataManualGenericReferenceDto,
  SidataManualJabatanDto,
  SidataManualUnitDto,
  NormalizedGenericReferenceFilters,
  NormalizedJabatanFilters,
  SIDATA_GENERIC_REF_TYPE,
  SidataGenericReferenceQueryDto,
  SidataGenericReferenceType,
  SidataJabatanQueryDto,
} from './sidata-reference.types';

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
  private readonly logger = new Logger(SidataReferenceService.name);

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

  async listGenericReferences(query: SidataGenericReferenceQueryDto): Promise<GenericRefRow[]> {
    const filters = this.normalizeGenericFilters(query);
    return this.referenceRepository.findGenericReferences(filters);
  }

  async findJabatanById(id: string): Promise<JabatanResponse> {
    const jabatan = await this.referenceRepository.findJabatanById(id.trim());

    if (!jabatan) {
      throw new NotFoundException('Data jabatan tidak ditemukan');
    }

    return this.toJabatanResponse(jabatan);
  }

  async createGenericReference(dto: SidataManualGenericReferenceDto, user: AuthUser): Promise<GenericRefRow> {
    this.ensureCanMaintainReference(user);
    const type = this.normalizeReferenceType(dto.type);
    return this.referenceRepository.upsertGenericReference({
      type,
      kode: this.toNullable(dto.kode),
      nama: this.requiredText(dto.nama, 'Nama referensi'),
      isActive: dto.isActive ?? true,
    });
  }

  async updateGenericReference(typeValue: string, id: string, dto: SidataManualGenericReferenceDto, user: AuthUser): Promise<GenericRefRow> {
    this.ensureCanMaintainReference(user);
    const type = this.normalizeReferenceType(typeValue);
    return this.referenceRepository.upsertGenericReference({
      type,
      id: id.trim(),
      kode: this.toNullable(dto.kode),
      nama: this.requiredText(dto.nama, 'Nama referensi'),
      isActive: dto.isActive ?? true,
    });
  }

  async deactivateGenericReference(typeValue: string, id: string, user: AuthUser): Promise<GenericRefRow> {
    this.ensureCanMaintainReference(user);
    return this.referenceRepository.deactivateGenericReference(this.normalizeReferenceType(typeValue), id.trim());
  }

  async createUnit(dto: SidataManualUnitDto, user: AuthUser) {
    this.ensureCanMaintainReference(user);
    return this.referenceRepository.upsertUnit({
      kode: this.requiredText(dto.kode, 'Kode unit'),
      nama: this.requiredText(dto.nama, 'Nama unit'),
      parentId: this.toNullable(dto.parentId),
      level: this.normalizePositiveNumber(dto.level, 1, 0, 20),
      isActive: dto.isActive ?? true,
    });
  }

  async updateUnit(id: string, dto: SidataManualUnitDto, user: AuthUser) {
    this.ensureCanMaintainReference(user);
    return this.referenceRepository.upsertUnit({
      id: id.trim(),
      kode: this.requiredText(dto.kode, 'Kode unit'),
      nama: this.requiredText(dto.nama, 'Nama unit'),
      parentId: this.toNullable(dto.parentId),
      level: this.normalizePositiveNumber(dto.level, 1, 0, 20),
      isActive: dto.isActive ?? true,
    });
  }

  async deactivateUnit(id: string, user: AuthUser) {
    this.ensureCanMaintainReference(user);
    return this.referenceRepository.deactivateUnit(id.trim());
  }

  async createJabatan(dto: SidataManualJabatanDto, user: AuthUser): Promise<JabatanResponse> {
    this.ensureCanMaintainReference(user);
    return this.toJabatanResponse(await this.referenceRepository.upsertJabatan(this.toJabatanUpsert(dto)));
  }

  async updateJabatan(id: string, dto: SidataManualJabatanDto, user: AuthUser): Promise<JabatanResponse> {
    this.ensureCanMaintainReference(user);
    return this.toJabatanResponse(await this.referenceRepository.upsertJabatan({ id: id.trim(), ...this.toJabatanUpsert(dto) }));
  }

  async deactivateJabatan(id: string, user: AuthUser): Promise<JabatanResponse> {
    this.ensureCanMaintainReference(user);
    return this.toJabatanResponse(await this.referenceRepository.deactivateJabatan(id.trim()));
  }

  private ensureCanMaintainReference(user: AuthUser) {
    if (!user.roles.some((role) => ['SUPER_ADMIN', 'ADMIN_BKPSDM'].includes(role))) {
      throw new ForbiddenException('Anda tidak berwenang mengelola referensi SIDATA');
    }
  }

  private normalizeReferenceType(value: string): SidataGenericReferenceType {
    const type = value?.trim().toUpperCase() as SidataGenericReferenceType;
    if (!Object.values(SIDATA_GENERIC_REF_TYPE).includes(type)) {
      throw new BadRequestException(`Jenis referensi tidak valid: ${value}`);
    }
    return type;
  }

  private toJabatanUpsert(dto: SidataManualJabatanDto) {
    const nama = this.requiredText(dto.nama, 'Nama jabatan');
    return {
      jenisJabatanId: this.requiredText(dto.jenisJabatanId, 'Jenis jabatan'),
      kode: this.toNullable(dto.kode),
      nama,
      namaNormalized: nama.toLowerCase().replace(/\s+/g, ' '),
      rumpun: this.toNullable(dto.rumpun),
      jenjang: this.toNullable(dto.jenjang),
      kelasJabatan: dto.kelasJabatan ? Number(dto.kelasJabatan) : null,
      isActive: dto.isActive ?? true,
    };
  }

  private requiredText(value: string | undefined, label: string) {
    const normalized = value?.trim();
    if (!normalized) throw new BadRequestException(`${label} wajib diisi`);
    return normalized;
  }

  private toNullable(value: string | undefined) {
    const normalized = value?.trim();
    return normalized || null;
  }

  private normalizeGenericFilters(query: SidataGenericReferenceQueryDto): NormalizedGenericReferenceFilters {
    const type = query.type as SidataGenericReferenceType;
    if (!Object.values(SIDATA_GENERIC_REF_TYPE).includes(type)) {
      throw new BadRequestException(`Jenis referensi tidak valid: ${query.type}`);
    }
    return {
      type,
      q: this.normalizeOptionalText(query.q),
      isActive: query.isActive,
    };
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
