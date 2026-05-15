import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jenisJabatan = [
  {
    kode: 'STRUKTURAL',
    nama: 'Jabatan Struktural',
    deskripsi:
      'Jabatan pimpinan tinggi, administrator, dan pengawas dalam struktur organisasi pemerintahan.',
  },
  {
    kode: 'FUNGSIONAL',
    nama: 'Jabatan Fungsional',
    deskripsi:
      'Jabatan yang menjalankan fungsi pelayanan berdasarkan keahlian atau keterampilan tertentu.',
  },
  {
    kode: 'PELAKSANA',
    nama: 'Jabatan Pelaksana',
    deskripsi:
      'Jabatan yang menjalankan tugas teknis, administratif, dan operasional pemerintahan.',
  },
] as const;

async function main() {
  for (const item of jenisJabatan) {
    await prisma.refJenisJabatan.upsert({
      where: { kode: item.kode },
      update: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        isActive: true,
        deletedAt: null,
      },
      create: {
        kode: item.kode,
        nama: item.nama,
        deskripsi: item.deskripsi,
        isActive: true,
      },
    });
  }

  const rows = await prisma.refJenisJabatan.findMany({
    where: { kode: { in: jenisJabatan.map((item) => item.kode) }, deletedAt: null },
    orderBy: { kode: 'asc' },
    select: { kode: true, nama: true, isActive: true },
  });

  console.table(rows);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
