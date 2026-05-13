import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import {
  AsnRecord,
  SidataRepository,
  UnitKerjaRecord,
} from './sidata.repository';
import {
  NormalizedAsnFilters,
  SIDATA_ALL_ACCESS_ROLES,
  SidataAccessScope,
  SidataAsnQueryDto,
  UnitTreeNode,
} from './sidata.types';

type UnitResponse = {
  id: string;
  kode: string;
  nama: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
};

type AsnUnitKerja = {
  id: string;
  kode: string;
  nama: string;
};

type AsnResponse = {
  id: string;
  nip: string;
  nik: string | null;
  nama: string;
  email: string | null;
  phone: string | null;
  unitKerjaId: string | null;
  unitKerja: AsnUnitKerja | null;
  jabatanNama: string | null;
  golonganNama: string | null;
  jenisAsn: string | null;
  statusAsn: string | null;
  tanggalLahir: string | null;
  tmtPensiun: string | null;
};

type PaginatedAsnResponse = {
  items: AsnResponse[];
  page: number;
  limit: number;
  total: number;
};

@Injectable()
export class SidataService {
  constructor(
    @Inject(SidataRepository)
    private readonly sidataRepository: SidataRepository,
  ) {}

  async findUnits(): Promise<UnitResponse[]> {
    const units = await this.sidataRepository.findUnits();
    return units.map((unit) => this.toUnitResponse(unit));
  }

  async findUnitTree(): Promise<UnitTreeNode[]> {
    const tree = await this.sidataRepository.findUnitTree();
    return tree.map((unit) => this.toUnitTreeResponse(unit));
  }

  async findAsnList(
    query: SidataAsnQueryDto,
    user: AuthUser,
  ): Promise<PaginatedAsnResponse> {
    const filters = this.normalizeAsnFilters(query, user);
    const result = await this.sidataRepository.findAsnList(filters);

    return {
      items: result.items.map((asn) => this.toAsnResponse(asn)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findAsnById(id: string, user: AuthUser): Promise<AsnResponse> {
    const asn = await this.sidataRepository.findAsnById(id.trim());

    if (!asn) {
      throw new NotFoundException('Data ASN tidak ditemukan');
    }

    const scope = this.getAccessScope(user);

    if (scope === 'UNIT' && asn.unitKerjaId !== user.unitKerjaId) {
      throw new NotFoundException('Data ASN tidak ditemukan');
    }

    return this.toAsnResponse(asn);
  }

  private getAccessScope(user: AuthUser): SidataAccessScope {
    const allAccessRoles: readonly string[] = SIDATA_ALL_ACCESS_ROLES;
    if (user.roles.some((r) => allAccessRoles.includes(r))) {
      return 'ALL';
    }
    return 'UNIT';
  }

  private normalizeAsnFilters(
    query: SidataAsnQueryDto,
    user: AuthUser,
  ): NormalizedAsnFilters {
    const scope = this.getAccessScope(user);

    const unitKerjaId =
      scope === 'UNIT'
        ? (user.unitKerjaId ?? undefined)
        : this.normalizeOptionalText(query.unitKerjaId);

    return {
      q: this.normalizeOptionalText(query.q),
      unitKerjaId,
      statusAsn: this.normalizeOptionalText(query.statusAsn),
      jenisAsn: this.normalizeOptionalText(query.jenisAsn),
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

    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private toUnitResponse(unit: UnitKerjaRecord): UnitResponse {
    return {
      id: unit.id,
      kode: unit.kode,
      nama: unit.nama,
      parentId: unit.parentId,
      level: unit.level,
      isActive: unit.isActive,
    };
  }

  private toUnitTreeResponse(unit: UnitTreeNode): UnitTreeNode {
    return {
      id: unit.id,
      kode: unit.kode,
      nama: unit.nama,
      parentId: unit.parentId,
      level: unit.level,
      isActive: unit.isActive,
      children: unit.children.map((child) => this.toUnitTreeResponse(child)),
    };
  }

  private toAsnResponse(asn: AsnRecord): AsnResponse {
    return {
      id: asn.id,
      nip: asn.nip,
      nik: asn.nik,
      nama: asn.nama,
      email: asn.email,
      phone: asn.phone,
      unitKerjaId: asn.unitKerjaId,
      unitKerja: asn.unitKerja,
      jabatanNama: asn.jabatanNama,
      golonganNama: asn.golonganNama,
      jenisAsn: asn.jenisAsn,
      statusAsn: asn.statusAsn,
      tanggalLahir: asn.tanggalLahir?.toISOString() ?? null,
      tmtPensiun: asn.tmtPensiun?.toISOString() ?? null,
    };
  }
}
