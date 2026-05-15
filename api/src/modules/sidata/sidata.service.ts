import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import {
  AsnAssignmentHistoryRecord,
  AsnDocumentRecord,
  AsnGolonganHistoryRecord,
  AsnRecord,
  SidataRepository,
  UnitKerjaRecord,
} from './sidata.repository';
import {
  NormalizedAsnFilters,
  SIDATA_ADMIN_ROLES,
  SIDATA_ALL_ACCESS_ROLES,
  SidataAsnDocumentUploadDto,
  SidataAccessScope,
  SidataAsnQueryDto,
  SidataUpdateAsnDto,
  UnitTreeNode,
} from './sidata.types';
import {
  buildCsvFileName,
  createCsvStream,
  CsvExportResult,
  formatCsvDate,
  formatCsvDateTime,
} from './sidata-csv.util';

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

type AsnHistoryBatch = {
  id: string;
  fileName: string | null;
  importType: string;
  createdAt: string;
};

type AsnAssignmentHistoryResponse = {
  id: string;
  type: 'ASSIGNMENT';
  unitKerjaId: string | null;
  unitKerja: AsnUnitKerja | null;
  siasnUnorId: string | null;
  unorNama: string | null;
  jabatanRefId: string | null;
  siasnJabatanId: string | null;
  jabatanNama: string | null;
  jenisJabatanNama: string | null;
  tmtJabatan: string | null;
  effectiveDate: string | null;
  syncedAt: string;
  createdAt: string;
  sourceBatch: AsnHistoryBatch | null;
};

type AsnGolonganHistoryResponse = {
  id: string;
  type: 'GOLONGAN';
  golonganRefId: string | null;
  siasnGolonganId: string | null;
  golonganNama: string | null;
  pangkatNama: string | null;
  ruangNama: string | null;
  tmtGolongan: string | null;
  effectiveDate: string | null;
  syncedAt: string;
  createdAt: string;
  sourceBatch: AsnHistoryBatch | null;
};

type AsnHistoryResponse = {
  assignment: AsnAssignmentHistoryResponse[];
  golongan: AsnGolonganHistoryResponse[];
};

type UploadedSidataDocumentFile = {
  originalname: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
};

type AsnDocumentResponse = {
  id: string;
  asnId: string | null;
  documentType: string;
  fileName: string;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  version: number;
  uploadedBy: string | null;
  uploadedAt: string;
};

type AsnDocumentDownload = {
  stream: Readable;
  mimeType: string;
  fileName: string;
};

@Injectable()
export class SidataService {
  private readonly logger = new Logger(SidataService.name);
  private static readonly CSV_PAGE_SIZE = 1000;

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

    this.assertAsnAccessible(asn, user);

