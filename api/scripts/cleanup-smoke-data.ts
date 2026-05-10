import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const smokeCases = await prisma.siapCase.findMany({
    where: {
      OR: [
        { caseNumber: { startsWith: 'SMOKE-' } },
        { serviceType: 'SMOKE' },
      ],
    },
    select: {
      id: true,
    },
  });
  const caseIds = smokeCases.map((item) => item.id);

  const [notifications, domainEvents, auditLogs] = await Promise.all([
    prisma.notification.deleteMany({
      where: {
        OR: [
          { type: { startsWith: 'SMOKE_' } },
          { caseId: { in: caseIds } },
        ],
      },
    }),
    prisma.domainEvent.deleteMany({
      where: {
        OR: [
          { entityId: { startsWith: 'SMOKE_' } },
          { entityId: { startsWith: 'SMOKE-' } },
          { entityId: { in: caseIds } },
        ],
      },
    }),
    prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityId: { startsWith: 'SMOKE_' } },
          { entityId: { startsWith: 'SMOKE-' } },
          { entityId: { in: caseIds } },
        ],
      },
    }),
  ]);

  const deletedCases =
    caseIds.length > 0
      ? await prisma.siapCase.deleteMany({
          where: {
            id: {
              in: caseIds,
            },
          },
        })
      : { count: 0 };

  console.log(
    JSON.stringify(
      {
        smokeCases: deletedCases.count,
        notifications: notifications.count,
        domainEvents: domainEvents.count,
        auditLogs: auditLogs.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
