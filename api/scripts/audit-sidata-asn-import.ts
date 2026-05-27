import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toCountMap<T extends string | null>(
  rows: Array<{ value: T; count: number }>,
): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.value ?? 'NULL', row.count]));
}

function monthsFromNow(months: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, now.getUTCDate(), 23, 59, 59));
}

function isRawBup(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) && parsed >= 45 && parsed <= 70;
}

async function main() {
  const batchId = process.argv[2]?.trim();
  const batch = batchId
    ? await prisma.sidataAsnImportBatch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          fileName: true,
          status: true,
          totalRows: true,
          validRows: true,
          invalidRows: true,
          duplicateRows: true,
          warningRows: true,
          createdAt: true,
        },
      })
    : await prisma.sidataAsnImportBatch.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          status: true,
          totalRows: true,
          validRows: true,
          invalidRows: true,
          duplicateRows: true,
          warningRows: true,
          createdAt: true,
        },
      });

  const batchWhere = batch ? { batchId: batch.id } : undefined;
  const [mappingGroups, validationGroups, stagingMissing, suspiciousTmt, rawBupRows, masterHealth, upcomingBup] =
    await Promise.all([
      batch
        ? prisma.sidataAsnImportStaging.groupBy({
            by: ['mappingStatus'],
            where: batchWhere,
            _count: { _all: true },
          })
        : Promise.resolve([]),
      batch
        ? prisma.sidataAsnImportStaging.groupBy({
            by: ['validationStatus'],
            where: batchWhere,
            _count: { _all: true },
          })
        : Promise.resolve([]),
      batch
        ? prisma.sidataAsnImportStaging.aggregate({
            where: batchWhere,
            _count: {
              _all: true,
              nip: true,
              nama: true,
              tanggalLahir: true,
              namaJabatan: true,
              kdUnor: true,
              unorNama: true,
              tmtPensiun: true,
            },
          })
        : Promise.resolve(null),
      batch
        ? prisma.sidataAsnImportStaging.count({
            where: {
              batchId: batch.id,
              tmtPensiun: { lt: new Date(Date.UTC(1950, 0, 1)) },
            },
          })
        : Promise.resolve(0),
      batch
        ? prisma.sidataAsnImportStaging.findMany({
            where: { batchId: batch.id },
            select: { rawData: true },
            take: 20_000,
          })
        : Promise.resolve([]),
      prisma.asn.aggregate({
        where: { deletedAt: null },
        _count: {
          _all: true,
          nik: true,
          tmtPensiun: true,
          unitKerjaId: true,
          jabatanRefId: true,
          golonganRefId: true,
        },
      }),
      prisma.asn.count({
        where: {
          deletedAt: null,
          tmtPensiun: {
            gte: monthsFromNow(0),
            lte: monthsFromNow(12),
          },
        },
      }),
    ]);

  const rawBupDetected = rawBupRows.filter((row) => {
    const raw = row.rawData;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    const record = raw as Record<string, unknown>;
    return Object.entries(record).some(([key, value]) => {
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      return ['bup', 'batas_usia_pensiun', 'batas_usia_pensiun_tahun'].includes(normalizedKey)
        && isRawBup(value);
    });
  }).length;

  const stagingTotal = stagingMissing?._count._all ?? 0;
  const result = {
    batch,
    staging: batch
      ? {
          mappingStatus: toCountMap(
            mappingGroups.map((row) => ({ value: row.mappingStatus, count: row._count._all })),
          ),
          validationStatus: toCountMap(
            validationGroups.map((row) => ({ value: row.validationStatus, count: row._count._all })),
          ),
          missingFields: {
            nip: stagingTotal - (stagingMissing?._count.nip ?? 0),
            nama: stagingTotal - (stagingMissing?._count.nama ?? 0),
            tanggalLahir: stagingTotal - (stagingMissing?._count.tanggalLahir ?? 0),
            namaJabatan: stagingTotal - (stagingMissing?._count.namaJabatan ?? 0),
            kdUnor: stagingTotal - (stagingMissing?._count.kdUnor ?? 0),
            unorNama: stagingTotal - (stagingMissing?._count.unorNama ?? 0),
            tmtPensiun: stagingTotal - (stagingMissing?._count.tmtPensiun ?? 0),
          },
          rawBupDetected,
          suspiciousTmtBefore1950: suspiciousTmt,
        }
      : null,
    masterAsn: {
      total: masterHealth._count._all,
      missingNik: masterHealth._count._all - masterHealth._count.nik,
      missingTmtPensiun: masterHealth._count._all - masterHealth._count.tmtPensiun,
      missingUnitKerja: masterHealth._count._all - masterHealth._count.unitKerjaId,
      missingJabatanRef: masterHealth._count._all - masterHealth._count.jabatanRefId,
      missingGolonganRef: masterHealth._count._all - masterHealth._count.golonganRefId,
      pensiunBup12Bulan: upcomingBup,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