    return this.toAsnResponse(asn);
  }

  async updateAsn(
    id: string,
    dto: SidataUpdateAsnDto,
    user: AuthUser,
  ): Promise<AsnResponse> {
    this.ensureCanMaintainAsn(user);
    const asn = await this.sidataRepository.findAsnById(id.trim());
    this.assertAsnAccessible(asn, user);

    const data: Prisma.AsnUncheckedUpdateInput = {
      updatedBy: user.id,
    };

    this.assignOptionalString(data, 'nipLama', dto.nipLama);
    this.assignOptionalString(data, 'nik', dto.nik);
    this.assignOptionalString(data, 'nama', dto.nama);
    if (dto.nama !== undefined) {
      data.namaSearch = this.normalizeSearchText(dto.nama);
    }
    this.assignOptionalString(data, 'jenisAsnNama', dto.jenisAsn);
    this.assignOptionalString(data, 'statusAsn', dto.statusAsn);
    this.assignOptionalString(data, 'unitKerjaId', dto.unitKerjaId);
    this.assignOptionalString(data, 'jabatanRefId', dto.jabatanRefId);
    this.assignOptionalString(data, 'jabatanNama', dto.jabatanNama);
    this.assignOptionalString(data, 'golonganRefId', dto.golonganRefId);
    this.assignOptionalString(data, 'golonganNama', dto.golonganNama);
    if (dto.tmtJabatan !== undefined) data.tmtJabatan = this.parseOptionalDate(dto.tmtJabatan, 'TMT jabatan');
    if (dto.tmtGolongan !== undefined) data.tmtGolongan = this.parseOptionalDate(dto.tmtGolongan, 'TMT golongan');
    if (dto.tmtPensiun !== undefined) data.tmtPensiun = this.parseOptionalDate(dto.tmtPensiun, 'TMT pensiun');
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.sidataRepository.updateAsn(asn.id, data);
    this.logger.log(`updateAsn id=${asn.id} actor=${user.id}`);

    return this.toAsnResponse(updated);
  }

  async findAsnDocuments(id: string, user: AuthUser): Promise<AsnDocumentResponse[]> {
    const asn = await this.sidataRepository.findAsnById(id.trim());
    this.assertAsnAccessible(asn, user);
    const documents = await this.sidataRepository.findAsnDocuments(asn.id);
    return documents.map((item) => this.toAsnDocumentResponse(item));
  }

  async uploadAsnDocument(params: {
    asnId: string;
    dto: SidataAsnDocumentUploadDto;
    file: UploadedSidataDocumentFile | undefined;
    user: AuthUser;
  }): Promise<AsnDocumentResponse> {
    this.ensureCanMaintainAsn(params.user);
    if (!params.file) throw new BadRequestException('File dokumen wajib diunggah');
    if (!params.dto.documentType?.trim()) throw new BadRequestException('Jenis dokumen wajib diisi');

    const asn = await this.sidataRepository.findAsnById(params.asnId.trim());
    this.assertAsnAccessible(asn, params.user);

    const checksum = createHash('sha256').update(params.file.buffer).digest('hex');
    const extension = extname(params.file.originalname || '').slice(0, 20);
    const fileName = `${randomUUID()}${extension}`;
    const storageDir = resolve(process.cwd(), 'uploads', 'sidata', 'asn', asn.id);
    await mkdir(storageDir, { recursive: true });
    await writeFile(resolve(storageDir, fileName), params.file.buffer);

    const document = await this.sidataRepository.createAsnDocument({
      id: randomUUID(),
      asnId: asn.id,
      documentType: params.dto.documentType.trim().toUpperCase(),
      fileName,
      originalFileName: params.file.originalname,
      storagePath: ['uploads', 'sidata', 'asn', asn.id, fileName].join('/'),
      mimeType: params.file.mimetype,
      fileSize: params.file.size,
      checksum,
      uploadedBy: params.user.id,
    });

    return this.toAsnDocumentResponse(document);
  }

  async downloadAsnDocument(
    asnId: string,
    documentId: string,
    user: AuthUser,
  ): Promise<AsnDocumentDownload> {
    const asn = await this.sidataRepository.findAsnById(asnId.trim());
    this.assertAsnAccessible(asn, user);
    const document = await this.sidataRepository.findAsnDocumentById(documentId.trim());
    if (!document || document.asnId !== asn.id) throw new NotFoundException('Dokumen ASN tidak ditemukan');

    return {
      stream: createReadStream(resolve(process.cwd(), document.storagePath)),
      mimeType: document.mimeType ?? 'application/octet-stream',
      fileName: basename(document.originalFileName ?? document.fileName),
    };
  }

  async deleteAsnDocument(
    asnId: string,
    documentId: string,
    user: AuthUser,
  ): Promise<AsnDocumentResponse> {
    this.ensureCanMaintainAsn(user);
    const asn = await this.sidataRepository.findAsnById(asnId.trim());
    this.assertAsnAccessible(asn, user);
    const document = await this.sidataRepository.findAsnDocumentById(documentId.trim());
    if (!document || document.asnId !== asn.id) throw new NotFoundException('Dokumen ASN tidak ditemukan');
    return this.toAsnDocumentResponse(await this.sidataRepository.softDeleteAsnDocument(document.id));
  }

  async findAsnHistory(id: string, user: AuthUser): Promise<AsnHistoryResponse> {
    const asn = await this.sidataRepository.findAsnById(id.trim());

    this.assertAsnAccessible(asn, user);

    const [assignment, golongan] = await Promise.all([
      this.sidataRepository.findAsnAssignmentHistory(asn.id),
      this.sidataRepository.findAsnGolonganHistory(asn.id),
    ]);

    return {
      assignment: assignment.map((item) => this.toAssignmentHistoryResponse(item)),
      golongan: golongan.map((item) => this.toGolonganHistoryResponse(item)),
    };
  }

  async exportAsnCsv(
    query: SidataAsnQueryDto,
    user: AuthUser,
  ): Promise<CsvExportResult> {
    const filters = this.normalizeAsnFilters(query, user);

    return {
      stream: createCsvStream(this.generateAsnCsvRows(filters)),
      mimeType: 'text/csv; charset=utf-8',
      fileName: buildCsvFileName('sidata-asn'),
    };
  }

  private async *generateAsnCsvRows(
    filters: NormalizedAsnFilters,
  ): AsyncGenerator<unknown[]> {
    yield [
      'NIP',
      'NIP Lama',
      'NIK',
      'Nama',
      'Jenis ASN',
      'Status ASN',
      'Kedudukan Hukum',
      'Kode Unit Kerja',
      'Unit Kerja',
      'Jabatan',
      'Jenis Jabatan',
      'TMT Jabatan',
      'Golongan',
      'TMT Golongan',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Jenis Kelamin',
      'Agama',
      'Status Kawin',
      'Email',
      'Email Gov',
      'Telepon',
      'TMT PNS',
      'TMT Pensiun',
      'Synced At',
    ];

    let cursorId: string | undefined;

    while (true) {
      const page = await this.sidataRepository.findAsnExportPage({
        filters,
        cursorId,
        take: SidataService.CSV_PAGE_SIZE,
      });

      if (page.length === 0) {
        break;
      }

      for (const asn of page) {
        yield [
          asn.nip,
          asn.nipLama,
          asn.nik,
          asn.nama,
          asn.jenisAsnNama,
          asn.statusAsn,
          asn.kedudukanHukumNama,
          asn.unitKerja?.kode,
          asn.unitKerja?.nama,
          asn.jabatanNama,
          asn.jenisJabatanNama,
          formatCsvDate(asn.tmtJabatan),
          asn.golonganNama,
          formatCsvDate(asn.tmtGolongan),
          asn.siasnProfile?.tempatLahirNama,
          formatCsvDate(asn.siasnProfile?.tanggalLahir),
          asn.siasnProfile?.jenisKelaminNama,
          asn.siasnProfile?.agamaNama,
          asn.siasnProfile?.statusKawinNama,
          asn.siasnProfile?.email,
          asn.siasnProfile?.emailGov,
          asn.siasnProfile?.phone,
          formatCsvDate(asn.siasnProfile?.tmtPns),
          formatCsvDate(asn.tmtPensiun ?? asn.siasnProfile?.tmtPensiun),
          formatCsvDateTime(asn.syncedAt),
        ];
      }

      cursorId = page.at(-1)?.id;
    }
  }

  private getAccessScope(user: AuthUser): SidataAccessScope {
    const allAccessRoles: readonly string[] = SIDATA_ALL_ACCESS_ROLES;
    if (user.roles.some((r) => allAccessRoles.includes(r))) {
      return 'ALL';
    }
    return 'UNIT';
  }

  private ensureCanMaintainAsn(user: AuthUser) {
    const roles: readonly string[] = SIDATA_ADMIN_ROLES;
    if (!user.roles.some((role) => roles.includes(role))) {
      throw new ForbiddenException('Anda tidak berwenang mengubah data SIDATA ASN');
    }
  }

  private assignOptionalString(
    data: Prisma.AsnUncheckedUpdateInput,
    field: keyof Prisma.AsnUncheckedUpdateInput,
    value: string | undefined,
  ) {
    if (value === undefined) return;
    const normalized = value.trim();
    data[field] = (normalized || null) as never;
  }

  private parseOptionalDate(value: string, label: string): Date | null {
    const normalized = value.trim();
    if (!normalized) return null;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} tidak valid`);
    }
    return parsed;
  }

  private normalizeSearchText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ') || null;
  }

  private assertAsnAccessible(
    asn: AsnRecord | null,
    user: AuthUser,
  ): asserts asn is AsnRecord {
    if (!asn) {
      throw new NotFoundException('Data ASN tidak ditemukan');
    }

    const scope = this.getAccessScope(user);

    if (scope === 'UNIT' && asn.unitKerjaId !== user.unitKerjaId) {
      throw new NotFoundException('Data ASN tidak ditemukan');
    }
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
      email: asn.siasnProfile?.email ?? null,
      phone: asn.siasnProfile?.phone ?? null,
      unitKerjaId: asn.unitKerjaId,
      unitKerja: asn.unitKerja,
      jabatanNama: asn.jabatanNama,
      golonganNama: asn.golonganNama,
      jenisAsn: asn.jenisAsnNama,
      statusAsn: asn.statusAsn,
      tanggalLahir: asn.siasnProfile?.tanggalLahir?.toISOString() ?? null,
      tmtPensiun: asn.tmtPensiun?.toISOString() ?? null,
    };
  }

  private toAssignmentHistoryResponse(
    item: AsnAssignmentHistoryRecord,
  ): AsnAssignmentHistoryResponse {
    return {
      id: item.id,
      type: 'ASSIGNMENT',
      unitKerjaId: item.unitKerjaId,
      unitKerja: item.unitKerja,
      siasnUnorId: item.siasnUnorId,
      unorNama: item.unorNama,
      jabatanRefId: item.jabatanRefId,
      siasnJabatanId: item.siasnJabatanId,
      jabatanNama: item.jabatanNama,
      jenisJabatanNama: item.jenisJabatanNama,
      tmtJabatan: item.tmtJabatan?.toISOString() ?? null,
      effectiveDate: item.effectiveDate?.toISOString() ?? null,
      syncedAt: item.syncedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      sourceBatch: this.toHistoryBatchResponse(item.sourceBatch),
    };
  }

  private toGolonganHistoryResponse(
    item: AsnGolonganHistoryRecord,
  ): AsnGolonganHistoryResponse {
    return {
      id: item.id,
      type: 'GOLONGAN',
      golonganRefId: item.golonganRefId,
      siasnGolonganId: item.siasnGolonganId,
      golonganNama: item.golonganNama,
      pangkatNama: item.pangkatNama,
      ruangNama: item.ruangNama,
      tmtGolongan: item.tmtGolongan?.toISOString() ?? null,
      effectiveDate: item.effectiveDate?.toISOString() ?? null,
      syncedAt: item.syncedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      sourceBatch: this.toHistoryBatchResponse(item.sourceBatch),
    };
  }

  private toHistoryBatchResponse(
    batch: AsnAssignmentHistoryRecord['sourceBatch'] | null,
  ): AsnHistoryBatch | null {
    if (!batch) return null;
    return {
      id: batch.id,
      fileName: batch.fileName,
      importType: batch.importType,
      createdAt: batch.createdAt.toISOString(),
    };
  }

  private toAsnDocumentResponse(item: AsnDocumentRecord): AsnDocumentResponse {
    return {
      id: item.id,
      asnId: item.asnId,
      documentType: item.documentType,
      fileName: item.fileName,
      originalFileName: item.originalFileName,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      checksum: item.checksum,
      version: item.version,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt.toISOString(),
    };
  }
}
