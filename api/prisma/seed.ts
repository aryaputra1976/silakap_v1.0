import { AccountStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const rootUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM' },
    update: {
      nama: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia',
      parentId: null,
      level: 0,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM',
      nama: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia',
      level: 0,
      isActive: true,
    },
  });

  const mutasiUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM-MUTASI' },
    update: {
      nama: 'Bidang Mutasi dan Promosi',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM-MUTASI',
      nama: 'Bidang Mutasi dan Promosi',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
  });

  const dataUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM-DATA' },
    update: {
      nama: 'Bidang Data dan Informasi ASN',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM-DATA',
      nama: 'Bidang Data dan Informasi ASN',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
  });

  const pengembanganUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM-PSDM' },
    update: {
      nama: 'Bidang Pengembangan Kompetensi ASN',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM-PSDM',
      nama: 'Bidang Pengembangan Kompetensi ASN',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
  });

  const role = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {
      name: 'Super Admin',
      isSystem: true,
      isActive: true,
    },
    create: {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Administrasi sistem',
      isSystem: true,
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Super Admin',
      email: 'admin@silakap.local',
      passwordHash,
      status: AccountStatus.ACTIVE,
      unitKerjaId: rootUnit.id,
    },
    create: {
      username: 'admin',
      name: 'Super Admin',
      email: 'admin@silakap.local',
      passwordHash,
      status: AccountStatus.ACTIVE,
      unitKerjaId: rootUnit.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  await prisma.asn.upsert({
    where: { nip: '198501012010011001' },
    update: {
      nama: 'Andi Pratama',
      unitKerjaId: dataUnit.id,
      jabatanNama: 'Analis Kepegawaian Ahli Muda',
      golonganNama: 'III/c',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2043-02-01'),
    },
    create: {
      nip: '198501012010011001',
      nik: '7204010101850001',
      nama: 'Andi Pratama',
      unitKerjaId: dataUnit.id,
      jabatanNama: 'Analis Kepegawaian Ahli Muda',
      golonganNama: 'III/c',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2043-02-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '199002142014032002' },
    update: {
      nama: 'Siti Nurhaliza',
      unitKerjaId: mutasiUnit.id,
      jabatanNama: 'Penata Mutasi Kepegawaian',
      golonganNama: 'III/b',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2048-03-01'),
    },
    create: {
      nip: '199002142014032002',
      nik: '7204011402900002',
      nama: 'Siti Nurhaliza',
      unitKerjaId: mutasiUnit.id,
      jabatanNama: 'Penata Mutasi Kepegawaian',
      golonganNama: 'III/b',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2048-03-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '198811202019021003' },
    update: {
      nama: 'Muhammad Fadli',
      unitKerjaId: pengembanganUnit.id,
      jabatanNama: 'Analis Pengembangan Kompetensi',
      golonganNama: 'III/a',
      tipePegawai: 'PPPK',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2046-12-01'),
    },
    create: {
      nip: '198811202019021003',
      nik: '7204012011880003',
      nama: 'Muhammad Fadli',
      unitKerjaId: pengembanganUnit.id,
      jabatanNama: 'Analis Pengembangan Kompetensi',
      golonganNama: 'III/a',
      tipePegawai: 'PPPK',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2046-12-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '197704062002121004' },
    update: {
      nama: 'Rina Wulandari',
      unitKerjaId: rootUnit.id,
      jabatanNama: 'Sekretaris BKPSDM',
      golonganNama: 'IV/a',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2035-05-01'),
    },
    create: {
      nip: '197704062002121004',
      nik: '7204010604770004',
      nama: 'Rina Wulandari',
      unitKerjaId: rootUnit.id,
      jabatanNama: 'Sekretaris BKPSDM',
      golonganNama: 'IV/a',
      tipePegawai: 'PNS',
      statusAsn: 'AKTIF',
      tmtPensiun: new Date('2035-05-01'),
    },
  });

  // Seed canonical jenis jabatan classifiers
  const jenisJabatanData = [
    {
      kode: 'STRUKTURAL',
      nama: 'Jabatan Struktural',
      deskripsi: 'Jabatan yang menunjukkan tugas, tanggung jawab, wewenang dan hak seorang PNS dalam rangka memimpin suatu satuan organisasi.',
    },
    {
      kode: 'FUNGSIONAL',
      nama: 'Jabatan Fungsional',
      deskripsi: 'Jabatan yang mempunyai ruang lingkup, tugas, tanggung jawab dan wewenang untuk melakukan kegiatan yang berkaitan dengan pelayanan fungsional.',
    },
    {
      kode: 'PELAKSANA',
      nama: 'Jabatan Pelaksana',
      deskripsi: 'Jabatan yang mempunyai ruang lingkup, tugas, tanggung jawab dan wewenang untuk melakukan kegiatan pelayanan publik serta administrasi pemerintahan.',
    },
  ];

  for (const data of jenisJabatanData) {
    await prisma.refJenisJabatan.upsert({
      where: { kode: data.kode },
      update: { nama: data.nama, deskripsi: data.deskripsi, isActive: true },
      create: { kode: data.kode, nama: data.nama, deskripsi: data.deskripsi, isActive: true },
    });
  }

  // Default working calendar — Senin–Jumat 08:00–16:00, break 12:00–13:00, Asia/Makassar
  await prisma.workingCalendar.upsert({
    where: { name: 'Kalender Kerja BKPSDM' },
    update: {
      timezone: 'Asia/Makassar',
      workDays: [1, 2, 3, 4, 5],
      workStart: '08:00',
      workEnd: '16:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      isDefault: true,
      isActive: true,
    },
    create: {
      name: 'Kalender Kerja BKPSDM',
      timezone: 'Asia/Makassar',
      workDays: [1, 2, 3, 4, 5],
      workStart: '08:00',
      workEnd: '16:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      isDefault: true,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
