import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'pilot123';

type SeedUser = {
  id: string;
  nip: string;
  name: string;
  email?: string;
  jabatan: string;
  roleCode: string;
};

const users: SeedUser[] = [
  {
    id: '8f257177-2ac0-446b-bb0c-70a4556e44ee',
    nip: '198806022010011004',
    name: 'MOCHAMMAD THEIZAR',
    email: 'mochammad.theizar@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Madya',
    roleCode: 'ANALIS_MADYA',
  },
  {
    id: 'cb33ad64-5fb0-429f-9f48-c34d9cdb8403',
    nip: '197605042011011002',
    name: 'KHAIRUL ANWAR',
    email: 'khaerul.anwar@gmail.com',
    jabatan: 'Kepala Bidang Pengadaan, Pemberhentian dan Informasi Kepegawaian',
    roleCode: 'KABID',
  },
  {
    id: '3cf5125a-fe0a-46b0-be7f-5403008cb097',
    nip: '198301192008011002',
    name: 'IBRAHIM',
    email: 'ibrahim@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Muda',
    roleCode: 'ANALIS_MUDA',
  },
  {
    id: '637abfee-14dd-40db-8aa0-6d550f5f1c3c',
    nip: '197812082007011014',
    name: 'ANSAR',
    email: 'ansar@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Muda',
    roleCode: 'ANALIS_MUDA',
  },
  {
    id: '64cedc79-d40e-4390-849a-63eb3af72856',
    nip: '198210292009041002',
    name: 'MOH. ILHAM U. HARUNA',
    email: 'moh.ilham.u.haruna@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Muda',
    roleCode: 'ANALIS_MUDA',
  },
  {
    id: '42a609dd-439f-470f-8ffe-4d62531e7177',
    nip: '199605112022031011',
    name: 'MUH. AKBAR MARAILA',
    email: 'muh.akbar.maraila@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
    roleCode: 'ANALIS_PERTAMA',
  },
  {
    id: '63498656-b5a3-47d7-a2d1-c8629d2df445',
    nip: '198902232019072001',
    name: 'DIAH SETIAWATI',
    email: 'diah.setiawati@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
    roleCode: 'ANALIS_PERTAMA',
  },
  {
    id: '64bd0249-72b3-4ce0-9e3f-38c981efc5bf',
    nip: '199109112022032016',
    name: 'DIAN MARDIYANI',
    email: 'dian.mardiyani@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
    roleCode: 'ANALIS_PERTAMA',
  },
  {
    id: '654d133b-7d9c-4a63-afd7-f2c4f1d53b3e',
    nip: '199508162019071001',
    name: 'ILYAS',
    email: 'ilyas@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
    roleCode: 'ANALIS_PERTAMA',
  },
  {
    id: '60509065-0e53-48c1-a11d-185ead9c2f8f',
    nip: '198201112014112002',
    name: 'FATHIA S. BASO',
    email: 'fathia.s.baso@gmail.com',
    jabatan: 'Penelaah Teknis Kebijakan',
    roleCode: 'PENELAAH',
  },
  {
    id: '71ca2a8d-dd24-4cdb-8809-7fb4756dddd0',
    nip: '198103142007012006',
    name: 'SUMIDAH',
    email: 'sumidah@gmail.com',
    jabatan: 'Penelaah Teknis Kebijakan',
    roleCode: 'PENELAAH',
  },
  {
    id: '12a2eec7-f078-497e-96b2-63ec5d82bead',
    nip: '199008082024211023',
    name: 'NAWIR BULLA',
    email: 'nawir.bulla@gmail.com',
    jabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
    roleCode: 'ANALIS_PERTAMA',
  },
  {
    id: '85d9064d-f190-4032-b06a-d6e66a137aa5',
    nip: '199203182025212150',
    name: 'DELFIA DEBORA',
    email: 'delfia.debora@gmail.com',
    jabatan: 'PPPK Paruh Waktu',
    roleCode: 'PPPK_PARUH_WAKTU',
  },
  {
    id: '07208535-90ff-4d44-89a4-a543aecb04ee',
    nip: '199202132025212123',
    name: 'SAHARA NURDIN',
    email: 'sahara.nurdin@gmail.com',
    jabatan: 'PPPK Paruh Waktu',
    roleCode: 'PPPK_PARUH_WAKTU',
  },
  {
    id: 'c9f3ff3d-7bfb-4d70-a11a-9a236f4e2b61',
    nip: '198402292009041002',
    name: 'RONALD RECKY YUDHA',
    email: 'ronaldreckyyudha@gmail.com',
    jabatan: 'Operator OPD - Badan Kepegawaian Dan Pengembangan Sumber Daya Manusia',
    roleCode: 'OPD',
  },
];

const roleNames: Record<string, string> = {
  KABID: 'Kepala Bidang',
  ANALIS_MADYA: 'Analis SDMA Ahli Madya',
  ANALIS_MUDA: 'Analis SDMA Ahli Muda',
  ANALIS_PERTAMA: 'Analis SDMA Ahli Pertama',
  PENELAAH: 'Penelaah Teknis Kebijakan',
  PPPK_ANALIS_PERTAMA: 'PPPK Analis SDMA Ahli Pertama',
  PPPK_PARUH_WAKTU: 'PPPK Paruh Waktu',
  OPD_OPERATOR: 'Operator OPD',
  OPD: 'Operator OPD',
};

const MANAGED_ROLE_CODES = [
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
  'PPPK_ANALIS_PERTAMA',
  'PPPK_PARUH_WAKTU',
  'OPD_OPERATOR',
  'OPD',
];

async function ensureRole(roleCode: string) {
  return prisma.role.upsert({
    where: { code: roleCode },
    update: {
      name: roleNames[roleCode] ?? roleCode,
      isActive: true,
    },
    create: {
      code: roleCode,
      name: roleNames[roleCode] ?? roleCode,
      description: `Role ${roleNames[roleCode] ?? roleCode}`,
      isSystem: true,
      isActive: true,
    },
  });
}

async function cleanupManagedRoles(userId: string, expectedRoleCode: string) {
  const rolesToRemove = await prisma.role.findMany({
    where: {
      code: {
        in: MANAGED_ROLE_CODES.filter((code) => code !== expectedRoleCode),
      },
    },
    select: {
      id: true,
    },
  });

  if (rolesToRemove.length === 0) {
    return;
  }

  await prisma.userRole.deleteMany({
    where: {
      userId,
      roleId: {
        in: rolesToRemove.map((role) => role.id),
      },
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const item of users) {
    const role = await ensureRole(item.roleCode);

    const user = await prisma.user.upsert({
      where: { nip: item.nip },
      update: {
        username: item.nip,
        email: item.email ?? null,
        name: item.name,
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        id: item.id,
        username: item.nip,
        email: item.email ?? null,
        nip: item.nip,
        name: item.name,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    await cleanupManagedRoles(user.id, item.roleCode);

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
  }

  console.log('Seed user PPIK dan OPD selesai.');
  console.log(`Password default: ${DEFAULT_PASSWORD}`);
  console.table(
    users.map((item) => ({
      username: item.nip,
      nip: item.nip,
      name: item.name,
      role: item.roleCode,
      password: DEFAULT_PASSWORD,
    })),
  );
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