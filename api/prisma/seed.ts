import { AccountStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

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
    },
    create: {
      username: 'admin',
      name: 'Super Admin',
      email: 'admin@silakap.local',
      passwordHash,
      status: AccountStatus.ACTIVE,
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
