import { Inject, Injectable } from '@nestjs/common';
import { Prisma, StatusPemberhentian } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddDokumenDto,
  CreatePemberhentianDto,
  PemberhentianListQuery,
  UpdatePemberhentianDto,
} from './pemberhentian.types';

const asnSelect = {
  id: true,
  nip: true,
  nama: true,
  jabatanNama: true,
  jenisJabatanNama: true,
  golonganNama: true,
  pangkatNama: true,
  tmtPensiun: true,
  unitKerja: { select: { id: true, nama: true } },
} satisfies Prisma.AsnSelect;

const prosesSelect = {
  id: true,
  asnId: true,
  jenisPemberhentian: true,
  status: true,
  tmtPemberhentian: true,
  nomorSk: true,
  tanggalSk: true,
  nomorUsul: true,
  tanggalUsul: true,
  nomorPengembalian: true,
  alasanPengembalian: true,
  catatan: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  deletedAt: true,
  asn: { select: asnSelect },
} satisfies Prisma.PemberhentianProsesSelect;

@Injectable()
export class PemberhentianRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: string) {
    return this.prisma.pemberhentianProses.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...prosesSelect,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            statusDari: true,
            statusKe: true,
            catatan: true,
            createdAt: true,
            createdBy: true,
          },
        },
        dokumen: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            jenisDokumen: true,
            namaFile: true,
            storagePath: true,
            fileSize: true,
            mimeType: true,
            keterangan: true,
            createdAt: true,
            createdBy: true,
          },
        },
      },
    });
  }

  async findAll(query: PemberhentianListQuery) {
    const where: Prisma.PemberhentianProsesWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.jenisPemberhentian ? { jenisPemberhentian: query.jenisPemberhentian } : {}),
      ...(query.q
        ? {
            asn: {
              OR: [
                { nama: { contains: query.q } },
                { nip: { contains: query.q } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.pemberhentianProses.findMany({
        where,
        select: prosesSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.pemberhentianProses.count({ where }),
    ]);

    return { items, total };
  }

  async create(dto: CreatePemberhentianDto, userId: string) {
    const tmtPemberhentian = dto.tmtPemberhentian ? new Date(dto.tmtPemberhentian) : undefined;

    return this.prisma.$transaction(async (tx) => {
      const proses = await tx.pemberhentianProses.create({
        data: {
          asnId: dto.asnId,
          jenisPemberhentian: dto.jenisPemberhentian,
          tmtPemberhentian,
          catatan: dto.catatan ?? null,
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
        },
        select: prosesSelect,
      });

      await tx.pemberhentianStatusHistory.create({
        data: {
          prosesId: proses.id,
          statusDari: null,
          statusKe: 'DRAFT',
          catatan: 'Proses dibuat',
          createdBy: userId,
        },
      });

      return proses;
    });
  }

  async update(id: string, dto: UpdatePemberhentianDto, userId: string) {
    const data: Prisma.PemberhentianProsesUpdateInput = { updatedBy: userId };
    if (dto.tmtPemberhentian !== undefined) {
      data.tmtPemberhentian = dto.tmtPemberhentian ? new Date(dto.tmtPemberhentian) : null;
    }
    if (dto.nomorSk !== undefined) data.nomorSk = dto.nomorSk;
    if (dto.tanggalSk !== undefined) {
      data.tanggalSk = dto.tanggalSk ? new Date(dto.tanggalSk) : null;
    }
    if (dto.nomorUsul !== undefined) data.nomorUsul = dto.nomorUsul;
    if (dto.tanggalUsul !== undefined) {
      data.tanggalUsul = dto.tanggalUsul ? new Date(dto.tanggalUsul) : null;
    }
    if (dto.nomorPengembalian !== undefined) data.nomorPengembalian = dto.nomorPengembalian;
    if (dto.alasanPengembalian !== undefined) data.alasanPengembalian = dto.alasanPengembalian;
    if (dto.catatan !== undefined) data.catatan = dto.catatan;

    return this.prisma.pemberhentianProses.update({
      where: { id },
      data,
      select: prosesSelect,
    });
  }

  async transisiStatus(
    id: string,
    statusDari: StatusPemberhentian,
    statusKe: StatusPemberhentian,
    catatan: string | undefined,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.pemberhentianProses.update({
        where: { id },
        data: { status: statusKe, updatedBy: userId },
        select: prosesSelect,
      });

      await tx.pemberhentianStatusHistory.create({
        data: {
          prosesId: id,
          statusDari,
          statusKe,
          catatan: catatan ?? null,
          createdBy: userId,
        },
      });

      return updated;
    });
  }

  async softDelete(id: string, userId: string) {
    return this.prisma.pemberhentianProses.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
      select: { id: true },
    });
  }

  async addDokumen(prosesId: string, dto: AddDokumenDto, userId: string) {
    return this.prisma.pemberhentianDokumen.create({
      data: {
        prosesId,
        jenisDokumen: dto.jenisDokumen,
        namaFile: dto.namaFile,
        storagePath: dto.storagePath,
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        keterangan: dto.keterangan ?? null,
        createdBy: userId,
      },
    });
  }

  async deleteDokumen(id: string) {
    return this.prisma.pemberhentianDokumen.delete({ where: { id } });
  }

  async findDokumenById(id: string) {
    return this.prisma.pemberhentianDokumen.findUnique({ where: { id } });
  }

  // Monitoring: ASN with tmtPensiun within next N months
  async findAsnMendekatiPensiun(bulanKedepan: number) {
    const now = new Date();
    const batas = new Date();
    batas.setMonth(batas.getMonth() + bulanKedepan);

    return this.prisma.asn.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        tmtPensiun: { gte: now, lte: batas },
      },
      select: {
        id: true,
        nip: true,
        nama: true,
        jabatanNama: true,
        jenisJabatanNama: true,
        golonganNama: true,
        tmtPensiun: true,
        unitKerja: { select: { id: true, nama: true } },
        pemberhentianProses: {
          where: { deletedAt: null },
          select: { id: true, status: true, jenisPemberhentian: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { tmtPensiun: 'asc' },
    });
  }

  async countByStatus() {
    return this.prisma.pemberhentianProses.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });
  }
}
