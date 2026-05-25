import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import type { CreateAbkDto, UpdateAbkDto } from './dto/abk.dto';
import type { CreateBezettingDto, UpdateBezettingDto } from './dto/bezetting.dto';
import type { CreateFormasiDto, ReviewFormasiDto, UpdateFormasiDto } from './dto/formasi.dto';
import type {
  BulkImportJabatanFungsionalRefDto,
  CreateJabatanFungsionalRefDto,
  UpdateJabatanFungsionalRefDto,
} from './dto/jabatan-fungsional-ref.dto';
import type { BulkImportJabatanDto, CreateJabatanDto, UpdateJabatanDto } from './dto/jabatan.dto';
import type {
  AbkQueryDto,
  BezettingQueryDto,
  FormasiQueryDto,
  JabatanFungsionalRefQueryDto,
  JabatanQueryDto,
} from './dto/query.dto';
import { SiformenRepository } from './siformen.repository';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'];

@Injectable()
export class SiformenService {
  constructor(
    @Inject(SiformenRepository)
    private readonly repo: SiformenRepository,
  ) {}

  // ── Jabatan Fungsional Ref ────────────────────────────────────────────────

  listJabatanFungsionalRef(query: JabatanFungsionalRefQueryDto) {
    return this.repo.findManyJabatanFungsionalRef(query);
  }

  async getJabatanFungsionalRef(id: string) {
    const item = await this.repo.findJabatanFungsionalRefById(id);
    if (!item) throw new NotFoundException('Data jabatan fungsional referensi tidak ditemukan');
    return item;
  }

  async createJabatanFungsionalRef(dto: CreateJabatanFungsionalRefDto, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    return this.repo.createJabatanFungsionalRef({
      namaJabatan: dto.namaJabatan,
      jenjang: dto.jenjang,
      kategori: dto.kategori,
      jenjangAwal: dto.jenjangAwal ?? null,
      jenjangPuncak: dto.jenjangPuncak ?? null,
      golonganRuangAwal: dto.golonganRuangAwal ?? null,
      rumpunJabatan: dto.rumpunJabatan ?? null,
      ruangLingkup: dto.ruangLingkup ?? null,
      kedudukan: dto.kedudukan ?? null,
      pengisianAsn: dto.pengisianAsn ?? null,
      instansiPembina: dto.instansiPembina ?? null,
      dasarHukum: dto.dasarHukum ?? null,
      tugasJabatan: dto.tugasJabatan ?? null,
      pendidikanPengangkatan: dto.pendidikanPengangkatan ?? null,
      pendidikanPerpindahan: dto.pendidikanPerpindahan ?? null,
      perpresTunjangan: dto.perpresTunjangan ?? null,
      besaranTunjangan: dto.besaranTunjangan ?? null,
    });
  }

  async bulkImportJabatanFungsionalRef(dto: BulkImportJabatanFungsionalRefDto, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    const items = dto.items.map((d) => ({
      namaJabatan: d.namaJabatan,
      jenjang: d.jenjang,
      kategori: d.kategori,
      jenjangAwal: d.jenjangAwal ?? null,
      jenjangPuncak: d.jenjangPuncak ?? null,
      golonganRuangAwal: d.golonganRuangAwal ?? null,
      rumpunJabatan: d.rumpunJabatan ?? null,
      ruangLingkup: d.ruangLingkup ?? null,
      kedudukan: d.kedudukan ?? null,
      pengisianAsn: d.pengisianAsn ?? null,
      instansiPembina: d.instansiPembina ?? null,
      dasarHukum: d.dasarHukum ?? null,
      tugasJabatan: d.tugasJabatan ?? null,
      pendidikanPengangkatan: d.pendidikanPengangkatan ?? null,
      pendidikanPerpindahan: d.pendidikanPerpindahan ?? null,
      perpresTunjangan: d.perpresTunjangan ?? null,
      besaranTunjangan: d.besaranTunjangan ?? null,
    }));
    return this.repo.bulkUpsertJabatanFungsionalRef(items);
  }

