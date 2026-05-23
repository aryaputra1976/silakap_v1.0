import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { PemberhentianRepository } from './pemberhentian.repository';
import {
  AddDokumenDto,
  CreatePemberhentianDto,
  JenisPemberhentian,
  JENIS_KATEGORI_MAP,
  JENIS_LABEL_MAP,
  PemberhentianListQuery,
  STATUS_LABEL_MAP,
  STATUS_TRANSITIONS,
  StatusPemberhentian,
  TransisiStatusDto,
  UpdatePemberhentianDto,
} from './pemberhentian.types';

@Injectable()
export class PemberhentianService {
  constructor(
    @Inject(PemberhentianRepository)
    private readonly repo: PemberhentianRepository,
  ) {}

  async getMonitoring(bulanKedepan = 12) {
    const months = Math.max(1, Math.min(bulanKedepan, 36));
    const asn = await this.repo.findAsnMendekatiPensiun(months);
    const countByStatus = await this.repo.countByStatus();

    const statusSummary = Object.fromEntries(
      countByStatus.map((r) => [r.status, r._count.id]),
    ) as Partial<Record<StatusPemberhentian, number>>;

    return {
      periode: months,
      asnMendekatiPensiun: asn.map((a) => ({
        id: a.id,
        nip: a.nip,
        nama: a.nama,
        jabatanNama: a.jabatanNama,
        jenisJabatanNama: a.jenisJabatanNama,
        golonganNama: a.golonganNama,
        tmtPensiun: a.tmtPensiun,
        unitKerja: a.unitKerja,
        prosesAktif: a.pemberhentianProses[0] ?? null,
        hariMenujuPensiun: a.tmtPensiun
          ? Math.ceil((a.tmtPensiun.getTime() - Date.now()) / (1000 * 86400))
          : null,
      })),
      statusSummary,
    };
  }

  async listProses(query: PemberhentianListQuery) {
    const result = await this.repo.findAll(query);
    return {
      items: result.items.map(this.toListItem),
      page: query.page,
      limit: query.limit,
      total: result.total,
    };
  }

  async createProses(dto: CreatePemberhentianDto, user: AuthUser) {
    this.validateJenisPemberhentian(dto.jenisPemberhentian);
    if (dto.tmtPemberhentian) this.validateDate(dto.tmtPemberhentian, 'tmtPemberhentian');

    const proses = await this.repo.create(dto, user.id);
    return this.toDetailItem(proses as any);
  }

  async getProses(id: string) {
    const proses = await this.repo.findById(id);
    if (!proses) throw new NotFoundException('Proses pemberhentian tidak ditemukan');
    return this.toDetailItem(proses);
  }

  async updateProses(id: string, dto: UpdatePemberhentianDto, user: AuthUser) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Proses pemberhentian tidak ditemukan');
    if (['SELESAI', 'DIBATALKAN'].includes(existing.status)) {
      throw new BadRequestException('Proses sudah selesai/dibatalkan, tidak dapat diubah');
    }
    if (dto.tmtPemberhentian) this.validateDate(dto.tmtPemberhentian, 'tmtPemberhentian');
    if (dto.tanggalSk) this.validateDate(dto.tanggalSk, 'tanggalSk');
    if (dto.tanggalUsul) this.validateDate(dto.tanggalUsul, 'tanggalUsul');

    const updated = await this.repo.update(id, dto, user.id);
    return this.toDetailItem(updated as any);
  }

  async transisiStatus(id: string, dto: TransisiStatusDto, user: AuthUser) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Proses pemberhentian tidak ditemukan');

    const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.statusKe)) {
      throw new BadRequestException(
        `Tidak dapat beralih dari ${STATUS_LABEL_MAP[existing.status]} ke ${STATUS_LABEL_MAP[dto.statusKe]}`,
      );
    }

    const updated = await this.repo.transisiStatus(
      id,
      existing.status,
      dto.statusKe,
      dto.catatan,
      user.id,
    );
    return this.toDetailItem(updated as any);
  }

  async deleteProses(id: string, user: AuthUser) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Proses pemberhentian tidak ditemukan');
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Hanya proses berstatus DRAFT yang dapat dihapus');
    }
    return this.repo.softDelete(id, user.id);
  }

  async addDokumen(prosesId: string, dto: AddDokumenDto, user: AuthUser) {
    const existing = await this.repo.findById(prosesId);
    if (!existing) throw new NotFoundException('Proses pemberhentian tidak ditemukan');
    return this.repo.addDokumen(prosesId, dto, user.id);
  }

  async deleteDokumen(prosesId: string, dokId: string, user: AuthUser) {
    const existing = await this.repo.findById(prosesId);
    if (!existing) throw new NotFoundException('Proses pemberhentian tidak ditemukan');
    const dok = await this.repo.findDokumenById(dokId);
    if (!dok || dok.prosesId !== prosesId) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }
    return this.repo.deleteDokumen(dokId);
  }

  private validateJenisPemberhentian(jenis: string) {
    if (!(jenis in JENIS_KATEGORI_MAP)) {
      throw new BadRequestException(`jenisPemberhentian tidak valid: ${jenis}`);
    }
  }

  private validateDate(value: string, field: string) {
    const d = new Date(value);
    if (isNaN(d.getTime())) throw new BadRequestException(`${field} tidak valid`);
  }

  private toListItem(p: any) {
    return {
      id: p.id,
      asnId: p.asnId,
      jenisPemberhentian: p.jenisPemberhentian,
      jenisLabel: JENIS_LABEL_MAP[p.jenisPemberhentian as JenisPemberhentian],
      kategori: JENIS_KATEGORI_MAP[p.jenisPemberhentian as JenisPemberhentian],
      status: p.status,
      statusLabel: STATUS_LABEL_MAP[p.status as StatusPemberhentian],
      tmtPemberhentian: p.tmtPemberhentian,
      nomorSk: p.nomorSk,
      nomorUsul: p.nomorUsul,
      asn: p.asn,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private toDetailItem(p: any) {
    return {
      ...this.toListItem(p),
      tanggalSk: p.tanggalSk,
      tanggalUsul: p.tanggalUsul,
      nomorPengembalian: p.nomorPengembalian,
      alasanPengembalian: p.alasanPengembalian,
      catatan: p.catatan,
      nextTransitions: (STATUS_TRANSITIONS[p.status as StatusPemberhentian] ?? []).map((s) => ({
        status: s,
        label: STATUS_LABEL_MAP[s],
      })),
      statusHistory: p.statusHistory ?? [],
      dokumen: p.dokumen ?? [],
    };
  }
}
