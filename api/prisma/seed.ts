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
      email: 'andi.pratama@tolitoli.go.id',
      phone: '081234560001',
      unitKerjaId: dataUnit.id,
      jabatanNama: 'Analis Kepegawaian Ahli Muda',
      golonganNama: 'III/c',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1985-01-01'),
      tmtPensiun: new Date('2043-02-01'),
    },
    create: {
      nip: '198501012010011001',
      nik: '7204010101850001',
      nama: 'Andi Pratama',
      email: 'andi.pratama@tolitoli.go.id',
      phone: '081234560001',
      unitKerjaId: dataUnit.id,
      jabatanNama: 'Analis Kepegawaian Ahli Muda',
      golonganNama: 'III/c',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1985-01-01'),
      tmtPensiun: new Date('2043-02-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '199002142014032002' },
    update: {
      nama: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@tolitoli.go.id',
      phone: '081234560002',
      unitKerjaId: mutasiUnit.id,
      jabatanNama: 'Penata Mutasi Kepegawaian',
      golonganNama: 'III/b',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1990-02-14'),
      tmtPensiun: new Date('2048-03-01'),
    },
    create: {
      nip: '199002142014032002',
      nik: '7204011402900002',
      nama: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@tolitoli.go.id',
      phone: '081234560002',
      unitKerjaId: mutasiUnit.id,
      jabatanNama: 'Penata Mutasi Kepegawaian',
      golonganNama: 'III/b',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1990-02-14'),
      tmtPensiun: new Date('2048-03-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '198811202019021003' },
    update: {
      nama: 'Muhammad Fadli',
      email: 'muhammad.fadli@tolitoli.go.id',
      phone: '081234560003',
      unitKerjaId: pengembanganUnit.id,
      jabatanNama: 'Analis Pengembangan Kompetensi',
      golonganNama: 'III/a',
      jenisAsn: 'PPPK',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1988-11-20'),
      tmtPensiun: new Date('2046-12-01'),
    },
    create: {
      nip: '198811202019021003',
      nik: '7204012011880003',
      nama: 'Muhammad Fadli',
      email: 'muhammad.fadli@tolitoli.go.id',
      phone: '081234560003',
      unitKerjaId: pengembanganUnit.id,
      jabatanNama: 'Analis Pengembangan Kompetensi',
      golonganNama: 'III/a',
      jenisAsn: 'PPPK',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1988-11-20'),
      tmtPensiun: new Date('2046-12-01'),
    },
  });

  await prisma.asn.upsert({
    where: { nip: '197704062002121004' },
    update: {
      nama: 'Rina Wulandari',
      email: 'rina.wulandari@tolitoli.go.id',
      phone: '081234560004',
      unitKerjaId: rootUnit.id,
      jabatanNama: 'Sekretaris BKPSDM',
      golonganNama: 'IV/a',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1977-04-06'),
      tmtPensiun: new Date('2035-05-01'),
    },
    create: {
      nip: '197704062002121004',
      nik: '7204010604770004',
      nama: 'Rina Wulandari',
      email: 'rina.wulandari@tolitoli.go.id',
      phone: '081234560004',
      unitKerjaId: rootUnit.id,
      jabatanNama: 'Sekretaris BKPSDM',
      golonganNama: 'IV/a',
      jenisAsn: 'PNS',
      statusAsn: 'AKTIF',
      tanggalLahir: new Date('1977-04-06'),
      tmtPensiun: new Date('2035-05-01'),
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