  async updateJabatanFungsionalRef(
    id: string,
    dto: UpdateJabatanFungsionalRefDto,
    user: AuthUser,
  ) {
    requireRole(user, ADMIN_ROLES);
    await this.getJabatanFungsionalRef(id);
    return this.repo.updateJabatanFungsionalRef(id, {
      namaJabatan: dto.namaJabatan,
      jenjang: dto.jenjang,
      kategori: dto.kategori,
      jenjangAwal: dto.jenjangAwal,
      jenjangPuncak: dto.jenjangPuncak,
      golonganRuangAwal: dto.golonganRuangAwal,
      rumpunJabatan: dto.rumpunJabatan,
      ruangLingkup: dto.ruangLingkup,
      kedudukan: dto.kedudukan,
      pengisianAsn: dto.pengisianAsn,
      instansiPembina: dto.instansiPembina,
      dasarHukum: dto.dasarHukum,
      tugasJabatan: dto.tugasJabatan,
      pendidikanPengangkatan: dto.pendidikanPengangkatan,
      pendidikanPerpindahan: dto.pendidikanPerpindahan,
      perpresTunjangan: dto.perpresTunjangan,
      besaranTunjangan: dto.besaranTunjangan,
    });
  }

  async deleteJabatanFungsionalRef(id: string, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    await this.getJabatanFungsionalRef(id);
    return this.repo.deleteJabatanFungsionalRef(id);
  }

  getFilterOptions() {
    return Promise.all([
      this.repo.listRumpunJabatan(),
      this.repo.listInstansiPembina(),
    ]).then(([rumpunJabatan, instansiPembina]) => ({ rumpunJabatan, instansiPembina }));
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  getDashboard(tahun: number) {
    return this.repo.getDashboardSummary(tahun);
  }

  // ── Jabatan ──────────────────────────────────────────────────────────────

  listJabatan(query: JabatanQueryDto) {
    return this.repo.findManyJabatan(query);
  }

  async getJabatan(id: string) {
    const jabatan = await this.repo.findJabatanById(id);
    if (!jabatan) throw new NotFoundException('Jabatan tidak ditemukan');
    return jabatan;
  }

  async createJabatan(dto: CreateJabatanDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);

    const existing = await this.repo.findJabatanByKode(dto.kodeJabatan);
    if (existing) throw new ConflictException(`Kode jabatan '${dto.kodeJabatan}' sudah terdaftar`);

    return this.repo.createJabatan({
      kodeJabatan: dto.kodeJabatan,
      namaJabatan: dto.namaJabatan,
      jenisJabatan: dto.jenisJabatan,
      eselonLevel: dto.eselonLevel ?? null,
      kelasJabatan: dto.kelasJabatan ?? null,
      unitKerja: dto.unitKerja,
      satuanKerja: dto.satuanKerja ?? null,
      kualifikasiPendidikan: dto.kualifikasiPendidikan ?? null,
      jabatanFungsionalRef: dto.jabatanFungsionalRefId
        ? { connect: { id: dto.jabatanFungsionalRefId } }
        : undefined,
      createdBy: user.id,
    });
  }

  async updateJabatan(id: string, dto: UpdateJabatanDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);
    await this.getJabatan(id);

