import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ASN_CHANGE_TYPE,
  ARCHIVE_STATUS,
  AsnSnapshotData,
  ChangeRow,
  CreateArchiveResult,
  EligibleBatchItem,
  MendekatiPensiunRow,
  PaginatedChanges,
} from './asn-monthly-archive.types';

// ─── Local types ──────────────────────────────────────────────────────────────

type ArchiveCurrentEntry = {
  asnId: string | null;
  nip: string;
  nama: string;
  snapshot: AsnSnapshotData;
  tmtPensiunDate: Date | null;
  masaKerjaTahun: number | null;
  masaKerjaBulan: number | null;
};

type ChangeRecord = {
  archiveId: string;
  asnId: string | null;
  nip: string;
  nama: string;
  changeType: string;
  fieldSebelum: object | null;
  fieldSesudah: object | null;
  detectedAt: Date;
};

const ASN_IMPORT_TYPES = [
  'SIASN_ASN',
  'SIASN_ASN_PNS',
  'SIASN_ASN_PPPK',
  'SIASN_ASN_PPPK_PARUH_WAKTU',
] as const;

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class AsnMonthlyArchiveRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // ─── Archive List ──────────────────────────────────────────────────────────

  async listArchives() {
    return this.prisma.asnMonthlyArchive.findMany({
      orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
      select: {
        id: true, bulan: true, tahun: true, label: true, status: true,
        totalAsn: true, totalPns: true, totalPppk: true,
        countMutasiJabatan: true, countMutasiUnit: true, countNaikPangkat: true,
        countPensiun: true, countAsnBaru: true, countAsnKeluar: true,
        countTugasBelajar: true, countKgb: true, countAlihJabatan: true,
        countStatusBerubah: true, archivedAt: true, finalizedAt: true, createdAt: true,
      },
    });
  }

  async findArchiveById(id: string) {
    return this.prisma.asnMonthlyArchive.findUnique({ where: { id } });
  }

  async findArchiveByMonth(bulan: number, tahun: number) {
    return this.prisma.asnMonthlyArchive.findUnique({ where: { bulan_tahun: { bulan, tahun } } });
  }

  // ─── Snapshot helpers ──────────────────────────────────────────────────────

  private buildSnapshotData(asn: {
    nip: string; nama: string; tipePegawai: string | null;
    jenisAsnNama: string | null; unitKerjaId: string | null;
    jabatanNama: string | null; jenisJabatanNama: string | null;
    golonganNama: string | null; pangkatNama: string | null; eselonNama: string | null;
    kedudukanHukumNama: string | null; statusAsn: string | null;
    tmtPensiun: Date | null; masaKerjaTahun: number | null; masaKerjaBulan: number | null;
    tmtGolongan: Date | null;
    unitKerja?: { nama: string } | null;
  }): AsnSnapshotData {
    return {
      nip: asn.nip,
      nama: asn.nama,
      tipePegawai: asn.tipePegawai,
      jenisAsnNama: asn.jenisAsnNama,
      unitKerjaId: asn.unitKerjaId,
      unitKerjaNama: asn.unitKerja?.nama ?? null,
      jabatanNama: asn.jabatanNama,
      jenisJabatanNama: asn.jenisJabatanNama,
      golonganNama: asn.golonganNama,
      pangkatNama: asn.pangkatNama,
      eselonNama: asn.eselonNama,
      kedudukanHukumNama: asn.kedudukanHukumNama,
      statusAsn: asn.statusAsn,
      tmtPensiun: asn.tmtPensiun?.toISOString() ?? null,
      masaKerjaTahun: asn.masaKerjaTahun,
      masaKerjaBulan: asn.masaKerjaBulan,
      tmtGolongan: asn.tmtGolongan?.toISOString() ?? null,
    };
  }

  private checksum(data: object): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private parseGolonganLevel(nama: string | null): number {
    if (!nama) return 0;
    const map: Record<string, number> = {
      'I/a': 1, 'I/b': 2, 'I/c': 3, 'I/d': 4,
      'II/a': 5, 'II/b': 6, 'II/c': 7, 'II/d': 8,
      'III/a': 9, 'III/b': 10, 'III/c': 11, 'III/d': 12,
      'IV/a': 13, 'IV/b': 14, 'IV/c': 15, 'IV/d': 16, 'IV/e': 17,
    };
    const key = Object.keys(map).find(k => nama.includes(k));
    return key ? map[key] : 0;
  }

  private isTugasBelajar(status: string | null, kedudukan: string | null): boolean {
    const haystack = `${status ?? ''} ${kedudukan ?? ''}`.toLowerCase();
    return haystack.includes('tugas belajar') || haystack.includes('cltn') ||
      haystack.includes('cuti di luar tanggungan');
  }

  private bulanLabel(bulan: number, tahun: number): string {
    const names = ['Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'];
    return `${names[bulan - 1]} ${tahun}`;
  }

  // ─── Private: Load Previous Snapshot Map ──────────────────────────────────

  private async loadPrevSnapshotMap(bulan: number, tahun: number): Promise<Map<string, AsnSnapshotData>> {
    let prevBulan = bulan - 1;
    let prevTahun = tahun;
    if (prevBulan < 1) { prevBulan = 12; prevTahun = tahun - 1; }

    const prevArchive = await this.prisma.asnMonthlyArchive.findUnique({
      where: { bulan_tahun: { bulan: prevBulan, tahun: prevTahun } },
      select: { id: true },
    });

    const map = new Map<string, AsnSnapshotData>();
    if (prevArchive) {
      const rows = await this.prisma.asnMonthlySnapshot.findMany({
        where: { archiveId: prevArchive.id },
        select: { nip: true, snapshotData: true },
      });
      for (const r of rows) {
        map.set(r.nip, r.snapshotData as unknown as AsnSnapshotData);
      }
    }
    return map;
  }

  // ─── Private: Detect Changes ───────────────────────────────────────────────

  private detectChanges(params: {
    archiveId: string;
    bulan: number;
    tahun: number;
    currentEntries: ArchiveCurrentEntry[];
    prevSnapshotMap: Map<string, AsnSnapshotData>;
    now: Date;
  }): ChangeRecord[] {
    const { archiveId, bulan, tahun, currentEntries, prevSnapshotMap, now } = params;
    const changes: ChangeRecord[] = [];
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59);
    let prevBulan = bulan - 1;
    let prevTahun = tahun;
    if (prevBulan < 1) { prevBulan = 12; prevTahun = tahun - 1; }
    const currentNipSet = new Set(currentEntries.map(e => e.nip));

    for (const entry of currentEntries) {
      const curr = entry.snapshot;
      const prev = prevSnapshotMap.get(entry.nip);

      if (!prev) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.ASN_BARU, fieldSebelum: null, fieldSesudah: curr, detectedAt: now,
        });
        continue;
      }

      // Mutasi unit kerja
      if (prev.unitKerjaId !== curr.unitKerjaId) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.MUTASI_UNIT,
          fieldSebelum: { unitKerjaId: prev.unitKerjaId, unitKerjaNama: prev.unitKerjaNama },
          fieldSesudah: { unitKerjaId: curr.unitKerjaId, unitKerjaNama: curr.unitKerjaNama },
          detectedAt: now,
        });
      }

      // Alih jenis jabatan (cek duluan dari mutasi jabatan)
      const jenisChanged = prev.jenisJabatanNama && curr.jenisJabatanNama &&
        prev.jenisJabatanNama.toLowerCase() !== curr.jenisJabatanNama.toLowerCase();
      if (jenisChanged) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.ALIH_JABATAN,
          fieldSebelum: { jenisJabatan: prev.jenisJabatanNama, jabatan: prev.jabatanNama },
          fieldSesudah: { jenisJabatan: curr.jenisJabatanNama, jabatan: curr.jabatanNama },
          detectedAt: now,
        });
      } else if (prev.jabatanNama !== curr.jabatanNama) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.MUTASI_JABATAN,
          fieldSebelum: { jabatan: prev.jabatanNama },
          fieldSesudah: { jabatan: curr.jabatanNama },
          detectedAt: now,
        });
      }

      // Kenaikan pangkat (golongan naik)
      const prevGol = this.parseGolonganLevel(prev.golonganNama);
      const currGol = this.parseGolonganLevel(curr.golonganNama);
      if (currGol > prevGol && currGol > 0) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.NAIK_PANGKAT,
          fieldSebelum: { golongan: prev.golonganNama, pangkat: prev.pangkatNama, tmt: prev.tmtGolongan },
          fieldSesudah: { golongan: curr.golonganNama, pangkat: curr.pangkatNama, tmt: curr.tmtGolongan },
          detectedAt: now,
        });
      }

      // Pensiun bulan ini
      if (entry.tmtPensiunDate && entry.tmtPensiunDate <= endOfMonth) {
        const prevPensiun = prev.tmtPensiun ? new Date(prev.tmtPensiun) : null;
        const wasAlreadyPensiun = prevPensiun && prevPensiun <= new Date(prevTahun, prevBulan, 0);
        if (!wasAlreadyPensiun) {
          changes.push({
            archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
            changeType: ASN_CHANGE_TYPE.PENSIUN,
            fieldSebelum: { jabatan: prev.jabatanNama, golongan: prev.golonganNama },
            fieldSesudah: { tmtPensiun: curr.tmtPensiun },
            detectedAt: now,
          });
        }
      }

      // Tugas belajar / CLTN
      const prevTB = this.isTugasBelajar(prev.statusAsn, prev.kedudukanHukumNama);
      const currTB = this.isTugasBelajar(curr.statusAsn, curr.kedudukanHukumNama);
      if (!prevTB && currTB) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.TUGAS_BELAJAR,
          fieldSebelum: { status: prev.statusAsn },
          fieldSesudah: { status: curr.statusAsn, kedudukan: curr.kedudukanHukumNama },
          detectedAt: now,
        });
      }

      // Perubahan status lainnya
      if (prev.statusAsn !== curr.statusAsn && !jenisChanged) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.STATUS_BERUBAH,
          fieldSebelum: { status: prev.statusAsn },
          fieldSesudah: { status: curr.statusAsn },
          detectedAt: now,
        });
      }

      // KGB: masa kerja kelipatan 24 bulan dan berganti tmtGolongan
      const mkTotal = (entry.masaKerjaTahun ?? 0) * 12 + (entry.masaKerjaBulan ?? 0);
      if (mkTotal > 0 && mkTotal % 24 === 0 && prev.tmtGolongan !== curr.tmtGolongan && currGol <= prevGol) {
        changes.push({
          archiveId, asnId: entry.asnId, nip: entry.nip, nama: entry.nama,
          changeType: ASN_CHANGE_TYPE.KGB,
          fieldSebelum: { golongan: prev.golonganNama, masaKerja: `${Math.floor(mkTotal / 12)} tahun` },
          fieldSesudah: { golongan: curr.golonganNama, tmtGolongan: curr.tmtGolongan },
          detectedAt: now,
        });
      }
    }

    // ASN keluar (ada di bulan lalu tapi tidak ada sekarang)
    for (const [nip, prev] of prevSnapshotMap) {
      if (!currentNipSet.has(nip)) {
        changes.push({
          archiveId, asnId: null, nip, nama: prev.nama,
          changeType: ASN_CHANGE_TYPE.ASN_KELUAR,
          fieldSebelum: { jabatan: prev.jabatanNama, golongan: prev.golonganNama, unit: prev.unitKerjaNama },
          fieldSesudah: null, detectedAt: now,
        });
      }
    }

    return changes;
  }

  // ─── Private: Persist Archive Data ────────────────────────────────────────

  private async persistArchiveData(params: {
    archiveId: string;
    isNew: boolean;
    bulan: number;
    tahun: number;
    label: string;
    batchId: string | null;
    userId: string | null;
    currentEntries: ArchiveCurrentEntry[];
    changes: ChangeRecord[];
    now: Date;
  }): Promise<CreateArchiveResult> {
    const { archiveId, isNew, bulan, tahun, label, batchId, userId, currentEntries, changes, now } = params;

    const countOf = (type: string) => changes.filter(c => c.changeType === type).length;
    const totalAsn = currentEntries.length;
    const totalPns = currentEntries.filter(e => {
      const t = (e.snapshot.tipePegawai ?? e.snapshot.jenisAsnNama ?? '').toUpperCase();
      return t.includes('PNS');
    }).length;
    const totalPppk = currentEntries.filter(e => {
      const t = (e.snapshot.tipePegawai ?? e.snapshot.jenisAsnNama ?? '').toUpperCase();
      return t.includes('PPPK');
    }).length;

    const headerData = {
      bulan, tahun, label, status: ARCHIVE_STATUS.DRAFT,
      batchId: batchId ?? null,
      totalAsn, totalPns, totalPppk,
      countMutasiJabatan: countOf(ASN_CHANGE_TYPE.MUTASI_JABATAN),
      countMutasiUnit: countOf(ASN_CHANGE_TYPE.MUTASI_UNIT),
      countNaikPangkat: countOf(ASN_CHANGE_TYPE.NAIK_PANGKAT),
      countPensiun: countOf(ASN_CHANGE_TYPE.PENSIUN),
      countAsnBaru: countOf(ASN_CHANGE_TYPE.ASN_BARU),
      countAsnKeluar: countOf(ASN_CHANGE_TYPE.ASN_KELUAR),
      countTugasBelajar: countOf(ASN_CHANGE_TYPE.TUGAS_BELAJAR),
      countKgb: countOf(ASN_CHANGE_TYPE.KGB),
      countAlihJabatan: countOf(ASN_CHANGE_TYPE.ALIH_JABATAN),
      countStatusBerubah: countOf(ASN_CHANGE_TYPE.STATUS_BERUBAH),
      archivedById: userId ?? null,
      archivedAt: now,
    };

    await this.prisma.$transaction(async (tx) => {
      if (isNew) {
        await tx.asnMonthlyArchive.create({ data: { id: archiveId, ...headerData, updatedAt: now } });
      } else {
        await tx.asnMonthlyArchive.update({ where: { id: archiveId }, data: headerData });
      }

      await tx.asnMonthlyChange.deleteMany({ where: { archiveId } });
      if (changes.length > 0) {
        await tx.asnMonthlyChange.createMany({
          data: changes.map(c => ({
            id: randomUUID(),
            archiveId: c.archiveId,
            asnId: c.asnId,
            nip: c.nip,
            nama: c.nama,
            changeType: c.changeType,
            fieldSebelum: (c.fieldSebelum ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            fieldSesudah: (c.fieldSesudah ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            detectedAt: c.detectedAt,
          })),
        });
      }

      await tx.asnMonthlySnapshot.deleteMany({ where: { archiveId } });
      // Only entries with a resolved asnId can be stored in the snapshot (FK constraint)
      const snapBatch = currentEntries
        .filter((entry): entry is ArchiveCurrentEntry & { asnId: string } => entry.asnId !== null)
        .map(entry => ({
          id: randomUUID(),
          archiveId,
          asnId: entry.asnId,
          nip: entry.nip,
          nama: entry.nama,
          snapshotData: entry.snapshot as object,
          checksum: this.checksum(entry.snapshot),
        }));
      for (let i = 0; i < snapBatch.length; i += 500) {
        await tx.asnMonthlySnapshot.createMany({ data: snapBatch.slice(i, i + 500) });
      }
    }, { timeout: 60000 });

    return { archiveId, label, totalAsn, totalChanges: changes.length, isNew };
  }

  // ─── Core: Create / Regenerate Archive (dari data ASN live) ───────────────

  async createOrRegenerateArchive(params: {
    bulan: number;
    tahun: number;
    batchId?: string;
    userId?: string;
  }): Promise<CreateArchiveResult> {
    const { bulan, tahun, batchId, userId } = params;
    const label = this.bulanLabel(bulan, tahun);
    const now = new Date();

    const allAsn = await this.prisma.asn.findMany({
      where: { deletedAt: null },
      select: {
        id: true, nip: true, nama: true, tipePegawai: true, jenisAsnNama: true,
        unitKerjaId: true, jabatanNama: true, jenisJabatanNama: true,
        golonganNama: true, pangkatNama: true, eselonNama: true,
        kedudukanHukumNama: true, statusAsn: true, tmtPensiun: true,
        masaKerjaTahun: true, masaKerjaBulan: true, tmtGolongan: true,
        unitKerja: { select: { nama: true } },
      },
    });

    const [prevSnapshotMap, existing] = await Promise.all([
      this.loadPrevSnapshotMap(bulan, tahun),
      this.prisma.asnMonthlyArchive.findUnique({ where: { bulan_tahun: { bulan, tahun } } }),
    ]);

    const isNew = !existing;
    if (existing?.status === ARCHIVE_STATUS.FINAL) {
      return { archiveId: existing.id, label: existing.label, totalAsn: existing.totalAsn, totalChanges: 0, isNew: false };
    }
    const archiveId = existing?.id ?? randomUUID();

    const currentEntries: ArchiveCurrentEntry[] = allAsn.map(asn => ({
      asnId: asn.id,
      nip: asn.nip,
      nama: asn.nama,
      snapshot: this.buildSnapshotData(asn),
      tmtPensiunDate: asn.tmtPensiun,
      masaKerjaTahun: asn.masaKerjaTahun,
      masaKerjaBulan: asn.masaKerjaBulan,
    }));

    const changes = this.detectChanges({ archiveId, bulan, tahun, currentEntries, prevSnapshotMap, now });

    return this.persistArchiveData({
      archiveId, isNew, bulan, tahun, label,
      batchId: batchId ?? null,
      userId: userId ?? null,
      currentEntries, changes, now,
    });
  }

  // ─── Core: Create / Regenerate Archive (dari batch import staging) ─────────

  async createOrRegenerateArchiveFromBatch(params: {
    bulan: number;
    tahun: number;
    batchId: string;
    userId?: string;
  }): Promise<CreateArchiveResult> {
    const { bulan, tahun, batchId, userId } = params;
    const label = this.bulanLabel(bulan, tahun);
    const now = new Date();

    // 1. Validate batch
    const batch = await this.prisma.sidataAsnImportBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true, importType: true },
    });
    if (!batch) throw new BadRequestException('Batch tidak ditemukan');
    if (batch.status !== 'COMMITTED') {
      throw new BadRequestException('Hanya batch berstatus COMMITTED yang dapat digunakan untuk arsip');
    }
    if (!(ASN_IMPORT_TYPES as readonly string[]).includes(batch.importType)) {
      throw new BadRequestException('Batch bukan merupakan import data ASN SIASN');
    }

    // 2. Load staging rows yang sudah dipetakan
    const stagingRows = await this.prisma.sidataAsnImportStaging.findMany({
      where: { batchId, mappingStatus: 'MAPPED' },
      select: {
        nip: true, nama: true, namaJabatan: true, jenisJabatan: true,
        namaGolongan: true, namaPangkat: true, namaRuang: true, eselonNama: true,
        kedudukanHukum: true, statusKepegawaian: true, jenisAsn: true,
        tmtPensiun: true, masaKerjaTahun: true, masaKerjaBulan: true,
        tmtGolongan: true, unorNama: true, mappedData: true, matchedAsnId: true,
      },
    });

    if (stagingRows.length === 0) {
      throw new BadRequestException('Batch tidak memiliki baris staging yang sudah dipetakan (MAPPED)');
    }

    // 3. Resolve unitKerja names dari mappedData.unitKerjaId
    const unitKerjaIds = [...new Set(
      stagingRows
        .map(r => (r.mappedData as Record<string, string> | null)?.unitKerjaId)
        .filter((id): id is string => !!id),
    )];
    const unitKerjaMap = new Map<string, string>();
    if (unitKerjaIds.length > 0) {
      const rows = await this.prisma.unitKerja.findMany({
        where: { id: { in: unitKerjaIds } },
        select: { id: true, nama: true },
      });
      for (const uk of rows) unitKerjaMap.set(uk.id, uk.nama);
    }

    // 4. NIP-based fallback untuk baris tanpa matchedAsnId
    const unmatchedNips = [...new Set(
      stagingRows.filter(r => !r.matchedAsnId && r.nip).map(r => r.nip!),
    )];
    const nipToAsnId = new Map<string, string>();
    if (unmatchedNips.length > 0) {
      const found = await this.prisma.asn.findMany({
        where: { nip: { in: unmatchedNips }, deletedAt: null },
        select: { id: true, nip: true },
      });
      for (const a of found) nipToAsnId.set(a.nip, a.id);
    }

    // 5. Build ArchiveCurrentEntry dari staging rows
    const currentEntries: ArchiveCurrentEntry[] = stagingRows
      .filter(r => r.nip && r.nama)
      .map(r => {
        const md = r.mappedData as Record<string, string> | null;
        const unitKerjaId = md?.unitKerjaId ?? null;
        const unitKerjaNama = unitKerjaId
          ? (unitKerjaMap.get(unitKerjaId) ?? r.unorNama ?? null)
          : (r.unorNama ?? null);
        const asnId = r.matchedAsnId ?? (r.nip ? nipToAsnId.get(r.nip) ?? null : null);
        const jenisAsn = r.jenisAsn ?? null;
        const tipePegawai = jenisAsn?.toUpperCase().includes('PPPK')
          ? 'PPPK'
          : jenisAsn?.toUpperCase().includes('PNS') ? 'PNS' : null;

        const snapshot: AsnSnapshotData = {
          nip: r.nip!,
          nama: r.nama!,
          tipePegawai,
          jenisAsnNama: jenisAsn,
          unitKerjaId,
          unitKerjaNama,
          jabatanNama: r.namaJabatan ?? null,
          jenisJabatanNama: r.jenisJabatan ?? null,
          golonganNama: r.namaGolongan ?? null,
          pangkatNama: r.namaPangkat ?? r.namaRuang ?? null,
          eselonNama: r.eselonNama ?? null,
          kedudukanHukumNama: r.kedudukanHukum ?? null,
          statusAsn: r.statusKepegawaian ?? null,
          tmtPensiun: r.tmtPensiun?.toISOString() ?? null,
          masaKerjaTahun: r.masaKerjaTahun ?? null,
          masaKerjaBulan: r.masaKerjaBulan ?? null,
          tmtGolongan: r.tmtGolongan?.toISOString() ?? null,
        };

        return {
          asnId,
          nip: r.nip!,
          nama: r.nama!,
          snapshot,
          tmtPensiunDate: r.tmtPensiun ?? null,
          masaKerjaTahun: r.masaKerjaTahun ?? null,
          masaKerjaBulan: r.masaKerjaBulan ?? null,
        };
      });

    // 6. Load prev snapshot & detect changes
    const [prevSnapshotMap, existing] = await Promise.all([
      this.loadPrevSnapshotMap(bulan, tahun),
      this.prisma.asnMonthlyArchive.findUnique({ where: { bulan_tahun: { bulan, tahun } } }),
    ]);

    const isNew = !existing;
    if (existing?.status === ARCHIVE_STATUS.FINAL) {
      return { archiveId: existing.id, label: existing.label, totalAsn: existing.totalAsn, totalChanges: 0, isNew: false };
    }
    const archiveId = existing?.id ?? randomUUID();

    const changes = this.detectChanges({ archiveId, bulan, tahun, currentEntries, prevSnapshotMap, now });

    return this.persistArchiveData({
      archiveId, isNew, bulan, tahun, label,
      batchId,
      userId: userId ?? null,
      currentEntries, changes, now,
    });
  }

  // ─── Eligible Batches ──────────────────────────────────────────────────────

  async listEligibleBatches(): Promise<EligibleBatchItem[]> {
    const rows = await this.prisma.sidataAsnImportBatch.findMany({
      where: {
        status: 'COMMITTED',
        importType: { in: [...ASN_IMPORT_TYPES] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, source: true, importType: true, fileName: true,
        totalRows: true, validRows: true, finishedAt: true, createdAt: true,
      },
    });

    return rows.map(r => ({
      id: r.id,
      source: r.source,
      importType: r.importType,
      fileName: r.fileName,
      totalRows: r.totalRows,
      validRows: r.validRows,
      finishedAt: r.finishedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // ─── Finalize ──────────────────────────────────────────────────────────────

  async finalizeArchive(archiveId: string, userId: string) {
    return this.prisma.asnMonthlyArchive.update({
      where: { id: archiveId },
      data: { status: ARCHIVE_STATUS.FINAL, finalizedAt: new Date(), archivedById: userId },
    });
  }

  // ─── Changes query ─────────────────────────────────────────────────────────

  async getChanges(params: {
    archiveId: string;
    changeType?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedChanges> {
    const { archiveId, changeType, search, page, limit } = params;
    const where = {
      archiveId,
      ...(changeType ? { changeType } : {}),
      ...(search ? { OR: [
        { nip: { contains: search } },
        { nama: { contains: search } },
      ]} : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.asnMonthlyChange.findMany({
        where, orderBy: { detectedAt: 'asc' },
        skip: (page - 1) * limit, take: limit,
        select: { id: true, nip: true, nama: true, changeType: true,
          fieldSebelum: true, fieldSesudah: true, detectedAt: true },
      }),
      this.prisma.asnMonthlyChange.count({ where }),
    ]);

    return {
      items: items.map(i => ({
        id: i.id, nip: i.nip, nama: i.nama, changeType: i.changeType,
        fieldSebelum: i.fieldSebelum as Record<string, unknown> | null,
        fieldSesudah: i.fieldSesudah as Record<string, unknown> | null,
        detectedAt: i.detectedAt.toISOString(),
      })),
      total, page, limit,
    };
  }

  // ─── Mendekati Pensiun (live) ──────────────────────────────────────────────

  async getMendekatiPensiun(bulanKedepan = 6): Promise<MendekatiPensiunRow[]> {
    const now = new Date();
    const batas = new Date(now.getFullYear(), now.getMonth() + bulanKedepan, now.getDate());

    const rows = await this.prisma.asn.findMany({
      where: {
        deletedAt: null, isActive: true,
        tmtPensiun: { gte: now, lte: batas },
      },
      orderBy: { tmtPensiun: 'asc' },
      select: {
        id: true, nip: true, nama: true, jabatanNama: true,
        golonganNama: true, tmtPensiun: true,
        unitKerja: { select: { nama: true } },
      },
    });

    return rows.map(r => {
      const sisaMs = r.tmtPensiun!.getTime() - now.getTime();
      const sisaBulan = Math.ceil(sisaMs / (1000 * 60 * 60 * 24 * 30));
      return {
        id: r.id, nip: r.nip, nama: r.nama,
        jabatanNama: r.jabatanNama,
        unitKerjaNama: r.unitKerja?.nama ?? null,
        golonganNama: r.golonganNama,
        tmtPensiun: r.tmtPensiun!.toISOString(),
        sisaBulan,
      };
    });
  }
}
