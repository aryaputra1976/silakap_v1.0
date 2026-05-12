import {
  AccountStatus,
  PrismaClient,
  SiapWorklogStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PILOT_PASSWORD = 'pilot123';

const PILOT_ROLES = [
  {
    code: 'KEPALA_BADAN',
    name: 'Kepala Badan',
    description: 'Pimpinan tertinggi BKPSDM',
  },
  {
    code: 'KABID',
    name: 'Kepala Bidang',
    description: 'Kepala bidang/unit kerja',
  },
  {
    code: 'ANALIS_MADYA',
    name: 'Analis Madya',
    description: 'Koordinator/pejabat analis madya',
  },
  {
    code: 'ANALIS_MUDA',
    name: 'Analis Muda',
    description: 'Pejabat analis muda',
  },
  {
    code: 'ANALIS_PERTAMA',
    name: 'Analis Pertama',
    description: 'Staf/analis pelaksana',
  },
  {
    code: 'PENELAAH',
    name: 'Penelaah Teknis Kebijakan',
    description: 'Staf penelaah teknis kebijakan',
  },
  {
    code: 'PPPK',
    name: 'PPPK',
    description: 'Pegawai pemerintah dengan perjanjian kerja',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PILOT_PASSWORD, 10);

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

  const sekretariatUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM-SEKRETARIAT' },
    update: {
      nama: 'Sekretariat BKPSDM',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM-SEKRETARIAT',
      nama: 'Sekretariat BKPSDM',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
  });

  const pengadaanUnit = await prisma.unitKerja.upsert({
    where: { kode: 'BKPSDM-PPIK' },
    update: {
      nama: 'Bidang Pengadaan, Pemberhentian, dan Informasi Kepegawaian',
      parentId: rootUnit.id,
      level: 1,
      isActive: true,
    },
    create: {
      kode: 'BKPSDM-PPIK',
      nama: 'Bidang Pengadaan, Pemberhentian, dan Informasi Kepegawaian',
      parentId: rootUnit.id,
      level: 1,
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

  const roles = new Map<string, { id: string }>();

  for (const item of PILOT_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        isSystem: true,
        isActive: true,
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        isSystem: true,
        isActive: true,
      },
    });

    roles.set(item.code, role);
  }

  const users = [
    {
      username: 'pilot.kaban',
      name: 'Pilot Kepala Badan',
      email: 'pilot.kaban@silakap.local',
      roleCode: 'KEPALA_BADAN',
      unitKerjaId: rootUnit.id,
    },
    {
      username: 'pilot.kabid.ppik',
      name: 'Pilot Kabid PPIK',
      email: 'pilot.kabid.ppik@silakap.local',
      roleCode: 'KABID',
      unitKerjaId: pengadaanUnit.id,
    },
    {
      username: 'pilot.kabid.mutasi',
      name: 'Pilot Kabid Mutasi',
      email: 'pilot.kabid.mutasi@silakap.local',
      roleCode: 'KABID',
      unitKerjaId: mutasiUnit.id,
    },
    {
      username: 'pilot.analis.pertama',
      name: 'Pilot Analis Pertama',
      email: 'pilot.analis.pertama@silakap.local',
      roleCode: 'ANALIS_PERTAMA',
      unitKerjaId: pengadaanUnit.id,
    },
    {
      username: 'pilot.penelaah',
      name: 'Pilot Penelaah Teknis',
      email: 'pilot.penelaah@silakap.local',
      roleCode: 'PENELAAH',
      unitKerjaId: pengadaanUnit.id,
    },
    {
      username: 'pilot.pppk',
      name: 'Pilot PPPK Staf',
      email: 'pilot.pppk@silakap.local',
      roleCode: 'PPPK',
      unitKerjaId: mutasiUnit.id,
    },
    {
      username: 'pilot.analis.muda',
      name: 'Pilot Analis Muda',
      email: 'pilot.analis.muda@silakap.local',
      roleCode: 'ANALIS_MUDA',
      unitKerjaId: pengadaanUnit.id,
    },
  ];

  const createdUsers = new Map<string, { id: string; unitKerjaId: string | null }>();

  for (const item of users) {
    const user = await prisma.user.upsert({
      where: { username: item.username },
      update: {
        name: item.name,
        email: item.email,
        passwordHash,
        status: AccountStatus.ACTIVE,
        unitKerjaId: item.unitKerjaId,
      },
      create: {
        username: item.username,
        name: item.name,
        email: item.email,
        passwordHash,
        status: AccountStatus.ACTIVE,
        unitKerjaId: item.unitKerjaId,
      },
    });

    const role = roles.get(item.roleCode);

    if (!role) {
      throw new Error(`Role ${item.roleCode} tidak ditemukan`);
    }

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

    createdUsers.set(item.username, user);
  }

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);

  await createPilotWorklog({
    userKey: 'pilot.analis.pertama',
    unitKerjaId: pengadaanUnit.id,
    workDate: today,
    category: 'VERIFIKASI_BERKAS',
    title: 'Pilot - Verifikasi berkas pensiun BUP',
    description:
      'Memeriksa kelengkapan DPCP, SK CPNS, SK PNS, SK pangkat terakhir, KK, dan pas foto.',
    output: '12 berkas pensiun BUP diverifikasi',
    volume: 12,
    obstacle: '2 berkas belum melampirkan pas foto terbaru',
    status: SiapWorklogStatus.SUBMITTED,
  });

  await createPilotWorklog({
    userKey: 'pilot.penelaah',
    unitKerjaId: pengadaanUnit.id,
    workDate: today,
    category: 'VALIDASI_DATA',
    title: 'Pilot - Validasi data ASN untuk layanan pensiun',
    description:
      'Melakukan pencocokan data ASN antara database lokal dan dokumen pendukung.',
    output: '25 data ASN tervalidasi',
    volume: 25,
    obstacle: null,
    status: SiapWorklogStatus.APPROVED,
  });

  await createPilotWorklog({
    userKey: 'pilot.pppk',
    unitKerjaId: mutasiUnit.id,
    workDate: yesterday,
    category: 'ARSIP_DIGITAL',
    title: 'Pilot - Digitalisasi dokumen mutasi',
    description:
      'Mengunggah dan menata dokumen mutasi pegawai ke arsip digital.',
    output: '18 dokumen mutasi diarsipkan',
    volume: 18,
    obstacle: 'Sebagian dokumen scan buram dan perlu pemindaian ulang',
    status: SiapWorklogStatus.REVISION_REQUIRED,
  });

  await createPilotWorklog({
    userKey: 'pilot.analis.muda',
    unitKerjaId: pengadaanUnit.id,
    workDate: twoDaysAgo,
    category: 'LAPORAN',
    title: 'Pilot - Rekap layanan pemberhentian ASN',
    description:
      'Menyusun rekap perkembangan layanan pemberhentian ASN untuk bahan monitoring bidang.',
    output: '1 rekap layanan disusun',
    volume: 1,
    obstacle: null,
    status: SiapWorklogStatus.APPROVED,
  });

  async function createPilotWorklog(input: {
    userKey: string;
    unitKerjaId: string;
    workDate: Date;
    category: string;
    title: string;
    description: string;
    output: string;
    volume: number;
    obstacle: string | null;
    status: SiapWorklogStatus;
  }) {
    const user = createdUsers.get(input.userKey);

    if (!user) {
      throw new Error(`User ${input.userKey} tidak ditemukan`);
    }

    const existing = await prisma.siapWorklog.findFirst({
      where: {
        userId: user.id,
        title: input.title,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const submittedAt =
      input.status === SiapWorklogStatus.SUBMITTED ||
      input.status === SiapWorklogStatus.APPROVED ||
      input.status === SiapWorklogStatus.REVISION_REQUIRED
        ? new Date()
        : null;

    const reviewer =
      input.status === SiapWorklogStatus.APPROVED ||
      input.status === SiapWorklogStatus.REVISION_REQUIRED
        ? createdUsers.get('pilot.kabid.ppik')
        : null;

    const data = {
      userId: user.id,
      unitKerjaId: input.unitKerjaId,
      workDate: input.workDate,
      category: input.category,
      title: input.title,
      description: input.description,
      output: input.output,
      volume: input.volume,
      obstacle: input.obstacle,
      status: input.status,
      submittedAt,
      reviewedBy: reviewer?.id,
      reviewedAt: reviewer ? new Date() : null,
      reviewNote:
        input.status === SiapWorklogStatus.REVISION_REQUIRED
          ? 'Pilot: bukti dukung perlu diperbaiki'
          : input.status === SiapWorklogStatus.APPROVED
            ? 'Pilot: buku kerja sudah sesuai'
            : null,
      createdBy: user.id,
      updatedBy: user.id,
    };

    if (existing) {
      await prisma.siapWorklog.update({
        where: { id: existing.id },
        data,
      });

      return;
    }

    await prisma.siapWorklog.create({
      data,
    });
  }

  console.log('Pilot SIAP seed selesai.');
  console.log('Password semua user pilot:', PILOT_PASSWORD);
  console.table(users.map((item) => ({
    username: item.username,
    role: item.roleCode,
    password: PILOT_PASSWORD,
  })));
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
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