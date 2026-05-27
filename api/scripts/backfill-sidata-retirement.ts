import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function inferBupFromJenjang(jenjang: string | null | undefined): number | null {
  const normalizedJenjang = normalize(jenjang);
  if (normalizedJenjang === '99') return 60;
  if (['31', '32', '41', '42'].includes(normalizedJenjang)) return 58;
  return null;
}

function inferBup(
  jabatanNama: string | null | undefined,
  jenisJabatanNama: string | null | undefined,
  jenjang: string | null | undefined,
): number | null {
  const bupFromJenjang = inferBupFromJenjang(jenjang);
  if (bupFromJenjang !== null) return bupFromJenjang;

  const jabatan = normalize(jabatanNama);
  const jenis = normalize(jenisJabatanNama);
  if (!jabatan && !jenis) return null;

  if (jabatan.includes('GURU')) return 60;
  if (jabatan.includes('AHLI UTAMA')) return 65;
  if (jabatan.includes('AHLI MADYA')) return 60;
  if (jabatan.includes('AHLI MUDA') || jabatan.includes('AHLI PERTAMA')) return 58;
  if (jenis.includes('PELAKSANA')) return 58;
  if (jenis.includes('FUNGSIONAL') && jabatan) return 58;
  if (jabatan) return 58;

  return null;
}

function dateOnlyUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function estimateTmtPensiun(tanggalLahir: Date, bup: number): Date {
  return dateOnlyUtc(
    tanggalLahir.getUTCFullYear() + bup,
    tanggalLahir.getUTCMonth() + 1,
    tanggalLahir.getUTCDate(),
  );
}

async function backfillRefJabatanBup() {
  const rows = await prisma.refJabatan.findMany({
    where: {
      deletedAt: null,
      bup: null,
    },
    select: {
      id: true,
      nama: true,
      jenjang: true,
      jenisJabatan: {
        select: { nama: true },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const bup = inferBup(row.nama, row.jenisJabatan.nama, row.jenjang);
    if (!bup) {
      skipped += 1;
      continue;
    }

    await prisma.refJabatan.update({
      where: { id: row.id },
      data: { bup },
      select: { id: true },
    });
    updated += 1;
  }

  return { checked: rows.length, updated, skipped };
}

async function backfillAsnTmtPensiun() {
  const rows = await prisma.asn.findMany({
    where: {
      deletedAt: null,
      tmtPensiun: null,
      siasnProfile: {
        is: {
          deletedAt: null,
          tanggalLahir: { not: null },
        },
      },
    },
    select: {
      id: true,
      jabatanNama: true,
      jenisJabatanNama: true,
      jabatanRef: {
        select: {
          nama: true,
          jenjang: true,
          bup: true,
          jenisJabatan: { select: { nama: true } },
        },
      },
      siasnProfile: {
        select: { tanggalLahir: true },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  const now = new Date();

  for (const row of rows) {
    const tanggalLahir = row.siasnProfile?.tanggalLahir;
    if (!tanggalLahir) {
      skipped += 1;
      continue;
    }

    const bup = row.jabatanRef?.bup ?? inferBup(
      row.jabatanNama ?? row.jabatanRef?.nama,
      row.jenisJabatanNama ?? row.jabatanRef?.jenisJabatan.nama,
      row.jabatanRef?.jenjang,
    );
    if (!bup) {
      skipped += 1;
      continue;
    }

    const tmtPensiun = estimateTmtPensiun(tanggalLahir, bup);
    await prisma.asn.update({
      where: { id: row.id },
      data: {
        tmtPensiun,
        isActive: tmtPensiun > now,
      },
      select: { id: true },
    });
    updated += 1;
  }

  return { checked: rows.length, updated, skipped };
}

async function main() {
  const refJabatanBup = await backfillRefJabatanBup();
  const asnTmtPensiun = await backfillAsnTmtPensiun();

  console.log(JSON.stringify({
    refJabatanBup,
    asnTmtPensiun,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