    return this.repo.updateJabatan(id, {
      namaJabatan: dto.namaJabatan,
      jenisJabatan: dto.jenisJabatan,
      eselonLevel: dto.eselonLevel,
      kelasJabatan: dto.kelasJabatan,
      unitKerja: dto.unitKerja,
      satuanKerja: dto.satuanKerja,
      kualifikasiPendidikan: dto.kualifikasiPendidikan,
      isActive: dto.isActive,
      jabatanFungsionalRef: dto.jabatanFungsionalRefId !== undefined
        ? dto.jabatanFungsionalRefId
          ? { connect: { id: dto.jabatanFungsionalRefId } }
          : { disconnect: true }
        : undefined,
      updatedBy: user.id,
    });
  }

  async generateJabatanFromUnitKerja(user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    return this.repo.generateJabatanFromUnitKerja(user.id);
  }

  async bulkImportJabatan(dto: BulkImportJabatanDto, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    if (dto.items.length === 0) throw new BadRequestException('Tidak ada data untuk diimport');
    if (dto.items.length > 1000) throw new BadRequestException('Maksimal 1000 jabatan per import');
    return this.repo.bulkImportJabatan(dto.items, user.id);
  }

  async deleteJabatan(id: string, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    await this.getJabatan(id);
    const refCount = await this.repo.countActiveReferencesByJabatan(id);
    if (refCount > 0) {
      throw new UnprocessableEntityException(
        `Jabatan tidak dapat dihapus karena masih direferensi oleh ${refCount} data (bezetting/formasi/ABK)`,
      );
    }
    return this.repo.softDeleteJabatan(id);
  }

  // ── Bezetting ────────────────────────────────────────────────────────────

  listBezetting(query: BezettingQueryDto) {
    return this.repo.findManyBezetting(query);
  }

  async getBezetting(id: string) {
    const item = await this.repo.findBezettingById(id);
    if (!item) throw new NotFoundException('Data bezetting tidak ditemukan');
    return item;
  }

  async createBezetting(dto: CreateBezettingDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);

    return this.repo.createBezetting({
      jabatan: dto.jabatanId ? { connect: { id: dto.jabatanId } } : undefined,
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      tahun: dto.tahun,
      nip: dto.nip ?? null,
      namaAsn: dto.namaAsn ?? null,
      pangkat: dto.pangkat ?? null,
      golongan: dto.golongan ?? null,
      tmtJabatan: dto.tmtJabatan ? new Date(dto.tmtJabatan) : null,
      statusIsi: dto.statusIsi ?? 'VACANT',
      keterangan: dto.keterangan ?? null,
      createdBy: user.id,
    });
  }

  async updateBezetting(id: string, dto: UpdateBezettingDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);
    await this.getBezetting(id);

    return this.repo.updateBezetting(id, {
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      tahun: dto.tahun,
      nip: dto.nip,
      namaAsn: dto.namaAsn,
      pangkat: dto.pangkat,
      golongan: dto.golongan,
      tmtJabatan: dto.tmtJabatan ? new Date(dto.tmtJabatan) : undefined,
      statusIsi: dto.statusIsi,
      keterangan: dto.keterangan,
      updatedBy: user.id,
    });
  }

  async deleteBezetting(id: string, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    await this.getBezetting(id);
    return this.repo.deleteBezetting(id);
  }

  // ── Formasi ──────────────────────────────────────────────────────────────

  listFormasi(query: FormasiQueryDto) {
    return this.repo.findManyFormasi(query);
  }

  async getFormasi(id: string) {
    const item = await this.repo.findFormasiById(id);
    if (!item) throw new NotFoundException('Data formasi tidak ditemukan');
    return item;
  }

  async createFormasi(dto: CreateFormasiDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);

    return this.repo.createFormasi({
      jabatan: dto.jabatanId ? { connect: { id: dto.jabatanId } } : undefined,
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      jenisFormasi: dto.jenisFormasi,
      tahun: dto.tahun,
      periode: dto.periode ?? null,
      jumlahKebutuhan: dto.jumlahKebutuhan,
      jumlahTersedia: dto.jumlahTersedia ?? 0,
      jumlahUsulan: dto.jumlahUsulan ?? dto.jumlahKebutuhan,
      kualifikasiPendidikan: dto.kualifikasiPendidikan ?? null,
      kualifikasiJurusan: dto.kualifikasiJurusan ?? null,
      alasanKebutuhan: dto.alasanKebutuhan ?? null,
      status: 'DRAFT',
      createdBy: user.id,
    });
  }

  async updateFormasi(id: string, dto: UpdateFormasiDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);
    const item = await this.getFormasi(id);

    if (item.status !== 'DRAFT') {
      throw new BadRequestException('Formasi hanya dapat diubah dalam status DRAFT');
    }

    return this.repo.updateFormasi(id, {
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      jenisFormasi: dto.jenisFormasi,
      tahun: dto.tahun,
      periode: dto.periode,
      jumlahKebutuhan: dto.jumlahKebutuhan,
      jumlahTersedia: dto.jumlahTersedia,
      jumlahUsulan: dto.jumlahUsulan,
      kualifikasiPendidikan: dto.kualifikasiPendidikan,
      kualifikasiJurusan: dto.kualifikasiJurusan,
      alasanKebutuhan: dto.alasanKebutuhan,
      updatedBy: user.id,
    });
  }

  async submitFormasi(id: string, user: AuthUser) {
    requireRole(user, WRITE_ROLES);
    await this.getFormasi(id); // 404 jika tidak ada
    const updated = await this.repo.updateFormasiConditional(id, 'DRAFT', {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedBy: user.id,
    });
    if (!updated) {
      throw new ConflictException('Status formasi telah berubah, hanya DRAFT yang dapat disubmit');
    }
    return updated;
  }

  async approveFormasi(id: string, dto: ReviewFormasiDto, user: AuthUser) {
    requireRole(user, APPROVE_ROLES);
    await this.getFormasi(id); // 404 jika tidak ada
    const updated = await this.repo.updateFormasiConditional(id, 'SUBMITTED', {
      status: 'APPROVED',
      catatanVerifikasi: dto.catatanVerifikasi ?? null,
      approvedById: user.id,
      approvedAt: new Date(),
      updatedBy: user.id,
    });
    if (!updated) {
      throw new ConflictException('Status formasi telah berubah, hanya SUBMITTED yang dapat disetujui');
    }
    return updated;
  }

  async rejectFormasi(id: string, dto: ReviewFormasiDto, user: AuthUser) {
    requireRole(user, APPROVE_ROLES);
    await this.getFormasi(id); // 404 jika tidak ada
    const updated = await this.repo.updateFormasiConditional(id, 'SUBMITTED', {
      status: 'REJECTED',
      catatanVerifikasi: dto.catatanVerifikasi ?? null,
      updatedBy: user.id,
    });
    if (!updated) {
      throw new ConflictException('Status formasi telah berubah, hanya SUBMITTED yang dapat ditolak');
    }
    return updated;
  }

  async deleteFormasi(id: string, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    const item = await this.getFormasi(id);
    if (item.status === 'APPROVED') {
      throw new BadRequestException('Formasi yang sudah disetujui tidak dapat dihapus');
    }
    return this.repo.softDeleteFormasi(id);
  }

  // ── ABK ──────────────────────────────────────────────────────────────────

  listAbk(query: AbkQueryDto) {
    return this.repo.findManyAbk(query);
  }

  async getAbk(id: string) {
    const item = await this.repo.findAbkById(id);
    if (!item) throw new NotFoundException('Data ABK tidak ditemukan');
    return item;
  }

  async createAbk(dto: CreateAbkDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);

    const waktuEfektif = dto.waktuEfektif ?? 1250;
    const bebanKerja = dto.volumeKerja * dto.normaWaktu;
    const kebutuhanPegawai = bebanKerja / waktuEfektif;
    const pegawaiAda = dto.pegawaiAda ?? 0;
    const selisih = kebutuhanPegawai - pegawaiAda;

    return this.repo.createAbk({
      jabatan: dto.jabatanId ? { connect: { id: dto.jabatanId } } : undefined,
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      tahun: dto.tahun,
      uraianTugas: dto.uraianTugas ?? null,
      volumeKerja: dto.volumeKerja,
      normaWaktu: dto.normaWaktu,
      bebanKerja,
      waktuEfektif,
      kebutuhanPegawai,
      pegawaiAda,
      selisih,
      keterangan: dto.keterangan ?? null,
      createdBy: user.id,
    });
  }

  async updateAbk(id: string, dto: UpdateAbkDto, user: AuthUser) {
    requireRole(user, WRITE_ROLES);
    const existing = await this.getAbk(id);

    const volumeKerja = dto.volumeKerja ?? existing.volumeKerja;
    const normaWaktu = dto.normaWaktu ?? existing.normaWaktu;
    const waktuEfektif = dto.waktuEfektif ?? existing.waktuEfektif;
    const bebanKerja = volumeKerja * normaWaktu;
    const kebutuhanPegawai = bebanKerja / waktuEfektif;
    const pegawaiAda = dto.pegawaiAda ?? existing.pegawaiAda;
    const selisih = kebutuhanPegawai - pegawaiAda;

    return this.repo.updateAbk(id, {
      namaJabatan: dto.namaJabatan,
      unitKerja: dto.unitKerja,
      tahun: dto.tahun,
      uraianTugas: dto.uraianTugas,
      volumeKerja,
      normaWaktu,
      bebanKerja,
      waktuEfektif,
      kebutuhanPegawai,
      pegawaiAda,
      selisih,
      keterangan: dto.keterangan,
      updatedBy: user.id,
    });
  }

  async deleteAbk(id: string, user: AuthUser) {
    requireRole(user, ADMIN_ROLES);
    await this.getAbk(id);
    return this.repo.deleteAbk(id);
  }

  async getFilledBezettingCount(params: {
    jabatanId?: string;
    namaJabatan: string;
    tahun: number;
  }): Promise<{ count: number }> {
    const count = await this.repo.countFilledBezetting({
      jabatanId: params.jabatanId ?? null,
      namaJabatan: params.namaJabatan,
      tahun: params.tahun,
    });
    return { count };
  }
}

function requireRole(user: AuthUser, allowed: string[]) {
  const hasRole = user.roles.some((r) => allowed.includes(r));
  if (!hasRole) throw new ForbiddenException('Akses tidak diizinkan untuk peran ini');
}
