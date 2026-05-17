import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { KINERJA_BIDANG_SEED_SOP } from '../src/modules/kinerja-bidang/constants/kinerja-bidang-seed.constant';

const prisma = new PrismaClient();

async function main() {
  const year = new Date().getFullYear();

  for (const item of KINERJA_BIDANG_SEED_SOP) {
    const sop = await prisma.kinerjaBidangSop.upsert({
      where: { code: item.code },
      update: {
        title: item.title,
        stage: item.stage,
        stageTitle: item.stageTitle,
        shortDescription: item.shortDescription,
        status: 'ACTIVE',
        isRhkPrimary: item.isRhkPrimary,
        sortOrder: item.sortOrder,
        targetQuantity: item.targetQuantity,
        targetUnit: item.targetUnit,
        qualityTarget: item.qualityTarget,
        timeTarget: item.timeTarget,
        deletedAt: null,
      },
      create: {
        code: item.code,
        title: item.title,
        stage: item.stage,
        stageTitle: item.stageTitle,
        shortDescription: item.shortDescription,
        status: 'ACTIVE',
        isRhkPrimary: item.isRhkPrimary,
        sortOrder: item.sortOrder,
        targetQuantity: item.targetQuantity,
        targetUnit: item.targetUnit,
        qualityTarget: item.qualityTarget,
        timeTarget: item.timeTarget,
      },
    });

    await prisma.kinerjaBidangSopRhk.deleteMany({
      where: { sopId: sop.id },
    });

    await prisma.kinerjaBidangSopRhk.createMany({
      data: item.rhkCodes.map((rhkCode, index) => ({
        sopId: sop.id,
        rhkCode,
        sortOrder: index + 1,
      })),
    });

    if (item.isRhkPrimary && item.rhkCodes[0]) {
      await prisma.kinerjaBidangSopTarget.upsert({
        where: {
          sopId_rhkCode_year: {
            sopId: sop.id,
            rhkCode: item.rhkCodes[0],
            year,
          },
        },
        update: {
          targetQuantity: item.targetQuantity,
          targetUnit: item.targetUnit,
          qualityTarget: item.qualityTarget,
          timeTarget: item.timeTarget,
          deletedAt: null,
        },
        create: {
          sopId: sop.id,
          rhkCode: item.rhkCodes[0],
          year,
          targetQuantity: item.targetQuantity,
          targetUnit: item.targetUnit,
          qualityTarget: item.qualityTarget,
          timeTarget: item.timeTarget,
        },
      });
    }
  }

  console.log(`Seed Kinerja Bidang selesai untuk tahun ${year}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
