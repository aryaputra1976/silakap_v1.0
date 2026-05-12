import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PILOT_USERNAMES = [
  'pilot.kaban',
  'pilot.kabid.ppik',
  'pilot.kabid.mutasi',
  'pilot.analis.pertama',
  'pilot.penelaah',
  'pilot.pppk',
  'pilot.analis.muda',
];

const PILOT_UNIT_CODES = [
  'BKPSDM-SEKRETARIAT',
  'BKPSDM-PPIK',
  'BKPSDM-MUTASI',
];

async function main() {
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: PILOT_USERNAMES,
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  const userIds = users.map((user) => user.id);

  const worklogs = await prisma.siapWorklog.findMany({
    where: {
      OR: [
        {
          userId: {
            in: userIds,
          },
        },
        {
          title: {
            startsWith: 'Pilot',
          },
        },
        {
          title: {
            contains: 'Phase 11',
          },
        },
        {
          title: {
            contains: 'Smoke',
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const worklogIds = worklogs.map((item) => item.id);

  await prisma.$transaction(async (tx) => {
    if (worklogIds.length > 0) {
      await tx.$executeRaw(
        Prisma.sql`
          DELETE FROM siap_worklog_attachments
          WHERE worklog_id IN (${Prisma.join(worklogIds)})
        `,
      );

      await tx.siapWorklog.deleteMany({
        where: {
          id: {
            in: worklogIds,
          },
        },
      });
    }

    if (userIds.length > 0) {
      await tx.notification.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      await tx.userRole.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      await tx.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    }

    await tx.unitKerja.deleteMany({
      where: {
        kode: {
          in: PILOT_UNIT_CODES,
        },
      },
    });
  });

  console.log('Cleanup pilot data selesai.');
  console.table({
    users: users.length,
    worklogs: worklogs.length,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Cleanup pilot data gagal.');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });