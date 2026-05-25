import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function inferBupFromJenjang(jenjang: string | null | undefined): number | null {
  const normalizedJenjang = normalize(jenjang);
  if (normalizedJenjang === '99') return 60;
  if (['31', '32', '41', '42'].includes(normalizedJenjang)) return 58;
  return null;
}

function inferBup(
  jabatanNama: string,
  jenisJabatanNama: string | null,
  jenjang: string | null,
): number | null {
  const bupFromJenjang = inferBupFromJenjang(jenjang);
  if (bupFromJenjang) return bupFromJenjang;

  const jabatan = normalize(jabatanNama);
  const jenis = normalize(jenisJabatanNama);

  if (jenis.includes('PELAKSANA')) return 58;

  if (jabatan.startsWith('SEKRETARIS DAERAH')) return 60;
  if (
    jabatan.startsWith('KEPALA DINAS')
    || jabatan.startsWith('KEPALA BADAN')
    || jabatan.startsWith('KEPALA SATUAN')
    || jabatan.startsWith('INSPEKTUR DAERAH')
    || jabatan.startsWith('SEKRETARIS DPRD')
  ) return 60;

  if (
    jabatan.startsWith('ASISTEN')
    || jabatan.startsWith('STAF AHLI')
    || jabatan.startsWith('SEKRETARIS DINAS')
    || jabatan.startsWith('SEKRETARIS BADAN')
    || jabatan.startsWith('SEKRETARIS INSPEKTORAT')
    || jabatan.startsWith('KEPALA BAGIAN')
    || jabatan.startsWith('CAMAT')
    || jabatan.startsWith('KEPALA BIDANG')
    || jabatan.startsWith('INSPEKTUR PEMBANTU')
    || jabatan.startsWith('KEPALA INSPEKTUR')
    || jabatan.startsWith('SEKRETARIS CAMAT')
    || jabatan.startsWith('KEPALA SUB BAGIAN')
    || jabatan.startsWith('KEPALA SUBBAGIAN')
    || jabatan.startsWith('KEPALA SUB BIDANG')
    || jabatan.startsWith('KEPALA SUBBIDANG')
    || jabatan.startsWith('KEPALA SEKSI')
    || jabatan.startsWith('LURAH')
    || jabatan.startsWith('SEKRETARIS LURAH')
  ) return 58;

  return null;
}

async function main() {
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
        select: {
          nama: true,
        },
      },
    },
  });

  let updated58 = 0;
  let updated60 = 0;
  let updatedFromJenjang = 0;
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
    });

    if (bup === 58) updated58 += 1;
    if (bup === 60) updated60 += 1;
    if (inferBupFromJenjang(row.jenjang)) updatedFromJenjang += 1;
  }

  console.log(JSON.stringify({
    checked: rows.length,
    updated: updated58 + updated60,
    updated58,
    updated60,
    updatedFromJenjang,
    skipped,
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
