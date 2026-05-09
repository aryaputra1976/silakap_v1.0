import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AsnRecord,
  SidataRepository,
  UnitKerjaRecord,
} from './sidata.repository';
import {
  NormalizedAsnFilters,
  SidataAsnQuery,
  UnitTreeNode,
} from './sidata.types';

@Injectable()
export class SidataService {
  constructor(
    @Inject(SidataRepository)
    private readonly sidataRepository: SidataRepository,
  ) {}

  async findUnits() {
    const units = await this.sidataRepository.findUnits();
    return units.map((unit) => this.toUnitResponse(unit));
  }

  async findUnitTree() {
    const tree = await this.sidataRepository.findUnitTree();
    return tree.map((unit) => this.toUnitTreeResponse(unit));
  }

  async findAsnList(query: SidataAsnQuery) {
    const filters = this.normalizeAsnFilters(query);
    const result = await this.sidataRepository.findAsnList(filters);

    return {
      items: result.items.map((asn) => this.toAsnResponse(asn)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findAsnById(id: string) {
    const asn = await this.sidataRepository.findAsnById(id.trim());

    if (!asn) {
      throw new NotFoundException('Data ASN tidak ditemukan');
    }

    return this.toAsnResponse(asn);
  }

  private normalizeAsnFilters(query: SidataAsnQuery): NormalizedAsnFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      statusAsn: this.normalizeOptionalText(query.statusAsn),
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private toUnitResponse(unit: UnitKerjaRecord) {
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

  private toAsnResponse(asn: AsnRecord) {
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
      tanggalLahir: asn.tanggalLahir,
      tmtPensiun: asn.tmtPensiun,
    };
  }
}
